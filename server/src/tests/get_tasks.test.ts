
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, familyMembersTable, categoriesTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Create test data
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .returning()
      .execute();

    const category = await db.insert(categoriesTable)
      .values({
        name: 'Work',
        description: 'Work related tasks',
        color: '#FF0000'
      })
      .returning()
      .execute();

    await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          due_date: new Date('2024-01-15'),
          is_completed: false,
          assigned_to: familyMember[0].id,
          category_id: category[0].id
        },
        {
          title: 'Task 2',
          description: 'Second task',
          due_date: null,
          is_completed: true,
          assigned_to: null,
          category_id: null
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify first task
    const task1 = result.find(t => t.title === 'Task 1');
    expect(task1).toBeDefined();
    expect(task1!.title).toBe('Task 1');
    expect(task1!.description).toBe('First task');
    expect(task1!.due_date).toBeInstanceOf(Date);
    expect(task1!.due_date!.getFullYear()).toBe(2024);
    expect(task1!.is_completed).toBe(false);
    expect(task1!.assigned_to).toBe(familyMember[0].id);
    expect(task1!.category_id).toBe(category[0].id);
    expect(task1!.created_at).toBeInstanceOf(Date);
    expect(task1!.updated_at).toBeInstanceOf(Date);
    expect(task1!.id).toBeDefined();

    // Verify second task
    const task2 = result.find(t => t.title === 'Task 2');
    expect(task2).toBeDefined();
    expect(task2!.title).toBe('Task 2');
    expect(task2!.description).toBe('Second task');
    expect(task2!.due_date).toBeNull();
    expect(task2!.is_completed).toBe(true);
    expect(task2!.assigned_to).toBeNull();
    expect(task2!.category_id).toBeNull();
    expect(task2!.created_at).toBeInstanceOf(Date);
    expect(task2!.updated_at).toBeInstanceOf(Date);
    expect(task2!.id).toBeDefined();
  });

  it('should handle tasks with minimal data', async () => {
    // Create task with only required fields
    await db.insert(tasksTable)
      .values({
        title: 'Minimal Task'
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Minimal Task');
    expect(result[0].description).toBeNull();
    expect(result[0].due_date).toBeNull();
    expect(result[0].is_completed).toBe(false); // Default value
    expect(result[0].assigned_to).toBeNull();
    expect(result[0].category_id).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return tasks in creation order', async () => {
    // Create tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: 'First Task'
      })
      .execute();

    await db.insert(tasksTable)
      .values({
        title: 'Second Task'
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('First Task');
    expect(result[1].title).toBe('Second Task');
  });
});
