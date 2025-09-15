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

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear fields on mount to avoid showing stale values from previous sessions
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
  }, []);

  const handleRegister = async (role) => {
    setLoading(true);
    setError("");

    if (name.trim().length < 3) {
      const msg = "Username must be at least 3 characters long.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    if (!name || !email || !password) {
      const msg = "Please fill in all fields.";
      setError(msg);
      setLoading(false);
      toast.error(msg);
      return;
    }

    try {
      const { data } = await API.post('/auth/register', { name, email, password, role });
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange')); // Notify header to update

      toast.success("Registration successful! Redirecting...");

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
      , React.createElement(SEO, { title: "Register", description: "Join Actory as an actor or producer to connect and collaborate."          , __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}} )
      , React.createElement('section', { className: "relative min-h-[80vh] flex items-center justify-center"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}
        , React.createElement('img', { src: heroImage, alt: "Cinematic backdrop" , className: "absolute inset-0 w-full h-full object-cover"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}} )
        , React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}} )
        , React.createElement('div', { className: "relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl"       , __self: this, __source: {fileName: _jsxFileName, lineNumber: 75}}
          , React.createElement('h1', { className: "font-display text-3xl text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 76}}, "Create your account"  )
          , React.createElement('p', { className: "text-center text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 77}}, "Join Actory" )
          , React.createElement('div', { className: "mt-6 space-y-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 78}}
            , React.createElement(Input, { 
              placeholder: "Full name" , 
              value: name,
              onChange: (e) => setName(e.target.value),
              autoComplete: "off",
              name: "new-name",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}}
            )
            , React.createElement(Input, { 
              placeholder: "Email", 
              type: "email", 
              value: email,
              onChange: (e) => setEmail(e.target.value),
              autoComplete: "off",
              name: "new-email",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}
            )
            , React.createElement(Input, { 
              placeholder: "Password", 
              type: "password", 
              value: password,
              onChange: (e) => setPassword(e.target.value),
              autoComplete: "new-password",
              name: "new-password",
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 92}}
            )
            , error && React.createElement('p', { className: "text-sm text-red-500 text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}}, error)
            , React.createElement('div', { className: "grid grid-cols-2 gap-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}
              , React.createElement(Button, { 
                variant: "brand-outline", 
                className: "w-full", 
                onClick: () => handleRegister('Actor'),
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}

                , loading ? 'Signing up...' : 'Sign up as Actor'
              )
              , React.createElement(Button, { 
                variant: "hero", 
                className: "w-full", 
                onClick: () => handleRegister('Producer'),
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 109}}

                , loading ? 'Signing up...' : 'Sign up as Producer'
              )
            )
          )
          , React.createElement('div', { className: "my-4 flex items-center gap-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 119}}
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 120}} )
            , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}}, "or")
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 122}} )
          )
          , React.createElement('div', { className: "space-y-3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 124}}
            , React.createElement('p', { className: "text-center text-sm text-muted-foreground"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 125}}, "Sign up with Google as"    )
            , React.createElement('div', { className: "grid grid-cols-2 gap-3"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 126}}
              , React.createElement('div', { className: "flex flex-col items-center gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 127}}
                , React.createElement(GoogleSignIn, { text: "signup_with", role: "Actor", __self: this, __source: {fileName: _jsxFileName, lineNumber: 128}} )
                , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 129}}, "Actor")
              )
              , React.createElement('div', { className: "flex flex-col items-center gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                , React.createElement(GoogleSignIn, { text: "signup_with", role: "Producer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 132}} )
                , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 133}}, "Producer")
              )
            )
          )
          , React.createElement('p', { className: "mt-4 text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 137}}, "Already have an account? "
                , React.createElement('a', { href: "/auth/login", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 138}}, "Log in" )
          )
        )
      )
    )
  );
}
