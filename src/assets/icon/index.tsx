import { cn } from "@/lib/utils";

export const CopyIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("stroke-white", className)}
    >
      <rect x="6" y="0" width="14" height="17" rx="2" strokeWidth="1.5" />
      <rect
        x="0"
        y="5"
        width="14"
        height="17"
        rx="2"
        fill="var(--bg)"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const CheckIcon = ({ className }: { className?: string }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("stroke-green-500", className)}
    >
      <path
        d="M2 10 L8 16 L18 4"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
