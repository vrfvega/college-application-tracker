import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "border-white/30 bg-primary/80 backdrop-blur-md text-primary-foreground [a&]:hover:bg-primary/90 shadow-sm",
        secondary:
          "border-white/20 bg-secondary/70 backdrop-blur-md text-secondary-foreground [a&]:hover:bg-secondary/80 shadow-sm",
        destructive:
          "border-red-300/30 bg-destructive/80 backdrop-blur-md text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-sm",
        outline:
          "border-white/30 bg-white/20 backdrop-blur-md text-foreground [a&]:hover:bg-accent/50 [a&]:hover:text-accent-foreground dark:bg-white/5 dark:border-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
