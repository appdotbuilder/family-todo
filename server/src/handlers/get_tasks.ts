
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';

export async function getTasks(): Promise<Task[]> {
  try {
    const results = await db.select()
      .from(tasksTable)
      .execute();

    return results.map(task => ({
      ...task,
      // Convert timestamps to Date objects
      created_at: new Date(task.created_at),
      updated_at: new Date(task.updated_at),
      due_date: task.due_date ? new Date(task.due_date) : null
    }));
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}
