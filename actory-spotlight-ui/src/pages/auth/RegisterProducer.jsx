import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";
import { useEmailValidation } from "@/hooks/useEmailValidation";

export default function RegisterProducer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const { 
    email, 
    setEmail, 
    isValid: isEmailValid, 
    isChecking, 
    error: emailError 
  } = useEmailValidation("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear any persisted values on mount
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setCompanyName("");
    setPhone("");
    setPhoneError("");
    setLocation("");
    setWebsite("");
  }, []);

  // Real-time password validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  // Real-time phone number validation
  useEffect(() => {
    if (phone && !/^\d{0,10}$/.test(phone)) {
      setPhoneError("Phone number must contain only digits");
    } else if (phone && phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  }, [phone]);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setPhone(value);
  };

  const validate = () => {
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return "Full Name must be 2–50 characters";
    }
    if (!isEmailValid || isChecking) {
      return "Please enter a valid email";
    }
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return "Please enter a valid 10-digit phone number";
    }
    if (!companyName || companyName.trim().length < 2) {
      return "Production House / Company Name is required";
    }
    if (!location) {
      return "Location/City is required";
    }
    return null;
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const msg = validate();
    if (msg) {
      setLoading(false);
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      const userData = {
        name,
        email,
        password,
        role: 'Producer',
        companyName,
        phone,
        location,
        website
      };

      console.log('Sending registration request with data:', userData);
      const response = await API.post("/auth/register", userData);
      console.log('Registration response:', response.data);
      
      if (response.data && response.data.success) {
        // Check if email verification is required
        if (response.data.email && !response.data.token) {
          // Email verification required
          localStorage.setItem('registrationEmail', response.data.email);
          
          // If OTP is included in response (development mode), show it
          if (response.data.otp) {
            toast.success(`${response.data.message}\n\nYour verification code: ${response.data.otp}`, {
              duration: 15000
            });
          } else {
            toast.success(response.data.message || "Registration successful! Please check your email for the verification code.");
          }
          
          setTimeout(() => {
            navigate('/auth/verify-email');
          }, 1000);
          return;
        }
        
        const { token, user } = response.data;
        
        if (!token || !user) {
          console.error('Invalid response structure:', response.data);
          throw new Error('Registration successful but could not log you in. Please try logging in manually.');
        }

        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Notify other components about the auth change
        window.dispatchEvent(new Event('authChange'));

        toast.success("Registration successful! Redirecting to your dashboard...");
        
        // Redirect based on role (default to producer if not specified)
        const userRole = (user.role || 'producer').toLowerCase();
        navigate(`/dashboard/${userRole}`);
        
      } else {
        throw new Error(response.data?.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Registration failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Join as Recruiter" description="Create your Recruiter account on Actory." />
      
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <img 
          src={heroImage} 
          alt="Cinematic backdrop" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur" />
        
        <div className="relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl">
          <h1 className="font-display text-3xl text-center">Join as Recruiter</h1>
          <p className="text-center text-muted-foreground mt-1">Create your recruiter account</p>
          
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm">Full name *</label>
              <Input 
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                name="new-name"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Email *</label>
              <Input
                placeholder="yourname@gmail.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                name="new-email"
                disabled={loading}
                className={!isEmailValid && email ? 'border-red-500' : ''}
              />
              {isChecking && <p className="text-xs text-muted-foreground">Checking email availability...</p>}
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Password *</label>
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                name="new-password"
                disabled={loading}
                className={passwordError && confirmPassword ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">At least 6 characters</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Confirm Password *</label>
              <Input
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                name="confirm-password"
                disabled={loading}
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && (
                <p className="text-xs text-red-500">{passwordError}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Production House / Company Name *</label>
              <Input 
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Phone Number *</label>
              <Input 
                placeholder="Phone Number"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                inputMode="numeric"
                className={phoneError ? 'border-red-500' : ''}
                disabled={loading}
              />
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Location/City *</label>
              <Input 
                placeholder="City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Website / Social Handle (optional)</label>
              <Input 
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            
            <Button 
              className="w-full mt-2" 
              onClick={handleRegister}
              disabled={loading || passwordError || phoneError}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
          
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          
          <GoogleSignIn text="signup_with" role="Producer" />
          
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <a 
              href="/login" 
              className="font-medium text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Log in
            </a>
          </p>
        </div>
      </section>
    </>
  );
}