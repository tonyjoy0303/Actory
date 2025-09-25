import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProducerDashboard() {
  const [castingCalls, setCastingCalls] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // submissions dialog state
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [activeCasting, setActiveCasting] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchCastingCalls();
  }, []);

  const fetchCastingCalls = async () => {
    try {
      // Use the dedicated producer endpoint that includes authentication
      const { data } = await API.get('/casting/producer');
      
      // Set the casting calls directly from the response
      setCastingCalls(data.data);
      
      // Log success for debugging
      console.log(`Successfully fetched ${data.count} casting calls for producer`);
      
    } catch (error) {
      console.error('Error fetching casting calls:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch casting calls.');
    }
  };

  const handleViewSubmissions = async (call) => {
    setActiveCasting(call);
    setSubmissions([]);
    setSubmissionsLoading(true);
    setSubmissionsOpen(true);
    try {
      const { data } = await API.get(`/casting/${call._id}/videos`);
      setSubmissions(data.data);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to load submissions.';
      toast.error(msg);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const updateSubmissionStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      const { data } = await API.patch(`/videos/${id}/status`, { status });
      // Update local state
      setSubmissions((prev) => prev.map((s) => (s._id === id ? { ...s, status: data.data.status } : s)));
      toast.success(`Submission ${status.toLowerCase()}.`);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateCasting = () => {
    navigate('/casting/new');
  };

  // Render submissions block
  const renderSubmissions = () => {
    if (submissionsLoading) {
      return <p className="text-center text-sm">Loading submissions...</p>;
    }
    if (submissions.length) {
      return (
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {submissions.map((s) => (
            <div key={s._id} className="p-3 rounded-md border flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.actor?.name || 'Unknown actor'}</p>
                <p className="text-xs text-muted-foreground">{s.actor?.email}</p>
                <p className="text-xs text-muted-foreground">Title: {s.title}</p>
                <p className="text-xs text-muted-foreground">
                  Height: {s.height} cm • Weight: {s.weight} kg • Age: {s.age} • Skintone: {s.skintone}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(s.createdAt).toLocaleString()}
                </p>
                <div className="mt-1">
                  <span 
                    className={`inline-block px-2 py-0.5 rounded text-xs ${
                      s.status === 'Accepted' 
                        ? 'bg-green-600/20 text-green-500' 
                        : s.status === 'Rejected' 
                          ? 'bg-red-600/20 text-red-500' 
                          : 'bg-yellow-600/20 text-yellow-500'
                    }`}
                  >
                    {s.status || 'Pending'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={s.videoUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">View Video</Button>
                </a>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled={updatingId === s._id} 
                  onClick={() => updateSubmissionStatus(s._id, 'Accepted')}
                >
                  {updatingId === s._id ? 'Updating...' : 'Accept'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled={updatingId === s._id} 
                  onClick={() => updateSubmissionStatus(s._id, 'Rejected')}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-center text-sm text-muted-foreground">No submissions yet.</p>;
  };

  return (
    <div className="container py-8">
      <SEO 
        title="Producer Dashboard - Actory" 
        description="Manage your casting calls and view submissions." 
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Create Casting Call Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Create New Casting Call</CardTitle>
              <Button onClick={handleCreateCasting}>
                Post New Casting Call
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click the button above to create a new casting call and start receiving submissions from actors.
              </p>
            </CardContent>
          </Card>

          {/* Active Castings */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Your Active Casting Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {castingCalls.length > 0 ? (
                castingCalls.map((call) => (
                  <div key={call._id} className="flex items-center justify-between p-4 rounded-md border">
                    <div>
                      <p className="font-medium">{call.roleTitle || call.roleName}</p>
                      <p className="text-sm text-muted-foreground">
                        {call.location} • {call.ageRange?.min}-{call.ageRange?.max} years • {call.genderRequirement}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Audition: {new Date(call.auditionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/casting/${call._id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewSubmissions(call)}
                      >
                        View Submissions
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You have not posted any casting calls yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Messaging Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Messaging</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/messages')}>
                Open Messages
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Chat with actors and other producers. Connect and communicate directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Submissions for {activeCasting?.roleTitle || activeCasting?.roleName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {renderSubmissions()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
