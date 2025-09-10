import React from 'react'
const _jsxFileName = "";
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef


(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  React.createElement(PopoverPrimitive.Portal, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 14}}
    , React.createElement(PopoverPrimitive.Content, {
      ref: ref,
      align: align,
      sideOffset: sideOffset,
      className: cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      ),
      ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}
    )
  )
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
