import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — clean minimal variants.
 *
 * • default: solid ink (near-black). Strongest CTA.
 * • accent:  indigo. Use for hero primary CTA where ink is too heavy.
 * • outline: bordered white, subtle.
 * • ghost:   transparent, hover tint.
 * • secondary: muted surface.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "btn-gradient",
        accent: "btn-accent",
        outline:
          "border border-border bg-card text-foreground hover:border-foreground/30",
        ghost: "text-foreground hover:bg-muted",
        secondary:
          "bg-muted text-foreground hover:bg-muted/70",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
