
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function toggleTaskCompletion(input: ToggleTaskCompletionInput): Promise<Task> {
  try {
    // Update the task's completion status and updated_at timestamp
    const result = await db.update(tasksTable)
      .set({
        is_completed: input.is_completed,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Toggle task completion failed:', error);
    throw error;
  }
}
