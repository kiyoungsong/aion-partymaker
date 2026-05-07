import React, { useEffect, useState, type JSX } from "react";
import { useBossStore } from "../stores";

/**
 * 루드라 파티 메이커 — AION Raid Party Composer
 * React + TypeScript + TailwindCSS
 */

// ---------- Types ----------
export type AttrKey =
  | "궁성"
  | "살성"
  | "검성"
  | "치유성"
  | "수호성"
  | "호법성"
  | "정령성"
  | "마도성";

export interface Character {
  id: string;
  name: string;
  attr: AttrKey;
  cp: number;
}

export interface Player {
  id: string;
  name: string;
  main: Character;
  subs: Character[];
}

export interface PartyChar extends Character {
  isMain: boolean;
  player: string;
  playerId: string;
}

export interface Game {
  idx: number;
  a: PartyChar[];
  b: PartyChar[];
  avgA: number;
  avgB: number;
}

interface AttrToken {
  text: string;
  bg: string;
  border: string;
}

// ---------- Tokens ----------
const ATTRS: Record<AttrKey, AttrToken> = {
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
const ATTR_LIST = Object.keys(ATTRS) as AttrKey[];

// ---------- Helpers ----------
const newId = (): string => "x" + Math.random().toString(36).slice(2, 9);

function parseRow(str: string): { name: string; attr: AttrKey; cp: number } {
  const [name, attr, cp] = str.split("/");
  return { name, attr: attr as AttrKey, cp: Number(cp) };
}

const seedPlayers = (): Player[] => {
  const data: Array<{ name: string; main: string; sub: string[] }> = [
    {
      name: "차정준",
      main: "차정준/궁성/467",
      sub: ["귀유미/치유성/501", "양의지/살성/220", "조수행/수호성/225"],
    },
    {
      name: "천국",
      main: "천국/호법성/545",
      sub: ["빈하/치유성/220", "태빈/수호성/180", "태민/궁성/150"],
    },
    {
      name: "대삭",
      main: "대삭/검성/580",
      sub: ["수삭/정령성/190", "호삭/호법성/180", "대삭부/검성/210"],
    },
    {
      name: "송곳",
      main: "송곳/궁성/520",
      sub: ["맹타/검성/160", "쉬이/궁성/192", "송곳부/궁성/240"],
    },
    {
      name: "단단한민중",
      main: "단단한민중/수호성/400",
      sub: [
        "버프주는민중/호법성/200",
        "활쏘는민중/궁성/280",
        "민중부/마도성/170",
      ],
    },
    {
      name: "정카리",
      main: "정카리/검성/557",
      sub: ["궁카리/궁성/200", "카리뽈/치유성/245", "카리부/호법성/190"],
    },
    {
      name: "살괭이",
      main: "살괭이/살성/530",
      sub: ["르/호법성/153", "살괭이부/궁성/300", "괭이뉴/마도성/180"],
    },
    {
      name: "레잉",
      main: "레잉/검성/470",
      sub: ["귀멸의티모/검성/220", "빙결/마도성/160", "레잉부/호법성/320"],
    },
  ];
  return data.map((p, i) => ({
    id: "p" + i,
    name: p.name,
    main: { id: "m" + i, ...parseRow(p.main) },
    subs: p.sub.map((s, j) => ({ id: `s${i}-${j}`, ...parseRow(s) })),
  }));
};

interface BulkResult {
  players: Player[];
  errors: string[];
}

interface NameAttrCp {
  name: string;
  attr: AttrKey;
  cp: number;
}

function parseBulk(text: string): BulkResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: Player[] = [];
  const errors: string[] = [];
  lines.forEach((line, li) => {
    const segs = line.split(/\s*\/\s*/).filter(Boolean);
    let main: NameAttrCp | undefined = undefined;
    const subs: Array<NameAttrCp> = [];
    segs.forEach((seg) => {
      const m = seg.match(
        /^(.+?)\s*\(\s*([본부])\s*[,\s\uFF0C]\s*(\S+?)\s*[,\s\uFF0C]\s*([\d,]+)\s*\)\s*$/
      );
      if (!m) {
        errors.push(`${li + 1}행: "${seg}" 형식이 올바르지 않습니다`);
        return;
      }
      const [, name, kind, attrRaw, cpRaw] = m;
      const attr = attrRaw.trim() as AttrKey;
      if (!ATTR_LIST.includes(attr))
        errors.push(`${li + 1}행 "${name}": 알 수 없는 속성 "${attr}"`);
      const cp = Number(String(cpRaw).replace(/,/g, "")) || 0;
      const ch = { name: name.trim(), attr, cp };
      if (kind === "본") {
        if (main) subs.push(ch);
        else main = ch;
      } else subs.push(ch);
    });
    if (!main) {
      errors.push(`${li + 1}행: 본캐를 찾지 못했습니다`);
      return;
    }
    const mainChar: NameAttrCp = main;
    out.push({
      id: "p" + Math.random().toString(36).slice(2, 8),
      name: mainChar.name,
      main: { id: newId(), ...mainChar },
      subs: subs.map((s) => ({ id: newId(), ...s })),
    });
  });
  return { players: out, errors };
}

