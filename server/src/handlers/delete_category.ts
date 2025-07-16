
import { db } from '../db';
import { categoriesTable, tasksTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // First, update any tasks that have this category assigned to remove the category reference
    await db.update(tasksTable)
      .set({ category_id: null })
      .where(eq(tasksTable.category_id, input.id))
      .execute();

    // Then delete the category
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
