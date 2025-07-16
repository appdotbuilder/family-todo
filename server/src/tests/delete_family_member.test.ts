
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, tasksTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteFamilyMember } from '../handlers/delete_family_member';
import { eq } from 'drizzle-orm';

describe('deleteFamilyMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a family member', async () => {
    // Create a family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const familyMember = familyMemberResult[0];

    // Delete the family member
    const input: DeleteInput = { id: familyMember.id };
    const result = await deleteFamilyMember(input);

    expect(result.success).toBe(true);

    // Verify family member is deleted
    const deletedMembers = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, familyMember.id))
      .execute();

    expect(deletedMembers).toHaveLength(0);
  });

  it('should unassign tasks when deleting a family member', async () => {
    // Create a family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'Jane Doe',
        email: 'jane@example.com'
      })
      .returning()
      .execute();

    const familyMember = familyMemberResult[0];

    // Create a task assigned to this family member
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        assigned_to: familyMember.id
      })
      .returning()
      .execute();

    const task = taskResult[0];

    // Delete the family member
    const input: DeleteInput = { id: familyMember.id };
    const result = await deleteFamilyMember(input);

    expect(result.success).toBe(true);

    // Verify task is unassigned
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].assigned_to).toBeNull();
  });

  it('should handle deletion of non-existent family member', async () => {
    const input: DeleteInput = { id: 999 };
    const result = await deleteFamilyMember(input);

    expect(result.success).toBe(true);
  });

  it('should handle multiple tasks assigned to deleted family member', async () => {
    // Create a family member
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'Bob Smith',
        email: 'bob@example.com'
      })
      .returning()
      .execute();

    const familyMember = familyMemberResult[0];

    // Create multiple tasks assigned to this family member
    const taskResults = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          assigned_to: familyMember.id
        },
        {
          title: 'Task 2',
          description: 'Second task',
          assigned_to: familyMember.id
        },
        {
          title: 'Task 3',
          description: 'Third task',
          assigned_to: familyMember.id
        }
      ])
      .returning()
      .execute();

    // Delete the family member
    const input: DeleteInput = { id: familyMember.id };
    const result = await deleteFamilyMember(input);

    expect(result.success).toBe(true);

    // Verify all tasks are unassigned
    for (const task of taskResults) {
      const updatedTasks = await db.select()
        .from(tasksTable)
        .where(eq(tasksTable.id, task.id))
        .execute();

      expect(updatedTasks).toHaveLength(1);
      expect(updatedTasks[0].assigned_to).toBeNull();
    }
  });
});
