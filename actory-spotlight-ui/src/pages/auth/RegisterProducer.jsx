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

export default function RegisterProducer() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear any persisted values on mount
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setCompanyName("");
    setPhone("");
    setLocation("");
    setWebsite("");
  }, []);

  const validate = () => {
    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return "Full Name must be 2–50 characters";
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!email || !emailRegex.test(email)) {
      return "Please enter a valid email";
    }
    if (!password || password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!companyName) {
      return "Production House / Company Name is required";
    }
    const phoneRegex = /^\+?[0-9\-\s]{7,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return "Please enter a valid phone number";
    }
    if (!location) {
      return "Location/City is required";
    }
    return null;
  };

  const handleRegister = async () => {
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
      const payload = {
        name,
        email,
        password,
        role: 'Producer',
        companyName,
        phone,
        location,
        website
      };

      const { data } = await API.post('/auth/register', payload);
      toast.success("Registration successful! Please log in.");
      navigate('/auth/login');
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
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 65}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 66}}, "Full name *")
              , React.createElement(Input, { 
                placeholder: "Full name" , 
                value: name,
                onChange: (e) => setName(e.target.value),
                autoComplete: "off",
                name: "new-name",
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 67}}
              )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 75}}, "Email *")
              , React.createElement(Input, { 
                placeholder: "Email", 
                type: "email", 
                value: email,
                onChange: (e) => setEmail(e.target.value),
                autoComplete: "off",
                name: "new-email",
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 76}}
              )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, "Password *")
              , React.createElement(Input, { 
                placeholder: "Password", 
                type: "password", 
                value: password,
                onChange: (e) => setPassword(e.target.value),
                autoComplete: "new-password",
                name: "new-password",
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}
              )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 94}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}, "Production House / Company Name *")
              , React.createElement(Input, { placeholder: "Company name", value: companyName, onChange: (e) => setCompanyName(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 98}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}}, "Phone Number *")
              , React.createElement(Input, { placeholder: "+1 555 123 4567", value: phone, onChange: (e) => setPhone(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 103}}, "Location/City *")
              , React.createElement(Input, { placeholder: "City", value: location, onChange: (e) => setLocation(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 104}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 106}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 107}}, "Website / Social Handle (optional)")
              , React.createElement(Input, { placeholder: "https://...", value: website, onChange: (e) => setWebsite(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 108}} )
            )
            , error && React.createElement('p', { className: "text-sm text-red-500 text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 110}}, error)
            , React.createElement(Button, { 
              variant: "hero", 
              className: "w-full", 
              onClick: handleRegister,
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 111}}

              , loading ? 'Signing up...' : 'Sign up as Producer'
            )
          )
          , React.createElement('div', { className: "my-4 flex items-center gap-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 120}}
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}} )
            , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 122}}, "or")
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 123}} )
          )
          , React.createElement(GoogleSignIn, { text: "signup_with", role: "Producer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 125}} )
          , React.createElement('p', { className: "mt-4 text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 126}}, "Already have an account? "
                , React.createElement('a', { href: "/auth/login", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 127}}, "Log in" )
          )
        )
      )
    )
  );
}
