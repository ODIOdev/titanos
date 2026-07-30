import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-heading text-sm font-semibold uppercase tracking-wide transition-[color,background-color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-titan-yellow focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-titan-yellow text-dark-charcoal hover:bg-[#e0b400]",
        secondary:
          "bg-dark-charcoal text-white hover:bg-near-black",
        outline:
          "border border-border-gray bg-white text-dark-charcoal hover:border-dark-charcoal hover:bg-light-gray",
        outlineInverse:
          "border border-white/45 bg-transparent text-white hover:border-white hover:bg-white/10",
        ghost:
          "bg-transparent text-dark-charcoal hover:bg-light-gray",
        danger:
          "bg-red-700 text-white hover:bg-red-800",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
