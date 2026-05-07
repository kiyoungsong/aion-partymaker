// ─── PlayerCard ───────────────────────────────────────────────

import type { IPlayerCardProps } from "../../types";
import { CharRow } from "./row";

export const PlayerCard = ({
  player,
  onCharChange,
  onAddAlt,
  onRemoveChar,
  onClear,
}: IPlayerCardProps) => {
  const mainChar = player.chars.find((c) => c.kind === "본");
  const alts = player.chars.filter((c) => c.kind === "부");
  const playerName = mainChar?.name || "?";
  const initials = playerName.slice(0, 2);

  return (
    <div
      className="relative flex flex-col gap-2.5 rounded-[14px] border border-[#232C45] p-3 sm:p-3.5
      bg-linear-to-b from-[rgba(28,36,60,0.6)] to-[rgba(18,24,42,0.6)]
      before:pointer-events-none before:absolute before:inset-0 before:rounded-[14px] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 border-b border-[#1B2238] pb-2.5">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold tracking-tight text-[#0A0E1A]"
          style={avatarHueStyle(playerName)}
        >
          {initials}
        </div>
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-[#E6ECF7] truncate">
          {playerName === "?" ? "—" : playerName}
        </span>
        <span className="whitespace-nowrap text-[11px] text-[#6B7592]">
          {player.chars.length}캐릭터
        </span>
        <button
          className="inline-flex items-center justify-center w-[26px] h-[26px] ml-[6px] bg-transparent border border-[#232C45] rounded-[7px] cursor-pointer transition-all ease-in-out  hover:text-[#FF9A9A] hover:border-[rgba(255,90,90,0.45)] hover:bg-[rgba(255,90,90,0.10)]"
          onClick={onClear}
          title="카드 데이터 초기화"
          aria-label="카드 초기화"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>

      {/* 본캐 */}
      {mainChar && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-semibold tracking-wider text-[#6B7592]">
            본캐
          </div>
          <CharRow
            ch={mainChar}
            onChange={(patch) => onCharChange(mainChar.id, patch)}
          />
        </div>
      )}

      {/* 부캐 */}
      {alts.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-semibold tracking-wider text-[#6B7592]">
            부캐
          </div>
          <div className="flex flex-col gap-1.5">
            {alts.map((c) => (
              <CharRow
                key={c.id}
                ch={c}
                onChange={(patch) => onCharChange(c.id, patch)}
                onDelete={() => onRemoveChar(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAddAlt}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#232C45] px-3 py-2 text-[12.5px] text-[#9AA6BF]
          transition hover:border-[#6F9CFF] hover:bg-[rgba(80,120,220,0.06)] hover:text-[#E6ECF7]"
      >
        <span className="text-[14px] leading-none">+</span> 부캐 추가
      </button>
    </div>
  );
};

function avatarHueStyle(name: string): React.CSSProperties {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return {
    background: `linear-gradient(135deg, oklch(0.78 0.06 ${h % 360}), oklch(0.66 0.08 ${(h + 40) % 360}))`,
  };
}
