import React from 'react'
const _jsxFileName = "";import { Helmet } from "react-helmet-async";







export default function SEO({ title, description, url }) {
  const fullTitle = `${title} | Actory`;
  return (
    React.createElement(Helmet, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 12}}
      , React.createElement('title', {__self: this, __source: {fileName: _jsxFileName, lineNumber: 13}}, fullTitle)
      , React.createElement('meta', { name: "description", content: description, __self: this, __source: {fileName: _jsxFileName, lineNumber: 14}} )
      , React.createElement('link', { rel: "canonical", href: url || (typeof window !== 'undefined' ? window.location.href : '/') , __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}} )
      , React.createElement('meta', { property: "og:title", content: fullTitle, __self: this, __source: {fileName: _jsxFileName, lineNumber: 16}} )
      , React.createElement('meta', { property: "og:description", content: description, __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}} )
    )
  );
}
