import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import API from '@/lib/api';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, X } from 'lucide-react';

// Define types

export default function AuditionSubmit() {
  const { castingCallId } = useParams();
  const navigate = useNavigate();

  const [castingCall, setCastingCall] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [height, setHeight] = useState(''); // cm
  const [weight, setWeight] = useState(''); // kg
  const [age, setAge] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [livingCity, setLivingCity] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioUploadProgress, setPortfolioUploadProgress] = useState(0);
  const videoRef = useRef(null);

  // Skills handling functions
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  useEffect(() => {
    const fetchCastingCall = async () => {
      try {
        const { data } = await API.get(`/casting/${castingCallId}`);
        setCastingCall(data.data);
      } catch (error) {
        toast.error('Failed to load casting call details.');
        navigate('/dashboard/actor');
      }
    };
    if (castingCallId) {
      fetchCastingCall();
    }
  }, [castingCallId, navigate]);

  const onDrop = (e) => {
    e.preventDefault();
    const f = _optionalChain([e, 'access', _ => _.dataTransfer, 'access', _2 => _2.files, 'optionalAccess', _3 => _3[0]]);
    if (f && f.type.startsWith('video/')) {
      setFile(f);
    } else {
      toast.error('Please drop a valid video file.');
    }
  };

  const onSelect = (e) => {
    const f = _optionalChain([e, 'access', _4 => _4.target, 'access', _5 => _5.files, 'optionalAccess', _6 => _6[0]]);
    if (f && f.type.startsWith('video/')) {
      setFile(f);
    } else {
      toast.error('Please select a valid video file.');
    }
  };

  const onSelectPortfolio = (e) => {
    const f = _optionalChain([e, 'access', _ => _.target, 'access', _2 => _2.files, 'optionalAccess', _3 => _3[0]]);
    const maxBytes = 500 * 1024; // 500 KB
    if (f && f.type === 'application/pdf') {
      if (f.size <= maxBytes) {
        setPortfolioFile(f);
      } else {
        setPortfolioFile(null);
        toast.error('Portfolio PDF must be 500 KB or smaller.');
      }
    } else {
      setPortfolioFile(null);
      toast.error('Please select a valid PDF file for your portfolio.');
    }
  };

  const handleSubmit = async () => {
    // Basic validation
    const h = Number(height);
    const w = Number(weight);
    const a = Number(age);

    if (!file || !portfolioFile || !title || !height || !weight || !age || skills.length === 0 || 
        !permanentAddress || !livingCity || !dateOfBirth || !phoneNumber) {
      toast.error('Please fill all fields, select a video, upload your portfolio PDF, and add at least one skill.');
      return;
    }
    if (portfolioFile && portfolioFile.size > 500 * 1024) {
      toast.error('Portfolio PDF must be 500 KB or smaller.');
      return;
    }
    if (Number.isNaN(h) || Number.isNaN(w) || Number.isNaN(a) || h <= 0 || w <= 0 || a <= 0) {
      toast.error('Please enter valid numeric values for height, weight, and age.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const portfolioForm = new FormData();
    portfolioForm.append('file', portfolioFile);
    const portfolioPreset = import.meta.env.VITE_CLOUDINARY_PORTFOLIO_PRESET || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!portfolioPreset) {
      toast.error('Missing Cloudinary unsigned upload preset for portfolio (VITE_CLOUDINARY_PORTFOLIO_PRESET).');
      setLoading(false);
      return;
    }
    portfolioForm.append('upload_preset', portfolioPreset);
    portfolioForm.append('folder', 'portfolio');

    try {
      // 1. Upload to Cloudinary
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percent);
          },
        }
      );

      const { secure_url, public_id } = cloudinaryRes.data;

      // Upload portfolio PDF via image endpoint (works with unsigned presets)
      const portfolioRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        portfolioForm,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setPortfolioUploadProgress(percent);
          },
        }
      );
      const portfolioUrl = _optionalChain([portfolioRes, 'access', _ => _.data, 'optionalAccess', _2 => _2.secure_url]);

      // 2. Submit to our backend
      await API.post(`/casting/${castingCallId}/videos`,
        { 
          title,
          videoUrl: secure_url,
          cloudinaryId: public_id,
          castingCall: castingCallId,
          height: h,
          weight: w,
          age: a,
          skills,
          permanentAddress,
          livingCity,
          dateOfBirth,
          phoneNumber,
          email,
          portfolioUrl,
        }
      );

      toast.success('Audition submitted successfully!');
      navigate('/dashboard/actor');

    } catch (error) {
      // Surface Cloudinary error details when available to aid troubleshooting
      const msg = _optionalChain([error, 'optionalAccess', _7 => _7.response, 'optionalAccess', _8 => _8.data, 'optionalAccess', _9 => _9.error])?.message
        || _optionalChain([error, 'optionalAccess', _10 => _10.response, 'optionalAccess', _11 => _11.data, 'optionalAccess', _12 => _12.message])
        || 'Submission failed. Please try again.';
      console.error('Upload error:', _optionalChain([error, 'optionalAccess', _13 => _13.response, 'optionalAccess', _14 => _14.data]) || error);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const src = file ? URL.createObjectURL(file) : undefined;

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Audition Submission" , description: "Upload your audition video with a simple drag-and-drop interface."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 141}} )
      , React.createElement('section', { className: "container py-8 max-w-3xl"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 142}}
        , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 143}}
          , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 144}}
            , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 145}}, "Submit Your Audition for: "    , (_optionalChain([castingCall, 'optionalAccess', _10 => _10.roleTitle]) || _optionalChain([castingCall, 'optionalAccess', _11 => _11.roleName])) || '...')
            , React.createElement('p', { className: "text-muted-foreground text-sm pt-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 146}}, _optionalChain([castingCall, 'optionalAccess', _11 => _11.description]))
            , castingCall && (
              React.createElement('div', { className: "mt-3 grid gap-2 text-sm text-muted-foreground"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 148}}
                , castingCall.location && (
                  React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 150}}, React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 150}}, "Location:"), " " , castingCall.location)
                )
                , castingCall.ageRange && (
                  React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 153}}, 
                    React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 153}}, "Age Range:" ), " " , castingCall.ageRange.min, " - ", castingCall.ageRange.max, " years"
                  )
                )
                , (castingCall.auditionDate || castingCall.shootingStartDate || castingCall.shootingEndDate) && (
                  React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-3 gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 156}}
                    , castingCall.auditionDate && (
                      React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 158}}, React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 158}}, "Audition:"), " " , new Date(castingCall.auditionDate).toLocaleDateString())
                    )
                    , castingCall.shootingStartDate && (
                      React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 161}}, React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 161}}, "Shoot Start:" ), " " , new Date(castingCall.shootingStartDate).toLocaleDateString())
                    )
                    , castingCall.shootingEndDate && (
                      React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 164}}, React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 164}}, "Shoot End:" ), " " , new Date(castingCall.shootingEndDate).toLocaleDateString())
                    )
                  )
                )
                , _optionalChain([castingCall, 'access', _12 => _12.skills, 'optionalAccess', _13 => _13.length]) ? (
                  React.createElement('div', { className: "flex flex-wrap gap-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 169}}
                    , castingCall.skills.map((s) => (
                      React.createElement('span', { key: s, className: "px-2 py-1 rounded-full bg-secondary text-xs"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 171}}, s)
                    ))
                  )
                ) : null
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 175}}
                  , React.createElement('span', { className: "font-medium text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 176}}, "Producer:"), " " , typeof castingCall.producer === 'object' ? _optionalChain([castingCall, 'access', _14 => _14.producer, 'optionalAccess', _15 => _15.name]) : '—'
                  , typeof castingCall.producer === 'object' && _optionalChain([castingCall, 'access', _16 => _16.producer, 'optionalAccess', _17 => _17.email]) ? ` • ${castingCall.producer.email}` : ''
                )
              )
            )
          )
          , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 182}}
            , React.createElement('div', {
              className: "border-dashed border-2 rounded-lg p-10 text-center bg-card hover:shadow-[var(--shadow-elegant)] transition-shadow"       ,
              onDragOver: (e) => e.preventDefault(),
              onDrop: onDrop, __self: this, __source: {fileName: _jsxFileName, lineNumber: 183}}

              , React.createElement('p', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 188}}, "Drag & drop your video here, or click to select a file"           )
              , React.createElement('div', { className: "mt-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 189}}
                , React.createElement(Input, { id: "file-upload", type: "file", accept: "video/*", onChange: onSelect, className: "sr-only", __self: this, __source: {fileName: _jsxFileName, lineNumber: 190}} )
                , React.createElement(Button, { asChild: true, variant: "secondary", __self: this, __source: {fileName: _jsxFileName, lineNumber: 191}}
                  , React.createElement('label', { htmlFor: "file-upload", __self: this, __source: {fileName: _jsxFileName, lineNumber: 192}}, "Choose File" )
                )
              )
            )

            , React.createElement('div', { className: "mt-6 grid gap-4"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 197}}
              , React.createElement(Input, { 
                placeholder: "Give your audition a title (e.g., 'Dramatic Monologue')"       ,
                value: title,
                onChange: (e) => setTitle(e.target.value),
                disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 198}}
              )

              /* Additional required fields */
              , React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 206}}
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 207}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 208}}, "Height (cm)" )
                  , React.createElement(Input, { type: "number", inputMode: "numeric", min: 50, max: 300, step: 1, placeholder: "e.g., 175" , value: height, onChange: (e) => setHeight(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 209}} )
                )
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 211}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 212}}, "Weight (kg)" )
                  , React.createElement(Input, { type: "number", inputMode: "numeric", min: 10, max: 500, step: 1, placeholder: "e.g., 70" , value: weight, onChange: (e) => setWeight(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 213}} )
                )
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 215}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 216}}, "Age")
                  , React.createElement(Input, { type: "number", inputMode: "numeric", min: 1, max: 120, step: 1, placeholder: "e.g., 26" , value: age, onChange: (e) => setAge(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 217}} )
                )
              )

              /* Personal Information Fields */
              , React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-4"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 220}}
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 221}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 222}}, "Permanent Address *")
                  , React.createElement(Input, { type: "text", placeholder: "Enter your permanent address" , value: permanentAddress, onChange: (e) => setPermanentAddress(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 223}} )
                )
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 225}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 226}}, "Living City *")
                  , React.createElement(Input, { type: "text", placeholder: "Enter your current city" , value: livingCity, onChange: (e) => setLivingCity(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}} )
                )
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 229}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 230}}, "Date of Birth *")
                  , React.createElement(Input, { type: "date", value: dateOfBirth, onChange: (e) => setDateOfBirth(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}} )
                )
                , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 233}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 234}}, "Phone Number *")
                  , React.createElement(Input, { type: "tel", placeholder: "Enter your phone number" , value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 235}} )
                )
                , React.createElement('div', { className: "sm:col-span-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 237}}
                  , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 238}}, "Email Address (Optional)")
                  , React.createElement(Input, { type: "email", placeholder: "Enter your email address (optional)" , value: email, onChange: (e) => setEmail(e.target.value), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 239}} )
                )
              )

              /* Skills Section */
              , React.createElement('div', { className: "grid grid-cols-1"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 241}}
                  , React.createElement('div', { className: "md:col-span-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 222}}
                    , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 223}}, "Skills *")
                    , React.createElement('div', { className: "flex gap-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 224}}
                      , React.createElement(Input, { placeholder: "Add a skill (e.g., Dancing, Martial Arts)" , value: skillInput, onChange: (e) => setSkillInput(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleAddSkill(e), disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 225}} )
                      , React.createElement(Button, { type: "button", variant: "outline", size: "icon", onClick: handleAddSkill, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 226}}
                        , React.createElement(Plus, { className: "h-4 w-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}} )
                      )
                    )
                    , React.createElement('div', { className: "flex flex-wrap gap-2 mt-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 228}}
                      , skills.map((skill) => (
                        React.createElement('div', { key: skill, className: "flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 230}}
                          , skill
                          , React.createElement('button', { type: "button", onClick: () => handleRemoveSkill(skill), className: "text-muted-foreground hover:text-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}}
                            , React.createElement(X, { className: "h-3 w-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 232}} )
                          )
                        )
                      ))
                    )
                  )
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 235}}
                    , React.createElement('label', { className: "block text-sm mb-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 236}}, "Portfolio (PDF)")
                    , React.createElement(Input, { type: "file", accept: "application/pdf", onChange: onSelectPortfolio, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 237}} )
                    , portfolioFile ? React.createElement('p', { className: "text-xs text-muted-foreground mt-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 238}}, _optionalChain([portfolioFile, 'access', _ => _.name])) : null
                  )
              )

              , src && (
                React.createElement('video', { ref: videoRef, controls: true, className: "w-full rounded-md shadow"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 226}}
                  , React.createElement('source', { src: src, __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}} )
                )
              )
              , loading && React.createElement('div', { className: "space-y-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 230}}
                , React.createElement(Progress, { value: uploadProgress, className: "w-full", __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}} )
                , portfolioFile && React.createElement(Progress, { value: portfolioUploadProgress, className: "w-full", __self: this, __source: {fileName: _jsxFileName, lineNumber: 232}} )
              )
              , React.createElement('div', { className: "mt-2 flex justify-end"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}}
                , React.createElement(Button, { variant: "hero", className: "hover-scale", onClick: handleSubmit, disabled: loading || !file || !portfolioFile, __self: this, __source: {fileName: _jsxFileName, lineNumber: 232}}
                  , loading ? `Uploading... ${uploadProgress}%` : 'Submit Audition'
                )
              )
            )
          )
        )
      )
    )
  );
}
