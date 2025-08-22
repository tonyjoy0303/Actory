import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (role: 'Actor' | 'Producer' | 'Admin') => {
    setLoading(true);
    setError("");

    if (name.trim().length < 3) {
      const msg = "Username must be at least 3 characters long.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    if (!name || !email || !password) {
      const msg = "Please fill in all fields.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    try {
      const { data } = await API.post('/auth/register', { name, email, password, role });
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange')); // Notify header to update

      toast.success("Registration successful! Redirecting...");

      // Redirect based on role
      if (data.user.role === 'Admin') {
        navigate('/dashboard/admin');
      } else if (data.user.role === 'Actor') {
        navigate('/dashboard/actor');
      } else if (data.user.role === 'Producer') {
        navigate('/dashboard/producer');
      } else {
        navigate('/'); // Fallback redirect
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Register" description="Join Actory as an actor or producer to connect and collaborate." />
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <img src={heroImage} alt="Cinematic backdrop" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur" />
        <div className="relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl">
          <h1 className="font-display text-3xl text-center">Create your account</h1>
          <p className="text-center text-muted-foreground mt-1">Join Actory</p>
          <div className="mt-6 space-y-4">
            <Input 
              placeholder="Full name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <Input 
              placeholder="Email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input 
              placeholder="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="brand-outline" 
                className="w-full" 
                onClick={() => handleRegister('Actor')}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join as Actor'}
              </Button>
              <Button 
                variant="hero" 
                className="w-full" 
                onClick={() => handleRegister('Producer')}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join as Producer'}
              </Button>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <a href="/auth/login" className="story-link">Log in</a>
          </p>
        </div>
      </section>
    </>
  );
}
