import React from 'react'
const _jsxFileName = "";
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef


(({ className, containerClassName, ...props }, ref) => (
  React.createElement(OTPInput, {
    ref: ref,
    containerClassName: cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    ),
    className: cn("disabled:cursor-not-allowed", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 11}}
  )
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', { ref: ref, className: cn("flex items-center", className), ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 27}} )
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef


(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    React.createElement('div', {
      ref: ref,
      className: cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      ),
      ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 39}}

      , char
      , hasFakeCaret && (
        React.createElement('div', { className: "pointer-events-none absolute inset-0 flex items-center justify-center"     , __self: this, __source: {fileName: _jsxFileName, lineNumber: 50}}
          , React.createElement('div', { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000"    , __self: this, __source: {fileName: _jsxFileName, lineNumber: 51}} )
        )
      )
    )
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef


(({ ...props }, ref) => (
  React.createElement('div', { ref: ref, role: "separator", ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 63}}
    , React.createElement(Dot, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 64}} )
  )
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
