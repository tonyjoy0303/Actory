import React from 'react'
const _jsxFileName = "";

import { cn } from "@/lib/utils"

const Card = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', {
    ref: ref,
    className: cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 9}}
  )
))
Card.displayName = "Card"

const CardHeader = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', {
    ref: ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 24}}
  )
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('h3', {
    ref: ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 36}}
  )
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('p', {
    ref: ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 51}}
  )
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', { ref: ref, className: cn("p-6 pt-0", className), ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}} )
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', {
    ref: ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 71}}
  )
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
