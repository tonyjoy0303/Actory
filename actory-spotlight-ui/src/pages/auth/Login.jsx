import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ensure fields are cleared on page load and discourage autofill persistence
  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      const msg = "Please fill in both fields.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    try {
      const { data } = await API.post('/auth/login', { email, password });
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange')); // Notify header to update

      toast.success("Login successful! Redirecting...");

      // Redirect based on role
      if (data.user.role === 'Admin') {
        navigate('/dashboard/admin');
      } else if (data.user.role === 'Actor') {
        navigate('/dashboard/actor');
      } else if (data.user.role === 'Producer') {
        navigate('/dashboard/producer');
      } else {
        navigate('/'); // Fallback redirect
      }

    } catch (err) {
      const errorMessage = _optionalChain([err, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || "An unexpected error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Login", description: "Access your Actory account to manage auditions and castings."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}} )
      , React.createElement('section', { className: "relative min-h-[80vh] flex items-center justify-center"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}}
        , React.createElement('img', { src: heroImage, alt: "Cinematic backdrop" , className: "absolute inset-0 w-full h-full object-cover"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 65}} )
        , React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 66}} )
        , React.createElement('div', { className: "relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl"       , __self: this, __source: {fileName: _jsxFileName, lineNumber: 67}}
          , React.createElement('h1', { className: "font-display text-3xl text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 68}}, "Welcome back" )
          , React.createElement('p', { className: "text-center text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 69}}, "Log into Actory"  )
          , React.createElement('form', { onSubmit: handleLogin, className: "mt-6 space-y-4", autoComplete: "off" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}
            , React.createElement(Input, { 
              placeholder: "Email", 
              type: "email", 
              value: email,
              onChange: (e) => setEmail(e.target.value),
              autoComplete: "off",
              name: "new-email",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
            )
            , React.createElement(Input, { 
              placeholder: "Password", 
              type: "password", 
              value: password,
              onChange: (e) => setPassword(e.target.value),
              autoComplete: "new-password",
              name: "new-password",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 78}}
            )
            , error && React.createElement('p', { className: "text-sm text-red-500 text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, error)
            , React.createElement(Button, { type: "submit", className: "w-full hover-scale" , variant: "hero", disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}
              , loading ? 'Logging in...' : 'Log in'
            )
          )
          , React.createElement('div', { className: "my-4 flex items-center gap-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 91}} )
            , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 92}}, "or")
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 93}} )
          )
          , React.createElement(GoogleSignIn, { text: "signin_with", __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}} )
          , React.createElement('p', { className: "mt-4 text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}, "No account? "
              , React.createElement('a', { href: "/auth/register", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}, "Create one" )
          )
        )
      )
    )
  );
}
