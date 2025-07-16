
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskManager } from '@/components/TaskManager';
import { FamilyMemberManager } from '@/components/FamilyMemberManager';
import { CategoryManager } from '@/components/CategoryManager';
import { CheckCircle, Circle, Calendar, User, Tag, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Task, FamilyMember, Category } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Load all data with error handling
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const [tasksData, membersData, categoriesData] = await Promise.all([
        trpc.getTasks.query(),
        trpc.getFamilyMembers.query(),
        trpc.getCategories.query()
      ]);
      setTasks(tasksData);
      setFamilyMembers(membersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setHasError(true);
      
      // Load demo data when backend is unavailable
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Demo data for when backend is unavailable
  const loadDemoData = () => {
    const demoFamilyMembers: FamilyMember[] = [
      {
        id: 1,
        name: 'Mom',
        email: 'mom@family.com',
        avatar_url: null,
        created_at: new Date('2024-01-01')
      },
      {
        id: 2,
        name: 'Dad',
        email: 'dad@family.com',
        avatar_url: null,
        created_at: new Date('2024-01-01')
      },
      {
        id: 3,
        name: 'Alice',
        email: 'alice@family.com',
        avatar_url: null,
        created_at: new Date('2024-01-01')
      },
      {
        id: 4,
        name: 'Bob',
        email: null,
        avatar_url: null,
        created_at: new Date('2024-01-01')
      }
    ];

    const demoCategories: Category[] = [
      {
        id: 1,
        name: 'Chores',
        description: 'Household cleaning and maintenance',
        color: '#10b981',
        created_at: new Date('2024-01-01')
      },
      {
        id: 2,
        name: 'Shopping',
        description: 'Grocery and other shopping tasks',
        color: '#3b82f6',
        created_at: new Date('2024-01-01')
      },
      {
        id: 3,
        name: 'School',
        description: 'School-related tasks and activities',
        color: '#f59e0b',
        created_at: new Date('2024-01-01')
      },
      {
        id: 4,
        name: 'Personal',
        description: 'Individual tasks and goals',
        color: '#8b5cf6',
        created_at: new Date('2024-01-01')
      }
    ];

    const demoTasks: Task[] = [
      {
        id: 1,
        title: 'Clean the kitchen',
        description: 'Wash dishes, wipe counters, and mop floor',
        due_date: new Date('2024-12-25'),
        is_completed: false,
        assigned_to: 1,
        category_id: 1,
        created_at: new Date('2024-12-20'),
        updated_at: new Date('2024-12-20')
      },
      {
        id: 2,
        title: 'Buy groceries',
        description: 'Milk, eggs, bread, and vegetables',
        due_date: new Date('2024-12-24'),
        is_completed: true,
        assigned_to: 2,
        category_id: 2,
        created_at: new Date('2024-12-19'),
        updated_at: new Date('2024-12-23')
      },
      {
        id: 3,
        title: 'Finish homework',
        description: 'Math problems and history essay',
        due_date: new Date('2024-12-22'),
        is_completed: false,
        assigned_to: 3,
        category_id: 3,
        created_at: new Date('2024-12-21'),
        updated_at: new Date('2024-12-21')
      },
      {
        id: 4,
        title: 'Walk the dog',
        description: null,
        due_date: null,
        is_completed: false,
        assigned_to: 4,
        category_id: 4,
        created_at: new Date('2024-12-20'),
        updated_at: new Date('2024-12-20')
      },
      {
        id: 5,
        title: 'Vacuum living room',
        description: 'Don\'t forget under the couch!',
        due_date: new Date('2024-12-21'),
        is_completed: false,
        assigned_to: 1,
        category_id: 1,
        created_at: new Date('2024-12-18'),
        updated_at: new Date('2024-12-18')
      }
    ];

    setFamilyMembers(demoFamilyMembers);
    setCategories(demoCategories);
    setTasks(demoTasks);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task handlers with error handling
  const handleToggleTask = async (taskId: number, isCompleted: boolean) => {
    try {
      await trpc.toggleTaskCompletion.mutate({ id: taskId, is_completed: isCompleted });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? { ...task, is_completed: isCompleted } : task
        )
      );
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Optimistically update UI even if backend fails
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? { ...task, is_completed: isCompleted } : task
        )
      );
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      // Optimistically update UI even if backend fails
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    }
  };

  // Helper functions
  const getFamilyMemberName = (memberId: number | null) => {
    if (!memberId) return 'Unassigned';
    const member = familyMembers.find((m: FamilyMember) => m.id === memberId);
    return member ? member.name : 'Unknown';
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'No Category';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return '#64748b';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category?.color || '#64748b';
  };

  // Statistics
  const completedTasks = tasks.filter((task: Task) => task.is_completed).length;
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter((task: Task) => 
    !task.is_completed && task.due_date && new Date(task.due_date) < new Date()
  ).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading family tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          👨‍👩‍👧‍👦 Family Todo List
        </h1>
        <p className="text-gray-600 text-lg">
          Organize your family's tasks and stay on top of everything together
        </p>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                Backend server is not available. Running in demo mode with sample data.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {completedTasks}/{totalTasks}
            </div>
            <p className="text-sm text-blue-600">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Family Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {familyMembers.length}
            </div>
            <p className="text-sm text-green-600">Active members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {overdueTasks}
            </div>
            <p className="text-sm text-orange-600">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Family
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <TaskManager
                tasks={tasks}
                setTasks={setTasks}
                familyMembers={familyMembers}
                categories={categories}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                isOfflineMode={hasError}
              />
            </div>
            
            {/* Quick Task Overview */}
            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Tasks</CardTitle>
                  <CardDescription>Latest task activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task: Task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <button
                          onClick={() => handleToggleTask(task.id, !task.is_completed)}
                          className="flex-shrink-0"
                        >
                          {task.is_completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            task.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{ backgroundColor: getCategoryColor(task.category_id) + '20' }}
                            >
                              {getCategoryName(task.category_id)}
                            </Badge>
                            {task.assigned_to && (
                              <span className="text-xs text-gray-500">
                                {getFamilyMemberName(task.assigned_to)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No tasks yet</p>
                        <p className="text-sm">Create your first task to get started!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="family">
          <FamilyMemberManager
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            tasks={tasks}
            isOfflineMode={hasError}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManager
            categories={categories}
            setCategories={setCategories}
            tasks={tasks}
            isOfflineMode={hasError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
