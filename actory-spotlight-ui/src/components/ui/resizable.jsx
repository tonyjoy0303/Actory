import React from 'react'
const _jsxFileName = "";import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}) => (
  React.createElement(ResizablePrimitive.PanelGroup, {
    className: cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}
  )
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}

) => (
  React.createElement(ResizablePrimitive.PanelResizeHandle, {
    className: cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 28}}

    , withHandle && (
      React.createElement('div', { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border"        , __self: this, __source: {fileName: _jsxFileName, lineNumber: 36}}
        , React.createElement(GripVertical, { className: "h-2.5 w-2.5" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 37}} )
      )
    )
  )
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
