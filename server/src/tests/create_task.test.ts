
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, familyMembersTable, categoriesTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with minimal required fields', async () => {
    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: null,
      due_date: null,
      assigned_to: null,
      category_id: null
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Test Task');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.category_id).toBeNull();
    expect(result.is_completed).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with all fields populated', async () => {
    // Create prerequisite data
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
        name: 'Household',
        description: 'Home tasks',
        color: '#FF5733'
      })
      .returning()
      .execute();

    const dueDate = new Date('2024-12-31');
    const testInput: CreateTaskInput = {
      title: 'Complete Project',
      description: 'Finish the family task manager',
      due_date: dueDate,
      assigned_to: familyMember[0].id,
      category_id: category[0].id
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Complete Project');
    expect(result.description).toEqual('Finish the family task manager');
    expect(result.due_date).toEqual(dueDate);
    expect(result.assigned_to).toEqual(familyMember[0].id);
    expect(result.category_id).toEqual(category[0].id);
    expect(result.is_completed).toBe(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const testInput: CreateTaskInput = {
      title: 'Database Test Task',
      description: 'Testing database persistence',
      due_date: null,
      assigned_to: null,
      category_id: null
    };

    const result = await createTask(testInput);

    // Query the database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].description).toEqual('Testing database persistence');
    expect(tasks[0].is_completed).toBe(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle foreign key references correctly', async () => {
    // Create family member first
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar_url: null
      })
      .returning()
      .execute();

    const testInput: CreateTaskInput = {
      title: 'Task with Assignment',
      description: null,
      due_date: null,
      assigned_to: familyMember[0].id,
      category_id: null
    };

    const result = await createTask(testInput);

    expect(result.assigned_to).toEqual(familyMember[0].id);

    // Verify foreign key relationship in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].assigned_to).toEqual(familyMember[0].id);
  });
});
