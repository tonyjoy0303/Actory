import React from 'react'
const _jsxFileName = "";
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef


(({ className, value, ...props }, ref) => (
  React.createElement(ProgressPrimitive.Root, {
    ref: ref,
    className: cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}

    , React.createElement(ProgressPrimitive.Indicator, {
      className: "h-full w-full flex-1 bg-primary transition-all"    ,
      style: { transform: `translateX(-${100 - (value || 0)}%)` }, __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}
    )
  )
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
