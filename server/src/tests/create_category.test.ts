
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

const testInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing',
  color: '#FF0000'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category', async () => {
    const result = await createCategory(testInput);

    expect(result.name).toEqual('Test Category');
    expect(result.description).toEqual('A category for testing');
    expect(result.color).toEqual('#FF0000');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
    expect(categories[0].description).toEqual('A category for testing');
    expect(categories[0].color).toEqual('#FF0000');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields', async () => {
    const inputWithNulls: CreateCategoryInput = {
      name: 'Minimal Category',
      description: null,
      color: null
    };

    const result = await createCategory(inputWithNulls);

    expect(result.name).toEqual('Minimal Category');
    expect(result.description).toBeNull();
    expect(result.color).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create categories with unique names', async () => {
    const firstCategory = await createCategory(testInput);
    
    const secondInput: CreateCategoryInput = {
      name: 'Different Category',
      description: 'Another category',
      color: '#00FF00'
    };
    
    const secondCategory = await createCategory(secondInput);

    expect(firstCategory.id).not.toEqual(secondCategory.id);
    expect(firstCategory.name).toEqual('Test Category');
    expect(secondCategory.name).toEqual('Different Category');
  });
});
