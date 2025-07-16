
import { db } from '../db';
import { familyMembersTable, tasksTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteFamilyMember(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, update any tasks assigned to this family member to unassign them
    await db.update(tasksTable)
      .set({ assigned_to: null })
      .where(eq(tasksTable.assigned_to, input.id))
      .execute();

    // Then delete the family member
    await db.delete(familyMembersTable)
      .where(eq(familyMembersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Family member deletion failed:', error);
    throw error;
  }
}
