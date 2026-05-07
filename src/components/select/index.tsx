import { cn } from "../../lib/utils";
import { inputBaseStyle } from "../../style";

export const Select = ({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  return <select className={cn(inputBaseStyle, className)} {...props} />;
};
