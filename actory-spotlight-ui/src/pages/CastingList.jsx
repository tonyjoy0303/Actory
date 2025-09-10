import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "@/lib/api";














export default function CastingList() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [castings, setCastings] = useState([]);

  useEffect(() => {
    const fetchCastings = async () => {
      try {
        const { data } = await API.get("/casting");
        setCastings(data.data);
      } catch (err) {
        console.error("Failed to fetch casting calls", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCastings();
  }, []);

  const filtered = useMemo(
    () =>
      castings.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.roleName.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q))
        );
      }),
    [castings, query]
  );

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Casting Calls" , description: "Browse real casting calls posted by producers and view full details."          , __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}} )
      , React.createElement('section', { className: "container py-8" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 59}}
        , React.createElement('div', { className: "relative max-w-2xl mx-auto"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 60}}
          , React.createElement(Input, {
            placeholder: "Search by role, location, skill..."    ,
            value: query,
            onChange: (e) => setQuery(e.target.value),
            'aria-autocomplete': "list", __self: this, __source: {fileName: _jsxFileName, lineNumber: 61}}
          )
        )

        , loading ? (
          React.createElement('p', { className: "mt-10 text-center" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 70}}, "Loading castings..." )
        ) : (
          React.createElement('div', { className: "mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 72}}
            , filtered.map((c) => (
              React.createElement(Card, { key: c._id, className: "hover:shadow-[var(--shadow-elegant)] transition-shadow" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 74}}
                , React.createElement(CardHeader, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 75}}
                  , React.createElement(CardTitle, { className: "font-display text-xl" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 76}}, c.roleName)
                  , React.createElement('p', { className: "text-sm text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 77}}, "Location: " , c.location)
                )
                , React.createElement(CardContent, { className: "space-y-3", __self: this, __source: {fileName: _jsxFileName, lineNumber: 79}}
                  , React.createElement('p', { className: "text-sm leading-relaxed" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 80}}, c.description)

                  , React.createElement('div', { className: "text-sm grid grid-cols-2 gap-y-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}}
                    , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 83}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 83}}, "Age Range:" ), " " , c.ageRange)
                    , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 84}}, "Audition:"), " " , new Date(c.auditionDate).toLocaleDateString())
                    , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 85}}, "Shoot Start:" ), " " , new Date(c.shootingStartDate).toLocaleDateString())
                    , React.createElement('span', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}, React.createElement('span', { className: "text-muted-foreground", __self: this, __source: {fileName: _jsxFileName, lineNumber: 86}}, "Shoot End:" ), " " , new Date(c.shootingEndDate).toLocaleDateString())
                  )

                  , React.createElement('div', { className: "flex flex-wrap gap-2"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 89}}
                    , c.skills.map((s) => (
                      React.createElement('span', { key: s, className: "px-2 py-1 rounded-full bg-secondary text-xs"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 91}}, s)
                    ))
                  )

                  , React.createElement('div', { className: "text-xs text-muted-foreground" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}, "Posted by: "
                      , typeof c.producer === 'object' ? _optionalChain([c, 'access', _ => _.producer, 'optionalAccess', _2 => _2.name]) : 'Unknown'
                    , typeof c.producer === 'object' && _optionalChain([c, 'access', _3 => _3.producer, 'optionalAccess', _4 => _4.email]) ? ` • ${c.producer.email}` : ''
                  )

                  , React.createElement(Button, {
                    variant: "brand-outline",
                    className: "mt-3",
                    onClick: () => navigate(`/audition/submit/${c._id}`), __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}
, "Apply / Submit Audition"

                  )
                )
              )
            ))
            , !filtered.length && (
              React.createElement('p', { className: "col-span-full text-center text-muted-foreground"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 111}}, "No casting calls match your search."     )
            )
          )
        )
      )
    )
  );
}
