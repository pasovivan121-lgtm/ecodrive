import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
export const Card = React.forwardRef(({ className, ...props }) => {
    return (_jsx("div", { className: cn("rounded-lg border border-border", className), ...props }));
});
Card.displayName = 'Card';
