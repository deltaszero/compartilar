"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  rightElement?: React.ReactNode
  containerClassName?: string
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon, rightElement, containerClassName, ...props }, ref) => {
    return (
      <div className={cn(
        "flex h-10 w-full items-center rounded-md border border-input bg-background ring-offset-background",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        containerClassName
      )}>
        {icon && (
          <div className="flex items-center justify-center pl-3">
            {icon}
          </div>
        )}
        <Input 
          className={cn(
            "h-full border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            icon && "pl-2",
            rightElement && "pr-2",
            className
          )} 
          ref={ref} 
          {...props} 
        />
        {rightElement && (
          <div className="flex items-center justify-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
    )
  }
)

InputWithIcon.displayName = "InputWithIcon"

export { InputWithIcon }