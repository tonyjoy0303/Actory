import React from 'react'
const _jsxFileName = ""; function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";



export default function Messages() {
  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "Hi Alex, thanks for submitting!" },
    { id: 2, from: "me", text: "Thank you! Happy to share another take if needed." },
  ]);
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => { _optionalChain([endRef, 'access', _ => _.current, 'optionalAccess', _2 => _2.scrollIntoView, 'call', _3 => _3({ behavior: "smooth" })]); }, [messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: "me", text: draft.trim() }]);
    setDraft("");
  };

  return (
    React.createElement(React.Fragment, null
      , React.createElement(SEO, { title: "Messages", description: "Chat in real-time with typing indicators and smooth interactions."        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 26}} )
      , React.createElement('section', { className: "container py-8 grid md:grid-cols-3 gap-6"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 27}}
        , React.createElement(Card, { className: "md:col-span-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 28}}
          , React.createElement(CardContent, { className: "p-0", __self: this, __source: {fileName: _jsxFileName, lineNumber: 29}}
            , React.createElement('div', { className: "p-4 border-b font-medium"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 30}}, "Conversations")
            , React.createElement('div', { className: "p-4 space-y-3" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 31}}
              , ["Producer – Indie Drama", "Casting – Action Feature"].map((c) => (
                React.createElement('div', { key: c, className: "p-3 rounded-md bg-secondary cursor-pointer"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 33}}, c)
              ))
            )
          )
        )

        , React.createElement(Card, { className: "md:col-span-2 flex flex-col"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 39}}
          , React.createElement(CardContent, { className: "flex-1 p-4 overflow-y-auto space-y-3"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 40}}
            , messages.map((m) => (
              React.createElement('div', { key: m.id, className: `max-w-[75%] p-3 rounded-lg ${m.from === 'me' ? 'ml-auto bg-brand text-brand-foreground' : 'bg-secondary'}`, __self: this, __source: {fileName: _jsxFileName, lineNumber: 42}}
                , m.text
              )
            ))
            , React.createElement('div', { ref: endRef, __self: this, __source: {fileName: _jsxFileName, lineNumber: 46}} )
          )
          , React.createElement('div', { className: "p-4 border-t flex items-center gap-2"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 48}}
            , React.createElement('input', {
              className: "flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"           ,
              placeholder: "Type a message..."  ,
              value: draft,
              onChange: (e) => setDraft(e.target.value), __self: this, __source: {fileName: _jsxFileName, lineNumber: 49}}
            )
            , React.createElement(Button, { variant: "hero", className: "hover-scale", onClick: send, __self: this, __source: {fileName: _jsxFileName, lineNumber: 55}}, "Send")
          )
          , draft && (
            React.createElement('div', { className: "px-4 pb-3 text-xs text-muted-foreground"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}}, "Producer is typing…"  )
          )
        )
      )
    )
  );
}
