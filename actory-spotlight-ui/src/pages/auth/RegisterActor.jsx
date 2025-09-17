import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function RegisterActor() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
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
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Clear any persisted values on mount
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAge("");
    setGender("");
    setPhone("");
    setLocation("");
    setExperienceLevel("");
    setProfileImage(null);
    setProfileImagePreview("");
    setBio("");
  }, []);

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

  // Real-time password validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  }, [password, confirmPassword]);

  const validate = () => {
    if (nameTouched && (!name || name.trim().length < 2 || name.trim().length > 50)) {
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
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return "Age must be a number between 1 and 120";
    }
    if (!gender) {
      return "Please select a gender";
    }
    if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
      return "Please enter a valid 10-digit phone number";
    }
    if (!location) {
      return "Location/City is required";
    }
    if (!experienceLevel) {
      return "Please select an experience level";
    }
    if (bio && bio.length > 500) {
      return "Bio must be at most 500 characters";
    }
    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setError("Please select a valid image file");
        return;
      }
      
      // Check file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size should be less than 2MB");
        return;
      }
      
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setPhone(value);
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
      // Prepare user data for registration
      const userData = {
        name,
        email,
        password,
        role: 'Actor',
        age,
        gender,
        phone,
        location,
        experienceLevel,
        bio,
      };

      console.log('Sending registration request with data:', userData);
      const response = await API.post("/auth/register", userData);
      console.log('Registration response:', response.data);
      
      if (response.data && response.data.success) {
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

        // Handle profile image upload if provided
        if (profileImage) {
          try {
            const formData = new FormData();
            formData.append('photo', profileImage);
            
            await API.post("/auth/me/photo", formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              },
            });

            // Refresh user data after uploading photo
            const userResponse = await API.get('/auth/me', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (userResponse.data?.success) {
              localStorage.setItem('user', JSON.stringify(userResponse.data.data));
              window.dispatchEvent(new Event('authChange'));
            }
          } catch (uploadError) {
            console.error("Error uploading profile image:", uploadError);
            toast.warning("Account created, but there was an error uploading your profile image. You can update it later.");
          }
        }

        toast.success("Registration successful! Redirecting to your dashboard...");
        
        // Redirect based on role (default to actor if not specified)
        const userRole = (user.role || 'actor').toLowerCase();
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
      <SEO title="Join as Actor" description="Create your Actor account on Actory." />
      
      <section className="relative min-h-[80vh] flex items-center justify-center">
        <img 
          src={heroImage} 
          alt="Cinematic backdrop" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur" />
        
        <div className="relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl">
          <h1 className="font-display text-3xl text-center">Join as Actor</h1>
          <p className="text-center text-muted-foreground mt-1">Create your actor account</p>
          
          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm">Full name *</label>
              <Input 
                placeholder="Full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!nameTouched) setNameTouched(true);
                }}
                onBlur={() => setNameTouched(true)}
                autoComplete="off"
                name="new-name"
                disabled={loading}
                className={nameTouched && (!name || name.trim().length < 2 || name.trim().length > 50) ? 'border-red-500' : ''}
              />
              {nameTouched && (!name || name.trim().length < 2 || name.trim().length > 50) && (
                <p className="text-xs text-red-500">Full Name must be 2–50 characters</p>
              )}
            </div>
            
            <div className="space-y-1">
              <label className="text-sm">Email *</label>
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                name="new-email"
                disabled={loading || isChecking}
                className={!isEmailValid && email ? 'border-red-500' : ''}
              />
              {isChecking && <p className="text-xs text-muted-foreground">Checking email availability...</p>}
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm">Password *</label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className={passwordError ? 'border-red-500' : ''}
                />
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm">Confirm Password *</label>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                  className={passwordError ? 'border-red-500' : ''}
                />
                {passwordError && (
                  <p className="text-xs text-red-500">{passwordError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm">Age *</label>
                <Input
                  type="number"
                  placeholder="Age"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm">Gender *</label>
                <select
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
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
                placeholder="Location/City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Experience Level *</label>
              <select
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                disabled={loading}
              >
                <option value="">Select experience level</option>
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="experienced">Experienced (3-5 years)</option>
                <option value="professional">Professional (5+ years)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted">
                  {profileImagePreview ? (
                    <img 
                      src={profileImagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-6 h-6"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    Upload Photo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">JPEG, PNG (max 2MB)</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm">Bio (optional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isChecking || phoneError || passwordError}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleSignIn disabled={loading || isChecking} />

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => navigate("/login")}
                disabled={loading || isChecking}
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
