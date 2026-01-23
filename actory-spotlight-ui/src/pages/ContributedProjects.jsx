import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import API from '@/lib/api';
import { format } from 'date-fns';

const fetchProjects = async () => {
  const { data } = await API.get('/projects');
  if (!data.success) throw new Error('Failed to load projects');
  return data.data;
};

export default function ContributedProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['contributed-projects'],
    queryFn: fetchProjects,
    enabled: !!user,
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId) => {
      await API.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributed-projects'] });
    }
  });

  const contributed = projects.filter((p) => {
    const uid = String(user?._id || '');
    if (!uid) return false;

    const createdBy = String(p.createdBy?._id || p.createdBy || '');
    const collaborators = (p.collaborators || []).map((c) => String(c?._id || c || ''));

    const teamOwner = String(p.team?.owner?._id || p.team?.owner || '');
    const teamMembers = (p.team?.members || []).map((m) => String(m?.user?._id || m?.user || ''));

    const isCreatorOrCollab = createdBy === uid || collaborators.includes(uid);
    const isTeamMember = teamOwner === uid || teamMembers.includes(uid);

    return isCreatorOrCollab || isTeamMember;
  });

  if (!user) {
    return (
      <div className="container py-10 text-muted-foreground text-sm">
        Please log in to view your projects.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-10 text-muted-foreground text-sm">
        Loading your projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-10 text-destructive text-sm">
        Failed to load projects: {error.message}
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground text-sm">Projects you created or collaborate on.</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          Create / Manage Projects
        </Button>
      </div>

      {contributed.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          You have no contributed projects yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributed.map((project) => (
            <Card key={project._id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                  {project.genre && <Badge variant="outline">{project.genre}</Badge>}
                  {project.language && <Badge variant="outline">{project.language}</Badge>}
                  {project.status && <Badge>{project.status}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
                {project.description && (
                  <p className="line-clamp-3">{project.description}</p>
                )}
                <div className="space-y-1">
                  {project.startDate && (
                    <div>
                      <span className="font-medium text-foreground">Start:</span>{' '}
                      {format(new Date(project.startDate), 'MMM d, yyyy')}
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <span className="font-medium text-foreground">End:</span>{' '}
                      {format(new Date(project.endDate), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium text-foreground">Created by:</span>{' '}
                    {project.createdBy?.name || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Collaborators:</span>{' '}
                    {(project.collaborators || []).length || 0}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => navigate(`/projects/${project._id}`)}>
                      Manage
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (deleteProject.isPending) return;
                        if (window.confirm('Delete this project? This will also remove its castings.')) {
                          deleteProject.mutate(project._id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
