import React from 'react'
const _jsxFileName = "";
import Header from "@/components/Header";
import { NavLink } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    React.createElement('div', { className: "min-h-screen flex flex-col"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 6}}
      , React.createElement(Header, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 7}} )
      , React.createElement('main', { className: "flex-1", __self: this, __source: {fileName: _jsxFileName, lineNumber: 8}}
        , children
      )
      , React.createElement('footer', { className: "border-t", __self: this, __source: {fileName: _jsxFileName, lineNumber: 11}}
        , React.createElement('div', { className: "container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4"         , __self: this, __source: {fileName: _jsxFileName, lineNumber: 12}}
          , React.createElement('p', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 13}}, "© " , new Date().getFullYear(), " Actory. All rights reserved."    )
          , React.createElement('nav', { className: "flex items-center gap-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 14}}
            , React.createElement(NavLink, { to: "/features", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}, "Features")
            , React.createElement(NavLink, { to: "/know-more", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}, "Know More")
            , React.createElement('a', { href: "#pricing", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 16}}, "Pricing")
            , React.createElement('a', { href: "#contact", className: "story-link", __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}}, "Contact")
          )
        )
      )
    )
  );
}
