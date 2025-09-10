import React from 'react'
const _jsxFileName = "";import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    React.createElement('div', { className: "min-h-screen flex items-center justify-center bg-background"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 16}}
      , React.createElement('div', { className: "text-center", __self: this, __source: {fileName: _jsxFileName, lineNumber: 17}}
        , React.createElement('h1', { className: "font-display text-6xl font-semibold mb-2"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}, "404")
        , React.createElement('p', { className: "text-lg text-muted-foreground mb-6"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 19}}, "Oops! Page not found"   )
        , React.createElement('a', { href: "/", __self: this, __source: {fileName: _jsxFileName, lineNumber: 20}}
          , React.createElement(Button, { variant: "hero", className: "hover-scale", __self: this, __source: {fileName: _jsxFileName, lineNumber: 21}}, "Return Home" )
        )
      )
    )
  );
};

export default NotFound;
