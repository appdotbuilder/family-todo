
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, familyMembersTable, categoriesTable } from '../db/schema';
import { type DeleteInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task successfully', async () => {
    // Create a task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Task to be deleted',
        is_completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const deleteInput: DeleteInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the task is actually deleted from the database
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(deletedTasks).toHaveLength(0);
  });

  it('should succeed when deleting non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const deleteInput: DeleteInput = { id: 999 };
    const result = await deleteTask(deleteInput);

    // Should still return success
    expect(result.success).toBe(true);
  });

  it('should delete task with foreign key references', async () => {
    // Create a family member first
    const memberResult = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const memberId = memberResult[0].id;

    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        description: 'Work-related tasks'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a task with foreign key references
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Assigned Task',
        description: 'Task with references',
        assigned_to: memberId,
        category_id: categoryId,
        is_completed: false
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const deleteInput: DeleteInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    // Verify the result
    expect(result.success).toBe(true);

    // Verify the task is deleted
    const deletedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(deletedTasks).toHaveLength(0);

    // Verify the family member and category still exist
    const members = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, memberId))
      .execute();

    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(members).toHaveLength(1);
    expect(categories).toHaveLength(1);
  });
});
