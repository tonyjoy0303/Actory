import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define the type for a casting call
interface CastingCall {
  _id: string;
  roleName: string;
  description: string;
  ageRange: string;
  location: string;
  skills: string[];
  producer: {
    _id: string;
    name: string;
  };
}

interface Submission {
  _id: string;
  title: string;
  videoUrl: string;
  actor: { name: string; email: string };
  createdAt: string;
  height: number;
  weight: number;
  age: number;
  skintone: string;
}

const initialFormState = {
  roleName: '',
  description: '',
  ageRange: '',
  location: '',
  skills: '',
  auditionDate: '',
  shootingStartDate: '',
  shootingEndDate: '',
};

export default function ProducerDashboard() {
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // submissions dialog state
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [activeCasting, setActiveCasting] = useState<CastingCall | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

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
      const { data } = await API.get('/casting');
      // Filter calls by the logged-in producer
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setCastingCalls(data.data.filter((call: CastingCall) => call.producer._id === storedUser.id));
    } catch (error) {
      toast.error('Failed to fetch casting calls.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const postData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()),
      };
      await API.post('/casting', postData);
      toast.success('Casting call posted successfully!');
      setFormData(initialFormState); // Reset form
      fetchCastingCalls(); // Refresh list
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to post casting call.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmissions = async (call: CastingCall) => {
    setActiveCasting(call);
    setSubmissions([]);
    setSubmissionsLoading(true);
    setSubmissionsOpen(true);
    try {
      const { data } = await API.get(`/casting/${call._id}/videos`);
      setSubmissions(data.data);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to load submissions.';
      toast.error(msg);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Producer Dashboard" description="Post casting calls, manage submissions, and chat with actors." />
      <section className="container py-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Post a Casting Call</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="grid gap-4">
                <Input name="roleName" value={formData.roleName} onChange={handleInputChange} placeholder="Role title (e.g., Lead – Detective)" disabled={loading} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      id="ageRange"
                      name="ageRange"
                      value={formData.ageRange}
                      onChange={handleInputChange}
                      className={`w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.ageRange ? 'text-white' : 'text-gray-400'}`}
                    >
                      <option value="" disabled>Select Age Range</option>
                      <option value="18-25">18-25</option>
                      <option value="25-35">25-35</option>
                      <option value="35-45">35-45</option>
                      <option value="45-55">45-55</option>
                      <option value="55+">55+</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                  <Input name="location" value={formData.location} onChange={handleInputChange} placeholder="Location (e.g., Los Angeles, CA)" disabled={loading} />
                </div>
                <Input name="skills" value={formData.skills} onChange={handleInputChange} placeholder="Skills (comma-separated, e.g., bilingual, stunt work)" disabled={loading} />
                <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief role description" disabled={loading} />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="auditionDate">Audition Date</label>
                    <Input type="date" name="auditionDate" value={formData.auditionDate} onChange={handleInputChange} disabled={loading} />
                  </div>
                  <div>
                    <label htmlFor="shootingStartDate">Shoot Start Date</label>
                    <Input type="date" name="shootingStartDate" value={formData.shootingStartDate} onChange={handleInputChange} disabled={loading} />
                  </div>
                  <div>
                    <label htmlFor="shootingEndDate">Shoot End Date</label>
                    <Input type="date" name="shootingEndDate" value={formData.shootingEndDate} onChange={handleInputChange} disabled={loading} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="hero" className="hover-scale" disabled={loading}>
                    {loading ? 'Posting...' : 'Post Casting'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Your Active Castings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {castingCalls.length > 0 ? (
                castingCalls.map((call) => (
                  <div key={call._id} className="flex items-center justify-between p-2 rounded-md border">
                    <div>
                      <p className="font-medium">{call.roleName}</p>
                      <p className="text-xs text-muted-foreground">{call.location} | {call.ageRange}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => handleViewSubmissions(call)}>View Submissions</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">You have not posted any casting calls yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Messaging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">Messaging feature coming soon.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Submissions Dialog */}
      <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submissions for {activeCasting?.roleName}</DialogTitle>
          </DialogHeader>
          {submissionsLoading ? (
            <p className="text-center text-sm">Loading submissions...</p>
          ) : submissions.length ? (
            <div className="space-y-3 max-h-[60vh] overflow-auto">
              {submissions.map((s) => (
                <div key={s._id} className="p-3 rounded-md border flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.actor?.name || 'Unknown actor'}</p>
                    <p className="text-xs text-muted-foreground">{s.actor?.email}</p>
                    <p className="text-xs text-muted-foreground">Title: {s.title}</p>
                    <p className="text-xs text-muted-foreground">Height: {s.height} cm • Weight: {s.weight} kg • Age: {s.age} • Skintone: {s.skintone}</p>
                    <p className="text-xs text-muted-foreground">Submitted: {new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={s.videoUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="brand-outline">View Video</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
