import React, { useState } from 'react';
const _jsxFileName = "";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import API from "@/lib/api";
import SEO from "@/components/SEO";
import heroImage from "@/assets/hero-cinematic.jpg";

export default function RegisterProductionTeamMember() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    companyName: ''
  });

  const [loading, setLoading] = useState(false);
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // Step 1: Send verification code (register pending user)
  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.email.includes('@')) {
      const msg = "Valid email is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.companyName.trim()) {
      const msg = "Company/Production House name is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.phone.trim()) {
      const msg = "Phone is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.location.trim()) {
      const msg = "Location is required";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      const msg = "Passwords don't match";
      setError(msg);
      toast.error(msg);
      return;
    }

    setSendOtpLoading(true);

    try {
      // Register pending user with ProductionTeam role
      // Use companyName as name for ProductionTeam users
      await API.post('/auth/register', {
        name: formData.companyName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        location: formData.location,
        role: 'ProductionTeam',
        companyName: formData.companyName
      });

      setOtpSent(true);
      toast.success("Verification code sent to your email!");
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Failed to send verification code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSendOtpLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length !== 6) {
      const msg = "Please enter a valid 6-digit code";
      setError(msg);
      toast.error(msg);
      return;
    }

    setVerificationLoading(true);

    try {
      // Verify OTP
      await API.post('/auth/verify-email', {
        email: formData.email,
        otp: otp.trim()
      });

      toast.success("Email verified! Logging you in...");

      // Auto-login after verification
      const loginResponse = await API.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (loginResponse.data.token && loginResponse.data.user) {
        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
        window.dispatchEvent(new Event('authChange'));

        toast.success("Registration successful!");
        navigate('/dashboard/producer'); // ProductionTeam uses same dashboard as Producer
      } else {
        toast.info("Verification successful! Please log in.");
        navigate('/auth/login');
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || "Invalid or expired verification code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const reset = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      location: '',
      companyName: ''
    });
    setOtp('');
    setOtpSent(false);
    setError('');
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Register as Production Team Member", description: "Join Actory as a production team member to collaborate on film projects."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 189}} )
      , React.createElement('section', { className: "relative min-h-screen flex items-center justify-center py-12"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 190}}
        , React.createElement('img', { src: heroImage, alt: "Cinematic backdrop" , className: "absolute inset-0 w-full h-full object-cover"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 191}} )
        , React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 192}} )
        
        , React.createElement('div', { className: "relative w-full max-w-2xl px-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 194}}
          , React.createElement(Card, { className: "shadow-2xl border-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 195}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 196}}
              , React.createElement(CardTitle, { className: "text-3xl text-center font-display" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 197}}
                , "Join as Production Team Member"
              )
              , React.createElement('p', { className: "text-center text-muted-foreground mt-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 200}}
                , "Register to collaborate on film projects"
              )
            )
            
            , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 204}}
              , React.createElement('form', { onSubmit: otpSent ? handleVerifyOtp : handleSendVerification, className: "space-y-6"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 205}}
                , React.createElement('div', { className: "space-y-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 206}}
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 217}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 218}}, "Email")
                    , React.createElement(Input, {
                      type: "email", 
                      placeholder: "your.email@example.com", 
                      value: formData.email,
                      onChange: (e) => handleChange('email', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 219}}
                    )
                    , !otpSent && (
                      React.createElement('div', { className: "mt-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}}
                        , React.createElement(Button, {
                          type: "button", 
                          onClick: handleSendVerification,
                          disabled: sendOtpLoading || !formData.email,
                          size: "sm", 
                          variant: "outline", __self: this, __source: {fileName: _jsxFileName, lineNumber: 228}}
                        
                          , sendOtpLoading ? "Sending..." : "Verify Email"
                        )
                      )
                    )
                  )

                  , otpSent && (
                    React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 240}}
                      , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 241}}, "Verification Code")
                      , React.createElement(Input, {
                        placeholder: "Enter 6-digit code", 
                        value: otp,
                        onChange: (e) => setOtp(e.target.value),
                        maxLength: 6,
                        disabled: verificationLoading,
                        required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 242}}
                      )
                    )
                  )

                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 252}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 253}}, "Company / Production House")
                    , React.createElement(Input, {
                      placeholder: "e.g., XYZ Productions", 
                      value: formData.companyName,
                      onChange: (e) => handleChange('companyName', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 254}}
                    )
                  )

                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 262}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 263}}, "Phone")
                    , React.createElement(Input, {
                      type: "tel", 
                      placeholder: "+1234567890", 
                      value: formData.phone,
                      onChange: (e) => handleChange('phone', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 264}}
                    )
                  )

                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 273}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 274}}, "Location")
                    , React.createElement(Input, {
                      placeholder: "City, Country", 
                      value: formData.location,
                      onChange: (e) => handleChange('location', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 275}}
                    )
                  )

                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 283}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 284}}, "Password")
                    , React.createElement(Input, {
                      type: "password", 
                      placeholder: "Minimum 6 characters", 
                      value: formData.password,
                      onChange: (e) => handleChange('password', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 285}}
                    )
                  )

                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 294}}
                    , React.createElement('label', { className: "text-sm font-medium mb-1.5 block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 295}}, "Confirm Password")
                    , React.createElement(Input, {
                      type: "password", 
                      placeholder: "Re-enter password", 
                      value: formData.confirmPassword,
                      onChange: (e) => handleChange('confirmPassword', e.target.value),
                      disabled: loading || otpSent,
                      required: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 296}}
                    )
                  )
                )

                , error && (
                  React.createElement('div', { className: "p-3 bg-destructive/10 text-destructive rounded-md text-sm"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 307}}
                    , error
                  )
                )

                , otpSent && (
                  React.createElement('div', { className: "flex gap-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 313}}
                    , React.createElement(Button, {
                      type: "submit", 
                      disabled: verificationLoading || otp.length !== 6,
                      className: "flex-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 314}}
                    
                      , verificationLoading ? "Verifying..." : "Done"
                    )
                    , React.createElement(Button, {
                      type: "button", 
                      variant: "outline", 
                      onClick: reset,
                      disabled: verificationLoading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 320}}
                    
                      , "Reset"
                    )
                  )
                )

                , React.createElement('div', { className: "text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 330}}
                  , "Already have an account? "
                  , React.createElement('a', { href: "/auth/login", className: "text-primary hover:underline"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 332}}, "Sign in"
                  )
                )
              )
            )
          )
        )
      )
    )
  );
}
