import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Define types
interface CastingCall {
  _id: string;
  roleName: string;
  description: string;
  location: string;
  producer: {
    name: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Actor' | 'Producer';
}

export default function ActorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [castingCalls, setCastingCalls] = useState<CastingCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchCalls = async () => {
      try {
        const { data } = await API.get('/casting');
        setCastingCalls(data.data);
      } catch (error) {
        console.error('Error fetching casting calls:', error);
        toast.error('Failed to fetch casting calls.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const handleRequestSwitch = async () => {
    if (reason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (at least 10 characters).");
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post('/actor/request-switch', { reason });
      toast.success('Your role switch request has been submitted successfully.');
      setIsSwitchModalOpen(false);
      setReason('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to submit request.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Actor Dashboard" description="Manage your profile, portfolio, and audition submissions on Actory." />
      <section className="container py-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="size-16 rounded-full bg-secondary" aria-hidden />
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{user?.name || 'Actor'}</h2>
                <p className="text-muted-foreground">Drama • Comedy • Voiceover</p>
              </div>
              <Button variant="brand-outline" className="hover-scale">Edit Profile</Button>
              <Button variant="hero" className="ml-2" onClick={() => setIsSwitchModalOpen(true)}>Request Producer Role</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Open Casting Calls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p>Loading casting calls...</p>
              ) : castingCalls.length > 0 ? (
                castingCalls.map((call) => (
                  <div key={call._id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-brand">{call.roleName}</p>
                      <p className="text-sm text-muted-foreground">{call.description.substring(0, 50)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">Posted by: {call.producer.name}</p>
                    </div>
                    <Button variant="hero" onClick={() => navigate(`/audition/submit/${call._id}`)}>View & Apply</Button>
                  </div>
                ))
              ) : (
                <p>No open casting calls at the moment.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">My Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">Your submitted auditions will appear here.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display">Notifications</CardTitle>
              <Bell className="text-brand" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">No new notifications.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={isSwitchModalOpen} onOpenChange={setIsSwitchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Producer Role</DialogTitle>
            <DialogDescription>
              Please provide a reason for wanting to switch to a Producer role. An admin will review your request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe your experience or reason for switching..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSwitchModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleRequestSwitch} disabled={isSubmitting || reason.trim().length < 10}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
