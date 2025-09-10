import React from 'react'
const _jsxFileName = "";import heroImage from "@/assets/hero-cinematic.jpg";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { NavLink } from "react-router-dom";

const Index = () => {
  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, {
        title: "Actory — Auditions & Casting Calls"     ,
        description: "Join Actory to discover casting calls, upload auditions, and connect with producers and casting directors."              , __self: this, __source: {fileName: _jsxFileName, lineNumber: 9}}
      )
      , React.createElement('section', {
        className: "relative min-h-[80vh] flex items-center justify-center overflow-hidden"     ,
        'aria-label': "Hero", __self: this, __source: {fileName: _jsxFileName, lineNumber: 13}}

        , React.createElement('img', {
          src: heroImage,
          alt: "Cinematic stage lights and film set"     ,
          className: "absolute inset-0 h-full w-full object-cover"    ,
          loading: "eager", __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}}
        )
        , React.createElement('div', { className: "absolute inset-0 bg-gradient-to-t from-background/80 via-background/50 to-background/20"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 23}} )
        , React.createElement('div', { className: "relative container text-center py-24"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 24}}
          , React.createElement('h1', { className: "font-display text-4xl md:text-6xl font-semibold tracking-tight animate-enter"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 25}}, "Spotlight Your Talent. Empower Your Casting."

          )
          , React.createElement('p', { className: "mt-4 max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-in"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 28}}, "Actory connects aspiring actors with top producers and casting directors. Discover roles, submit auditions, and get noticed."

          )
          , React.createElement('div', { className: "mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"      , __self: this, __source: {fileName: _jsxFileName, lineNumber: 31}}
            , React.createElement(NavLink, { to: "/auth/register/actor", __self: this, __source: {fileName: _jsxFileName, lineNumber: 32}}
              , React.createElement(Button, { variant: "hero", className: "hover-scale", 'aria-label': "Join as Actor"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 33}}, "Join as Actor"

              )
            )
            , React.createElement(NavLink, { to: "/auth/register/producer", __self: this, __source: {fileName: _jsxFileName, lineNumber: 37}}
              , React.createElement(Button, { variant: "brand-outline", className: "hover-scale", 'aria-label': "Join as Producer"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 38}}, "Join as Producer"

              )
            )
          )
        )
      )

      , React.createElement('section', { id: "features", className: "container py-16" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 46}}
        , React.createElement('div', { className: "grid md:grid-cols-3 gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 47}}
          , [
            {
              title: "Casting Calls",
              desc: "Search roles by type, age, skills, and location.",
            },
            {
              title: "Audition Uploads",
              desc: "Drag-and-drop video submissions with quick preview.",
            },
            {
              title: "Messaging",
              desc: "Collaborate in real-time with typing indicators.",
            },
          ].map((f) => (
            React.createElement('div', { key: f.title, className: "rounded-lg border p-6 bg-card shadow-sm hover:shadow-[var(--shadow-elegant)] transition-shadow"      , __self: this, __source: {fileName: _jsxFileName, lineNumber: 62}}
              , React.createElement('h3', { className: "font-display text-xl" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}, f.title)
              , React.createElement('p', { className: "mt-2 text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}}, f.desc)
            )
          ))
        )
      )
    )
  );
};

export default Index;
