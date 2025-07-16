
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, tasksTable, familyMembersTable } from '../db/schema';
import { type DeleteInput, type CreateCategoryInput, type CreateTaskInput, type CreateFamilyMemberInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category', async () => {
    // Create a category first
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'A test category',
      color: '#FF0000'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    const category = categoryResult[0];

    // Delete the category
    const deleteInput: DeleteInput = { id: category.id };
    const result = await deleteCategory(deleteInput);

    expect(result.success).toBe(true);

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, category.id))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should return false for non-existent category', async () => {
    const deleteInput: DeleteInput = { id: 999 };
    const result = await deleteCategory(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should set category_id to null for tasks assigned to deleted category', async () => {
    // Create a family member first
    const familyMemberInput: CreateFamilyMemberInput = {
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: null
    };

    const familyMemberResult = await db.insert(familyMembersTable)
      .values(familyMemberInput)
      .returning()
      .execute();

    const familyMember = familyMemberResult[0];

    // Create a category
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'A test category',
      color: '#FF0000'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create a task with this category
    const taskInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A test task',
      due_date: null,
      assigned_to: familyMember.id,
      category_id: category.id
    };

    const taskResult = await db.insert(tasksTable)
      .values(taskInput)
      .returning()
      .execute();

    const task = taskResult[0];

    // Delete the category
    const deleteInput: DeleteInput = { id: category.id };
    const result = await deleteCategory(deleteInput);

    expect(result.success).toBe(true);

    // Verify task's category_id is now null
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].category_id).toBeNull();
  });

  it('should handle multiple tasks with same category', async () => {
    // Create a family member first
    const familyMemberInput: CreateFamilyMemberInput = {
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: null
    };

    const familyMemberResult = await db.insert(familyMembersTable)
      .values(familyMemberInput)
      .returning()
      .execute();

    const familyMember = familyMemberResult[0];

    // Create a category
    const categoryInput: CreateCategoryInput = {
      name: 'Test Category',
      description: 'A test category',
      color: '#FF0000'
    };

    const categoryResult = await db.insert(categoriesTable)
      .values(categoryInput)
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create multiple tasks with this category
    const taskInput1: CreateTaskInput = {
      title: 'Test Task 1',
      description: 'First test task',
      due_date: null,
      assigned_to: familyMember.id,
      category_id: category.id
    };

    const taskInput2: CreateTaskInput = {
      title: 'Test Task 2',
      description: 'Second test task',
      due_date: null,
      assigned_to: familyMember.id,
      category_id: category.id
    };

    await db.insert(tasksTable)
      .values([taskInput1, taskInput2])
      .execute();

    // Delete the category
    const deleteInput: DeleteInput = { id: category.id };
    const result = await deleteCategory(deleteInput);

    expect(result.success).toBe(true);

    // Verify all tasks with this category have category_id set to null
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.assigned_to, familyMember.id))
      .execute();

    expect(tasks).toHaveLength(2);
    tasks.forEach(task => {
      expect(task.category_id).toBeNull();
    });
  });
});
