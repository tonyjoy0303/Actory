import heroImage from "@/assets/hero-cinematic.jpg";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { NavLink } from "react-router-dom";

const Index = () => {
  return (
    <>
      <SEO
        title="Actory — Auditions & Casting Calls"
        description="Join Actory to discover casting calls, upload auditions, and connect with producers and casting directors."
      />
      <section
        className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        <img
          src={heroImage}
          alt="Cinematic stage lights and film set"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/50 to-background/20" />
        <div className="relative container text-center py-24">
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight animate-enter">
            Spotlight Your Talent. Empower Your Casting.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-in">
            Actory connects aspiring actors with top producers and casting directors. Discover roles, submit auditions, and get noticed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <NavLink to="/auth/register?role=actor">
              <Button variant="hero" className="hover-scale" aria-label="Join as Actor">
                Join as Actor
              </Button>
            </NavLink>
            <NavLink to="/auth/register?role=producer">
              <Button variant="brand-outline" className="hover-scale" aria-label="Join as Producer">
                Join as Producer
              </Button>
            </NavLink>
          </div>
        </div>
      </section>

      <section id="features" className="container py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Casting Calls",
              desc: "Search roles by type, age, skills, and location.",
            },
            {
              title: "Audition Uploads",
              desc: "Drag-and-drop video submissions with quick preview.",
            },
            {
              title: "Messaging",
              desc: "Collaborate in real-time with typing indicators.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border p-6 bg-card shadow-sm hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Index;
