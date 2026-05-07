import type { TAttrKey } from "../../types";

// ─── 직업 색상 토큰 ───────────────────────────────────────────
interface AttrToken {
  text: string;
  bg: string;
  border: string;
}

export const ATTRS: Record<TAttrKey, AttrToken> = {
  궁성: {
    text: "text-[#C4A8FF]",
    bg: "bg-[rgba(160,120,255,0.14)]",
    border: "border-[rgba(160,120,255,0.32)]",
  },
  살성: {
    text: "text-[#FF9A9A]",
    bg: "bg-[rgba(255,90,90,0.14)]",
    border: "border-[rgba(255,90,90,0.32)]",
  },
  검성: {
    text: "text-[#C9D1E2]",
    bg: "bg-[rgba(180,195,220,0.10)]",
    border: "border-[rgba(180,195,220,0.24)]",
  },
  치유성: {
    text: "text-[#7FE3A6]",
    bg: "bg-[rgba(80,210,130,0.13)]",
    border: "border-[rgba(80,210,130,0.30)]",
  },
  수호성: {
    text: "text-[#6FE0D0]",
    bg: "bg-[rgba(60,210,200,0.13)]",
    border: "border-[rgba(60,210,200,0.30)]",
  },
  호법성: {
    text: "text-[#86B4FF]",
    bg: "bg-[rgba(90,140,255,0.14)]",
    border: "border-[rgba(90,140,255,0.32)]",
  },
  정령성: {
    text: "text-[#FFA6CD]",
    bg: "bg-[rgba(255,130,190,0.13)]",
    border: "border-[rgba(255,130,190,0.30)]",
  },
  마도성: {
    text: "text-[#F5C36B]",
    bg: "bg-[rgba(230,170,70,0.14)]",
    border: "border-[rgba(230,170,70,0.32)]",
  },
};
