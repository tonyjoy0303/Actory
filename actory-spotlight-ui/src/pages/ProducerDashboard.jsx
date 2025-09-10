import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define the type for a casting call

// const CastingCall = {
//   roleName: string;
//   description: string;
//   ageRange: string;
//   location: string;
//   skills: string[];
//   auditionDate: Date;
//   shootingStartDate: Date;
//   shootingEndDate: Date;
// };

const initialFormState = {
  roleName: '',
  description: '',
  ageRange: '',
  location: '',
  skills: '',
  auditionDate: '',
  shootingStartDate: '',
  shootingEndDate: '',
};

export default function ProducerDashboard() {
  const [castingCalls, setCastingCalls] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // submissions dialog state
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [activeCasting, setActiveCasting] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    // Get user from local storage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchCastingCalls();
  }, []);

  const fetchCastingCalls = async () => {
    try {
      const { data } = await API.get('/casting');
      // Filter calls by the logged-in producer
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setCastingCalls(data.data.filter((call) => call.producer._id === storedUser.id));
    } catch (error) {
      toast.error('Failed to fetch casting calls.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const postData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim()),
      };
      await API.post('/casting', postData);
      toast.success('Casting call posted successfully!');
      setFormData(initialFormState); // Reset form
      fetchCastingCalls(); // Refresh list
    } catch (error) {
      const errorMessage = _optionalChain([error, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || 'Failed to post casting call.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmissions = async (call) => {
    setActiveCasting(call);
    setSubmissions([]);
    setSubmissionsLoading(true);
    setSubmissionsOpen(true);
    try {
      const { data } = await API.get(`/casting/${call._id}/videos`);
      setSubmissions(data.data);
    } catch (error) {
      const msg = _optionalChain([error, 'access', _4 => _4.response, 'optionalAccess', _5 => _5.data, 'optionalAccess', _6 => _6.message]) || 'Failed to load submissions.';
      toast.error(msg);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const updateSubmissionStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      const { data } = await API.patch(`/videos/${id}/status`, { status });
      // Update local state
      setSubmissions((prev) => prev.map((s) => (s._id === id ? { ...s, status: data.data.status } : s)));
      toast.success(`Submission ${status.toLowerCase()}.`);
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Render submissions block to avoid nested ternary parsing issues
  const renderSubmissions = () => {
    if (submissionsLoading) {
      return React.createElement('p', { className: "text-center text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 221}}, "Loading submissions..." );
    }
    if (submissions.length) {
      return React.createElement('div', { className: "space-y-3 max-h-[60vh] overflow-auto"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 223}},
        submissions.map((s) => (
          React.createElement('div', { key: s._id, className: "p-3 rounded-md border flex items-center justify-between gap-3"      , __self: this, __source: {fileName: _jsxFileName, lineNumber: 225}},
            React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 226}},
              React.createElement('p', { className: "font-medium", __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}}, _optionalChain([s, 'access', _8 => _8.actor, 'optionalAccess', _9 => _9.name]) || 'Unknown actor'),
              React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 228}}, _optionalChain([s, 'access', _10 => _10.actor, 'optionalAccess', _11 => _11.email])),
              React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 229}}, "Title: " , s.title),
              React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 230}}, "Height: " , s.height, " cm • Weight: "    , s.weight, " kg • Age: "    , s.age, " • Skintone: "   , s.skintone),
              React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}}, "Submitted: " , new Date(s.createdAt).toLocaleString()),
              React.createElement('div', { className: "mt-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}},
                React.createElement('span', { className: `inline-block px-2 py-0.5 rounded text-xs ${s.status === 'Accepted' ? 'bg-green-600/20 text-green-500' : s.status === 'Rejected' ? 'bg-red-600/20 text-red-500' : 'bg-yellow-600/20 text-yellow-500'}` , __self: this, __source: {fileName: _jsxFileName, lineNumber: 231}}, s.status || 'Pending')
              )
            ),
            React.createElement('div', { className: "flex items-center gap-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 233}},
              React.createElement('a', { href: s.videoUrl, target: "_blank", rel: "noreferrer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 234}},
                React.createElement(Button, { size: "sm", variant: "brand-outline", __self: this, __source: {fileName: _jsxFileName, lineNumber: 235}}, "View Video" )
              ),
              React.createElement(Button, { size: "sm", variant: "secondary", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Accepted'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 235}}, updatingId === s._id ? 'Updating...' : 'Accept'),
              React.createElement(Button, { size: "sm", variant: "ghost", disabled: updatingId === s._id, onClick: () => updateSubmissionStatus(s._id, 'Rejected'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 235}}, "Reject")
            )
          )
        ))
      );
    }
    return React.createElement('p', { className: "text-center text-sm text-muted-foreground"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 242}}, "No submissions yet."  );
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Producer Dashboard" , description: "Post casting calls, manage submissions, and chat with actors."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 123}} )
      , React.createElement('section', { className: "container py-8 grid gap-6 md:grid-cols-3"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 124}}
        , React.createElement('div', { className: "md:col-span-2 grid gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 125}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 126}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 127}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 128}}, "Post a Casting Call"   )
            )
            , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 130}}
              , React.createElement('form', { onSubmit: handleFormSubmit, className: "grid gap-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                , React.createElement(Input, { name: "roleName", value: formData.roleName, onChange: handleInputChange, placeholder: "Role title (e.g., Lead – Detective)"     , disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 132}} )
                , React.createElement('div', { className: "grid grid-cols-2 gap-3"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 133}}
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 134}}
                    , React.createElement('select', {
                      id: "ageRange",
                      name: "ageRange",
                      value: formData.ageRange,
                      onChange: handleInputChange,
                      className: `w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formData.ageRange ? 'text-white' : 'text-gray-400'}`, __self: this, __source: {fileName: _jsxFileName, lineNumber: 135}}

                      , React.createElement('option', { value: "", disabled: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 142}}, "Select Age Range"  )
                      , React.createElement('option', { value: "18-25", __self: this, __source: {fileName: _jsxFileName, lineNumber: 143}}, "18-25")
                      , React.createElement('option', { value: "25-35", __self: this, __source: {fileName: _jsxFileName, lineNumber: 144}}, "25-35")
                      , React.createElement('option', { value: "35-45", __self: this, __source: {fileName: _jsxFileName, lineNumber: 145}}, "35-45")
                      , React.createElement('option', { value: "45-55", __self: this, __source: {fileName: _jsxFileName, lineNumber: 146}}, "45-55")
                      , React.createElement('option', { value: "55+", __self: this, __source: {fileName: _jsxFileName, lineNumber: 147}}, "55+")
                      , React.createElement('option', { value: "any", __self: this, __source: {fileName: _jsxFileName, lineNumber: 148}}, "Any")
                    )
                  )
                  , React.createElement(Input, { name: "location", value: formData.location, onChange: handleInputChange, placeholder: "Location (e.g., Los Angeles, CA)"    , disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 151}} )
                )
                , React.createElement(Input, { name: "skills", value: formData.skills, onChange: handleInputChange, placeholder: "Skills (comma-separated, e.g., bilingual, stunt work)"     , disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 153}} )
                , React.createElement(Textarea, { name: "description", value: formData.description, onChange: handleInputChange, placeholder: "Brief role description"  , disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 154}} )
                , React.createElement('div', { className: "grid grid-cols-3 gap-3"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 155}}
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 156}}
                    , React.createElement('label', { htmlFor: "auditionDate", __self: this, __source: {fileName: _jsxFileName, lineNumber: 157}}, "Audition Date" )
                    , React.createElement(Input, { type: "date", name: "auditionDate", value: formData.auditionDate, onChange: handleInputChange, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 158}} )
                  )
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 160}}
                    , React.createElement('label', { htmlFor: "shootingStartDate", __self: this, __source: {fileName: _jsxFileName, lineNumber: 161}}, "Shoot Start Date"  )
                    , React.createElement(Input, { type: "date", name: "shootingStartDate", value: formData.shootingStartDate, onChange: handleInputChange, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 162}} )
                  )
                  , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 164}}
                    , React.createElement('label', { htmlFor: "shootingEndDate", __self: this, __source: {fileName: _jsxFileName, lineNumber: 165}}, "Shoot End Date"  )
                    , React.createElement(Input, { type: "date", name: "shootingEndDate", value: formData.shootingEndDate, onChange: handleInputChange, disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 166}} )
                  )
                )
                , React.createElement('div', { className: "flex justify-end" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 169}}
                  , React.createElement(Button, { type: "submit", variant: "hero", className: "hover-scale", disabled: loading, __self: this, __source: {fileName: _jsxFileName, lineNumber: 170}}
                    , loading ? 'Posting...' : 'Post Casting'
                  )
                )
              )
            )
          )

          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 178}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 179}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 180}}, "Your Active Castings"  )
            )
            , React.createElement(CardContent, { className: "space-y-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 182}}
              , castingCalls.length > 0 ? (
                castingCalls.map((call) => (
                  React.createElement('div', { key: call._id, className: "flex items-center justify-between p-2 rounded-md border"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 185}}
                    , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 186}}
                      , React.createElement('p', { className: "font-medium", __self: this, __source: {fileName: _jsxFileName, lineNumber: 187}}, call.roleName)
                      , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 188}}, call.location, " | "  , call.ageRange)
                    )
                    , React.createElement('div', { className: "flex gap-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 190}}
                      , React.createElement(Button, { variant: "ghost", onClick: () => handleViewSubmissions(call), __self: this, __source: {fileName: _jsxFileName, lineNumber: 191}}, "View Submissions" )
                    )
                  )
                ))
              ) : (
                React.createElement('p', { className: "text-sm text-muted-foreground text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 196}}, "You have not posted any casting calls yet."       )
              )
            )
          )
        )

        , React.createElement('div', { className: "grid gap-6" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 202}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 203}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 204}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 205}}, "Messaging")
            )
            , React.createElement(CardContent, { className: "space-y-3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 207}}
              , React.createElement('p', { className: "text-sm text-muted-foreground text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 208}}, "Messaging feature coming soon."   )
            )
          )
        )
      )

      /* Submissions Dialog */
      , React.createElement(Dialog, { open: submissionsOpen, onOpenChange: setSubmissionsOpen, __self: this, __source: {fileName: _jsxFileName, lineNumber: 215}}
        , React.createElement(DialogContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 216}}
          , React.createElement(DialogHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 217}}
            , React.createElement(DialogTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 218}}, "Submissions for "  , _optionalChain([activeCasting, 'optionalAccess', _7 => _7.roleName]))
          )
          , renderSubmissions()
        )
      )
    )
  );
}
