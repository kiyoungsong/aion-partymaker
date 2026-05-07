export const Pill = ({
  kind,
  className = "",
  children,
}: {
  kind: "본" | "부";
  className?: string;
  children: React.ReactNode;
}) => {
  const cls =
    kind === "본"
      ? "text-[#88AEFF] bg-[rgba(96,140,255,0.14)] border-[rgba(96,140,255,0.32)]"
      : "text-[#C2CADF] bg-[rgba(170,180,210,0.07)] border-[rgba(170,180,210,0.18)]";
  return (
    <span
      className={`inline-grid place-items-center rounded-md border font-bold tracking-wide ${cls} ${className}`}
    >
      {children}
    </span>
  );
};
