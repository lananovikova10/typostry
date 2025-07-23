import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const toolbarButtonVariants = cva(
  "h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--markdown-toolbar-active))]",
  {
    variants: {
      variant: {
        default: "",
        active: "bg-secondary/90 text-[hsl(var(--markdown-toolbar-icon-active))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toolbarButtonVariants> {
  asChild?: boolean
  icon: React.ReactNode
  title?: string
  isActive?: boolean
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ className, variant, asChild = false, icon, title, isActive, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const tooltipContent = title || props["aria-label"] || "Toolbar Button"
    
    // Determine variant based on isActive prop
    const buttonVariant = isActive ? "active" : variant

    // Create class name including active state if provided
    const buttonClassName = cn(
      toolbarButtonVariants({ variant: buttonVariant }), 
      className,
      isActive && "active"
    )

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Comp
              className={buttonClassName}
              ref={ref}
              {...props}
            >
              {icon}
            </Comp>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)
ToolbarButton.displayName = "ToolbarButton"

export { ToolbarButton, toolbarButtonVariants }