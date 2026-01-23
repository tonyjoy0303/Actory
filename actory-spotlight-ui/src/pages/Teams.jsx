import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import API from '@/lib/api';

const fetchTeams = async () => {
  const { data } = await API.get('/teams');
  if (!data.success) throw new Error('Failed to load teams');
  return data.data;
};

export default function Teams() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();

  if (!user || (user.role !== 'Producer' && user.role !== 'ProductionTeam')) {
    return <div className="container py-8 text-sm text-muted-foreground">Only producers/production teams can manage teams.</div>;
  }

  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', productionHouse: '', description: '' });
  const [invite, setInvite] = useState({ teamId: '', userId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const invitesQuery = useQuery({
    queryKey: ['team-invitations'],
    queryFn: async () => {
      const { data } = await API.get('/team-invitations/pending');
      if (!data.success) throw new Error('Failed to load invitations');
      return data.data;
    },
  });

  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams });

  const selectedTeamQuery = useQuery({
    queryKey: ['team', selectedTeamId],
    queryFn: async () => {
      try {
        const { data } = await API.get(`/teams/${selectedTeamId}`);
        console.log("Team Details Response:", data);
        if (!data.success) throw new Error('Failed to load team details');
        return data.data;
      } catch (e) {
        console.error("Team Details Error:", e);
        throw e;
      }
    },
    enabled: !!selectedTeamId
  });

  const teamProjectsQuery = useQuery({
    queryKey: ['projects', { teamId: selectedTeamId }],
    queryFn: async () => {
      const { data } = await API.get('/projects', { params: { teamId: selectedTeamId } });
      if (!data.success) throw new Error('Failed to load projects');
      return data.data;
    },
    enabled: !!selectedTeamId
  });

  const createTeam = useMutation({
    mutationFn: async () => {
      const { data } = await API.post('/teams', form);
      return data;
    },
    onSuccess: () => {
      toast.success('Team created');
      setForm({ name: '', productionHouse: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: () => toast.error('Failed to create team')
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!invite.userId) throw new Error('Select a user to invite');
      const { data } = await API.post('/team-invitations/send', {
        teamId: invite.teamId,
        inviteeId: invite.userId,
        role: 'Recruiter'
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Invitation sent');
      setInvite({ teamId: '', userId: '' });
      setSearchQuery('');
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
    onError: () => toast.error('Failed to send invitation')
  });

  const acceptInvite = useMutation({
    mutationFn: async (token) => {
      const { data } = await API.post('/team-invitations/accept', { token });
      return data;
    },
    onSuccess: () => {
      toast.success('Invitation accepted');
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: () => toast.error('Failed to accept invitation')
  });

  const rejectInvite = useMutation({
    mutationFn: async (token) => {
      const { data } = await API.post('/team-invitations/reject', { token });
      return data;
    },
    onSuccess: () => {
      toast.success('Invitation rejected');
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
    onError: () => toast.error('Failed to reject invitation')
  });

  const removeMember = useMutation({
    mutationFn: async ({ teamId, memberId }) => {
      const { data } = await API.delete(`/teams/${teamId}/members/${memberId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['team', selectedTeamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: () => toast.error('Failed to remove member')
  });

  const leaveTeam = useMutation({
    mutationFn: async (teamId) => {
      const { data } = await API.post(`/teams/${teamId}/leave`);
      return data;
    },
    onSuccess: () => {
      toast.success('Left team');
      setSelectedTeamId(null);
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: () => toast.error('Failed to leave team')
  });

  const updateTeam = useMutation({
    mutationFn: async ({ teamId, data }) => {
      const res = await API.put(`/teams/${teamId}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Team updated');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['team', selectedTeamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: () => toast.error('Failed to update team')
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', productionHouse: '', description: '' });

  // Pre-fill edit form when team loads or modal opens
  useEffect(() => {
    if (selectedTeamQuery.data && !isEditing) {
      setEditForm({
        name: selectedTeamQuery.data.name || '',
        productionHouse: selectedTeamQuery.data.productionHouse || '',
        description: selectedTeamQuery.data.description || ''
      });
    }
  }, [selectedTeamQuery.data, isEditing]);

  // Search users by username to invite
  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await API.get('/profile/search', { params: { username: searchQuery.trim() } });
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  return (
    <div className="container py-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Production Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Team name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Production house"
              value={form.productionHouse}
              onChange={(e) => setForm({ ...form, productionHouse: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Button onClick={() => createTeam.mutate()} disabled={createTeam.isPending}>
              {createTeam.isPending ? 'Creating...' : 'Create Team'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Recruiter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Auto-select team effect */}
            {React.useEffect(() => {
              if (teamsQuery.data && teamsQuery.data.length > 0) {
                const myOwnedTeams = teamsQuery.data.filter(t => t.owner === user._id);
                if (myOwnedTeams.length === 1 && !invite.teamId) {
                  setInvite(prev => ({ ...prev, teamId: myOwnedTeams[0]._id }));
                }
              }
            }, [teamsQuery.data])}

            <Input
              placeholder="Team ID (Required)"
              value={invite.teamId}
              onChange={(e) => setInvite({ ...invite, teamId: e.target.value })}
              className={!invite.teamId && invite.userId ? "border-destructive" : ""}
            />
            {/* Helper to select one of my teams automatically if I only own one */}
            {teamsQuery.data && teamsQuery.data.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {teamsQuery.data.filter(t => t.owner === user._id).map(t => (
                  <Button
                    key={t._id}
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs ${invite.teamId === t._id ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                    onClick={() => setInvite({ ...invite, teamId: t._id })}
                  >
                    {t.name}
                  </Button>
                ))}
              </div>
            )}
            {!invite.teamId && invite.userId && (
              <p className="text-xs text-destructive font-medium">Please select a team above to invite this user.</p>
            )}

            <Input
              placeholder="Search recruiter by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {isSearching && <p className="text-xs text-muted-foreground">Searching...</p>}

            {!isSearching && searchQuery && searchResults.length === 0 && (
              <p className="text-xs text-muted-foreground">No users found</p>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    className={`w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-3 ${invite.userId === u._id ? 'bg-muted' : ''}`}
                    onClick={() => setInvite({ ...invite, userId: u._id })}
                  >
                    {u.profileImage ? (
                      <img src={u.profileImage} alt={u.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.role || 'User'}</div>
                    </div>
                    {u.isVerified && (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button onClick={() => {
              if (!invite.teamId) {
                toast.error("Please select a team first");
                return;
              }
              sendInvite.mutate();
            }} disabled={sendInvite.isPending || !invite.userId}>
              {sendInvite.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading invitations...</p>}

            {!invitesQuery.isLoading && invitesQuery.data && invitesQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending invites</p>
            )}

            {!invitesQuery.isLoading && invitesQuery.data && invitesQuery.data.map((inv) => (
              <div key={inv._id} className="border rounded-md p-3 space-y-1">
                <p className="text-sm font-medium">{inv.team?.name || 'Team'}</p>
                <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptInvite.mutate(inv.token)} disabled={acceptInvite.isPending}>
                    {acceptInvite.isPending ? 'Accepting...' : 'Accept'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectInvite.mutate(inv.token)} disabled={rejectInvite.isPending}>
                    {rejectInvite.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teamsQuery.isLoading && <p className="text-muted-foreground">Loading teams...</p>}
        {!teamsQuery.isLoading && teamsQuery.data && teamsQuery.data.map((team) => (
          <Card key={team._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">{team.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedTeamId(team._id)}>Manage</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{team.productionHouse}</p>
              <p className="text-sm line-clamp-2">{team.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{team.members?.length || 0} Members</span>
                <span>Owner: {team.owner === user._id ? 'You' : 'Someone else'}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTeamId && (
        <Dialog open={!!selectedTeamId} onOpenChange={(open) => !open && setSelectedTeamId(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Team Management</DialogTitle>
              <DialogDescription>Manage members and settings</DialogDescription>
            </DialogHeader>

            {selectedTeamQuery.isLoading && <p>Loading details...</p>}
            {selectedTeamQuery.isError && (
              <div className="text-destructive">
                <p>Failed to load team details.</p>
                <p className="text-xs">{selectedTeamQuery.error?.message}</p>
                {selectedTeamQuery.error?.response?.data?.debug && (
                  <div className="mt-2 text-[10px] bg-red-100 p-2 rounded overflow-auto font-mono">
                    <p>Debug Info:</p>
                    <pre>{JSON.stringify(selectedTeamQuery.error.response.data.debug, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {selectedTeamQuery.data && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between mb-2">
                    {!isEditing ? (
                      <h3 className="text-lg font-semibold">{selectedTeamQuery.data.name}</h3>
                    ) : (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="font-semibold"
                        placeholder="Team Name"
                      />
                    )}

                    {selectedTeamQuery.data.owner && user._id === selectedTeamQuery.data.owner._id && !isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>Edit</Button>
                    )}
                  </div>

                  {!isEditing ? (
                    <>
                      <p className="text-sm text-muted-foreground">{selectedTeamQuery.data.productionHouse}</p>
                      <p className="mt-2 text-sm">{selectedTeamQuery.data.description}</p>
                    </>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <Input
                        value={editForm.productionHouse}
                        onChange={(e) => setEditForm(prev => ({ ...prev, productionHouse: e.target.value }))}
                        placeholder="Production House"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button size="sm" onClick={() => updateTeam.mutate({ teamId: selectedTeamQuery.data._id, data: editForm })} disabled={updateTeam.isPending}>
                          {updateTeam.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-3">Members ({selectedTeamQuery.data.members?.length})</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedTeamQuery.data.members?.map((m) => {
                      if (!m.user) return null; // Safety check
                      return (
                        <div key={m.user._id || Math.random()} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-3">
                            {m.user.profileImage ? (
                              <img src={m.user.profileImage} alt={m.user.name} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                {(m.user.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium">{m.user.name || 'Unknown User'}</p>
                              <p className="text-xs text-muted-foreground">{m.role} • {m.user.email || 'No Email'}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          {selectedTeamQuery.data.owner && user._id === selectedTeamQuery.data.owner._id ? (
                            // I am Owner
                            m.user._id !== user._id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeMember.mutate({ teamId: selectedTeamQuery.data._id, memberId: m.user._id })}
                                disabled={removeMember.isPending}
                              >
                                Remove
                              </Button>
                            )
                          ) : (
                            // I am Member
                            m.user._id === user._id && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => leaveTeam.mutate(selectedTeamQuery.data._id)}
                                disabled={leaveTeam.isPending}
                              >
                                Leave Team
                              </Button>
                            )
                          )}
                        </div>
                      );
                    })}
                    {selectedTeamQuery.data.members?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No members found.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Allocated Projects</h4>
                  {teamProjectsQuery.isLoading && <p className="text-sm text-muted-foreground">Loading projects...</p>}

                  {!teamProjectsQuery.isLoading && teamProjectsQuery.data?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No projects allocated to this team.</p>
                  )}

                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {!teamProjectsQuery.isLoading && teamProjectsQuery.data?.map((project) => (
                      <div key={project._id} className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.status} • {new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                        {/* Could add a 'View' button here if needed, linking to project details */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
