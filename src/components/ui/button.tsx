import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary",
        hero:
          "bg-primary text-primary-foreground rounded-full px-6 py-3 text-base font-semibold hover:bg-primary/90 glow-primary transition-all duration-200",
        heroSecondary:
          "liquid-glass text-foreground rounded-full px-6 py-3 text-base font-normal hover:bg-white/5 transition-all duration-200",
        gradient:
          "text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm rounded-lg",
        sm:      "h-8 px-3 text-sm rounded-md",
        lg:      "h-12 px-6 text-base rounded-xl",
        icon:    "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
