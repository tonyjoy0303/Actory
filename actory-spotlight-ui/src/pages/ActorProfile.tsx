import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import API from "@/lib/api";
import { Star } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Actor' | 'Producer' | 'Admin';
  phone?: string;
  createdAt?: string;
  skills?: string[];
  media?: string[];
}

export default function ActorProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const { data } = await API.get('/auth/me');
        setUser(data.user);
      } catch (err: any) {
        const status = err.response?.status;
        const message = err.response?.data?.message || 'Failed to load profile.';
        setError(message);
        if (status === 401) {
          // Not authenticated; redirect to login
          navigate('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

  return (
    <>
      <SEO title="Your Profile" description="View and manage your profile information." />
      <section className="container py-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">
                {loading ? <Skeleton className="h-7 w-40" /> : user?.name || 'Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Role:</span> {user?.role}</p>
                  <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
                  {user?.phone && (
                    <p><span className="text-muted-foreground">Phone:</span> {user.phone}</p>
                  )}
                  {user?.skills && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.skills.map((s) => (
                        <span key={s} className="px-2 py-1 rounded-full bg-secondary text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                  {user?.media && (
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {user.media.map((m, i) => (
                        <div key={i} className="aspect-video rounded-md bg-muted" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Videos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="aspect-video rounded-md bg-muted" />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Ratings</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="text-brand" fill="currentColor" />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="hero" className="w-full hover-scale">Message Actor</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
