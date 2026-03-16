import React from 'react'
const _jsxFileName = "";

import { cn } from "@/lib/utils"




const Textarea = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      React.createElement('textarea', {
        className: cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background/90 px-3 py-2 text-sm ring-offset-background transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        ),
        ref: ref,
        ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 11}}
      )
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
