import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { toast } from 'sonner';
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Define types

















































export default function AdminDashboard() {
  const [switchRequests, setSwitchRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [castingCalls, setCastingCalls] = useState([]);
  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCasting, setLoadingCasting] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Dialog state for casting call details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCasting, setSelectedCasting] = useState(null);

  // Dialog state for video details
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const fetchSwitchRequests = async () => {
    try {
      const { data } = await API.get('/admin/switch-requests');
      setSwitchRequests(data.data);
    } catch (error) {
      console.error('Error fetching switch requests:', error);
      toast.error('Failed to fetch switch requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await API.get('/admin/users');
      setUsers(data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(_optionalChain([error, 'access', _ => _.response, 'optionalAccess', _2 => _2.data, 'optionalAccess', _3 => _3.message]) || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCastingCalls = async () => {
    setLoadingCasting(true);
    try {
      const { data } = await API.get('/admin/castingcalls');
      setCastingCalls(data.data);
    } catch (error) {
      console.error('Error fetching casting calls:', error);
      toast.error(_optionalChain([error, 'access', _4 => _4.response, 'optionalAccess', _5 => _5.data, 'optionalAccess', _6 => _6.message]) || 'Failed to fetch casting calls');
    } finally {
      setLoadingCasting(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data } = await API.get('/admin/videos');
      setVideos(data.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error(_optionalChain([error, 'access', _7 => _7.response, 'optionalAccess', _8 => _8.data, 'optionalAccess', _9 => _9.message]) || 'Failed to fetch videos');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    // Load everything initially
    fetchSwitchRequests();
    fetchUsers();
    fetchCastingCalls();
    fetchVideos();
  }, []);

  const handleRequestUpdate = async (id, action) => {
    try {
      await API.put(`/admin/switch-requests/${id}/${action}`);
      toast.success(`Request has been ${action}d.`);
      fetchSwitchRequests(); // Refresh the list
    } catch (err) {
      const errorMessage = _optionalChain([err, 'access', _10 => _10.response, 'optionalAccess', _11 => _11.data, 'optionalAccess', _12 => _12.message]) || `Failed to ${action} request.`;
      toast.error(errorMessage);
    }
  };

  const handleUserRoleChange = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}`, { role });
      toast.success('User updated');
      fetchUsers();
    } catch (err) {
      toast.error(_optionalChain([err, 'access', _13 => _13.response, 'optionalAccess', _14 => _14.data, 'optionalAccess', _15 => _15.message]) || 'Failed to update user');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'users') {
        await API.delete(`/admin/users/${id}`);
        fetchUsers();
      } else if (type === 'casting') {
        await API.delete(`/admin/castingcalls/${id}`);
        fetchCastingCalls();
      } else {
        await API.delete(`/admin/videos/${id}`);
        fetchVideos();
      }
      toast.success('Deleted successfully');
    } catch (err) {
      toast.error(_optionalChain([err, 'access', _16 => _16.response, 'optionalAccess', _17 => _17.data, 'optionalAccess', _18 => _18.message]) || 'Delete failed');
    }
  };

  const openDetails = (c) => {
    setSelectedCasting(c);
    setDetailsOpen(true);
  };

  const openVideo = (v) => {
    setSelectedVideo(v);
    setVideoOpen(true);
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Admin Dashboard" , description: "Manage users, casting calls, and system settings."      , __self: this, __source: {fileName: _jsxFileName, lineNumber: 190}} )
      , React.createElement('section', { className: "container py-8" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 191}}
        , React.createElement('h1', { className: "text-3xl font-bold font-display mb-6"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 192}}, "Admin Dashboard" )
        , React.createElement(Tabs, { defaultValue: "switch-requests", __self: this, __source: {fileName: _jsxFileName, lineNumber: 193}}
          , React.createElement(TabsList, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 194}}
            , React.createElement(TabsTrigger, { value: "switch-requests", __self: this, __source: {fileName: _jsxFileName, lineNumber: 195}}, "Role Switch Requests"  )
            , React.createElement(TabsTrigger, { value: "users", __self: this, __source: {fileName: _jsxFileName, lineNumber: 196}}, "Users")
            , React.createElement(TabsTrigger, { value: "casting-calls", __self: this, __source: {fileName: _jsxFileName, lineNumber: 197}}, "Casting Calls" )
            , React.createElement(TabsTrigger, { value: "videos", __self: this, __source: {fileName: _jsxFileName, lineNumber: 198}}, "Videos")
          )

          , React.createElement(TabsContent, { value: "switch-requests", __self: this, __source: {fileName: _jsxFileName, lineNumber: 201}}
            , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 202}}
              , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 203}}
                , React.createElement(CardTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 204}}, "Pending Role Switch Requests"   )
              )
              , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 206}}
                , loading ? React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 207}}, "Loading...") : (
                  React.createElement(Table, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 208}}
                    , React.createElement(TableHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 209}}
                      , React.createElement(TableRow, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 210}}
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 211}}, "Actor")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 212}}, "Email")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 213}}, "Reason")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 214}}, "Date")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 215}}, "Actions")
                      )
                    )
                    , React.createElement(TableBody, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 218}}
                      , switchRequests.filter(req => req.status === 'Pending').map(req => (
                        React.createElement(TableRow, { key: req._id, __self: this, __source: {fileName: _jsxFileName, lineNumber: 220}}
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 221}}, req.actorId.name)
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 222}}, req.actorId.email)
                          , React.createElement(TableCell, { className: "max-w-xs truncate" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 223}}, req.reason)
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 224}}, new Date(req.createdAt).toLocaleDateString())
                          , React.createElement(TableCell, { className: "space-x-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 225}}
                            , React.createElement(Button, { size: "sm", variant: "success", onClick: () => handleRequestUpdate(req._id, 'approve'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 226}}, "Approve")
                            , React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => handleRequestUpdate(req._id, 'reject'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 227}}, "Reject")
                          )
                        )
                      ))
                    )
                  )
                )
              )
            )
          )

          , React.createElement(TabsContent, { value: "users", __self: this, __source: {fileName: _jsxFileName, lineNumber: 238}}
            , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 239}}
              , React.createElement(CardHeader, { className: "flex flex-row items-center justify-between"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 240}}
                , React.createElement(CardTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 241}}, "Users")
                , React.createElement(Button, { size: "sm", onClick: fetchUsers, disabled: loadingUsers, __self: this, __source: {fileName: _jsxFileName, lineNumber: 242}}, "Refresh")
              )
              , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 244}}
                , loadingUsers ? React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 245}}, "Loading...") : (
                  React.createElement(Table, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 246}}
                    , React.createElement(TableHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 247}}
                      , React.createElement(TableRow, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 248}}
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 249}}, "Name")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 250}}, "Email")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 251}}, "Role")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 252}}, "Actions")
                      )
                    )
                    , React.createElement(TableBody, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 255}}
                      , users.map(u => (
                        React.createElement(TableRow, { key: u._id, __self: this, __source: {fileName: _jsxFileName, lineNumber: 257}}
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 258}}, u.name)
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 259}}, u.email)
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 260}}
                            , React.createElement('select', {
                              className: "border rounded px-2 py-1 bg-background"    ,
                              value: u.role,
                              onChange: (e) => handleUserRoleChange(u._id, e.target.value ), __self: this, __source: {fileName: _jsxFileName, lineNumber: 261}}

                              , React.createElement('option', { value: "Actor", __self: this, __source: {fileName: _jsxFileName, lineNumber: 266}}, "Actor")
                              , React.createElement('option', { value: "Producer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 267}}, "Producer")
                              , React.createElement('option', { value: "Admin", __self: this, __source: {fileName: _jsxFileName, lineNumber: 268}}, "Admin")
                            )
                          )
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 271}}
                            , React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => handleDelete('users', u._id), __self: this, __source: {fileName: _jsxFileName, lineNumber: 272}}, "Delete")
                          )
                        )
                      ))
                    )
                  )
                )
              )
            )
          )

          , React.createElement(TabsContent, { value: "casting-calls", __self: this, __source: {fileName: _jsxFileName, lineNumber: 283}}
            , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 284}}
              , React.createElement(CardHeader, { className: "flex flex-row items-center justify-between"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 285}}
                , React.createElement(CardTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 286}}, "Casting Calls" )
                , React.createElement(Button, { size: "sm", onClick: fetchCastingCalls, disabled: loadingCasting, __self: this, __source: {fileName: _jsxFileName, lineNumber: 287}}, "Refresh")
              )
              , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 289}}
                , loadingCasting ? React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 290}}, "Loading...") : (
                  React.createElement(Table, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 291}}
                    , React.createElement(TableHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 292}}
                      , React.createElement(TableRow, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 293}}
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 294}}, "Title")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 295}}, "Producer")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 296}}, "Actions")
                      )
                    )
                    , React.createElement(TableBody, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 299}}
                      , castingCalls.map(c => (
                        React.createElement(TableRow, { key: c._id, __self: this, __source: {fileName: _jsxFileName, lineNumber: 301}}
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 302}}, c.title || c.roleName || '—')
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 303}}, typeof c.producer === 'object' ? _optionalChain([c, 'access', _19 => _19.producer, 'optionalAccess', _20 => _20.name]) : '')
                          , React.createElement(TableCell, { className: "space-x-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 304}}
                            , React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => openDetails(c), __self: this, __source: {fileName: _jsxFileName, lineNumber: 305}}, "View details" )
                            , React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => handleDelete('casting', c._id), __self: this, __source: {fileName: _jsxFileName, lineNumber: 306}}, "Delete")
                          )
                        )
                      ))
                    )
                  )
                )
              )
            )

            /* Details Dialog */
            , React.createElement(Dialog, { open: detailsOpen, onOpenChange: setDetailsOpen, __self: this, __source: {fileName: _jsxFileName, lineNumber: 317}}
              , React.createElement(DialogContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 318}}
                , React.createElement(DialogHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 319}}
                  , React.createElement(DialogTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 320}}, _optionalChain([selectedCasting, 'optionalAccess', _21 => _21.title]) || _optionalChain([selectedCasting, 'optionalAccess', _22 => _22.roleName]) || 'Casting Details')
                  , React.createElement(DialogDescription, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 321}}, "Full casting information"  )
                )
                , selectedCasting && (
                  React.createElement('div', { className: "space-y-2 text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 324}}
                    , selectedCasting.description && (
                      React.createElement('p', { className: "leading-relaxed", __self: this, __source: {fileName: _jsxFileName, lineNumber: 326}}, selectedCasting.description)
                    )
                    , React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 328}}
                      , selectedCasting.location && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 330}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 330}}, "Location:"), " " , selectedCasting.location)
                      )
                      , selectedCasting.ageRange && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 333}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 333}}, "Age Range:" ), " " , selectedCasting.ageRange)
                      )
                      , selectedCasting.auditionDate && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 336}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 336}}, "Audition:"), " " , new Date(selectedCasting.auditionDate).toLocaleDateString())
                      )
                      , selectedCasting.shootingStartDate && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 339}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 339}}, "Shoot Start:" ), " " , new Date(selectedCasting.shootingStartDate).toLocaleDateString())
                      )
                      , selectedCasting.shootingEndDate && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 342}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 342}}, "Shoot End:" ), " " , new Date(selectedCasting.shootingEndDate).toLocaleDateString())
                      )
                    )
                    , _optionalChain([selectedCasting, 'access', _23 => _23.skills, 'optionalAccess', _24 => _24.length]) ? (
                      React.createElement('div', { className: "flex flex-wrap gap-2 pt-1"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 346}}
                        , selectedCasting.skills.map((s) => (
                          React.createElement('span', { key: s, className: "px-2 py-1 rounded-full bg-secondary text-xs"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 348}}, s)
                        ))
                      )
                    ) : null
                    , React.createElement('div', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 352}}, "Producer: "
                       , typeof selectedCasting.producer === 'object' ? _optionalChain([selectedCasting, 'access', _25 => _25.producer, 'optionalAccess', _26 => _26.name]) : '—'
                      , typeof selectedCasting.producer === 'object' && _optionalChain([selectedCasting, 'access', _27 => _27.producer, 'optionalAccess', _28 => _28.email]) ? ` • ${selectedCasting.producer.email}` : ''
                    )
                  )
                )
              )
            )
          )

          , React.createElement(TabsContent, { value: "videos", __self: this, __source: {fileName: _jsxFileName, lineNumber: 362}}
            , React.createElement(Card, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 363}}
              , React.createElement(CardHeader, { className: "flex flex-row items-center justify-between"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 364}}
                , React.createElement(CardTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 365}}, "Videos")
                , React.createElement(Button, { size: "sm", onClick: fetchVideos, disabled: loadingVideos, __self: this, __source: {fileName: _jsxFileName, lineNumber: 366}}, "Refresh")
              )
              , React.createElement(CardContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 368}}
                , loadingVideos ? React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 369}}, "Loading...") : (
                  React.createElement(Table, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 370}}
                    , React.createElement(TableHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 371}}
                      , React.createElement(TableRow, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 372}}
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 373}}, "Title")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 374}}, "Actor")
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 375}}, "Casting Call" )
                        , React.createElement(TableHead, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 376}}, "Actions")
                      )
                    )
                    , React.createElement(TableBody, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 379}}
                      , videos.map(v => (
                        React.createElement(TableRow, { key: v._id, __self: this, __source: {fileName: _jsxFileName, lineNumber: 381}}
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 382}}, v.title || '—')
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 383}}, typeof v.actor === 'object' ? _optionalChain([v, 'access', _29 => _29.actor, 'optionalAccess', _30 => _30.name]) : '')
                          , React.createElement(TableCell, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 384}}, typeof v.castingCall === 'object' ? _optionalChain([(v.castingCall ), 'optionalAccess', _31 => _31.roleName]) || '' : '')
                          , React.createElement(TableCell, { className: "space-x-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 385}}
                            , React.createElement(Button, { size: "sm", variant: "secondary", onClick: () => openVideo(v), __self: this, __source: {fileName: _jsxFileName, lineNumber: 386}}, "View details" )
                            , React.createElement(Button, { size: "sm", variant: "destructive", onClick: () => handleDelete('videos', v._id), __self: this, __source: {fileName: _jsxFileName, lineNumber: 387}}, "Delete")
                          )
                        )
                      ))
                    )
                  )
                )
              )
            )

            /* Video Details Dialog */
            , React.createElement(Dialog, { open: videoOpen, onOpenChange: setVideoOpen, __self: this, __source: {fileName: _jsxFileName, lineNumber: 398}}
              , React.createElement(DialogContent, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 399}}
                , React.createElement(DialogHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 400}}
                  , React.createElement(DialogTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 401}}, _optionalChain([selectedVideo, 'optionalAccess', _32 => _32.title]) || 'Submission Details')
                  , React.createElement(DialogDescription, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 402}}, "Actor submission information"  )
                )
                , selectedVideo && (
                  React.createElement('div', { className: "space-y-3 text-sm" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 405}}
                    , React.createElement('div', { className: "grid grid-cols-1 sm:grid-cols-2 gap-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 406}}
                      , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 407}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 407}}, "Actor:"), " " , typeof selectedVideo.actor === 'object' ? _optionalChain([selectedVideo, 'access', _33 => _33.actor, 'optionalAccess', _34 => _34.name]) : '—')
                      , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 408}}, "Actor Email:" ), " " , typeof selectedVideo.actor === 'object' ? _optionalChain([(selectedVideo.actor ), 'optionalAccess', _35 => _35.email]) || '' : '')
                      , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 409}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 409}}, "Casting Call:" ), " " , typeof selectedVideo.castingCall === 'object' ? _optionalChain([(selectedVideo.castingCall ), 'optionalAccess', _36 => _36.roleName]) || '' : '')
                      , React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 410}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 410}}, "Submitted:"), " " , selectedVideo.createdAt ? new Date(selectedVideo.createdAt).toLocaleString() : '—')
                      , selectedVideo.age !== undefined && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 412}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 412}}, "Age:"), " " , selectedVideo.age)
                      )
                      , selectedVideo.height !== undefined && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 415}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 415}}, "Height:"), " " , selectedVideo.height, " cm" )
                      )
                      , selectedVideo.weight !== undefined && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 418}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 418}}, "Weight:"), " " , selectedVideo.weight, " kg" )
                      )
                      , selectedVideo.skintone && (
                        React.createElement('div', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 421}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 421}}, "Skintone:"), " " , selectedVideo.skintone)
                      )
                    )
                    , selectedVideo.videoUrl && (
                      React.createElement('div', { className: "space-y-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 425}}
                        , React.createElement('video', { src: selectedVideo.videoUrl, controls: true, className: "w-full rounded-md shadow"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 426}} )
                        , React.createElement('div', { className: "flex gap-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 427}}
                          , React.createElement('a', { href: selectedVideo.videoUrl, target: "_blank", rel: "noreferrer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 428}}
                            , React.createElement(Button, { size: "sm", variant: "brand-outline", __self: this, __source: {fileName: _jsxFileName, lineNumber: 429}}, "Open in new tab"   )
                          )
                        )
                      )
                    )
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
