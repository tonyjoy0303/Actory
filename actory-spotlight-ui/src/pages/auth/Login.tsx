import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      const msg = "Please fill in both fields.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange')); // Notify header to update

      toast.success("Login successful! Redirecting...");

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
      <SEO title="Login" description="Access your Actory account to manage auditions and castings." />
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <img src={heroImage} alt="Cinematic backdrop" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur" />
        <div className="relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl">
          <h1 className="font-display text-3xl text-center">Welcome back</h1>
          <p className="text-center text-muted-foreground mt-1">Log into Actory</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
            <Button type="submit" className="w-full hover-scale" variant="hero" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account? <a href="/auth/register" className="story-link">Create one</a>
          </p>
        </div>
      </section>
    </>
  );
}
