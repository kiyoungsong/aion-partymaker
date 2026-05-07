import { cn } from "../../lib/utils";
import { inputBaseStyle } from "../../style";

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cn(inputBaseStyle, className)} {...props} />;
};
