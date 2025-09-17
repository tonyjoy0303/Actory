import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

export default function LoginRequired() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  // If user is already logged in, redirect them to the intended page
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  const handleLogin = () => {
    navigate('/auth/login', { state: { from } });
  };

  const handleRegister = () => {
    navigate('/auth/register/actor', { state: { from } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <SEO 
        title="Login Required - Actory" 
        description="You need to be logged in to access this page." 
      />
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 className="mt-2 text-3xl font-display font-semibold tracking-tight">
            Login Required
          </h2>
          <p className="mt-2 text-muted-foreground">
            You need to be logged in to access this page.
          </p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-8 space-y-6">
          <div className="space-y-4">
            <Button
              onClick={handleLogin}
              variant="hero"
              className="w-full hover-scale"
              size="lg"
            >
              Log In
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              variant="outline"
              className="w-full hover-scale"
              size="lg"
            >
              Create an Account
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link 
              to="/auth/register/actor" 
              className="font-medium text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                handleRegister();
              }}
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
