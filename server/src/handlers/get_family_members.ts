
import { db } from '../db';
import { familyMembersTable } from '../db/schema';
import { type FamilyMember } from '../schema';

export const getFamilyMembers = async (): Promise<FamilyMember[]> => {
  try {
    const results = await db.select()
      .from(familyMembersTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch family members:', error);
    throw error;
  }
};
