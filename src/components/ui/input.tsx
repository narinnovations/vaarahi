import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        `
        flex
        w-full

        h-11
        sm:h-10

        rounded-xl
        sm:rounded-lg

        border
        border-input

        bg-background

        px-4
        sm:px-3

        text-sm
        sm:text-sm

        shadow-sm

        transition-all
        duration-200

        placeholder:text-muted-foreground

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary/20
        focus-visible:border-primary

        disabled:cursor-not-allowed
        disabled:opacity-50

        file:border-0
        file:bg-transparent
        file:text-sm
        file:font-medium
        file:text-foreground
        `,
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };