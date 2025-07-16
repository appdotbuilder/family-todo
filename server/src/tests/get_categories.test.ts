
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    expect(result).toEqual([]);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable).values([
      {
        name: 'Household',
        description: 'Home maintenance tasks',
        color: '#FF5733'
      },
      {
        name: 'Work',
        description: 'Professional tasks',
        color: '#3498DB'
      },
      {
        name: 'Personal',
        description: null,
        color: null
      }
    ]).execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Check first category
    expect(result[0].name).toEqual('Household');
    expect(result[0].description).toEqual('Home maintenance tasks');
    expect(result[0].color).toEqual('#FF5733');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second category
    expect(result[1].name).toEqual('Work');
    expect(result[1].description).toEqual('Professional tasks');
    expect(result[1].color).toEqual('#3498DB');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);

    // Check third category with null values
    expect(result[2].name).toEqual('Personal');
    expect(result[2].description).toBeNull();
    expect(result[2].color).toBeNull();
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return categories ordered by creation time', async () => {
    // Create categories with slight delay to ensure different timestamps
    await db.insert(categoriesTable).values({
      name: 'First Category',
      description: 'Created first',
      color: '#FF0000'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(categoriesTable).values({
      name: 'Second Category',
      description: 'Created second',
      color: '#00FF00'
    }).execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Category');
    expect(result[1].name).toEqual('Second Category');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