function avatarHueStyle(name: string): React.CSSProperties {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    background: `linear-gradient(135deg, oklch(0.78 0.06 ${hue}), oklch(0.66 0.08 ${(hue + 40) % 360}))`,
  };
}

// ---------- Atoms ----------
const inputBase =
  "h-7 min-w-0 rounded-md bg-[#131A2B] border border-[#1B2238] text-[#E6ECF7] " +
  "px-2.5 text-[13px] outline-none focus:border-[#6F9CFF] focus:bg-[#182037]";

const Pill: React.FC<{
  kind: "본" | "부";
  className?: string;
  children: React.ReactNode;
}> = ({ kind, className = "", children }) => {
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

const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...rest
}) => (
  <button
    {...rest}
    className={`inline-flex items-center gap-1.5 rounded-[9px] border border-[#232C45] bg-[#131A2B] px-3 py-1.5 text-[12.5px] font-medium text-[#9AA6BF]
      transition hover:border-[#2A3454] hover:bg-[#182037] hover:text-[#E6ECF7] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const PrimaryButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center gap-1.5 rounded-[10px] border border-[#5681F0] px-3.5 py-2 text-[13px] font-semibold text-white
      bg-linear-to-b from-[#4F7BE6] to-[#3A60C5]
      shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_18px_-8px_rgba(80,130,240,0.55)]
      transition hover:brightness-110 active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

// ---------- App ----------
export const RudraPage = () => {
  const [players, setPlayers] = useState<Player[]>(seedPlayers);
  const [subCount, setSubCount] = useState<number>(3);
  const [games, setGames] = useState<Game[]>([]);
  const [bulkOpen, setBulkOpen] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  const updatePlayer = (id: string, patch: Partial<Player>): void =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const updateChar = (
    pid: string,
    cid: string,
    patch: Partial<Character>
  ): void =>
    setPlayers((ps) =>
      ps.map((p) => {
        if (p.id !== pid) return p;
        if (p.main.id === cid) return { ...p, main: { ...p.main, ...patch } };
        return {
          ...p,
          subs: p.subs.map((s) => (s.id === cid ? { ...s, ...patch } : s)),
        };
      })
    );

  const addSub = (pid: string): void =>
    setPlayers((ps) =>
      ps.map((p) =>
        p.id === pid
          ? {
              ...p,
              subs: [...p.subs, { id: newId(), name: "", attr: "궁성", cp: 0 }],
            }
          : p
      )
    );

  const delSub = (pid: string, cid: string): void =>
    setPlayers((ps) =>
      ps.map((p) =>
        p.id === pid ? { ...p, subs: p.subs.filter((s) => s.id !== cid) } : p
      )
    );

  const generateParties = (): void => {
    const all: PartyChar[] = [];
    players.forEach((p) => {
      all.push({ ...p.main, isMain: true, player: p.name, playerId: p.id });
      p.subs
        .slice(0, subCount)
        .forEach((s) =>
          all.push({ ...s, isMain: false, player: p.name, playerId: p.id })
        );
    });
    const perParty = 4;
    const perGame = perParty * 2;
    const numGames = Math.max(1, Math.floor(all.length / perGame));
    const pool = [...all].sort((a, b) => (b.cp || 0) - (a.cp || 0));
    const buckets = Array.from({ length: numGames }, () => ({
      a: [] as PartyChar[],
      b: [] as PartyChar[],
      sumA: 0,
      sumB: 0,
    }));
    pool.slice(0, numGames * perGame).forEach((c, idx) => {
      const g = buckets[idx % numGames];
      if (g.a.length >= perParty) {
        g.b.push(c);
        g.sumB += c.cp || 0;
        return;
      }
      if (g.b.length >= perParty) {
        g.a.push(c);
        g.sumA += c.cp || 0;
        return;
      }
      if (g.sumA <= g.sumB) {
        g.a.push(c);
        g.sumA += c.cp || 0;
      } else {
        g.b.push(c);
        g.sumB += c.cp || 0;
      }
    });
    setGames(
      buckets.map((g, i) => ({
        idx: i + 1,
        a: g.a,
        b: g.b,
        avgA: Math.round(g.sumA / Math.max(g.a.length, 1)),
        avgB: Math.round(g.sumB / Math.max(g.b.length, 1)),
      }))
    );
  };

  const applyBulk = (): void => {
    const { players: parsed, errors } = parseBulk(bulkText);
    setBulkErrors(errors);
    if (parsed.length > 0 && errors.length === 0) {
      setPlayers(parsed);
      const maxSubs = parsed.reduce((m, p) => Math.max(m, p.subs.length), 0);
      if (maxSubs > 0) setSubCount(maxSubs);
      setBulkOpen(false);
      setBulkText("");
    }
  };

  const totalChars = players.reduce(
    (n, p) => n + 1 + Math.min(p.subs.length, subCount),
    0
  );

  useEffect(() => {
    const updatedPlayers = () => {
      setPlayers((ps) =>
        ps.map((p) => {
          const currentSubs = p.subs;

          // subCount보다 많으면 자르기
          if (currentSubs.length > subCount) {
            return { ...p, subs: currentSubs.slice(0, subCount) };
          }

          // subCount보다 적으면 빈 슬롯 추가
          if (currentSubs.length < subCount) {
            const toAdd = subCount - currentSubs.length;
            const newSubs = Array.from({ length: toAdd }, () => ({
              id: newId(),
              name: "",
              attr: "궁성" as AttrKey,
              cp: 0,
            }));
            return { ...p, subs: [...currentSubs, ...newSubs] };
          }

          return p;
        })
      );
    };
    updatedPlayers();
  }, [subCount]);

  return (
    <div
      className="min-h-screen bg-[#0A0E1A] text-[#E6ECF7] font-[Pretendard,Inter,system-ui,sans-serif] text-[13.5px] tabular-nums antialiased
      bg-[radial-gradient(1100px_700px_at_80%_-10%,rgba(80,120,220,0.12),transparent_60%),radial-gradient(900px_600px_at_-10%_30%,rgba(60,180,200,0.07),transparent_60%)]"
    >
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 pt-4 pb-20 sm:px-5 lg:gap-[22px] lg:px-7">
        <TopBar
          subCount={subCount}
          setSubCount={setSubCount}
          onGenerate={generateParties}
          onOpenBulk={() => setBulkOpen(true)}
        />
        {bulkOpen && (
          <BulkPanel
            value={bulkText}
            onChange={setBulkText}
            errors={bulkErrors}
            onClose={() => {
              setBulkOpen(false);
              setBulkErrors([]);
            }}
            onApply={applyBulk}
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              subCount={subCount}
              onName={(name) => updatePlayer(p.id, { name })}
              onChar={(cid, patch) => updateChar(p.id, cid, patch)}
              onAddSub={() => addSub(p.id)}
              onDelSub={(cid) => delSub(p.id, cid)}
            />
          ))}
        </div>
        <Results
          games={games}
          totalChars={totalChars}
          numPlayers={players.length}
        />
      </div>
    </div>
  );
};

// ---------- TopBar ----------
interface TopBarProps {
  subCount: number;
  setSubCount: (n: number) => void;
  onGenerate: () => void;
  onOpenBulk: () => void;
}

function TopBar({
  subCount,
  setSubCount,
  onGenerate,
  onOpenBulk,
}: TopBarProps): JSX.Element {
  const { raid } = useBossStore();
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#232C45] px-3 py-3
      bg-linear-to-b from-[rgba(30,40,70,0.55)] to-[rgba(20,28,50,0.4)] backdrop-blur-md sm:gap-6 sm:px-[18px] sm:py-3.5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="grid h-8 w-8 place-items-center rounded-[9px] border border-[#2E3A5C] text-[#9DB5FF] sm:h-[34px] sm:w-[34px]
          bg-linear-to-br from-[#2A3A66] to-[#1B2440]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="9" cy="8" r="3.2" />
            <circle cx="17" cy="9" r="2.4" />
            <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" />
            <path d="M14 18c0-2 2-3.5 4-3.5s4 1.5 4 3.5" />
          </svg>
        </div>
        <h3 className="m-0 text-[15px] font-bold tracking-tight sm:text-[17px]">
          {raid} 공대 메이커
        </h3>
        <span className="hidden border-l border-[#232C45] pl-2.5 font-mono text-[11px] tracking-wider text-[#6B7592] md:inline">
          한 게임당 8캐릭터 · 1파티 4명 + 2파티 4명
        </span>
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
        <label
          className="flex items-center gap-2.5 rounded-[10px] border border-[#232C45] bg-[#131A2B] py-1.5 pl-3 pr-2"
          title="플레이어 한 명당 부캐 슬롯 수"
        >
          <span className="whitespace-nowrap text-[12px] text-[#9AA6BF]">
            부캐 수
          </span>
          <input
            type="number"
            min={0}
            max={8}
            value={subCount}
            onChange={(e) =>
              setSubCount(Math.max(0, Math.min(8, Number(e.target.value) || 0)))
            }
            className="w-12 rounded-[7px] border border-[#1B2238] bg-[#0F1422] px-2 py-1.5 text-center text-[13px] text-[#E6ECF7] outline-none focus:border-[#6F9CFF] sm:w-14"
          />
        </label>
        <GhostButton onClick={onOpenBulk} title="텍스트로 일괄 입력">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          텍스트 입력
        </GhostButton>
        <PrimaryButton onClick={onGenerate}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
          파티 생성
        </PrimaryButton>
      </div>
    </div>
  );
}

// ---------- Bulk panel ----------
interface BulkPanelProps {
  value: string;
  onChange: (s: string) => void;
  errors: string[];
  onClose: () => void;
  onApply: () => void;
}

function BulkPanel({
  value,
  onChange,
  errors,
  onClose,
  onApply,
}: BulkPanelProps): JSX.Element {
  const ph = `차정준(본, 궁성, 467) / 양의지(부, 살성, 225) / 조수행(부, 수호성, 225) / 양석환(부, 호법성, 150)
귀유미(본, 치유성, 501) / 레잉(부, 호법성, 320) / 귀멸의티모(부, 검성, 220) / 쉬이(부, 궁성, 192)
천국(본, 호법성, 545) / 빈하(부, 치유성, 220) / 태빈(부, 수호성, 160) / 태민(부, 궁성, 150)`;
  return (
    <div
      className="flex flex-col gap-2.5 rounded-[14px] border border-[#232C45] px-4 py-3.5
      bg-gradient-to-b from-[rgba(28,36,60,0.7)] to-[rgba(18,24,42,0.7)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-bold">텍스트로 일괄 입력</div>
          <div className="mt-1 text-[11.5px] text-[#9AA6BF]">
            한 줄에 한 명의 플레이어 · 형식:{" "}
            <code className="rounded border border-[#1B2238] bg-[#0F1422] px-1.5 py-px font-mono text-[11px] text-[#E6ECF7]">
              이름(본, 속성, 전투력) / 이름(부, 속성, 전투력) / …
            </code>
          </div>
        </div>
        <GhostButton onClick={onClose} aria-label="닫기">
          <svg width="14" height="14" viewBox="0 0 12 12">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </GhostButton>
      </div>
      <textarea
        rows={9}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        spellCheck={false}
        className="min-h-[140px] w-full resize-y rounded-[9px] border border-[#1B2238] bg-[#0F1422] px-3 py-2.5 font-mono text-[12.5px] leading-7 text-[#E6ECF7] outline-none focus:border-[#6F9CFF] placeholder:text-[#4A5474]"
      />
      {errors.length > 0 && (
        <div className="rounded-lg border border-[rgba(255,90,90,0.22)] bg-[rgba(255,90,90,0.06)] px-3 py-2 text-[11.5px] leading-6 text-[#FFB3B3]">
          {errors.slice(0, 5).map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
          {errors.length > 5 && <div>… 외 {errors.length - 5}건</div>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton onClick={() => onChange(ph)}>예시 채우기</GhostButton>
        <div className="flex-1" />
        <GhostButton onClick={onClose}>취소</GhostButton>
        <PrimaryButton onClick={onApply} disabled={!value.trim()}>
          적용
        </PrimaryButton>
      </div>
    </div>
  );
}

// ---------- Player card ----------
interface PlayerCardProps {
  player: Player;
  subCount: number;
  onName: (name: string) => void;
  onChar: (cid: string, patch: Partial<Character>) => void;
  onAddSub: () => void;
  onDelSub: (cid: string) => void;
}

function PlayerCard({
  player,
  subCount,
  onName,
  onChar,
  onAddSub,
  onDelSub,
}: PlayerCardProps): JSX.Element {
  const initials = (player.name || "?").slice(0, 2);
  const visibleSubs = player.subs;
  const charCount = 1 + Math.min(visibleSubs.length, subCount);
  return (
    <div
      className="relative flex flex-col gap-2.5 rounded-[14px] border border-[#232C45] p-3 sm:p-3.5
      bg-gradient-to-b from-[rgba(28,36,60,0.6)] to-[rgba(18,24,42,0.6)]
      before:pointer-events-none before:absolute before:inset-0 before:rounded-[14px] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    >
      <div className="flex items-center gap-2.5 border-b border-[#1B2238] pb-2.5">
        <div
          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold tracking-tight text-[#0A0E1A]"
          style={avatarHueStyle(player.name)}
        >
          {initials}
        </div>
        <input
          value={player.name}
          onChange={(e) => onName(e.target.value)}
          placeholder="플레이어 이름"
          className="min-w-0 flex-1 rounded-md border border-[#1B2238] bg-[#131A2B] px-2.5 py-1.5 text-[13.5px] font-semibold text-[#E6ECF7] outline-none focus:border-[#6F9CFF] focus:bg-[#182037] sm:text-[14px]"
        />
        <span className="whitespace-nowrap text-[11px] text-[#6B7592]">
          {charCount}캐릭터
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[10.5px] font-semibold tracking-wider text-[#6B7592]">
          본캐
        </div>
        <CharRow
          ch={player.main}
          kind="본"
          onChange={(patch) => onChar(player.main.id, patch)}
        />
      </div>

      {visibleSubs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-[10.5px] font-semibold tracking-wider text-[#6B7592]">
            부캐
          </div>
          <div className="flex flex-col gap-1.5">
            {visibleSubs.map((s) => (
              <CharRow
                key={s.id}
                ch={s}
                kind="부"
                onChange={(patch) => onChar(s.id, patch)}
                onDelete={() => onDelSub(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAddSub}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#232C45] px-3 py-2 text-[12.5px] text-[#9AA6BF]
          transition hover:border-[#6F9CFF] hover:bg-[rgba(80,120,220,0.06)] hover:text-[#E6ECF7]"
      >
        <span className="text-[14px] leading-none">+</span> 부캐 추가
      </button>
    </div>
  );
}

// ---------- Char row ----------
interface CharRowProps {
  ch: Character;
  kind: "본" | "부";
  onChange: (patch: Partial<Character>) => void;
  onDelete?: () => void;
}

function CharRow({ ch, kind, onChange, onDelete }: CharRowProps): JSX.Element {
  return (
    <div
      className="grid items-center gap-1.5"
      style={{ gridTemplateColumns: "30px minmax(0,1fr) 80px 56px 24px" }}
    >
      <Pill kind={kind} className="h-[26px] min-w-[28px] px-1.5 text-[11px]">
        {kind}
      </Pill>
      <input
        value={ch.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="캐릭터 이름"
        className={`${inputBase} w-full`}
      />
      <div className="relative">
        <select
          value={ch.attr}
          onChange={(e) => onChange({ attr: e.target.value as AttrKey })}
          className={`${inputBase} w-full appearance-none pr-5 font-semibold ${ATTRS[ch.attr]?.text || ""}`}
        >
          {ATTR_LIST.map((a) => (
            <option key={a} value={a} className="bg-[#0F1422] text-[#E6ECF7]">
              {a}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B7592]"
          width="10"
          height="10"
          viewBox="0 0 12 12"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>
      <input
        type="number"
        value={ch.cp}
        onChange={(e) => onChange({ cp: Number(e.target.value) || 0 })}
        className={`${inputBase} pr-2 text-right tabular-nums`}
      />
      {onDelete ? (
        <button
          onClick={onDelete}
          aria-label="삭제"
          className="grid h-6 w-6 place-items-center rounded-md border border-transparent text-[#6B7592]
            transition hover:border-[rgba(255,90,90,0.2)] hover:bg-[rgba(255,90,90,0.08)] hover:text-[#FF9A9A]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </button>
      ) : (
        <span className="h-6 w-6" />
      )}
    </div>
  );
}

// ---------- Results ----------
function Results({
  games,
  totalChars,
  numPlayers,
}: {
  games: Game[];
  totalChars: number;
  numPlayers: number;
}): JSX.Element {
  if (games.length === 0) {
    return (
      <section id="results-section" className="mt-6 flex flex-col gap-4">
        <div
          className="rounded-[14px] border border-dashed border-[#232C45] p-9 text-center text-[#9AA6BF]
          bg-gradient-to-b from-[rgba(28,36,60,0.25)] to-[rgba(18,24,42,0.25)]"
        >
          <div className="mb-2 text-[28px] text-[#6B7592]">⚔︎</div>
          <div className="text-[14px] font-semibold text-[#E6ECF7]">
            파티가 아직 생성되지 않았습니다
          </div>
          <div className="mt-1 text-[12.5px]">
            상단의 <b className="font-semibold text-[#E6ECF7]">파티 생성</b>{" "}
            버튼을 눌러 균형 잡힌 파티를 만들어보세요.
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="results-section" className="mt-3.5 flex flex-col gap-[18px]">
      <div className="flex flex-wrap gap-2 px-0.5">
        <Stat n={numPlayers} label="플레이어" />
        <Stat n={games.length} label="게임" />
        <Stat n={totalChars} label="총 캐릭터" />
      </div>
      {games.map((g) => (
        <GameBlock key={g.idx} g={g} />
      ))}
    </section>
  );
}

const Stat: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#232C45] bg-[#131A2B] px-3 py-1.5 text-[12px] text-[#9AA6BF]">
    <b className="text-[13px] font-bold tabular-nums text-[#E6ECF7]">{n}</b>{" "}
    {label}
  </div>
);

function GameBlock({ g }: { g: Game }): JSX.Element {
  const diff = Math.abs(g.avgA - g.avgB);
  const warn = diff > 80;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5 px-1">
        <div className="flex items-center gap-2 text-[14px] font-bold tracking-tight sm:text-[15px]">
          <span className="text-[14px] text-[#5CE3D0]">⚔︎</span>
          <span>{g.idx}번째 게임</span>
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10.5px] font-semibold tabular-nums sm:text-[11px] ${
            warn
              ? "border-[rgba(255,140,140,0.28)] bg-[rgba(255,140,140,0.10)] text-[#FF9A9A]"
              : "border-[rgba(245,195,107,0.28)] bg-[rgba(245,195,107,0.10)] text-[#F5C36B]"
          }`}
        >
          전력차 {diff}
        </span>
        <span className="text-[11px] tabular-nums text-[#9AA6BF] sm:text-[12px]">
          1파티 평균 {g.avgA} · 2파티 평균 {g.avgB}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
        <PartyCard label="1파티" avg={g.avgA} chars={g.a} />
        <PartyCard label="2파티" avg={g.avgB} chars={g.b} />
      </div>
    </div>
  );
}

