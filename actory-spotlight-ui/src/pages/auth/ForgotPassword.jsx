import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import API from '@/lib/api';
import SEO from '@/components/SEO';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      
      await API.post('/auth/forgotpassword', { email });
      
      toast.success('If an account with that email exists, a password reset link has been sent');
      
      // Clear form
      setEmail('');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <SEO 
        title="Forgot Password | Actory" 
        description="Reset your Actory account password" 
      />
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
            
            <div className="text-center text-sm">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="font-medium text-primary hover:underline focus:outline-none"
                disabled={isLoading}
              >
                Back to Login
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
