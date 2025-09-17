import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import API from '@/lib/api';
import SEO from '@/components/SEO';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const navigate = useNavigate();

  // Check if token is valid on component mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        await API.get(`/auth/check-reset-token/${token}`);
        setIsValidToken(true);
      } catch (error) {
        console.error('Invalid token:', error);
        toast.error('Invalid or expired reset link. Please request a new one.');
        setIsValidToken(false);
        // Redirect to forgot password page after a delay
        setTimeout(() => {
          navigate('/forgot-password');
        }, 3000);
      } finally {
        setIsCheckingToken(false);
      }
    };

    if (token) {
      checkToken();
    } else {
      setIsCheckingToken(false);
      setIsValidToken(false);
      toast.error('No reset token provided');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      
      await API.put(`/auth/resetpassword/${token}`, {
        newPassword: password,
        confirmPassword
      });
      
      toast.success('Password updated successfully! Redirecting to login...');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>This password reset link is invalid or has expired.</p>
            <p className="mt-2">Redirecting to forgot password page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <SEO 
        title="Reset Password | Actory" 
        description="Set a new password for your Actory account" 
      />
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below to update your account.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
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
