/**
 * Button - Versatile button component with variant support and child composition
 * 
 * Provides a flexible button component built on Radix UI Slot and class-variance-authority
 * for consistent styling variants. Supports composition pattern with asChild prop and
 * forwarded refs for proper DOM integration.
 * 
 * Design Patterns Applied:
 * - Slot Pattern: Uses Radix Slot for component composition and polymorphic behavior
 * - Variant Pattern: CVA-based styling system for consistent button appearances
 * - Forwarded Ref Pattern: Proper ref forwarding for DOM access and integration
 * - Composition Pattern: asChild prop allows rendering as different elements
 */

import { Slot } from '@radix-ui/react-slot'
import { type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

import { buttonVariants } from './button-variants'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
