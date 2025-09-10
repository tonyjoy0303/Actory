import React from 'react'
const _jsxFileName = "";
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}) => (
  React.createElement(DrawerPrimitive.Root, {
    shouldScaleBackground: shouldScaleBackground,
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}
  )
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(DrawerPrimitive.Overlay, {
    ref: ref,
    className: cn("fixed inset-0 z-50 bg-black/80", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 27}}
  )
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef


(({ className, children, ...props }, ref) => (
  React.createElement(DrawerPortal, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 39}}
    , React.createElement(DrawerOverlay, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 40}} )
    , React.createElement(DrawerPrimitive.Content, {
      ref: ref,
      className: cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      ),
      ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 41}}

      , React.createElement('div', { className: "mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 49}} )
      , children
    )
  )
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}) => (
  React.createElement('div', {
    className: cn("grid gap-1.5 p-4 text-center sm:text-left", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 60}}
  )
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}) => (
  React.createElement('div', {
    className: cn("mt-auto flex flex-col gap-2 p-4", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
  )
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(DrawerPrimitive.Title, {
    ref: ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 82}}
  )
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement(DrawerPrimitive.Description, {
    ref: ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 97}}
  )
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
