import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, Plus, X, Loader2 } from 'lucide-react';
import API from '@/lib/api';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showAddRole, setShowAddRole] = useState(false);
  const [showCreateCasting, setShowCreateCasting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [roleForm, setRoleForm] = useState({
    roleName: '',
    roleType: 'Supporting',
    ageMin: '',
    ageMax: '',
    gender: 'Any',
    physicalTraits: '',
    skillsRequired: '',
    experienceLevel: 'Beginner',
    roleDescription: '',
    numberOfOpenings: 1
  });

  const [castingForm, setCastingForm] = useState({
    description: '',
    auditionDate: '',
    submissionDeadline: '',
    location: '',
    skills: []
  });

  // Fetch project details
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data } = await API.get(`/projects/${projectId}`);
      if (!data.success) throw new Error('Failed to load project');
      return data.data;
    }
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async () => {
      if (!roleForm.roleName.trim()) {
        throw new Error('Role name is required');
      }
      const { data } = await API.post(`/projects/${projectId}/roles`, {
        role: roleForm
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('Role added successfully');
      setRoleForm({
        roleName: '',
        roleType: 'Supporting',
        ageMin: '',
        ageMax: '',
        gender: 'Any',
        physicalTraits: '',
        skillsRequired: '',
        experienceLevel: 'Beginner',
        roleDescription: '',
        numberOfOpenings: 1
      });
      setShowAddRole(false);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add role');
    }
  });

  // Create casting from role mutation
  const createCastingMutation = useMutation({
    mutationFn: async () => {
      if (!castingForm.auditionDate || !castingForm.submissionDeadline) {
        throw new Error('Audition date and submission deadline are required');
      }
      const { data } = await API.post(`/projects/${projectId}/roles/${selectedRole._id}/casting`, {
        roleId: selectedRole._id,
        castingData: {
          ...castingForm,
          location: castingForm.location || projectQuery.data?.location,
          skills: castingForm.skills.length > 0 ? castingForm.skills : selectedRole.skillsRequired || []
        }
      });
      return data.data;
    },
    onSuccess: () => {
      toast.success('Casting created successfully');
      setCastingForm({
        description: '',
        auditionDate: '',
        submissionDeadline: '',
        location: '',
        skills: []
      });
      setShowCreateCasting(false);
      setSelectedRole(null);
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create casting');
    }
  });

  if (projectQuery.isLoading) {
    return <div className="container py-8">Loading project...</div>;
  }

  if (projectQuery.isError) {
    return <div className="container py-8 text-red-500">Failed to load project</div>;
  }

  const project = projectQuery.data;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          className="mb-0"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.genre} • {project.language}</p>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <p className="text-sm text-muted-foreground mt-1">{project.location || 'Not specified'}</p>
            </div>
            {project.startDate && (
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <p className="text-sm text-muted-foreground mt-1">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
            )}
            {project.endDate && (
              <div>
                <label className="text-sm font-medium">End Date</label>
                <p className="text-sm text-muted-foreground mt-1">{new Date(project.endDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Roles Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Roles ({project.roles?.length || 0})</CardTitle>
          <Button
            onClick={() => setShowAddRole(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Role
          </Button>
        </CardHeader>
        <CardContent>
          {!project.roles || project.roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles added yet</p>
          ) : (
            <div className="space-y-4">
              {project.roles.map((role) => (
                <div key={role._id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{role.roleName}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{role.roleType}</Badge>
                        <Badge variant="outline">{role.experienceLevel}</Badge>
                        {role.castingCallId && (
                          <Badge className="bg-green-600">Casting Created</Badge>
                        )}
                      </div>
                    </div>
                    {!role.castingCallId && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowCreateCasting(true);
                        }}
                      >
                        Create Casting
                      </Button>
                    )}
                  </div>
                  
                  {role.roleDescription && (
                    <p className="text-sm text-muted-foreground">{role.roleDescription}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {role.ageMin && (
                      <div>
                        <span className="font-medium">Age:</span> {role.ageMin}-{role.ageMax} years
                      </div>
                    )}
                    {role.gender && (
                      <div>
                        <span className="font-medium">Gender:</span> {role.gender}
                      </div>
                    )}
                    {role.skillsRequired && role.skillsRequired.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium">Skills:</span> {role.skillsRequired.join(', ')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Openings:</span> {role.numberOfOpenings}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role Name *</label>
              <Input
                placeholder="e.g., Lead Actor, Villain"
                value={roleForm.roleName}
                onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Role Type</label>
                <Select value={roleForm.roleType} onValueChange={(v) => setRoleForm({ ...roleForm, roleType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Supporting">Supporting</SelectItem>
                    <SelectItem value="Guest">Guest</SelectItem>
                    <SelectItem value="Extra">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Experience Level</label>
                <Select value={roleForm.experienceLevel} onValueChange={(v) => setRoleForm({ ...roleForm, experienceLevel: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Min Age</label>
                <Input
                  type="number"
                  placeholder="18"
                  value={roleForm.ageMin}
                  onChange={(e) => setRoleForm({ ...roleForm, ageMin: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Age</label>
                <Input
                  type="number"
                  placeholder="60"
                  value={roleForm.ageMax}
                  onChange={(e) => setRoleForm({ ...roleForm, ageMax: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select value={roleForm.gender} onValueChange={(v) => setRoleForm({ ...roleForm, gender: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Openings</label>
                <Input
                  type="number"
                  min="1"
                  value={roleForm.numberOfOpenings}
                  onChange={(e) => setRoleForm({ ...roleForm, numberOfOpenings: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Role Description</label>
              <Textarea
                placeholder="Describe the role..."
                value={roleForm.roleDescription}
                onChange={(e) => setRoleForm({ ...roleForm, roleDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Required Skills (comma separated)</label>
              <Input
                placeholder="Acting, Martial Arts, Dancing"
                value={roleForm.skillsRequired}
                onChange={(e) => setRoleForm({ ...roleForm, skillsRequired: e.target.value })}
              />
            </div>

            <Button
              onClick={() => addRoleMutation.mutate()}
              disabled={addRoleMutation.isPending}
              className="w-full"
            >
              {addRoleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Role'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Casting Dialog */}
      <Dialog open={showCreateCasting} onOpenChange={setShowCreateCasting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Casting for {selectedRole?.roleName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Casting call description..."
                value={castingForm.description}
                onChange={(e) => setCastingForm({ ...castingForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                placeholder={project.location || "Casting location"}
                value={castingForm.location}
                onChange={(e) => setCastingForm({ ...castingForm, location: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Submission Deadline *</label>
                <Input
                  type="datetime-local"
                  value={castingForm.submissionDeadline}
                  onChange={(e) => setCastingForm({ ...castingForm, submissionDeadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Audition Date *</label>
                <Input
                  type="datetime-local"
                  value={castingForm.auditionDate}
                  onChange={(e) => setCastingForm({ ...castingForm, auditionDate: e.target.value })}
                />
              </div>
            </div>

            <Button
              onClick={() => createCastingMutation.mutate()}
              disabled={createCastingMutation.isPending}
              className="w-full"
            >
              {createCastingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Casting'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
