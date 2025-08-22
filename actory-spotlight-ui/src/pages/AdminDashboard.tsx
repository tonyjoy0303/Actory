import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Define types
interface SwitchRequest {
  _id: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
  };
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'Actor' | 'Producer' | 'Admin';
}

interface CastingCallItem {
  _id: string;
  title: string;
  description?: string;
  producer?: { _id: string; name: string; email: string } | string;
  createdAt?: string;
  // Extended fields for details
  roleName?: string;
  location?: string;
  ageRange?: string;
  skills?: string[];
  auditionDate?: string;
  shootingStartDate?: string;
  shootingEndDate?: string;
}

interface VideoItem {
  _id: string;
  title?: string;
  actor?: { _id: string; name: string; email: string } | string;
  castingCall?: { _id: string; roleName?: string } | string;
  createdAt?: string;
  // Extended
  height?: number;
  weight?: number;
  age?: number;
  skintone?: string;
  videoUrl?: string;
}

export default function AdminDashboard() {
  const [switchRequests, setSwitchRequests] = useState<SwitchRequest[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [castingCalls, setCastingCalls] = useState<CastingCallItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCasting, setLoadingCasting] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Dialog state for casting call details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCasting, setSelectedCasting] = useState<CastingCallItem | null>(null);

  // Dialog state for video details
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const fetchSwitchRequests = async () => {
    try {
      const { data } = await API.get('/admin/switch-requests');
      setSwitchRequests(data.data);
    } catch (error) {
      console.error('Error fetching switch requests:', error);
      toast.error('Failed to fetch switch requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCastingCalls = async () => {
    setLoadingCasting(true);
    try {
      const { data } = await API.get('/admin/castingcalls');
      setCastingCalls(data.data);
    } catch (error: any) {
      console.error('Error fetching casting calls:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch casting calls');
    } finally {
      setLoadingCasting(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data } = await API.get('/admin/videos');
      setVideos(data.data);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    // Load everything initially
    fetchSwitchRequests();
    fetchUsers();
    fetchCastingCalls();
    fetchVideos();
  }, []);

  const handleRequestUpdate = async (id: string, action: 'approve' | 'reject') => {
    try {
      await API.put(`/admin/switch-requests/${id}/${action}`);
      toast.success(`Request has been ${action}d.`);
      fetchSwitchRequests(); // Refresh the list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to ${action} request.`;
      toast.error(errorMessage);
    }
  };

  const handleUserRoleChange = async (id: string, role: 'Actor' | 'Producer' | 'Admin') => {
    try {
      await API.put(`/admin/users/${id}`, { role });
      toast.success('User updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (type: 'users' | 'casting' | 'videos', id: string) => {
    try {
      if (type === 'users') {
        await API.delete(`/admin/users/${id}`);
        fetchUsers();
      } else if (type === 'casting') {
        await API.delete(`/admin/castingcalls/${id}`);
        fetchCastingCalls();
      } else {
        await API.delete(`/admin/videos/${id}`);
        fetchVideos();
      }
      toast.success('Deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const openDetails = (c: CastingCallItem) => {
    setSelectedCasting(c);
    setDetailsOpen(true);
  };

  const openVideo = (v: VideoItem) => {
    setSelectedVideo(v);
    setVideoOpen(true);
  };

  return (
    <>
      <SEO title="Admin Dashboard" description="Manage users, casting calls, and system settings." />
      <section className="container py-8">
        <h1 className="text-3xl font-bold font-display mb-6">Admin Dashboard</h1>
        <Tabs defaultValue="switch-requests">
          <TabsList>
            <TabsTrigger value="switch-requests">Role Switch Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="casting-calls">Casting Calls</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="switch-requests">
            <Card>
              <CardHeader>
                <CardTitle>Pending Role Switch Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <p>Loading...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Actor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {switchRequests.filter(req => req.status === 'Pending').map(req => (
                        <TableRow key={req._id}>
                          <TableCell>{req.actorId.name}</TableCell>
                          <TableCell>{req.actorId.email}</TableCell>
                          <TableCell className="max-w-xs truncate">{req.reason}</TableCell>
                          <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="success" onClick={() => handleRequestUpdate(req._id, 'approve')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRequestUpdate(req._id, 'reject')}>Reject</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users</CardTitle>
                <Button size="sm" onClick={fetchUsers} disabled={loadingUsers}>Refresh</Button>
              </CardHeader>
              <CardContent>
                {loadingUsers ? <p>Loading...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u._id}>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <select
                              className="border rounded px-2 py-1 bg-background"
                              value={u.role}
                              onChange={(e) => handleUserRoleChange(u._id, e.target.value as UserItem['role'])}
                            >
                              <option value="Actor">Actor</option>
                              <option value="Producer">Producer</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete('users', u._id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="casting-calls">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Casting Calls</CardTitle>
                <Button size="sm" onClick={fetchCastingCalls} disabled={loadingCasting}>Refresh</Button>
              </CardHeader>
              <CardContent>
                {loadingCasting ? <p>Loading...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Producer</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {castingCalls.map(c => (
                        <TableRow key={c._id}>
                          <TableCell>{c.title || c.roleName || '—'}</TableCell>
                          <TableCell>{typeof c.producer === 'object' ? c.producer?.name : ''}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="secondary" onClick={() => openDetails(c)}>View details</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete('casting', c._id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedCasting?.title || selectedCasting?.roleName || 'Casting Details'}</DialogTitle>
                  <DialogDescription>Full casting information</DialogDescription>
                </DialogHeader>
                {selectedCasting && (
                  <div className="space-y-2 text-sm">
                    {selectedCasting.description && (
                      <p className="leading-relaxed">{selectedCasting.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCasting.location && (
                        <div><span className="text-muted-foreground">Location:</span> {selectedCasting.location}</div>
                      )}
                      {selectedCasting.ageRange && (
                        <div><span className="text-muted-foreground">Age Range:</span> {selectedCasting.ageRange}</div>
                      )}
                      {selectedCasting.auditionDate && (
                        <div><span className="text-muted-foreground">Audition:</span> {new Date(selectedCasting.auditionDate).toLocaleDateString()}</div>
                      )}
                      {selectedCasting.shootingStartDate && (
                        <div><span className="text-muted-foreground">Shoot Start:</span> {new Date(selectedCasting.shootingStartDate).toLocaleDateString()}</div>
                      )}
                      {selectedCasting.shootingEndDate && (
                        <div><span className="text-muted-foreground">Shoot End:</span> {new Date(selectedCasting.shootingEndDate).toLocaleDateString()}</div>
                      )}
                    </div>
                    {selectedCasting.skills?.length ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedCasting.skills.map((s) => (
                          <span key={s} className="px-2 py-1 rounded-full bg-secondary text-xs">{s}</span>
                        ))}
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      Producer: {typeof selectedCasting.producer === 'object' ? selectedCasting.producer?.name : '—'}
                      {typeof selectedCasting.producer === 'object' && selectedCasting.producer?.email ? ` • ${selectedCasting.producer.email}` : ''}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="videos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Videos</CardTitle>
                <Button size="sm" onClick={fetchVideos} disabled={loadingVideos}>Refresh</Button>
              </CardHeader>
              <CardContent>
                {loadingVideos ? <p>Loading...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Casting Call</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map(v => (
                        <TableRow key={v._id}>
                          <TableCell>{v.title || '—'}</TableCell>
                          <TableCell>{typeof v.actor === 'object' ? v.actor?.name : ''}</TableCell>
                          <TableCell>{typeof v.castingCall === 'object' ? (v.castingCall as any)?.roleName || '' : ''}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="secondary" onClick={() => openVideo(v)}>View details</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete('videos', v._id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Video Details Dialog */}
            <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedVideo?.title || 'Submission Details'}</DialogTitle>
                  <DialogDescription>Actor submission information</DialogDescription>
                </DialogHeader>
                {selectedVideo && (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="text-muted-foreground">Actor:</span> {typeof selectedVideo.actor === 'object' ? selectedVideo.actor?.name : '—'}</div>
                      <div><span className="text-muted-foreground">Actor Email:</span> {typeof selectedVideo.actor === 'object' ? (selectedVideo.actor as any)?.email || '' : ''}</div>
                      <div><span className="text-muted-foreground">Casting Call:</span> {typeof selectedVideo.castingCall === 'object' ? (selectedVideo.castingCall as any)?.roleName || '' : ''}</div>
                      <div><span className="text-muted-foreground">Submitted:</span> {selectedVideo.createdAt ? new Date(selectedVideo.createdAt).toLocaleString() : '—'}</div>
                      {selectedVideo.age !== undefined && (
                        <div><span className="text-muted-foreground">Age:</span> {selectedVideo.age}</div>
                      )}
                      {selectedVideo.height !== undefined && (
                        <div><span className="text-muted-foreground">Height:</span> {selectedVideo.height} cm</div>
                      )}
                      {selectedVideo.weight !== undefined && (
                        <div><span className="text-muted-foreground">Weight:</span> {selectedVideo.weight} kg</div>
                      )}
                      {selectedVideo.skintone && (
                        <div><span className="text-muted-foreground">Skintone:</span> {selectedVideo.skintone}</div>
                      )}
                    </div>
                    {selectedVideo.videoUrl && (
                      <div className="space-y-2">
                        <video src={selectedVideo.videoUrl} controls className="w-full rounded-md shadow" />
                        <div className="flex gap-2">
                          <a href={selectedVideo.videoUrl} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="brand-outline">Open in new tab</Button>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
