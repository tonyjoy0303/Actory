import React from 'react'
const _jsxFileName = "";import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    React.createElement(ToastProvider, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 15}}
      , toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          React.createElement(Toast, { key: id, ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 18}}
            , React.createElement('div', { className: "grid gap-1" , __self: this, __source: {fileName: _jsxFileName, lineNumber: 19}}
              , title && React.createElement(ToastTitle, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 20}}, title)
              , description && (
                React.createElement(ToastDescription, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 22}}, description)
              )
            )
            , action
            , React.createElement(ToastClose, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 26}} )
          )
        )
      })
      , React.createElement(ToastViewport, {__self: this, __source: {fileName: _jsxFileName, lineNumber: 30}} )
    )
  )
}
