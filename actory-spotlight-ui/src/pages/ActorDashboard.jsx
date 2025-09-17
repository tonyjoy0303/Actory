import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Bell, } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Define types

















export default function ActorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [castingCalls, setCastingCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute backend origin (without /api/v1) to serve static uploads
  const API_ORIGIN = API.defaults.baseURL.replace(/\/api\/v1$/, "");

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchCalls = async () => {
      try {
        const { data } = await API.get('/casting');
        setCastingCalls(data.data);
      } catch (error) {
        console.error('Error fetching casting calls:', error);
        toast.error('Failed to fetch casting calls.');
      } finally {
        setLoading(false);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const { data } = await API.get('/videos/mine');
        setSubmissions(data.data || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to fetch your submissions.');
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchCalls();
    fetchSubmissions();
  }, []);

  const handleGoToProfile = () => {
    const id = _optionalChain([user, 'optionalAccess', _ => _.id]);
    if (id) {
      navigate(`/actor/profile/${id}`);
    } else {
      // Fallback: try to fetch /auth/me or redirect to login
      navigate('/auth/login');
    }
  };

  const handleRequestSwitch = async () => {
    if (reason.trim().length < 10) {
      toast.error("Please provide a more detailed reason (at least 10 characters).");
      return;
    }
    setIsSubmitting(true);
    try {
      await API.post('/actor/request-switch', { reason });
      toast.success('Your role switch request has been submitted successfully.');
      setIsSwitchModalOpen(false);
      setReason('');
    } catch (err) {
      const errorMessage = _optionalChain([err, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || "Failed to submit request.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Actor Dashboard" , description: "Manage your profile, portfolio, and audition submissions on Actory."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}} )
      , React.createElement('section', { className: "container py-8 grid gap-6 md:grid-cols-3"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 83}}
        , React.createElement('div', { className: "md:col-span-2 grid gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 87}}, "Profile Overview" )
            )
            , React.createElement(CardContent, { className: "flex items-center gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 89}}
              , React.createElement('div', { className: "size-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center"  , 'aria-hidden': !(_optionalChain([user, 'optionalAccess', _ => _.photo])), __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}
                , _optionalChain([user, 'optionalAccess', _2 => _2.photo]) ? (
                  React.createElement('img', { src: `${API_ORIGIN}${_optionalChain([user, 'optionalAccess', _3 => _3.photo])}`, alt: "Profile", className: "w-full h-full object-cover" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}} )
                ) : null
              )
              , React.createElement('div', { className: "flex-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 91}}
                , React.createElement('h2', { className: "text-xl font-semibold" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 92}}, _optionalChain([user, 'optionalAccess', _4 => _4.name]) || 'Actor')
                , React.createElement('p', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 93}}, "Drama • Comedy • Voiceover"    )
              )
              , React.createElement(Button, { variant: "brand-outline", className: "hover-scale", onClick: handleGoToProfile, __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}, "Edit Profile" )
              , React.createElement(Button, { variant: "hero", className: "ml-2", onClick: () => setIsSwitchModalOpen(true), __self: this, __source: {fileName: _jsxFileName, lineNumber: 96}}, "Request Producer Role"  )
            )
          )

          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "Open Casting Calls"  )
            )
            , React.createElement(CardContent, { className: "space-y-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 104}}
              , loading ? (
                React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 106}}, "Loading casting calls..."  )
              ) : castingCalls.length > 0 ? (
                castingCalls.map((call) => (
                  React.createElement('div', { key: call._id, className: "flex items-center justify-between p-3 rounded-lg border"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 109}}
                    , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 110}}
                      , React.createElement('p', { className: "font-medium text-brand" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 111}}, call.roleName)
                      , React.createElement('p', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 112}}, call.description.substring(0, 50), "...")
                      , React.createElement('p', { className: "text-xs text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 113}}, "Posted by: "  , call.producer?.name || 'Unknown Producer')
                    )
                    , React.createElement(Button, { variant: "hero", onClick: () => navigate(`/audition/submit/${call._id}`), __self: this, __source: {fileName: _jsxFileName, lineNumber: 115}}, "View & Apply"  )
                  )
                ))
              ) : (
                React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 119}}, "No open casting calls at the moment."      )
              )
            )
          )
        )

        , React.createElement('div', { className: "grid gap-6" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 125}}
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 126}}
            , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 127}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 128}}, "My Submissions" )
            )
            , React.createElement(CardContent, { className: "space-y-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 130}}
                , submissionsLoading ? (
                  React.createElement('p', { className: "text-sm text-muted-foreground text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, "Loading your submissions..." )
                ) : submissions.length > 0 ? (
                  submissions.map((s) => (
                    React.createElement('div', { key: s._id, className: "p-3 rounded-lg border flex items-center justify-between"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                      , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                        , React.createElement('p', { className: "font-medium" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, s.title)
                        , React.createElement('p', { className: "text-xs text-muted-foreground mt-1"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, (s.castingCall && s.castingCall.roleName) ? `For: ${s.castingCall.roleName}` : "")
                        , React.createElement('p', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, new Date(s.createdAt).toLocaleString())
                        , React.createElement('div', { className: "mt-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                          , React.createElement('span', { className: `inline-block px-2 py-0.5 rounded text-xs ${s.status === 'Accepted' ? 'bg-green-600/20 text-green-500' : s.status === 'Rejected' ? 'bg-red-600/20 text-red-500' : 'bg-yellow-600/20 text-yellow-500'}` , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, s.status || 'Pending')
                        )
                      )
                      , React.createElement(Button, { variant: "secondary", asChild: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}
                        , React.createElement('a', { href: s.videoUrl, target: "_blank", rel: "noreferrer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, "View")
                      )
                    )
                  ))
                ) : (
                  React.createElement('p', { className: "text-sm text-muted-foreground text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 131}}, "You haven't submitted any auditions yet.")
                )
            )
          )
          , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 134}}
            , React.createElement(CardHeader, { className: "flex-row items-center justify-between"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 135}}
              , React.createElement(CardTitle, { className: "font-display", __self: this, __source: {fileName: _jsxFileName, lineNumber: 136}}, "Notifications")
              , React.createElement(Bell, { className: "text-brand", __self: this, __source: {fileName: _jsxFileName, lineNumber: 137}} )
            )
            , React.createElement(CardContent, { className: "space-y-3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 139}}
              , React.createElement('p', { className: "text-sm text-muted-foreground text-center"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 140}}, "No new notifications."  )
            )
          )
        )
      )

      , React.createElement(Dialog, { open: isSwitchModalOpen, onOpenChange: setIsSwitchModalOpen, __self: this, __source: {fileName: _jsxFileName, lineNumber: 146}}
        , React.createElement(DialogContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 147}}
          , React.createElement(DialogHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 148}}
            , React.createElement(DialogTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 149}}, "Request Producer Role"  )
            , React.createElement(DialogDescription, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 150}}, "Please provide a reason for wanting to switch to a Producer role. An admin will review your request."

            )
          )
          , React.createElement('div', { className: "py-4", __self: this, __source: {fileName: _jsxFileName, lineNumber: 154}}
            , React.createElement(Textarea, {
              placeholder: "Describe your experience or reason for switching..."      ,
              value: reason,
              onChange: (e) => setReason(e.target.value),
              disabled: isSubmitting, __self: this, __source: {fileName: _jsxFileName, lineNumber: 155}}
            )
          )
          , React.createElement(DialogFooter, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 162}}
            , React.createElement(Button, { variant: "ghost", onClick: () => setIsSwitchModalOpen(false), disabled: isSubmitting, __self: this, __source: {fileName: _jsxFileName, lineNumber: 163}}, "Cancel")
            , React.createElement(Button, { onClick: handleRequestSwitch, disabled: isSubmitting || reason.trim().length < 10, __self: this, __source: {fileName: _jsxFileName, lineNumber: 164}}
              , isSubmitting ? 'Submitting...' : 'Submit Request'
            )
          )
        )
      )
    )
  );
}
