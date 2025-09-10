import React from 'react'
const _jsxFileName = "";
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(SwitchPrimitives.Root, {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref: ref, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}

    , React.createElement(SwitchPrimitives.Thumb, {
      className: cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      ), __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}
    )
  )
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
