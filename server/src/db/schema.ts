
import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const familyMembersTable = pgTable('family_members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Nullable by default
  avatar_url: text('avatar_url'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  color: text('color'), // Nullable by default (hex color code)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  due_date: timestamp('due_date'), // Nullable by default
  is_completed: boolean('is_completed').notNull().default(false),
  assigned_to: integer('assigned_to'), // Foreign key to family_members, nullable
  category_id: integer('category_id'), // Foreign key to categories, nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const familyMembersRelations = relations(familyMembersTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  assignedTo: one(familyMembersTable, {
    fields: [tasksTable.assigned_to],
    references: [familyMembersTable.id],
  }),
  category: one(categoriesTable, {
    fields: [tasksTable.category_id],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type FamilyMember = typeof familyMembersTable.$inferSelect;
export type NewFamilyMember = typeof familyMembersTable.$inferInsert;

export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  familyMembers: familyMembersTable,
  categories: categoriesTable,
  tasks: tasksTable
};
