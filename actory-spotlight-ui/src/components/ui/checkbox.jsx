import React from 'react'
const _jsxFileName = "";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(CheckboxPrimitive.Root, {
    ref: ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 11}}

    , React.createElement(CheckboxPrimitive.Indicator, {
      className: cn("flex items-center justify-center text-current"), __self: this, __source: {fileName: _jsxFileName, lineNumber: 19}}

      , React.createElement(Check, { className: "h-4 w-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 22}} )
    )
  )
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
