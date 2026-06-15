import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-100 text-zinc-900",
        secondary: "border-transparent bg-zinc-200 text-zinc-800",
        outline: "border-zinc-300 bg-white text-zinc-900",
        success: "border-transparent bg-emerald-100 text-emerald-900",
        warn: "border-transparent bg-amber-100 text-amber-900",
        danger: "border-transparent bg-red-100 text-red-900",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
