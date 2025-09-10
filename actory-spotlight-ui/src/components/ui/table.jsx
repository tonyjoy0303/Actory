import React from 'react'
const _jsxFileName = "";

import { cn } from "@/lib/utils"

const Table = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('div', { className: "relative w-full overflow-auto"  , __self: this, __source: {fileName: _jsxFileName, lineNumber: 9}}
    , React.createElement('table', {
      ref: ref,
      className: cn("w-full caption-bottom text-sm", className),
      ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 10}}
    )
  )
))
Table.displayName = "Table"

const TableHeader = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('thead', { ref: ref, className: cn("[&_tr]:border-b", className), ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 23}} )
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('tbody', {
    ref: ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 31}}
  )
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('tfoot', {
    ref: ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 43}}
  )
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('tr', {
    ref: ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 58}}
  )
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('th', {
    ref: ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 73}}
  )
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('td', {
    ref: ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 88}}
  )
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef


(({ className, ...props }, ref) => (
  React.createElement('caption', {
    ref: ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props, __self: this, __source: {fileName: _jsxFileName, lineNumber: 100}}
  )
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
