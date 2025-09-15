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

export default function RegisterActor() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [profileImage, setProfileImage] = useState(""); // URL optional
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Clear any persisted values on mount
  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setAge("");
    setGender("");
    setPhone("");
    setLocation("");
    setExperienceLevel("");
    setProfileImage("");
    setBio("");
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
    const ageNum = Number(age);
    if (!age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      return "Age must be a number between 1 and 120";
    }
    if (!gender) {
      return "Please select a gender";
    }
    const phoneRegex = /^\+?[0-9\-\s]{7,15}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return "Please enter a valid phone number";
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
        role: 'Actor',
        age: Number(age),
        gender,
        phone,
        location,
        experienceLevel,
        bio,
        profileImage
      };

      const { data } = await API.post('/auth/register', payload);
      toast.success("Registration successful! Please log in.");
      // Redirect to login as requested
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
      , React.createElement(SEO, { title: "Join as Actor"  , description: "Create your Actor account on Actory."     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 57}} )
      , React.createElement('section', { className: "relative min-h-[80vh] flex items-center justify-center"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}}
        , React.createElement('img', { src: heroImage, alt: "Cinematic backdrop" , className: "absolute inset-0 w-full h-full object-cover"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 59}} )
        , React.createElement('div', { className: "absolute inset-0 bg-background/70 backdrop-blur"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 60}} )
        , React.createElement('div', { className: "relative w-full max-w-md p-8 rounded-xl border bg-card shadow-xl"       , __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}}
          , React.createElement('h1', { className: "font-display text-3xl text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 62}}, "Join as Actor"  )
          , React.createElement('p', { className: "text-center text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}, "Create your actor account"   )
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
            , React.createElement('div', { className: "grid grid-cols-2 gap-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 94}}
              , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}
                , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}, "Age *")
                , React.createElement(Input, { placeholder: "Age", type: "number", value: age, onChange: (e) => setAge(e.target.value), min: 1, max: 120, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}} )
              )
              , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}}
                , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}, "Gender *")
                , React.createElement('select', { className: "w-full rounded-md border bg-background px-3 py-2 text-sm", value: gender, onChange: (e) => setGender(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}, 
                    React.createElement('option', { value: "" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "Select gender" ),
                    React.createElement('option', { value: "male" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 103}}, "Male" ),
                    React.createElement('option', { value: "female" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 104}}, "Female" ),
                    React.createElement('option', { value: "other" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 105}}, "Other" ),
                    React.createElement('option', { value: "prefer-not-to-say" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 106}}, "Prefer not to say" )
                  )
              )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 110}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 111}}, "Phone Number *")
              , React.createElement(Input, { placeholder: "+1 555 123 4567", value: phone, onChange: (e) => setPhone(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 112}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 114}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 115}}, "Location/City *")
              , React.createElement(Input, { placeholder: "City", value: location, onChange: (e) => setLocation(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 116}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 118}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 119}}, "Experience Level *")
              , React.createElement('select', { className: "w-full rounded-md border bg-background px-3 py-2 text-sm", value: experienceLevel, onChange: (e) => setExperienceLevel(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 120}}, 
                    React.createElement('option', { value: "" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 121}}, "Select experience" ),
                    React.createElement('option', { value: "beginner" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 122}}, "Beginner" ),
                    React.createElement('option', { value: "intermediate" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 123}}, "Intermediate" ),
                    React.createElement('option', { value: "experienced" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 124}}, "Experienced" ),
                    React.createElement('option', { value: "professional" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 125}}, "Professional" )
                  )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 128}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 129}}, "Profile Image URL (optional)")
              , React.createElement(Input, { placeholder: "https://...", value: profileImage, onChange: (e) => setProfileImage(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 130}} )
            )
            , React.createElement('div', { className: "space-y-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 132}}
              , React.createElement('label', { className: "text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 133}}, "Bio (optional, max 500 chars)")
              , React.createElement('textarea', { className: "w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[90px]", maxLength: 500, value: bio, onChange: (e) => setBio(e.target.value), placeholder: "Tell us about yourself", disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 134}} )
            )
            , error && React.createElement('p', { className: "text-sm text-red-500 text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 137}}, error)
            , React.createElement(Button, { 
              variant: "hero", 
              className: "w-full", 
              onClick: handleRegister,
              disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 138}}

              , loading ? 'Signing up...' : 'Sign up as Actor'
            )
          )
          , React.createElement('div', { className: "my-4 flex items-center gap-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 147}}
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 148}} )
            , React.createElement('span', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 149}}, "or")
            , React.createElement('div', { className: "h-px flex-1 bg-border"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 150}} )
          )
          , React.createElement(GoogleSignIn, { text: "signup_with", role: "Actor", __self: this, __source: {fileName: _jsxFileName, lineNumber: 152}} )
          , React.createElement('p', { className: "mt-4 text-center text-sm text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 153}}, "Already have an account? "
                , React.createElement('a', { href: "/auth/login", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 154}}, "Log in" )
          )
        )
      )
    )
  );
}
