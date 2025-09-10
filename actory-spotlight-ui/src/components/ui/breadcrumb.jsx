import React from 'react'
const _jsxFileName = ""; function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef




(({ ...props }, ref) => React.createElement('nav', { ref: ref, 'aria-label': "breadcrumb", ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 12}} ))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('ol', {
    ref: ref,
    className: cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 19}}
  )
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('li', {
    ref: ref,
    className: cn("inline-flex items-center gap-1.5", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 34}}
  )
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef




(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    React.createElement(Comp, {
      ref: ref,
      className: cn("transition-colors hover:text-foreground", className),
      ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 51}}
    )
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('span', {
    ref: ref,
    role: "link",
    'aria-disabled': "true",
    'aria-current': "page",
    className: cn("font-normal text-foreground", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 64}}
  )
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}) => (
  React.createElement('li', {
    role: "presentation",
    'aria-hidden': "true",
    className: cn("[&>svg]:size-3.5", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 80}}

    , _nullishCoalesce(children, () => ( React.createElement(ChevronRight, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 86}} )))
  )
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}) => (
  React.createElement('span', {
    role: "presentation",
    'aria-hidden': "true",
    className: cn("flex h-9 w-9 items-center justify-center", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 95}}

    , React.createElement(MoreHorizontal, { className: "h-4 w-4" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 101}} )
    , React.createElement('span', { className: "sr-only", __self: this, __source: {fileName: _jsxFileName, lineNumber: 102}}, "More")
  )
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
