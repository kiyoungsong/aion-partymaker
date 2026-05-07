import { useEffect, useRef, useState } from "react";
import { useBossStore, useWeightStore } from "../../stores";
import { WeightsModal } from "../modal";

interface RaidEntry {
  id: string;
  label: string;
  sub: string;
}

const RAIDS: RaidEntry[] = [
  { id: "루드라", label: "루드라", sub: "Rudra" },
  // { id: "침식", label: "침식", sub: "Erosion" },
  // { id: "드라칸", label: "드라칸", sub: "Drakan" },
  // { id: "발라우레아", label: "발라우레아", sub: "Balaurea" },
  // { id: "아브헬렌", label: "아브헬렌", sub: "Abrhelen" },
];

export const Header = () => {
  const { raid, setRaid } = useBossStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weightsOpen, setWeightsOpen] = useState(false);
  const { weights, setWeights, resetWeights } = useWeightStore();
  const settingsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (settingsWrapRef.current?.contains(target)) return;
      setSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [settingsOpen]);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[#232C45] backdrop-blur-md
      bg-linear-to-b from-[rgba(16,22,40,0.92)] to-[rgba(10,14,26,0.92)]"
    >
      <div
        className="mx-auto flex h-13 max-w-[1480px] items-center gap-3 px-3 sm:h-14 sm:gap-6 sm:px-5 lg:px-7"
        style={{ height: 56 }}
      >
        <div className="flex items-center gap-2.5 border-r border-[#232C45] pr-3 sm:pr-[18px]">
          <div className="grid h-[34px] w-[34px] place-items-center rounded-[9px] border border-[#2E3A5C] bg-linear-to-br from-[#1B2440] to-[#0F1628]">
            <svg
              width="22"
              height="22"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M16 3 L28 10 V22 L16 29 L4 22 V10 Z"
                stroke="#9DB5FF"
                strokeWidth="1.6"
                fill="rgba(80,120,220,0.12)"
                strokeLinejoin="round"
              />
              <path
                d="M16 9 L22 13 V19 L16 23 L10 19 V13 Z"
                stroke="#5CE3D0"
                strokeWidth="1.4"
                fill="none"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="16" r="1.6" fill="#5CE3D0" />
            </svg>
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <div className="bg-linear-to-br from-[#E6ECF7] to-[#9DB5FF] bg-clip-text text-[15px] font-extrabold tracking-tight text-transparent">
              PartyMaker
            </div>
            <div className="mt-0.5 font-mono text-[10px] tracking-wider text-[#6B7592]">
              AION Raid Composer
            </div>
          </div>
        </div>

        <nav
          className="scrollbar-none flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto overflow-y-hidden"
          role="tablist"
          aria-label="레이드 선택"
        >
          {RAIDS.map((r) => {
            const active = raid === r.id;
            return (
              <button
                key={r.id}
                role="tab"
                aria-selected={active}
                onClick={() => setRaid(r.id)}
                className={`relative flex cursor-pointer flex-col items-start justify-center whitespace-nowrap px-3 leading-tight transition sm:px-4
                  ${active ? "text-[#E6ECF7]" : "text-[#9AA6BF] hover:bg-white/2.5 hover:text-[#E6ECF7]"}`}
              >
                <span className="text-[12.5px] font-bold tracking-tight sm:text-[13.5px]">
                  {r.label}
                </span>
                <span
                  className={`mt-0.5 hidden font-mono text-[9.5px] tracking-wider sm:inline ${active ? "text-[#9DB5FF]" : "text-[#6B7592]"}`}
                >
                  {r.sub}
                </span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-t bg-linear-to-r from-[#6F9CFF] to-[#5CE3D0]" />
                )}
              </button>
            );
          })}
          {/* <button
            aria-label="레이드 추가"
            title="레이드 추가"
            className="my-auto ml-1 grid h-[26px] w-[26px] place-items-center rounded-[7px] border border-dashed border-[#232C45] text-[14px] text-[#6B7592]
              transition hover:border-solid hover:border-[#6F9CFF] hover:bg-[rgba(80,120,220,0.06)] hover:text-[#E6ECF7]"
          >
            +
          </button> */}
        </nav>

        <div
          ref={settingsWrapRef}
          className="hidden sm:flex items-center pl-[18px] border-l border-[#232C45] h-full relative"
        >
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="설정"
            className={`cursor-pointer w-8 h-8 rounded-[8px] border grid place-items-center transition-all duration-[120ms]
                ${
                  settingsOpen
                    ? "text-[#E6ECF7] bg-[#131A2B] border-[#232C45]"
                    : "text-[#9AA6BF] bg-transparent border-transparent hover:text-[#E6ECF7] hover:bg-[#131A2B] hover:border-[#232C45]"
                }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.15.67.4.88.71A1.65 1.65 0 0 0 21 10.6h.09a2 2 0 1 1 0 4H21a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {settingsOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 min-w-[180px] bg-[#131A2B] border border-[#232C45]
                rounded-[10px] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] z-[80] animate-[menuIn_0.12s_ease-out]"
            >
              <button
                onClick={() => {
                  setSettingsOpen(false);
                  setWeightsOpen(true);
                }}
                className=" flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-[7px] bg-transparent border-0
                    text-[#E6ECF7] text-[13px] text-left cursor-pointer transition hover:bg-[#182037]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 6h18M6 12h12M9 18h6" />
                </svg>
                <span>가중치 설정</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {weightsOpen && (
        <WeightsModal
          weights={weights}
          setWeights={setWeights}
          onClose={() => setWeightsOpen(false)}
          onReset={resetWeights}
        />
      )}
    </header>
  );
};
