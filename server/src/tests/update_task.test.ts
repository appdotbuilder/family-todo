
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, familyMembersTable, categoriesTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task with all fields', async () => {
    // Create test data
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        avatar_url: null
      })
      .returning()
      .execute();

    const category = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        description: 'Work tasks',
        color: '#FF0000'
      })
      .returning()
      .execute();

    const task = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        due_date: new Date('2024-01-01'),
        is_completed: false,
        assigned_to: null,
        category_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: task[0].id,
      title: 'Updated Task',
      description: 'Updated description',
      due_date: new Date('2024-12-31'),
      is_completed: true,
      assigned_to: familyMember[0].id,
      category_id: category[0].id
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task[0].id);
    expect(result.title).toEqual('Updated Task');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.is_completed).toEqual(true);
    expect(result.assigned_to).toEqual(familyMember[0].id);
    expect(result.category_id).toEqual(category[0].id);
    expect(result.created_at).toEqual(task[0].created_at);
    expect(result.updated_at).not.toEqual(task[0].updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task in database', async () => {
    // Create test task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        due_date: null,
        is_completed: false,
        assigned_to: null,
        category_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: task[0].id,
      title: 'Updated Task',
      is_completed: true
    };

    await updateTask(updateInput);

    // Query database directly to verify changes
    const updatedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task[0].id))
      .execute();

    expect(updatedTask).toHaveLength(1);
    expect(updatedTask[0].title).toEqual('Updated Task');
    expect(updatedTask[0].description).toEqual('Original description'); // Unchanged
    expect(updatedTask[0].is_completed).toEqual(true);
    expect(updatedTask[0].updated_at).not.toEqual(task[0].updated_at);
  });

  it('should update only provided fields', async () => {
    // Create test task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        due_date: new Date('2024-01-01'),
        is_completed: false,
        assigned_to: null,
        category_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: task[0].id,
      title: 'Updated Task Only'
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Updated Task Only');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.due_date).toEqual(new Date('2024-01-01')); // Unchanged
    expect(result.is_completed).toEqual(false); // Unchanged
    expect(result.assigned_to).toEqual(null); // Unchanged
    expect(result.category_id).toEqual(null); // Unchanged
    expect(result.updated_at).not.toEqual(task[0].updated_at);
  });

  it('should handle null values correctly', async () => {
    // Create test data
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        avatar_url: null
      })
      .returning()
      .execute();

    const task = await db.insert(tasksTable)
      .values({
        title: 'Task with Assignment',
        description: 'Task description',
        due_date: new Date('2024-01-01'),
        is_completed: false,
        assigned_to: familyMember[0].id,
        category_id: null
      })
      .returning()
      .execute();

    const updateInput: UpdateTaskInput = {
      id: task[0].id,
      description: null,
      due_date: null,
      assigned_to: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toEqual(null);
    expect(result.due_date).toEqual(null);
    expect(result.assigned_to).toEqual(null);
    expect(result.title).toEqual('Task with Assignment'); // Unchanged
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999,
      title: 'Updated Task'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should always update updated_at timestamp', async () => {
    // Create test task
    const task = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'Test description',
        due_date: null,
        is_completed: false,
        assigned_to: null,
        category_id: null
      })
      .returning()
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: task[0].id,
      title: 'Test Task' // Same title, but should still update timestamp
    };

    const result = await updateTask(updateInput);

    expect(result.updated_at).not.toEqual(task[0].updated_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(task[0].updated_at.getTime());
  });
});
