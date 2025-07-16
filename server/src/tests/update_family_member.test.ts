
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type UpdateFamilyMemberInput } from '../schema';
import { updateFamilyMember } from '../handlers/update_family_member';
import { eq } from 'drizzle-orm';

describe('updateFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testMemberId: number;

  beforeEach(async () => {
    // Create a test family member to update
    const result = await db.insert(familyMembersTable)
      .values({
        name: 'Original Name',
        email: 'original@test.com',
        avatar_url: 'https://example.com/avatar.jpg'
      })
      .returning()
      .execute();
    
    testMemberId = result[0].id;
  });

  it('should update family member name', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      name: 'Updated Name'
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('original@test.com');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update family member email', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      email: 'updated@test.com'
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Original Name');
    expect(result.email).toEqual('updated@test.com');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
  });

  it('should update family member avatar_url', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Original Name');
    expect(result.email).toEqual('original@test.com');
    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      name: 'Completely Updated Name',
      email: 'completely@updated.com',
      avatar_url: 'https://example.com/completely-new.jpg'
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Completely Updated Name');
    expect(result.email).toEqual('completely@updated.com');
    expect(result.avatar_url).toEqual('https://example.com/completely-new.jpg');
  });

  it('should set email to null when provided', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      email: null
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Original Name');
    expect(result.email).toBeNull();
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
  });

  it('should set avatar_url to null when provided', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      avatar_url: null
    };

    const result = await updateFamilyMember(input);

    expect(result.id).toEqual(testMemberId);
    expect(result.name).toEqual('Original Name');
    expect(result.email).toEqual('original@test.com');
    expect(result.avatar_url).toBeNull();
  });

  it('should persist changes to database', async () => {
    const input: UpdateFamilyMemberInput = {
      id: testMemberId,
      name: 'Persisted Name',
      email: 'persisted@test.com'
    };

    await updateFamilyMember(input);

    // Verify changes were saved to database
    const members = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, testMemberId))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].name).toEqual('Persisted Name');
    expect(members[0].email).toEqual('persisted@test.com');
  });

  it('should throw error when family member not found', async () => {
    const input: UpdateFamilyMemberInput = {
      id: 999999,
      name: 'Non-existent'
    };

    await expect(updateFamilyMember(input)).rejects.toThrow(/family member with id 999999 not found/i);
  });
});
