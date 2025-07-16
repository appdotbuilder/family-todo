
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, familyMembersTable, categoriesTable } from '../db/schema';
import { type ToggleTaskCompletionInput } from '../schema';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task completion to true', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A test task',
        is_completed: false
      })
      .returning()
      .execute();

    const task = taskResult[0];
    const originalUpdatedAt = task.updated_at;

    // Wait a bit to ensure updated_at timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTaskCompletionInput = {
      id: task.id,
      is_completed: true
    };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(task.id);
    expect(result.is_completed).toBe(true);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A test task');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should toggle task completion to false', async () => {
    // Create a completed test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'A completed task',
        is_completed: true
      })
      .returning()
      .execute();

    const task = taskResult[0];
    const originalUpdatedAt = task.updated_at;

    // Wait a bit to ensure updated_at timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTaskCompletionInput = {
      id: task.id,
      is_completed: false
    };

    const result = await toggleTaskCompletion(input);

    expect(result.id).toEqual(task.id);
    expect(result.is_completed).toBe(false);
    expect(result.title).toEqual('Completed Task');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should update the task in the database', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        is_completed: false
      })
      .returning()
      .execute();

    const task = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: task.id,
      is_completed: true
    };

    await toggleTaskCompletion(input);

    // Verify the task was updated in the database
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].is_completed).toBe(true);
    expect(updatedTasks[0].updated_at).toBeInstanceOf(Date);
    expect(updatedTasks[0].updated_at.getTime()).toBeGreaterThan(task.updated_at.getTime());
  });

  it('should throw error when task does not exist', async () => {
    const input: ToggleTaskCompletionInput = {
      id: 999,
      is_completed: true
    };

    await expect(toggleTaskCompletion(input)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should preserve all other task fields', async () => {
    // Create family member and category for full task
    const familyMemberResult = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        description: 'Work tasks',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const dueDate = new Date('2024-12-31');
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Complete Project',
        description: 'Finish the family task manager',
        due_date: dueDate,
        is_completed: false,
        assigned_to: familyMemberResult[0].id,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    const task = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: task.id,
      is_completed: true
    };

    const result = await toggleTaskCompletion(input);

    // Verify all fields are preserved
    expect(result.title).toEqual('Complete Project');
    expect(result.description).toEqual('Finish the family task manager');
    expect(result.due_date).toEqual(dueDate);
    expect(result.is_completed).toBe(true);
    expect(result.assigned_to).toEqual(familyMemberResult[0].id);
    expect(result.category_id).toEqual(categoryResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
