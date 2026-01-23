import React, { useState } from 'react';
const _jsxFileName = "";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import API from "@/lib/api";
import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-cinematic.jpg";

export default function RegisterProductionTeam() {
  const navigate = useNavigate();
  const [step, setStep] = useState("account"); // "account" or "team"

  // Account registration form
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    productionHouse: '',
    phone: '',
    location: ''
  });

  // Team creation form
  const [teamForm, setTeamForm] = useState({
    name: '',
    productionHouse: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  // Step 1: Send verification code (register pending user)
  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!accountForm.name.trim() || accountForm.name.trim().length < 3) {
      const msg = "Full name must be at least 3 characters";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!accountForm.email || !accountForm.email.includes('@')) {
      const msg = "Valid email is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!accountForm.phone.trim()) {
      const msg = "Phone is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!accountForm.location.trim()) {
      const msg = "Location is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!accountForm.password || accountForm.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (accountForm.password !== accountForm.confirmPassword) {
      const msg = "Passwords do not match";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!accountForm.productionHouse.trim()) {
      const msg = "Production House / Company Name is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSendOtpLoading(true);
    try {
      const { data } = await API.post('/auth/register', {
        name: accountForm.name,
        email: accountForm.email,
        password: accountForm.password,
        role: 'ProductionTeam',
        companyName: accountForm.productionHouse,
        phone: accountForm.phone,
        location: accountForm.location
      });

      if (data.success) {
        const successMessage = data.message || 'Registration successful! Please verify your email to continue.';
        toast.success(successMessage);

        setOtpSent(true);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendOtpLoading(false);
    }
  };

  // Step 1b: Verify OTP and log in
  const handleVerifyOtp = async () => {
    setError('');

    if (!accountForm.email || !otp.trim()) {
      const msg = 'Enter your email and OTP to verify';
      setError(msg);
      toast.error(msg);
      return;
    }

    setVerificationLoading(true);
    try {
      await API.post('/auth/verify-email', { email: accountForm.email, otp });
      toast.success('Email verified successfully!');

      // Auto login to continue flow
      const { data: loginData } = await API.post('/auth/login', {
        email: accountForm.email,
        password: accountForm.password
      });

      if (loginData.success && loginData.user && loginData.token) {
        setUserId(loginData.user._id);
        setToken(loginData.token);

        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        window.dispatchEvent(new Event('authChange'));

        setStep('team');
        setOtp('');
      } else {
        toast.info('Email verified. Please log in to continue.');
        navigate('/auth/login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'OTP verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Step 2: Create production team
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');

    if (!teamForm.name.trim()) {
      const msg = 'Team name is required';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post('/teams', {
        name: teamForm.name,
        productionHouse: teamForm.productionHouse,
        description: teamForm.description
      });

      if (data.success) {
        toast.success('Production team created successfully!');
        setTeamForm({ name: '', productionHouse: '', description: '' });
        navigate('/teams');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create team';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard/producer');
  };

  return (
    React.createElement(React.Fragment, null,
      React.createElement(SEO, { title: "Register as Production Team", description: "Create your production team account on Actory", __self: this, __source: { fileName: _jsxFileName, lineNumber: 115 } }),
      React.createElement('section', { className: "relative min-h-screen flex items-center justify-center py-8", __self: this, __source: { fileName: _jsxFileName, lineNumber: 116 } },
        React.createElement('img', { src: heroImage, alt: "Cinematic backdrop", className: "absolute inset-0 w-full h-full object-cover", __self: this, __source: { fileName: _jsxFileName, lineNumber: 117 } }),
        React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur", __self: this, __source: { fileName: _jsxFileName, lineNumber: 118 } }),

        React.createElement('div', { className: "relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl", __self: this, __source: { fileName: _jsxFileName, lineNumber: 120 } },
          // Step 1: Account Registration
          step === 'account' && React.createElement(React.Fragment, null,
            React.createElement('h1', { className: "font-display text-3xl text-center", __self: this, __source: { fileName: _jsxFileName, lineNumber: 123 } }, "Create Your Account"),
            React.createElement('p', { className: "text-center text-muted-foreground mt-1", __self: this, __source: { fileName: _jsxFileName, lineNumber: 124 } }, "Register as a Production Team"),

            React.createElement('form', { onSubmit: handleSendVerification, className: "mt-6 space-y-4", __self: this, __source: { fileName: _jsxFileName, lineNumber: 126 } },
              React.createElement(Input, {
                placeholder: "Full name",
                value: accountForm.name,
                onChange: (e) => setAccountForm({ ...accountForm, name: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "off",
                name: "new-name",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 127 }
              }
              ),
              React.createElement(Input, {
                placeholder: "Production House / Company Name",
                value: accountForm.productionHouse,
                onChange: (e) => setAccountForm({ ...accountForm, productionHouse: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "organization",
                name: "new-production-house",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 131 }
              }
              ),
              React.createElement(Input, {
                placeholder: "Phone",
                type: "tel",
                value: accountForm.phone,
                onChange: (e) => setAccountForm({ ...accountForm, phone: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "tel",
                name: "new-phone",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 135 }
              }
              ),
              React.createElement(Input, {
                placeholder: "Location",
                value: accountForm.location,
                onChange: (e) => setAccountForm({ ...accountForm, location: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "address-level1",
                name: "new-location",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 143 }
              }
              ),
              React.createElement(Input, {
                placeholder: "Email",
                type: "email",
                value: accountForm.email,
                onChange: (e) => setAccountForm({ ...accountForm, email: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "off",
                name: "new-email",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 134 }
              }
              ),
              React.createElement(Button, {
                type: "button",
                variant: "secondary",
                className: "w-full",
                onClick: handleSendVerification,
                disabled: sendOtpLoading || verificationLoading,
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 140 }
              }
                , sendOtpLoading ? 'Sending code...' : 'Verify email'
              ),
              React.createElement(Input, {
                placeholder: "Password",
                type: "password",
                value: accountForm.password,
                onChange: (e) => setAccountForm({ ...accountForm, password: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "new-password",
                name: "new-password",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 142 }
              }
              ),
              React.createElement(Input, {
                placeholder: "Confirm Password",
                type: "password",
                value: accountForm.confirmPassword,
                onChange: (e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value }),
                disabled: sendOtpLoading || verificationLoading,
                autoComplete: "new-password",
                name: "confirm-password",
                __self: this, __source: { fileName: _jsxFileName, lineNumber: 150 }
              }
              ),
              otpSent && React.createElement(React.Fragment, null,
                React.createElement(Input, {
                  placeholder: "Enter verification code",
                  value: otp,
                  onChange: (e) => setOtp(e.target.value),
                  disabled: verificationLoading,
                  inputMode: "numeric",
                  maxLength: 6,
                  name: "verification-code",
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 160 }
                }
                ),
                React.createElement(Button, {
                  type: "button",
                  variant: "hero",
                  className: "w-full",
                  onClick: handleVerifyOtp,
                  disabled: verificationLoading || !otp.trim(),
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 168 }
                }
                  , verificationLoading ? 'Verifying...' : 'Done'
                )
              ),
              error && React.createElement('p', { className: "text-sm text-red-500 text-center", __self: this, __source: { fileName: _jsxFileName, lineNumber: 158 } }, error),
              React.createElement('p', { className: "text-center text-sm text-muted-foreground", __self: this, __source: { fileName: _jsxFileName, lineNumber: 166 } },
                "Already have an account? ",
                React.createElement('a', { href: "/auth/login", className: "text-brand hover:underline", __self: this, __source: { fileName: _jsxFileName, lineNumber: 167 } }, "Log in")
              )
            )
          ),

          // Step 2: Team Creation
          step === 'team' && React.createElement(React.Fragment, null,
            React.createElement('h1', { className: "font-display text-3xl text-center", __self: this, __source: { fileName: _jsxFileName, lineNumber: 173 } }, "Create Your Team"),
            React.createElement('p', { className: "text-center text-muted-foreground mt-1 text-sm", __self: this, __source: { fileName: _jsxFileName, lineNumber: 174 } }, "Set up your production team to start managing projects and collaborating"),

            React.createElement('form', { onSubmit: handleCreateTeam, className: "mt-6 space-y-4", __self: this, __source: { fileName: _jsxFileName, lineNumber: 176 } },
              React.createElement('div', { className: "space-y-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 177 } },
                React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 178 } }, "Team Name *"),
                React.createElement(Input, {
                  placeholder: "e.g., Spotlight Productions",
                  value: teamForm.name,
                  onChange: (e) => setTeamForm({ ...teamForm, name: e.target.value }),
                  disabled: loading,
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 179 }
                }
                )
              ),
              React.createElement('div', { className: "space-y-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 184 } },
                React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 185 } }, "Production House Name"),
                React.createElement(Input, {
                  placeholder: "e.g., Golden Hour Films",
                  value: teamForm.productionHouse,
                  onChange: (e) => setTeamForm({ ...teamForm, productionHouse: e.target.value }),
                  disabled: loading,
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 186 }
                }
                )
              ),
              React.createElement('div', { className: "space-y-2", __self: this, __source: { fileName: _jsxFileName, lineNumber: 191 } },
                React.createElement('label', { className: "text-sm font-medium", __self: this, __source: { fileName: _jsxFileName, lineNumber: 192 } }, "Team Description"),
                React.createElement(Textarea, {
                  placeholder: "Tell us about your production team, focus areas, and vision...",
                  value: teamForm.description,
                  onChange: (e) => setTeamForm({ ...teamForm, description: e.target.value }),
                  disabled: loading,
                  className: "min-h-[100px]",
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 193 }
                }
                )
              ),
              error && React.createElement('p', { className: "text-sm text-red-500 text-center", __self: this, __source: { fileName: _jsxFileName, lineNumber: 199 } }, error),
              React.createElement('div', { className: "flex gap-3 pt-4", __self: this, __source: { fileName: _jsxFileName, lineNumber: 200 } },
                React.createElement(Button, {
                  type: "button",
                  variant: "outline",
                  className: "w-full",
                  onClick: handleSkip,
                  disabled: loading,
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 201 }
                }
                  , "Skip for Now"
                ),
                React.createElement(Button, {
                  type: "submit",
                  variant: "hero",
                  className: "w-full",
                  disabled: loading || !teamForm.name.trim(),
                  __self: this, __source: { fileName: _jsxFileName, lineNumber: 208 }
                }
                  , loading ? 'Creating...' : 'Create Team'
                )
              )
            )
          )
        )
      )
    )
  );
}
