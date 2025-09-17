import React from 'react'
const _jsxFileName = ""; function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import API from "@/lib/api";
import recruiterImg from "@/assets/recruiter.jpg";
import actorImg from "@/assets/actor.jpg";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const API_ORIGIN = API.defaults.baseURL.replace(/\/api\/v1$/, "");

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const dashboardPathFor = (role) => {
    if (role === 'Actor') return '/dashboard/actor';
    if (role === 'Producer') return '/dashboard/producer';
    if (role === 'Admin') return '/dashboard/admin';
    return '/';
  };

  // Check for user session on component mount and when storage changes
  useEffect(() => {
    const checkUser = () => {
      const userData = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (token && userData) {
        setUser(JSON.parse(userData));
      } else {
        // If token is missing, treat as logged out and clean up stale data
        if (!token && userData) localStorage.removeItem('user');
        setUser(null);
      }
    };

    checkUser();

    // Listen for custom event to re-check auth state
    window.addEventListener('authChange', checkUser);

    // Cleanup listener
    return () => {
      window.removeEventListener('authChange', checkUser);
    };
  }, []);

  // On initial load or path change, if authenticated and on a public page, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) return;
    const publicPaths = new Set([
      '/',
      '/features',
      '/know-more',
      '/auth/login',
      '/auth/register',
      '/auth/register/actor',
      '/auth/register/producer',
    ]);
    if (publicPaths.has(location.pathname)) {
      navigate(dashboardPathFor(user.role), { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.dispatchEvent(new Event('authChange')); // Notify other components
    navigate("/");
  };

  const onHome = location.pathname === "/";

  const handleRegisterClick = (role) => {
    setRegisterOpen(false);
    if (role === 'Actor') {
      navigate('/auth/register/actor');
    } else if (role === 'Producer') {
      navigate('/auth/register/producer');
    }
  };

  const linkCls = ({ isActive }) =>
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground transition-colors";

  return (
    React.createElement('header', { className: "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"       , __self: this, __source: {fileName: _jsxFileName, lineNumber: 53}}
      , React.createElement('nav', { className: "container h-16 flex items-center justify-between gap-4"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 54}}
        , React.createElement(NavLink, { to: "/", className: "flex items-center gap-2"  , 'aria-label': "Actory home" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 55}}
          , React.createElement(Logo, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 56}} )
        )

        , React.createElement('div', { className: "hidden md:flex items-center gap-6"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 59}}
          , React.createElement(NavLink, { to: "/casting", className: linkCls, end: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 60}}, "Castings")
          , _optionalChain([user, 'optionalAccess', _ => _.role]) === 'Actor' && React.createElement(NavLink, { to: "/dashboard/actor", className: linkCls, end: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}}, "Dashboard")
          , _optionalChain([user, 'optionalAccess', _2 => _2.role]) === 'Producer' && React.createElement(NavLink, { to: "/dashboard/producer", className: linkCls, end: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 62}}, "Dashboard")
          , user && React.createElement(NavLink, { to: "/messages", className: linkCls, end: true, __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}, "Messages")
        )

        , React.createElement('div', { className: "flex items-center gap-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 66}}
          , user ? (
            React.createElement(React.Fragment, null
              /* Profile button at the end for viewing user details */
              , React.createElement(NavLink, { to: `/actor/profile/${_nullishCoalesce(user.id, () => ( ''))}`, className: "hidden sm:inline-flex items-center gap-2" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}
                , _optionalChain([user, 'optionalAccess', _ => _.photo]) ? (
                  React.createElement('img', { src: `${API_ORIGIN}${_optionalChain([user, 'optionalAccess', _2 => _2.photo])}`, alt: "Avatar", className: "w-8 h-8 rounded-full object-cover border" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}} )
                ) : (
                  React.createElement(Button, { variant: "ghost", __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}}, "Profile")
                )
              )
              , React.createElement(Button, { onClick: handleLogout, variant: "hero", __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}}, "Logout")
              , user.role === 'Producer' && (
                React.createElement(NavLink, { to: "/casting/new", __self: this, __source: {fileName: _jsxFileName, lineNumber: 75}}
                  , React.createElement(Button, { variant: "hero", className: "hover-scale", __self: this, __source: {fileName: _jsxFileName, lineNumber: 76}}, "Post Casting" )
                )
              )
            )
          ) : (
            React.createElement(React.Fragment, null
              , React.createElement(NavLink, { to: "/auth/login", className: "hidden sm:inline-block" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}}
                , React.createElement(Button, { variant: "ghost", __self: this, __source: {fileName: _jsxFileName, lineNumber: 83}}, "Log in" )
              )
              , React.createElement(React.Fragment, null
                  , React.createElement(Button, { variant: "hero", className: "hover-scale", onClick: () => setRegisterOpen(true), __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}, "Get Started" )
                  , React.createElement(Dialog, { open: registerOpen, onOpenChange: setRegisterOpen, __self: this, __source: {fileName: _jsxFileName, lineNumber: 87}}
                    , React.createElement(DialogContent, { className: "max-w-5xl p-0 overflow-hidden", __self: this, __source: {fileName: _jsxFileName, lineNumber: 88}}
                      , React.createElement('div', { className: "relative grid grid-cols-2", __self: this, __source: {fileName: _jsxFileName, lineNumber: 89}}
                        , React.createElement('div', { className: "p-10 flex flex-col items-center text-center gap-5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 90}}
                          , React.createElement('div', { className: "h-56 w-80 flex items-center justify-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 91}}
                            , React.createElement('img', { src: actorImg, alt: "Artist", className: "max-h-full max-w-full object-contain", __self: this, __source: {fileName: _jsxFileName, lineNumber: 92}} )
                          )
                          , React.createElement('p', { className: "text-sm text-muted-foreground max-w-xs", __self: this, __source: {fileName: _jsxFileName, lineNumber: 93}}, "Apply for unlimited jobs/auditions posted by top industry recruiters.")
                          , React.createElement('button', { className: "text-xs font-semibold text-primary/80", onClick: () => navigate('/casting'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 94}}, "KNOW MORE")
                          , React.createElement(Button, { variant: "hero", className: "rounded-full px-6 py-6 text-base w-[220px]", onClick: () => handleRegisterClick('Actor'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}, "Register As Artist" )
                        )
                        , React.createElement('div', { className: "p-10 flex flex-col items-center text-center gap-5", __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}
                          , React.createElement('div', { className: "h-56 w-80 flex items-center justify-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 98}}
                            , React.createElement('img', { src: recruiterImg, alt: "Producer", className: "max-h-full max-w-full object-contain", __self: this, __source: {fileName: _jsxFileName, lineNumber: 99}} )
                          )
                          , React.createElement('p', { className: "text-sm text-muted-foreground max-w-xs", __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}, "Search and find the perfect talent for your project.")
                          , React.createElement('button', { className: "text-xs font-semibold text-primary/80", onClick: () => navigate('/casting'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}}, "KNOW MORE")
                          , React.createElement(Button, { variant: "hero", className: "rounded-full px-6 py-6 text-base w-[220px]", onClick: () => handleRegisterClick('Producer'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "Register As Producer" )
                        )
                        , React.createElement('div', { className: "hidden md:block absolute inset-y-0 left-1/2 w-px bg-border" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 103}} )
                      )
                      , React.createElement('div', { className: "px-6 pb-6 text-center text-xs text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 104}}, "Are you a talent agency? ", React.createElement('span', { className: "underline cursor-pointer", onClick: () => navigate('/auth/register/producer'), __self: this, __source: {fileName: _jsxFileName, lineNumber: 104}}, "Click here."))
                    )
                  )
                )
            )
          )
          , React.createElement(ThemeToggle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 110}} )
        )
      )
    )
  );
}
