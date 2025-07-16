
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type CreateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Helper function to create a test category
const createTestCategory = async (data: CreateCategoryInput) => {
  const result = await db.insert(categoriesTable)
    .values({
      name: data.name,
      description: data.description,
      color: data.color
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name only', async () => {
    // Create test category
    const testCategory = await createTestCategory({
      name: 'Original Category',
      description: 'Original description',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated Category'
    };

    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Original description');
    expect(result.color).toEqual('#FF0000');
    expect(result.id).toEqual(testCategory.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update all fields', async () => {
    // Create test category
    const testCategory = await createTestCategory({
      name: 'Original Category',
      description: 'Original description',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated Category',
      description: 'Updated description',
      color: '#00FF00'
    };

    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Updated description');
    expect(result.color).toEqual('#00FF00');
    expect(result.id).toEqual(testCategory.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    // Create test category with non-null values
    const testCategory = await createTestCategory({
      name: 'Original Category',
      description: 'Original description',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      description: null,
      color: null
    };

    const result = await updateCategory(updateInput);

    expect(result.name).toEqual('Original Category');
    expect(result.description).toBeNull();
    expect(result.color).toBeNull();
    expect(result.id).toEqual(testCategory.id);
  });

  it('should save updated category to database', async () => {
    // Create test category
    const testCategory = await createTestCategory({
      name: 'Original Category',
      description: 'Original description',
      color: '#FF0000'
    });

    const updateInput: UpdateCategoryInput = {
      id: testCategory.id,
      name: 'Updated Category',
      description: 'Updated description'
    };

    await updateCategory(updateInput);

    // Verify database was updated
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, testCategory.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Updated Category');
    expect(categories[0].description).toEqual('Updated description');
    expect(categories[0].color).toEqual('#FF0000');
  });

  it('should throw error when category not found', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Updated Category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/Category with id 999 not found/i);
  });
});
