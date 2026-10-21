import * as React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.ComponentProps<'input'> {
  type?: string;
  placeholder?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className, type = 'text', placeholder, ...rest } = props;

  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-50%, disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      type={type}
      placeholder={placeholder}
      {...rest}
    />
  );
});

Input.displayName = 'Input';