import React from 'react'
const _jsxFileName = "";import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    React.createElement(Button, {
      variant: "brand-outline",
      size: "icon",
      'aria-label': "Toggle theme" ,
      onClick: () => setTheme(isDark ? "light" : "dark"),
      className: "hover-scale", __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}

      , isDark ? React.createElement(Sun, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 22}} ) : React.createElement(Moon, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 22}} )
    )
  );
}
