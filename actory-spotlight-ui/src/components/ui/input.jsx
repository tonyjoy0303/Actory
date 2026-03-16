import React from 'react'
const _jsxFileName = "";

import { cn } from "@/lib/utils"

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return (
      React.createElement('input', {
        type: type,
        className: cn(
          "flex h-10 w-full rounded-md border border-input bg-background/90 px-3 py-2 text-base ring-offset-background transition-[border-color,box-shadow,background-color] duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref: ref,
        ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 8}}
      )
    )
  }
)
Input.displayName = "Input"

export { Input }
