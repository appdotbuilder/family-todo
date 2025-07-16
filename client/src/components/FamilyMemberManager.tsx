
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit2, Trash2, User, Mail, CheckCircle, Clock } from 'lucide-react';
import type { FamilyMember, Task, CreateFamilyMemberInput, UpdateFamilyMemberInput } from '../../../server/src/schema';

interface FamilyMemberManagerProps {
  familyMembers: FamilyMember[];
  setFamilyMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  tasks: Task[];
  isOfflineMode?: boolean;
}

export function FamilyMemberManager({ familyMembers, setFamilyMembers, tasks, isOfflineMode = false }: FamilyMemberManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateFamilyMemberInput>({
    name: '',
    email: null,
    avatar_url: null
  });

  const [editFormData, setEditFormData] = useState<UpdateFamilyMemberInput>({
    id: 0,
    name: '',
    email: null,
    avatar_url: null
  });

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let newMember: FamilyMember;
      
      if (isOfflineMode) {
        // Create member locally in offline mode
        newMember = {
          id: Math.max(...familyMembers.map(m => m.id), 0) + 1,
          name: createFormData.name,
          email: createFormData.email,
          avatar_url: createFormData.avatar_url,
          created_at: new Date()
        };
      } else {
        newMember = await trpc.createFamilyMember.mutate(createFormData);
      }
      
      setFamilyMembers((prev: FamilyMember[]) => [...prev, newMember]);
      setCreateFormData({
        name: '',
        email: null,
        avatar_url: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create family member:', error);
      
      // Fallback to local creation if backend fails
      const newMember: FamilyMember = {
        id: Math.max(...familyMembers.map(m => m.id), 0) + 1,
        name: createFormData.name,
        email: createFormData.email,
        avatar_url: createFormData.avatar_url,
        created_at: new Date()
      };
      
      setFamilyMembers((prev: FamilyMember[]) => [...prev, newMember]);
      setCreateFormData({
        name: '',
        email: null,
        avatar_url: null
      });
      setIsCreateDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setIsLoading(true);
    
    try {
      let updatedMember: FamilyMember;
      
      if (isOfflineMode) {
        // Update member locally in offline mode
        updatedMember = {
          ...editingMember,
          name: editFormData.name || editingMember.name,
          email: editFormData.email !== undefined ? editFormData.email : editingMember.email,
          avatar_url: editFormData.avatar_url !== undefined ? editFormData.avatar_url : editingMember.avatar_url
        };
      } else {
        updatedMember = await trpc.updateFamilyMember.mutate(editFormData);
      }
      
      setFamilyMembers((prev: FamilyMember[]) =>
        prev.map((member: FamilyMember) => member.id === editingMember.id ? updatedMember : member)
      );
      setIsEditDialogOpen(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update family member:', error);
      
      // Fallback to local update if backend fails
      const updatedMember: FamilyMember = {
        ...editingMember,
        name: editFormData.name || editingMember.name,
        email: editFormData.email !== undefined ? editFormData.email : editingMember.email,
        avatar_url: editFormData.avatar_url !== undefined ? editFormData.avatar_url : editingMember.avatar_url
      };
      
      setFamilyMembers((prev: FamilyMember[]) =>
        prev.map((member: FamilyMember) => member.id === editingMember.id ? updatedMember : member)
      );
      setIsEditDialogOpen(false);
      setEditingMember(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      if (!isOfflineMode) {
        await trpc.deleteFamilyMember.mutate({ id: memberId });
      }
      setFamilyMembers((prev: FamilyMember[]) => prev.filter((member: FamilyMember) => member.id !== memberId));
    } catch (error) {
      console.error('Failed to delete family member:', error);
      // Optimistically delete even if backend fails
      setFamilyMembers((prev: FamilyMember[]) => prev.filter((member: FamilyMember) => member.id !== memberId));
    }
  };

  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setEditFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      avatar_url: member.avatar_url
    });
    setIsEditDialogOpen(true);
  };

  const getMemberTaskStats = (memberId: number) => {
    const memberTasks = tasks.filter((task: Task) => task.assigned_to === memberId);
    const completedTasks = memberTasks.filter((task: Task) => task.is_completed).length;
    const pendingTasks = memberTasks.length - completedTasks;
    const overdueTasks = memberTasks.filter((task: Task) => 
      !task.is_completed && task.due_date && new Date(task.due_date) < new Date()
    ).length;

    return { total: memberTasks.length, completed: completedTasks, pending: pendingTasks, overdue: overdueTasks };
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Family Members</h2>
          <p className="text-gray-600">
            Manage your family member profiles and assignments
            {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Member</DialogTitle>
              <DialogDescription>
                Add a new family member to your household
                {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <Input
                  placeholder="Full name"
                  value={createFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateFamilyMemberInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Email address (optional)"
                  value={createFormData.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateFamilyMemberInput) => ({
                      ...prev,
                      email: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div>
                <Input
                  type="url"
                  placeholder="Avatar URL (optional)"
                  value={createFormData.avatar_url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCreateFormData((prev: CreateFamilyMemberInput) => ({
                      ...prev,
                      avatar_url: e.target.value || null
                    }))
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No family members yet</h3>
                <p className="text-gray-500 mb-4">Add family members to start assigning tasks</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          familyMembers.map((member: FamilyMember) => {
            const stats = getMemberTaskStats(member.id);
            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || ''} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        {member.email && (
                          <CardDescription className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(member)}
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
                            <AlertDialogTitle>Delete Family Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {member.name}? This will unassign them from all tasks.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMember(member.id)}>
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
                      <span className="text-sm font-medium text-gray-600">Task Overview</span>
                      <Badge variant="secondary">{stats.total} total</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium">{stats.completed}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-medium">{stats.pending}</span>
                      </div>
                    </div>
                    
                    {stats.overdue > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-red-50 rounded-md">
                        <Clock className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">
                          {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Member since {member.created_at.toLocaleDateString()}
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
            <DialogTitle>Edit Family Member</DialogTitle>
            <DialogDescription>
              Update family member information
              {isOfflineMode && <span className="text-orange-600 ml-2">(Demo Mode)</span>}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMember} className="space-y-4">
            <div>
              <Input
                placeholder="Full name"
                value={editFormData.name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFamilyMemberInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <Input
                type="email"
                placeholder="Email address (optional)"
                value={editFormData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFamilyMemberInput) => ({
                    ...prev,
                    email: e.target.value || null
                  }))
                }
              />
            </div>
            
            <div>
              <Input
                type="url"
                placeholder="Avatar URL (optional)"
                value={editFormData.avatar_url || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditFormData((prev: UpdateFamilyMemberInput) => ({
                    ...prev,
                    avatar_url: e.target.value || null
                  }))
                }
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
