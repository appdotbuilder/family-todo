
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createFamilyMemberInputSchema,
  updateFamilyMemberInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  deleteInputSchema,
  toggleTaskCompletionInputSchema
} from './schema';

// Import handlers
import { createFamilyMember } from './handlers/create_family_member';
import { getFamilyMembers } from './handlers/get_family_members';
import { updateFamilyMember } from './handlers/update_family_member';
import { deleteFamilyMember } from './handlers/delete_family_member';

import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';

import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { toggleTaskCompletion } from './handlers/toggle_task_completion';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Family Member routes
  createFamilyMember: publicProcedure
    .input(createFamilyMemberInputSchema)
    .mutation(({ input }) => createFamilyMember(input)),
  
  getFamilyMembers: publicProcedure
    .query(() => getFamilyMembers()),
  
  updateFamilyMember: publicProcedure
    .input(updateFamilyMemberInputSchema)
    .mutation(({ input }) => updateFamilyMember(input)),
  
  deleteFamilyMember: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteFamilyMember(input)),

  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  
  deleteCategory: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .query(() => getTasks()),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTask(input)),
  
  toggleTaskCompletion: publicProcedure
    .input(toggleTaskCompletionInputSchema)
    .mutation(({ input }) => toggleTaskCompletion(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
