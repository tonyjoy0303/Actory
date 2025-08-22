import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/lib/api";

interface CastingCall {
  _id: string;
  roleName: string;
  description: string;
  ageRange: string;
  location: string;
  skills: string[];
  auditionDate: string;
  shootingStartDate: string;
  shootingEndDate: string;
  producer?: { _id: string; name: string; email: string } | string;
}

export default function CastingList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [castings, setCastings] = useState<CastingCall[]>([]);

  useEffect(() => {
    const fetchCastings = async () => {
      try {
        const { data } = await API.get("/casting");
        setCastings(data.data);
      } catch (err: any) {
        console.error("Failed to fetch casting calls", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCastings();
  }, []);

  const filtered = useMemo(
    () =>
      castings.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.roleName.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
        );
      }),
    [castings, query]
  );

  return (
    <>
      <SEO title="Casting Calls" description="Browse real casting calls posted by producers and view full details." />
      <section className="container py-8">
        <div className="relative max-w-2xl mx-auto">
          <Input
            placeholder="Search by role, location, skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-autocomplete="list"
          />
        </div>

        {loading ? (
          <p className="mt-10 text-center">Loading castings...</p>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <Card key={c._id} className="hover:shadow-[var(--shadow-elegant)] transition-shadow">
                <CardHeader>
                  <CardTitle className="font-display text-xl">{c.roleName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Location: {c.location}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">{c.description}</p>

                  <div className="text-sm grid grid-cols-2 gap-y-2">
                    <span><span className="text-muted-foreground">Age Range:</span> {c.ageRange}</span>
                    <span><span className="text-muted-foreground">Audition:</span> {new Date(c.auditionDate).toLocaleDateString()}</span>
                    <span><span className="text-muted-foreground">Shoot Start:</span> {new Date(c.shootingStartDate).toLocaleDateString()}</span>
                    <span><span className="text-muted-foreground">Shoot End:</span> {new Date(c.shootingEndDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {c.skills.map((s) => (
                      <span key={s} className="px-2 py-1 rounded-full bg-secondary text-xs">{s}</span>
                    ))}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Posted by: {typeof c.producer === 'object' ? c.producer?.name : 'Unknown'}
                    {typeof c.producer === 'object' && c.producer?.email ? ` • ${c.producer.email}` : ''}
                  </div>

                  <Button
                    variant="brand-outline"
                    className="mt-3"
                    onClick={() => navigate(`/audition/submit/${c._id}`)}
                  >
                    Apply / Submit Audition
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!filtered.length && (
              <p className="col-span-full text-center text-muted-foreground">No casting calls match your search.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
