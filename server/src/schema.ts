
import { z } from 'zod';

// Family member schema
export const familyMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date()
});

export type FamilyMember = z.infer<typeof familyMemberSchema>;

// Input schema for creating family members
export const createFamilyMemberInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable(),
  avatar_url: z.string().url().nullable()
});

export type CreateFamilyMemberInput = z.infer<typeof createFamilyMemberInputSchema>;

// Input schema for updating family members
export const updateFamilyMemberInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().nullable().optional(),
  avatar_url: z.string().url().nullable().optional()
});

export type UpdateFamilyMemberInput = z.infer<typeof updateFamilyMemberInputSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().nullable(),
  color: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Category name is required").optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  is_completed: z.boolean(),
  assigned_to: z.number().nullable(),
  category_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  assigned_to: z.number().nullable(),
  category_id: z.number().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Task title is required").optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  is_completed: z.boolean().optional(),
  assigned_to: z.number().nullable().optional(),
  category_id: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for deleting records
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

// Input schema for marking task complete/incomplete
export const toggleTaskCompletionInputSchema = z.object({
  id: z.number(),
  is_completed: z.boolean()
});

export type ToggleTaskCompletionInput = z.infer<typeof toggleTaskCompletionInputSchema>;
