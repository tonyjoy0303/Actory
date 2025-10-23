import React from 'react'
const _jsxFileName = ""; function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Search, User, Video } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import API from "@/lib/api";
import recruiterImg from "@/assets/recruiter.jpg";
import actorImg from "@/assets/actor.jpg";
import { toast } from 'sonner';

// Helper function to get image URL (handles both local uploads and Cloudinary)
const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If it's already a full URL (Cloudinary), return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  // If it's a local path, prepend backend origin
  const API_ORIGIN = API.defaults.baseURL.replace(/\/api\/v1$/, "");
  return `${API_ORIGIN}${imagePath}`;
};

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [switchRoleOpen, setSwitchRoleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [reason, setReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const dashboardPathFor = (role) => {
    if (role === 'Actor') return '/dashboard/actor';
    if (role === 'Producer') return '/dashboard/producer';
    if (role === 'Admin') return '/dashboard/admin';
    return '/';
  };

  const handleSwitchRole = () => {
    if (user?.role === 'Actor') {
      setSwitchRoleOpen(true);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data } = await API.get('/profile/search', {
        params: { username: query }
      });

      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmitSwitchRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for switching to Producer');
      return;
    }

    try {
      setIsRequesting(true);
      const { data } = await API.post('/actor/request-switch', { reason });

      if (data.success) {
        toast.success('Role switch request submitted. Please wait for admin approval.');
        setSwitchRoleOpen(false);
        setReason('');
      }
    } catch (error) {
      console.error('Error submitting role switch request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsRequesting(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await API.get('/messages/unread-count');
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      // Set to 0 on error to avoid showing stale data
      setUnreadCount(0);
    }
  };

  // Check for user session on component mount and when storage changes
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Fetch unread count when user is logged in
        fetchUnreadCount();
      } else {
        // If token is missing, treat as logged out and clean up stale data
        if (!token && userData) localStorage.removeItem('user');
        setUser(null);
        setUnreadCount(0);
      }
    };

    checkUser();

    // Listen for custom event to re-check auth state
    window.addEventListener('authChange', checkUser);
    // Listen for unread count updates
    window.addEventListener('updateUnreadCount', fetchUnreadCount);

    // Cleanup listeners
    return () => {
      window.removeEventListener('authChange', checkUser);
      window.removeEventListener('updateUnreadCount', fetchUnreadCount);
    };
  }, []);

  // Poll for unread count updates every 30 seconds when user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // On initial load or path change, if authenticated and on a public page, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;
    const publicPaths = new Set([
      '/',
      '/features',
      '/know-more',
      '/auth/login',
      '/auth/register',
      '/auth/register/actor',
      '/auth/register/producer',
    ]);
    if (publicPaths.has(location.pathname)) {
      navigate(dashboardPathFor(user.role), { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event('authChange')); // Notify other components
    navigate("/");
  };

  const onHome = location.pathname === "/";

  const handleRegisterClick = (role) => {
    setRegisterOpen(false);
    if (role === 'Actor') {
      navigate('/auth/register/actor');
    } else if (role === 'Producer') {
      navigate('/auth/register/producer');
    }
  };

  const linkCls = ({ isActive }) =>
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground transition-colors";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container h-16 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2" aria-label="Actory home">
            <Logo />
          </NavLink>

          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/casting" className={linkCls} end={true}>Castings</NavLink>
            {user && <NavLink to="/feeds" className={linkCls} end={true}>Feeds</NavLink>}
            {user && <NavLink to="/call" className={linkCls} end={true}>Video Call</NavLink>}
            {_optionalChain([user, 'optionalAccess', _ => _.role]) === 'Actor' && <NavLink to="/dashboard/actor" className={linkCls} end={true}>Dashboard</NavLink>}
            {_optionalChain([user, 'optionalAccess', _2 => _2.role]) === 'Producer' && <NavLink to="/dashboard/producer" className={linkCls} end={true}>Dashboard</NavLink>}
            {user && (
              <div className="relative">
                <NavLink to="/messages" className={linkCls} end={true}>Messages</NavLink>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <React.Fragment>
                <Button variant="ghost" size="sm" onClick={() => setSearchOpen(true)}>
                  <Search className="w-4 h-4" />
                </Button>
                {/* Profile button at the end for viewing user details */}
                <NavLink to={`/profile/${_nullishCoalesce(user._id, () => ( ''))}`} className="hidden sm:inline-flex items-center gap-2">
                  {_optionalChain([user, 'optionalAccess', _ => _.profileImage]) ? (
                    <img 
                      src={`${_optionalChain([user, 'optionalAccess', _2 => _2.profileImage])}`}
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border" 
                    />
                  ) : _optionalChain([user, 'optionalAccess', _3 => _3.photo]) ? (
                    <img 
                      src={getImageUrl(_optionalChain([user, 'optionalAccess', _4 => _4.photo]))}
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border" 
                    />
                  ) : (
                    <Button variant="ghost">Profile</Button>
                  )}
                </NavLink>
                <Button onClick={handleLogout} variant="hero">Logout</Button>
                {user.role === 'Producer' && (
                  <NavLink to="/casting/new">
                    <Button variant="hero" className="hover-scale">Post Casting</Button>
                  </NavLink>
                )}
                {user?.role === 'Actor' && (
                  <Button variant="hero" size="sm" onClick={handleSwitchRole}>
                    Switch to Producer
                  </Button>
                )}

              </React.Fragment>
            ) : (
              <React.Fragment>
                <NavLink to="/auth/login" className="hidden sm:inline-block">
                  <Button variant="ghost">Log in</Button>
                </NavLink>
                <React.Fragment>
                  <Button variant="hero" className="hover-scale" onClick={() => setRegisterOpen(true)}>Get Started</Button>
                  <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                    <DialogContent className="max-w-5xl p-0 overflow-hidden">
                      <div className="relative grid grid-cols-1 md:grid-cols-2">
                        <div className="p-10 flex flex-col items-center text-center gap-5">
                          <div className="h-56 w-80 flex items-center justify-center">
                            <img src={actorImg} alt="Artist" className="max-h-full max-w-full object-contain" />
                          </div>
                          <p className="text-sm text-muted-foreground max-w-xs">Apply for unlimited jobs/auditions posted by top industry recruiters.</p>
                          <button className="text-xs font-semibold text-primary/80" onClick={() => navigate('/casting')}>KNOW MORE</button>
                          <Button variant="hero" className="rounded-full px-6 py-6 text-base w-[220px]" onClick={() => handleRegisterClick('Actor')}>Register As Artist</Button>
                        </div>
                        <div className="p-10 flex flex-col items-center text-center gap-5">
                          <div className="h-56 w-80 flex items-center justify-center">
                            <img src={recruiterImg} alt="Producer" className="max-h-full max-w-full object-contain" />
                          </div>
                          <p className="text-sm text-muted-foreground max-w-xs">Search and find the perfect talent for your project.</p>
                          <button className="text-xs font-semibold text-primary/80" onClick={() => navigate('/casting')}>KNOW MORE</button>
                          <Button variant="hero" className="rounded-full px-6 py-6 text-base w-[220px]" onClick={() => handleRegisterClick('Producer')}>Register As Recruiter</Button>
                        </div>
                        <div className="hidden md:block absolute inset-y-0 left-1/2 w-px bg-border" />
                      </div>
                      <div className="px-6 pb-6 text-center text-xs text-muted-foreground">Are you a talent agency? <span className="underline cursor-pointer" onClick={() => navigate('/auth/register/producer')}>Click here.</span></div>
                    </DialogContent>
                  </Dialog>
                </React.Fragment>
              </React.Fragment>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search Users</DialogTitle>
            <DialogDescription>
              Search for actors and producers by their username.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {isSearching && <p className="text-sm text-muted-foreground">Searching...</p>}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.map((result) => (
                <div
                  key={result._id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => {
                    navigate(`/profile/${result._id}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  {result.profileImage ? (
                    <img
                      src={result.profileImage}
                      alt={result.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.name}</p>
                    <p className="text-sm text-muted-foreground">{result.role}</p>
                  </div>
                  {result.isVerified && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
              ))}
              {searchQuery && !isSearching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Switch Request Dialog */}
      <Dialog open={switchRoleOpen} onOpenChange={setSwitchRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Role Switch to Producer</DialogTitle>
            <DialogDescription>
              Please provide a reason for switching to a Producer account. Your request will be reviewed by an administrator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">Reason</label>
              <Textarea
                id="reason"
                placeholder="Explain why you want to switch to a Producer account..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSwitchRoleOpen(false)}
              disabled={isRequesting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSwitchRequest}
              disabled={isRequesting || !reason.trim()}
            >
              {isRequesting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
