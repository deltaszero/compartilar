"use client"

import * as React from "react"

interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ 
          ...style,
          position: 'relative',
          width: '100%',
          paddingBottom: `${100 / ratio}%` 
        }}
        className={className}
        {...props}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          {props.children}
        </div>
      </div>
    )
  }
)

AspectRatio.displayName = "AspectRatio"