import * as React from "react";
import { cn } from "../../lib/utils";

interface CardProps {
  className?: string;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className,
  children,
  ...rest
}, ref) => {
  return (
    <div
      className={cn("rounded-lg", className)}
      ref={ref}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';