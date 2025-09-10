import React from 'react'
const _jsxFileName = "";
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(TabsPrimitive.List, {
    ref: ref,
    className: cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 12}}
  )
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(TabsPrimitive.Trigger, {
    ref: ref,
    className: cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 27}}
  )
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(TabsPrimitive.Content, {
    ref: ref,
    className: cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 42}}
  )
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
