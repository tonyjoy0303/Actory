import React from 'react'
const _jsxFileName = "";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef


(({ className, children, ...props }, ref) => (
  React.createElement(ScrollAreaPrimitive.Root, {
    ref: ref,
    className: cn("relative overflow-hidden", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}

    , React.createElement(ScrollAreaPrimitive.Viewport, { className: "h-full w-full rounded-[inherit]"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}
      , children
    )
    , React.createElement(ScrollBar, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 18}} )
    , React.createElement(ScrollAreaPrimitive.Corner, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 19}} )
  )
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef


(({ className, orientation = "vertical", ...props }, ref) => (
  React.createElement(ScrollAreaPrimitive.ScrollAreaScrollbar, {
    ref: ref,
    orientation: orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 28}}

    , React.createElement(ScrollAreaPrimitive.ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border"   , __self: this, __source: {fileName: _jsxFileName, lineNumber: 41}} )
  )
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