function PartyCard({
  label,
  avg,
  chars,
}: {
  label: string;
  avg: number;
  chars: PartyChar[];
}): JSX.Element {
  return (
    <div
      className="rounded-[12px] border border-[#232C45] px-3 py-3 sm:px-3.5
      bg-gradient-to-b from-[rgba(24,32,55,0.55)] to-[rgba(16,22,38,0.55)]"
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-[#1B2238] pb-2">
        <span className="text-[13.5px] font-bold">{label}</span>
        <span className="text-[11.5px] tabular-nums text-[#9AA6BF]">
          평균 <b className="text-[13px] font-bold text-[#E6ECF7]">{avg}</b>
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-px p-0">
        {chars.map((c, i) => (
          <CharLine key={i} c={c} />
        ))}
      </ul>
    </div>
  );
}

function CharLine({ c }: { c: PartyChar }): JSX.Element {
  const a = ATTRS[c.attr] || ATTRS["검성"];
  return (
    <li
      className="grid items-center gap-2 rounded-md px-1 py-1.5 text-[12px] transition hover:bg-white/[0.025] sm:text-[12.5px]"
      style={{ gridTemplateColumns: "26px 50px minmax(0,1fr) auto auto" }}
    >
      <Pill
        kind={c.isMain ? "본" : "부"}
        className="h-[21px] min-w-[24px] px-1.5 text-[10.5px]"
      >
        {c.isMain ? "본" : "부"}
      </Pill>
      <span
        className={`inline-grid h-[21px] place-items-center rounded-md border px-2 text-[10.5px] font-bold tracking-tight ${a.text} ${a.bg} ${a.border}`}
      >
        {c.attr}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#E6ECF7]">
        {c.name || "—"}
      </span>
      <span className="hidden pr-1 text-[11px] tabular-nums text-[#6B7592] sm:inline">
        {c.player}
      </span>
      <span className="min-w-[36px] text-right font-mono text-[12px] font-bold tabular-nums text-[#E6ECF7]">
        {c.cp}
      </span>
    </li>
  );
}
