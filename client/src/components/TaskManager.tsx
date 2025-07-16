
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { Plus, Edit2, Trash2, CheckCircle, Circle, Calendar, User, Tag } from 'lucide-react';
import type { Task, FamilyMember, Category, CreateTaskInput, UpdateTaskInput } from '../../../server/src/schema';

interface TaskManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  familyMembers: FamilyMember[];
  categories: Category[];
  onToggleTask: (taskId: number, isCompleted: boolean) => void;
  onDeleteTask: (taskId: number) => void;
  isOfflineMode?: boolean;
}

export function TaskManager({ 
  tasks, 
  setTasks, 
  familyMembers, 
  categories, 
  onToggleTask, 
  onDeleteTask,
  isOfflineMode = false
}: TaskManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [createFormData, setCreateFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    due_date: null,
    assigned_to: null,
    category_id: null
  });

  const [editFormData, setEditFormData] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null,
    due_date: null,
    assigned_to: null,
    category_id: null
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let newTask: Task;
      
      if (isOfflineMode) {
        // Create task locally in offline mode
        newTask = {
          id: Math.max(...tasks.map(t => t.id), 0) + 1,
          title: createFormData.title,
          description: createFormData.description,
          due_date: createFormData.due_date,
          is_completed: false,
          assigned_to: createFormData.assigned_to,
          category_id: createFormData.category_id,
          created_at: new Date(),
          updated_at: new Date()
        };
      } else {
        newTask = await trpc.createTask.mutate(createFormData);
      }
      
      setTasks((prev: Task[]) => [...prev, newTask]);
      setCreateFormData({
        title: '',
        description: null,
        due_date: null,
        assigned_to: null,
        category_id: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      
      // Fallback to local creation if backend fails
      const newTask: Task = {
        id: Math.max(...tasks.map(t => t.id), 0) + 1,
        title: createFormData.title,
        description: createFormData.description,
        due_date: createFormData.due_date,
        is_completed: false,
        assigned_to: createFormData.assigned_to,
        category_id: createFormData.category_id,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setTasks((prev: Task[]) => [...prev, newTask]);
      setCreateFormData({
        title: '',
        description: null,
        due_date: null,
        assigned_to: null,
        category_id: null
      });
      setIsCreateDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsLoading(true);
    
    try {
      let updatedTask: Task;
      
      if (isOfflineMode) {
        // Update task locally in offline mode
        updatedTask = {
          ...editingTask,
          title: editFormData.title || editingTask.title,
          description: editFormData.description !== undefined ? editFormData.description : editingTask.description,
          due_date: editFormData.due_date !== undefined ? editFormData.due_date : editingTask.due_date,
          assigned_to: editFormData.assigned_to !== undefined ? editFormData.assigned_to : editingTask.assigned_to,
          category_id: editFormData.category_id !== undefined ? editFormData.category_id : editingTask.category_id,
          updated_at: new Date()
        };
      } else {
        updatedTask = await trpc.updateTask.mutate(editFormData);
      }
      
      setTasks((prev: Task[]) =>
        prev.map((task: Task) => task.id === editingTask.id ? updatedTask : task)
      );
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      
      // Fallback to local update if backend fails
      const updatedTask: Task = {
        ...editingTask,
        title: editFormData.title || editingTask.title,
        description: editFormData.description !== undefined ? editFormData.description : editingTask.description,
        due_date: editFormData.due_date !== undefined ? editFormData.due_date : editingTask.due_date,
        assigned_to: editFormData.assigned_to !== undefined ? editFormData.assigned_to : editingTask.assigned_to,
        category_id: editFormData.category_id !== undefined ? editFormData.category_id : editingTask.category_id,
        updated_at: new Date()
      };
      
      setTasks((prev: Task[]) =>
        prev.map((task: Task) => task.id === editingTask.id ? updatedTask : task)
      );
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      id: task.id,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      category_id: task.category_id
    });
    setIsEditDialogOpen(true);
  };

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

  const filteredTasks = tasks.filter((task: Task) => {
    const statusMatch = filter === 'all' || 
      (filter === 'completed' && task.is_completed) ||
      (filter === 'pending' && !task.is_completed);
    
    const assigneeMatch = assigneeFilter === 'all' || 
      task.assigned_to?.toString() === assigneeFilter;
    
    const categoryMatch = categoryFilter === 'all' || 
      task.category_id?.toString() === categoryFilter;
    
    return statusMatch && assigneeMatch && categoryMatch;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate: Date | null, isCompleted: boolean) => {
    if (!dueDate || isCompleted) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600">
            Manage your family's tasks and assignments
            {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task for your family to complete
                {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <Input
                  placeholder="Task title"
                  value={createFormData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div>
                <Input
                  type="date"
                  value={createFormData.due_date ? new Date(createFormData.due_date).toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />
              </div>
              
              <div>
                <Select
                  value={createFormData.assigned_to?.toString() || 'unassigned'}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      assigned_to: value === 'unassigned' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to family member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {familyMembers.map((member: FamilyMember) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select
                  value={createFormData.category_id?.toString() || 'none'}
                  onValueChange={(value: string) =>
                    setCreateFormData((prev: CreateTaskInput) => ({
                      ...prev,
                      category_id: value === 'none' ? null : parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                
                            style={{ backgroundColor: category.color || '#64748b' }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <Tabs value={filter} onValueChange={(value: string) => setFilter(value as 'all' | 'pending' | 'completed')}>
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex gap-2">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {familyMembers.map((member: FamilyMember) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? "Create your first task to get started!" 
                  : `No ${filter} tasks match your current filters.`
                }
              </p>
              {filter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Task
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task: Task) => (
            <Card key={task.id} className={`${task.is_completed ? 'opacity-75' : ''} ${isOverdue(task.due_date, task.is_completed) ? 'border-red-200 bg-red-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => onToggleTask(task.id, !task.is_completed)}
                    className="flex-shrink-0 mt-1"
                  >
                    {task.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className={`text-lg font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Task</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{task.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteTask(task.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm mt-2 ${task.is_completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-sm ${
                          isOverdue(task.due_date, task.is_completed) 
                            ? 'text-red-600' 
                            : task.is_completed 
                              ? 'text-gray-400' 
                              : 'text-gray-500'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.due_date)}
                          {isOverdue(task.due_date, task.is_completed) && (
                            <span className="ml-1 text-red-600 font-medium">OVERDUE</span>
                          )}
                        </div>
                      )}
                      
                      {task.assigned_to && (
                        <div className={`flex items-center gap-1 text-sm ${task.is_completed ? 'text-gray-400' : 'text-gray-500'}`}>
                          <User className="h-4 w-4" />
                          {getFamilyMemberName(task.assigned_to)}
                        </div>
                      )}
                      
                      {task.category_id && (
                        <Badge
                          variant="secondary"
                          className="flex items-center gap-1"
                          style={{ backgroundColor: getCategoryColor(task.category_id) + '20' }}
                        >
                          <Tag className="h-3 w-3" />
                          {getCategoryName(task.category_id)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
              {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <Input
                placeholder="Task title"
                value={editFormData.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <Textarea
                placeholder="Description (optional)"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
              />
            </div>
            
            <div>
              <Input
                type="date"
                value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().split('T')[0] : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    due_date: e.target.value ? new Date(e.target.value) : null
                  }))
                }
              />
            </div>
            
            <div>
              <Select
                value={editFormData.assigned_to?.toString() || 'unassigned'}
                onValueChange={(value: string) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    assigned_to: value === 'unassigned' ? null : parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign to family member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No assignment</SelectItem>
                  {familyMembers.map((member: FamilyMember) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select
                value={editFormData.category_id?.toString() || 'none'}
                onValueChange={(value: string) =>
                  setEditFormData((prev: UpdateTaskInput) => ({
                    ...prev,
                    category_id: value === 'none' ? null : parseInt(value)
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color || '#64748b' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
