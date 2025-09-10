import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API from "@/lib/api";
import heroImage from "@/assets/hero-cinematic.jpg";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function RegisterProducer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
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
      const { data } = await API.post('/auth/register', { name, email, password, role: 'Producer' });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange'));
      toast.success("Registration successful! Redirecting...");
      navigate('/dashboard/producer');
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
      , React.createElement(SEO, { title: "Join as Producer"  , description: "Create your Producer account on Actory."     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 57}} )
      , React.createElement('section', { className: "relative min-h-[80vh] flex items-center justify-center"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}}
        , React.createElement('img', { src: heroImage, alt: "Cinematic backdrop" , className: "absolute inset-0 w-full h-full object-cover"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 59}} )
        , React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 60}} )
        , React.createElement('div', { className: "relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl"       , __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}}
          , React.createElement('h1', { className: "font-display text-3xl text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 62}}, "Join as Producer"  )
          , React.createElement('p', { className: "text-center text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}, "Create your producer account"   )
          , React.createElement('div', { className: "mt-6 space-y-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}}
            , React.createElement(Input, { 
              placeholder: "Full name" , 
              value: name,
              onChange: (e) => setName(e.target.value),
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 65}}
            )
            , React.createElement(Input, { 
              placeholder: "Email", 
              type: "email", 
              value: email,
              onChange: (e) => setEmail(e.target.value),
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
            )
            , React.createElement(Input, { 
              placeholder: "Password", 
              type: "password", 
              value: password,
              onChange: (e) => setPassword(e.target.value),
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 78}}
            )
            , error && React.createElement('p', { className: "text-sm text-red-500 text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, error)
            , React.createElement(Button, { 
              variant: "hero", 
              className: "w-full", 
              onClick: handleRegister,
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}

              , loading ? 'Signing up...' : 'Sign up as Producer'
            )
          )
          , React.createElement('div', { className: "my-4 flex items-center gap-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}} )
            , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}, "or")
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 98}} )
          )
          , React.createElement(GoogleSignIn, { text: "signup_with", role: "Producer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}} )
          , React.createElement('p', { className: "mt-4 text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}, "Already have an account? "
                , React.createElement('a', { href: "/auth/login", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "Log in" )
          )
        )
      )
    )
  );
}
