
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import type { Category, Task,  CreateCategoryInput, UpdateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  tasks: Task[];
  isOfflineMode?: boolean;
}

export function CategoryManager({ categories, setCategories, tasks, isOfflineMode = false }: CategoryManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateCategoryInput>({
    name: '',
    description: null,
    color: '#3b82f6'
  });

  const [editFormData, setEditFormData] = useState<UpdateCategoryInput>({
    id: 0,
    name: '',
    description: null,
    color: '#3b82f6'
  });

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let newCategory: Category;
      
      if (isOfflineMode) {
        // Create category locally in offline mode
        newCategory = {
          id: Math.max(...categories.map(c => c.id), 0) + 1,
          name: createFormData.name,
          description: createFormData.description,
          color: createFormData.color,
          created_at: new Date()
        };
      } else {
        newCategory = await trpc.createCategory.mutate(createFormData);
      }
      
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCreateFormData({
        name: '',
        description: null,
        color: '#3b82f6'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      
      // Fallback to local creation if backend fails
      const newCategory: Category = {
        id: Math.max(...categories.map(c => c.id), 0) + 1,
        name: createFormData.name,
        description: createFormData.description,
        color: createFormData.color,
        created_at: new Date()
      };
      
      setCategories((prev: Category[]) => [...prev, newCategory]);
      setCreateFormData({
        name: '',
        description: null,
        color: '#3b82f6'
      });
      setIsCreateDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    setIsLoading(true);
    
    try {
      let updatedCategory: Category;
      
      if (isOfflineMode) {
        // Update category locally in offline mode
        updatedCategory = {
          ...editingCategory,
          name: editFormData.name || editingCategory.name,
          description: editFormData.description !== undefined ? editFormData.description : editingCategory.description,
          color: editFormData.color || editingCategory.color
        };
      } else {
        updatedCategory = await trpc.updateCategory.mutate(editFormData);
      }
      
      setCategories((prev: Category[]) =>
        prev.map((category: Category) => category.id === editingCategory.id ? updatedCategory : category)
      );
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to update category:', error);
      
      // Fallback to local update if backend fails
      const updatedCategory: Category = {
        ...editingCategory,
        name: editFormData.name || editingCategory.name,
        description: editFormData.description !== undefined ? editFormData.description : editingCategory.description,
        color: editFormData.color || editingCategory.color
      };
      
      setCategories((prev: Category[]) =>
        prev.map((category: Category) => category.id === editingCategory.id ? updatedCategory : category)
      );
      setIsEditDialogOpen(false);
      setEditingCategory(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      if (!isOfflineMode) {
        await trpc.deleteCategory.mutate({ id: categoryId });
      }
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== categoryId));
    } catch (error) {
      console.error('Failed to delete category:', error);
      // Optimistically delete even if backend fails
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== categoryId));
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setEditFormData({
      id: category.id,
      name: category.name,
      description: category.description,
      color: category.color || '#3b82f6'
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryTaskCount = (categoryId: number) => {
    return tasks.filter((task: Task) => task.category_id === categoryId).length;
  };

  const getCategoryCompletedCount = (categoryId: number) => {
    return tasks.filter((task: Task) => task.category_id === categoryId && task.is_completed).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-gray-600">
            Organize your tasks with custom categories
            {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your tasks
                {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <Input
                  placeholder="Category name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateCategoryInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={createFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCreateFormData((prev: CreateCategoryInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Color
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="color"
                    value={createFormData.color || '#3b82f6'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateCategoryInput) => ({ ...prev, color: e.target.value }))
                    }
                    className="w-16 h-10"
                  />
                  <span className="text-sm text-gray-500">
                    {createFormData.color}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color: string) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        createFormData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCreateFormData((prev: CreateCategoryInput) => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p className="text-gray-500 mb-4">Create categories to organize your tasks</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Category
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          categories.map((category: Category) => {
            const taskCount = getCategoryTaskCount(category.id);
            const completedCount = getCategoryCompletedCount(category.id);
            const completionRate = taskCount > 0 ? (completedCount / taskCount) * 100 : 0;

            return (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      >
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
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
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{category.name}"? This will remove the category from {taskCount} task{taskCount !== 1 ? 's' : ''}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Task Usage</span>
                      <Badge variant="secondary">{taskCount} tasks</Badge>
                    </div>
                    
                    {taskCount > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completed</span>
                          <span className="font-medium">{completedCount}/{taskCount}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${completionRate}%`,
                              backgroundColor: category.color || '#3b82f6'
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {Math.round(completionRate)}% complete
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Created {category.created_at.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
              {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div>
              <Input
                placeholder="Category name"
                value={editFormData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateCategoryInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            
            
            <div>
              <Textarea
                placeholder="Description (optional)"
                value={editFormData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditFormData((prev: UpdateCategoryInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Color
              </label>
              <div className="flex items-center gap-2 mb-2">
                <Input
                  type="color"
                  value={editFormData.color || '#3b82f6'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateCategoryInput) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-16 h-10"
                />
                <span className="text-sm text-gray-500">
                  {editFormData.color}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {predefinedColors.map((color: string) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      editFormData.color === color ? 'border-gray-400' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditFormData((prev: UpdateCategoryInput) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
