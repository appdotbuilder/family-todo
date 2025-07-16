
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { getFamilyMembers } from '../handlers/get_family_members';

describe('getFamilyMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no family members exist', async () => {
    const result = await getFamilyMembers();

    expect(result).toEqual([]);
  });

  it('should return all family members', async () => {
    // Create test family members
    await db.insert(familyMembersTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: 'https://example.com/avatar1.jpg'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar_url: null
        },
        {
          name: 'Bob Johnson',
          email: null,
          avatar_url: 'https://example.com/avatar2.jpg'
        }
      ])
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(3);
    
    // Check first family member
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].avatar_url).toEqual('https://example.com/avatar1.jpg');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second family member
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].email).toEqual('jane@example.com');
    expect(result[1].avatar_url).toBeNull();

    // Check third family member
    expect(result[2].name).toEqual('Bob Johnson');
    expect(result[2].email).toBeNull();
    expect(result[2].avatar_url).toEqual('https://example.com/avatar2.jpg');
  });

  it('should return family members with proper field types', async () => {
    await db.insert(familyMembersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        avatar_url: 'https://example.com/avatar.jpg'
      })
      .execute();

    const result = await getFamilyMembers();

    expect(result).toHaveLength(1);
    expect(typeof result[0].id).toBe('number');
    expect(typeof result[0].name).toBe('string');
    expect(typeof result[0].email).toBe('string');
    expect(typeof result[0].avatar_url).toBe('string');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
