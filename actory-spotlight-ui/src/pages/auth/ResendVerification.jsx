import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import API from '@/lib/api';

export default function ResendVerification() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/auth/resend-verification', { email });
      toast.success(data.message || 'Verification email sent! Please check your inbox.');
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Resend Verification Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already verified?{' '}
              <a href="/auth/login" className="text-primary hover:underline">
                Login here
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
