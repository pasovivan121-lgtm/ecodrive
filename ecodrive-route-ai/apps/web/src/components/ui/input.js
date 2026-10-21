import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
export const Input = React.forwardRef(({ className, type = 'text', placeholder, ...props }) => {
    return (_jsx("input", { className: cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-50%, disabled:cursor-not-allowed disabled:opacity-50", className), type: type, placeholder: placeholder, ...props }));
});
Input.displayName = 'Input';
