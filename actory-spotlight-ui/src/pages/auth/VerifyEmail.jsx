import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import API from '@/lib/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem('registrationEmail') || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!email || !otp) {
      setError('Please enter both email and OTP');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/auth/verify-email', { 
        email, 
        otp 
      });
      
      setVerified(true);
      toast.success(data.message || 'Email verified successfully!');
      
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'OTP verification failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/auth/resend-verification', { email });
      
      // If OTP is included in response (development mode), show it
      if (data.otp) {
        toast.success(`${data.message}\n\nYour verification code: ${data.otp}`, {
          duration: 15000
        });
      } else {
        toast.success(data.message || 'Verification code sent! Check your email.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Verify Email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          {verified ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-center text-lg font-medium">Email Verified!</p>
              <p className="text-center text-sm text-muted-foreground">
                Your account has been verified. Redirecting to login...
              </p>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    localStorage.setItem('registrationEmail', e.target.value);
                  }}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Verification Code</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={loading}
                    maxLength="6"
                    className="text-2xl tracking-widest text-center font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Check your email for the verification code. It expires in 10 minutes.
                </p>
                <p className="text-xs text-orange-600 font-semibold mt-2">
                  ⚠️ Important: Your registration will be automatically deleted if not verified within 5 minutes.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <Button 
                onClick={handleVerifyOTP} 
                disabled={loading || !email || !otp}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={loading || !email}
                className="w-full"
              >
                Resend Code
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already verified?{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
