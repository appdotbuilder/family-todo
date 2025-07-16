
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type CreateFamilyMemberInput } from '../schema';
import { createFamilyMember } from '../handlers/create_family_member';
import { eq } from 'drizzle-orm';

// Simple test input with all fields
const testInput: CreateFamilyMemberInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar_url: 'https://example.com/avatar.jpg'
};

// Test input with nullable fields
const testInputNullableFields: CreateFamilyMemberInput = {
  name: 'Jane Smith',
  email: null,
  avatar_url: null
};

describe('createFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a family member with all fields', async () => {
    const result = await createFamilyMember(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a family member with nullable fields', async () => {
    const result = await createFamilyMember(testInputNullableFields);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save family member to database', async () => {
    const result = await createFamilyMember(testInput);

    // Query using proper drizzle syntax
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(familyMembers).toHaveLength(1);
    expect(familyMembers[0].name).toEqual('John Doe');
    expect(familyMembers[0].email).toEqual('john.doe@example.com');
    expect(familyMembers[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(familyMembers[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle creation without optional fields', async () => {
    const minimalInput: CreateFamilyMemberInput = {
      name: 'Minimal User',
      email: null,
      avatar_url: null
    };

    const result = await createFamilyMember(minimalInput);

    expect(result.name).toEqual('Minimal User');
    expect(result.email).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify in database
    const familyMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, result.id))
      .execute();

    expect(familyMembers).toHaveLength(1);
    expect(familyMembers[0].name).toEqual('Minimal User');
    expect(familyMembers[0].email).toBeNull();
    expect(familyMembers[0].avatar_url).toBeNull();
  });
});
