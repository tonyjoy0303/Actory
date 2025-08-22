import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

interface User {
  name: string;
  role: 'Actor' | 'Producer' | 'Admin';
  id?: string; 
}

export default function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // Check for user session on component mount and when storage changes
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    checkUser();

    // Listen for custom event to re-check auth state
    window.addEventListener('authChange', checkUser);

    // Cleanup listener
    return () => {
      window.removeEventListener('authChange', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event('authChange')); // Notify other components
    navigate("/");
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground transition-colors";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container h-16 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2" aria-label="Actory home">
          <Logo />
        </NavLink>

        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/casting" className={linkCls} end>Castings</NavLink>
          {user?.role === 'Actor' && <NavLink to="/dashboard/actor" className={linkCls} end>Dashboard</NavLink>}
          {user?.role === 'Producer' && <NavLink to="/dashboard/producer" className={linkCls} end>Dashboard</NavLink>}
          {user && <NavLink to="/messages" className={linkCls} end>Messages</NavLink>}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Profile button at the end for viewing user details */}
              <NavLink to={`/actor/profile/${user.id ?? ''}`} className="hidden sm:inline-block">
                <Button variant="ghost">Profile</Button>
              </NavLink>
              <Button onClick={handleLogout} variant="hero">Logout</Button>
              {user.role === 'Producer' && (
                <NavLink to="/dashboard/producer">
                  <Button variant="hero" className="hover-scale">Post Casting</Button>
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/auth/login" className="hidden sm:inline-block">
                <Button variant="ghost">Log in</Button>
              </NavLink>
              <NavLink to="/auth/register">
                <Button variant="hero" className="hover-scale">Get Started</Button>
              </NavLink>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
