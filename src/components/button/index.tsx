export const GhostButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-[9px] border border-[#232C45] bg-[#131A2B] px-3 py-1.5 text-[12.5px] font-medium text-[#9AA6BF]
      transition hover:border-[#2A3454] hover:bg-[#182037] hover:text-[#E6ECF7] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-[10px] border border-[#5681F0] px-3.5 py-2 text-[13px] font-semibold text-white
      bg-linear-to-b from-[#4F7BE6] to-[#3A60C5]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_18px_-8px_rgba(80,130,240,0.55)]
      transition hover:brightness-110 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const DangerButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-[9px] border border-[#ff5a5a]/50 text-[#ff5a5a] px-3 py-1.5 text-[12.5px] font-medium
      transition hover:border-[#ff5a5a]/45 hover:bg-[#ff5a5a]/10 hover:text-[#FFB0B0] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);
