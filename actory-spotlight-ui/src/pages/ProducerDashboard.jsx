import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [sortBy, setSortBy] = useState('date-desc');

  // Sorting function
  const sortSubmissions = (submissions, sortBy) => {
    const sorted = [...submissions];
    
    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name-asc':
        return sorted.sort((a, b) => (a.actor?.name || '').localeCompare(b.actor?.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.actor?.name || '').localeCompare(a.actor?.name || ''));
      case 'quality-high':
        return sorted.sort((a, b) => {
          const scoreA = a.qualityAssessment?.score || 0;
          const scoreB = b.qualityAssessment?.score || 0;
          return scoreB - scoreA;
        });
      case 'quality-low':
        return sorted.sort((a, b) => {
          const scoreA = a.qualityAssessment?.score || 0;
          const scoreB = b.qualityAssessment?.score || 0;
          return scoreA - scoreB;
        });
      case 'status-accepted':
        return sorted.sort((a, b) => {
          if (a.status === 'Accepted' && b.status !== 'Accepted') return -1;
          if (b.status === 'Accepted' && a.status !== 'Accepted') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'status-rejected':
        return sorted.sort((a, b) => {
          if (a.status === 'Rejected' && b.status !== 'Rejected') return -1;
          if (b.status === 'Rejected' && a.status !== 'Rejected') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'status-pending':
        return sorted.sort((a, b) => {
          if (a.status === 'Pending' && b.status !== 'Pending') return -1;
          if (b.status === 'Pending' && a.status !== 'Pending') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      case 'age-asc':
        return sorted.sort((a, b) => (a.age || 0) - (b.age || 0));
      case 'age-desc':
        return sorted.sort((a, b) => (b.age || 0) - (a.age || 0));
      case 'height-asc':
        return sorted.sort((a, b) => (a.height || 0) - (b.height || 0));
      case 'height-desc':
        return sorted.sort((a, b) => (b.height || 0) - (a.height || 0));
      default:
        return sorted;
    }
  };

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
      const sortedSubmissions = sortSubmissions(submissions, sortBy);
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort submissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality-high">Highest Quality First</SelectItem>
                <SelectItem value="quality-low">Lowest Quality First</SelectItem>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="status-accepted">Accepted First</SelectItem>
                <SelectItem value="status-rejected">Rejected First</SelectItem>
                <SelectItem value="status-pending">Pending First</SelectItem>
                <SelectItem value="age-asc">Age (Youngest)</SelectItem>
                <SelectItem value="age-desc">Age (Oldest)</SelectItem>
                <SelectItem value="height-asc">Height (Shortest)</SelectItem>
                <SelectItem value="height-desc">Height (Tallest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            {sortedSubmissions.map((s) => (
            <div key={s._id} className="p-3 rounded-md border flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.actor?.name || 'Unknown actor'}</p>
                <p className="text-xs text-muted-foreground">{s.actor?.email}</p>
                <p className="text-xs text-muted-foreground">Title: {s.title}</p>
                <p className="text-xs text-muted-foreground">
                  Height: {s.height} cm • Weight: {s.weight} kg • Age: {s.age}
                </p>
                <p className="text-xs text-muted-foreground">
                  Address: {s.permanentAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  City: {s.livingCity} • DOB: {new Date(s.dateOfBirth).toLocaleDateString()} • Phone: {s.phoneNumber}
                </p>
                {s.email && (
                  <p className="text-xs text-muted-foreground">
                    Email: {s.email}
                  </p>
                )}
                {s.skills && s.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded-full bg-secondary text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(s.createdAt).toLocaleString()}
                </p>
                <div className="mt-1">
                  <div className="flex gap-2">
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
                    {s.qualityAssessment && (
                      <span 
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          s.qualityAssessment.level === 'High' 
                            ? 'bg-green-600/20 text-green-500' 
                            : s.qualityAssessment.level === 'Medium'
                              ? 'bg-yellow-600/20 text-yellow-500' 
                              : 'bg-red-600/20 text-red-500'
                        }`}
                      >
                        Quality: {s.qualityAssessment.level} ({Math.round(s.qualityAssessment.score * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <video 
                  className="w-64 h-36 rounded"
                  src={s.videoUrl}
                  controls
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    // Update metrics when video is watched
                    if (video.currentTime > 0 && !video.paused && !video.ended) {
                      const watchTimePercentage = (video.currentTime / video.duration) * 100;
                      // Update metrics after significant watch time
                      if (watchTimePercentage > 30) {
                        API.put(`/videos/${s._id}/metrics`, {
                          watchTime: watchTimePercentage,
                          brightness: 0.8,
                          audioQuality: 0.85
                        }).catch(console.error);
                      }
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
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
            </div>
          ))}
          </div>
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
                        onClick={() => navigate(`/casting/${call._id}/submissions`)}
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
