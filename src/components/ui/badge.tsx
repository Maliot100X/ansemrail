import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-700 text-zinc-100",
        secondary: "border-transparent bg-zinc-800 text-zinc-300",
        destructive: "border-transparent bg-red-900 text-red-200",
        success: "border-transparent bg-green-900 text-green-200",
        warning: "border-transparent bg-amber-900 text-amber-200",
        outline: "border-zinc-700 text-zinc-300",
        ansem: "border-transparent bg-gradient-to-r from-amber-500/20 to-orange-600/20 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
