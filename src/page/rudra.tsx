import { useCallback, useEffect, useState, type JSX } from "react";
import { useBossStore, usePlayerDraftStore, useWeightStore } from "../stores";
import {
  buildBestPlan,
  type OptimizerChar,
  type PartyGroup,
  type PartyPlan,
} from "../lib/optimizer";
import { parseUsers } from "../lib/parser";
import { DangerButton, GhostButton, PrimaryButton } from "../components/button";
import type { ICharDraft, IPlayerDraft, TAttrKey } from "../types";
import { PlayerCard } from "../components/card";
import { BulkPanel } from "../components/text";
import { Pill } from "../components/pill";
import { ATTRS } from "../types/party";
import { CheckIcon, CopyIcon } from "@/assets/icon";
// ─── UI 데이터 타입 ───────────────────────────────────────────

// ─── 유틸 ────────────────────────────────────────────────────
const uid = () => "x" + Math.random().toString(36).slice(2, 9);

function makeEmptyChar(kind: "본" | "부"): ICharDraft {
  return { id: uid(), name: "", kind, job: "궁성", power: "" };
}

/** PlayerDraft[] → 텍스트 (복사용) */
function draftsToText(players: IPlayerDraft[]): string {
  return players
    .map((p) =>
      p.chars
        .filter((c) => c.name.trim())
        .map((c) => `${c.name.trim()}(${c.kind}, ${c.job}, ${c.power || 0})`)
        .join(" / "),
    )
    .filter(Boolean)
    .join("\n");
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export const RudraPage = () => {
  const { weights } = useWeightStore();
  const { players, setPlayers, altCount, setAltCount, resetPlayers } =
    usePlayerDraftStore();
  const [plan, setPlan] = useState<PartyPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);

  // altCount가 바뀌면 각 플레이어의 부캐 슬롯 수 조정
  useEffect(() => {
    const initPlayers = () => {
      setPlayers((ps) =>
        ps.map((p) => {
          const main =
            p.chars.find((c) => c.kind === "본") ?? makeEmptyChar("본");
          const alts = p.chars.filter((c) => c.kind === "부");
          if (alts.length === altCount) return p;
          if (alts.length > altCount)
            return { ...p, chars: [main, ...alts.slice(0, altCount)] };
          const toAdd = altCount - alts.length;
          return {
            ...p,
            chars: [
              main,
              ...alts,
              ...Array.from({ length: toAdd }, () => makeEmptyChar("부")),
            ],
          };
        }),
      );
    };
    initPlayers();
  }, [altCount, setPlayers]);

  const updateChar = useCallback(
    (pid: string, cid: string, patch: Partial<ICharDraft>) => {
      setPlayers((ps) =>
        ps.map((p) =>
          p.id !== pid
            ? p
            : {
                ...p,
                chars: p.chars.map((c) =>
                  c.id === cid ? { ...c, ...patch } : c,
                ),
              },
        ),
      );
    },
    [setPlayers],
  );

  const addAlt = useCallback(
    (pid: string) => {
      setPlayers((ps) =>
        ps.map((p) =>
          p.id === pid ? { ...p, chars: [...p.chars, makeEmptyChar("부")] } : p,
        ),
      );
    },
    [setPlayers],
  );

  const removeChar = useCallback(
    (pid: string, cid: string) => {
      setPlayers((ps) =>
        ps.map((p) =>
          p.id !== pid
            ? p
            : { ...p, chars: p.chars.filter((c) => c.id !== cid) },
        ),
      );
    },
    [setPlayers],
  );

  // ── 파티 생성 ──
  const generate = useCallback(() => {
    const hasEmptyField = players.some((p) =>
      p.chars.some((c) => !c.name.trim() || !String(c.power).trim()),
    );
    if (hasEmptyField) {
      window.alert("빈값이 있습니다. 캐릭터명과 전투력을 모두 입력해주세요.");
      return;
    }

    setError(null);
    setGenerating(true);

    // setTimeout으로 렌더 후 무거운 연산 실행
    setTimeout(() => {
      try {
        const text = draftsToText(players);
        const { users, errors } = parseUsers(text, altCount);
        if (errors.length > 0) throw new Error(errors.join("\n"));
        console.log("가중치 체크", weights);
        const result = buildBestPlan(users, altCount, weights);
        setPlan(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setGenerating(false);
      }
    }, 20);
  }, [players, altCount, weights]);

  // ── 텍스트 일괄 적용 ──
  const applyBulk = useCallback(() => {
    const { users, errors } = parseUsers(bulkText, altCount);
    setBulkErrors(errors);
    if (errors.length > 0 || users.length === 0) return;

    setPlayers(
      users.map((u) => ({
        id: uid(),
        chars: [
          {
            id: uid(),
            name: u.main.name,
            kind: "본",
            job: u.main.job as TAttrKey,
            power: String(u.main.power),
          },
          ...u.alts.map((a) => ({
            id: uid(),
            name: a.name,
            kind: "부" as const,
            job: a.job as TAttrKey,
            power: String(a.power),
          })),
        ],
      })),
    );
    setBulkOpen(false);
    setBulkText("");
    setBulkErrors([]);
  }, [bulkText, altCount, setPlayers]);

  const handleReset = () => {
    resetPlayers();
  };

  const clearPlayer = (id: string) => {
    setPlayers((ps) =>
      ps.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              chars: p.chars.map((c) => ({
                ...c,
                name: "",
                power: "",
                job: "궁성",
              })),
            },
      ),
    );
  };

  return (
    <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-3 pt-4 pb-20 sm:px-5 lg:gap-[22px] lg:px-7">
      <TopBar
        altCount={altCount}
        setAltCount={setAltCount}
        onGenerate={generate}
        generating={generating}
        onOpenBulk={() => setBulkOpen(true)}
        onReset={handleReset}
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

      {error && (
        <div className="rounded-[10px] border border-[rgba(255,90,90,0.3)] bg-[rgba(255,90,90,0.08)] px-4 py-3 text-[12.5px] leading-6 text-[#FFB3B3] whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* 플레이어 카드 그리드 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {players.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            altCount={altCount}
            onCharChange={(cid, patch) => updateChar(p.id, cid, patch)}
            onAddAlt={() => addAlt(p.id)}
            onRemoveChar={(cid) => removeChar(p.id, cid)}
            onClear={() => clearPlayer(p.id)}
          />
        ))}
      </div>

      {/* 결과 */}
      <ResultSection plan={plan} generating={generating} />
    </div>
  );
};

// ─── TopBar ──────────────────────────────────────────────────
interface TopBarProps {
  altCount: number;
  setAltCount: (n: number) => void;
  onGenerate: () => void;
  generating: boolean;
  onOpenBulk: () => void;
  onReset: () => void;
}

function TopBar({
  altCount,
  setAltCount,
  onGenerate,
  generating,
  onOpenBulk,
  onReset,
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
      </div>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-2.5">
        <label className="flex items-center gap-2.5 rounded-[10px] border border-[#232C45] bg-[#131A2B] py-1.5 pl-3 pr-2">
          <span className="whitespace-nowrap text-[12px] text-[#9AA6BF]">
            부캐 수
          </span>
          <select
            value={altCount}
            onChange={(e) => setAltCount(Number(e.target.value))}
            className="w-14 rounded-[7px] border border-[#1B2238] bg-[#0F1422] px-2 py-1.5 text-center text-[13px] text-[#E6ECF7] outline-none focus:border-[#6F9CFF]"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n}명
              </option>
            ))}
          </select>
        </label>
        <GhostButton onClick={onOpenBulk}>
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
        <DangerButton onClick={onReset} title="모든 데이터 초기화">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
          전체 초기화
        </DangerButton>
        <PrimaryButton onClick={onGenerate} disabled={generating}>
          {generating ? (
            <>
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              편성 중…
            </>
          ) : (
            <>
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
            </>
          )}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── ResultSection ───────────────────────────────────────────
function ResultSection({
  plan,
  generating,
}: {
  plan: PartyPlan | null;
  generating: boolean;
}): JSX.Element {
  if (generating) {
    return (
      <section className="mt-6">
        <div
          className="rounded-[14px] border border-dashed border-[#232C45] p-9 text-center text-[#9AA6BF]
          bg-linear-to-b from-[rgba(28,36,60,0.25)] to-[rgba(18,24,42,0.25)]"
        >
          <div className="mb-2 animate-spin text-[28px] text-[#6B7592]">⚙</div>
          <div className="text-[14px] font-semibold text-[#E6ECF7]">
            35,000개 후보 최적화 중…
          </div>
          <div className="mt-1 text-[12.5px]">
            직업 가중치 기반 파티 편성 계산 중입니다.
          </div>
        </div>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="mt-6">
        <div
          className="rounded-[14px] border border-dashed border-[#232C45] p-9 text-center text-[#9AA6BF]
          bg-linear-to-b from-[rgba(28,36,60,0.25)] to-[rgba(18,24,42,0.25)]"
        >
          <div className="mb-2 text-[28px] text-[#6B7592]">⚔︎</div>
          <div className="text-[14px] font-semibold text-[#E6ECF7]">
            파티가 아직 생성되지 않았습니다
          </div>
          <div className="mt-1 text-[12.5px]">
            상단의 <b className="font-semibold text-[#E6ECF7]">파티 생성</b>{" "}
            버튼을 눌러 최적 파티를 만들어보세요.
          </div>
        </div>
      </section>
    );
  }

  // 모든 파티 평균 수집
  const allAvgs = plan.parties
    .flat()
    .map(
      (p) =>
        p.members.reduce((s, x) => s + x.power, 0) /
        Math.max(p.members.length, 1),
    );
  const overallAvg = Math.round(
    allAvgs.reduce((s, x) => s + x, 0) / allAvgs.length,
  );
  const maxAvg = Math.round(Math.max(...allAvgs));
  const minAvg = Math.round(Math.min(...allAvgs));

  // 공대 수는 plan.parties.length 기준 (동적)
  const raidCount = plan.parties.length;

  return (
    <section className="mt-3.5 flex flex-col gap-[18px]">
      {/* 경고 */}
      {plan.warnings.length > 0 && (
        <div className="rounded-[10px] border border-[rgba(245,195,107,0.3)] bg-[rgba(245,195,107,0.08)] px-4 py-3 text-[12.5px] leading-6 text-[#F5C36B]">
          {plan.warnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* 통계 */}
      <div className="flex flex-wrap gap-2 px-0.5">
        {[
          { label: "전체 평균", val: overallAvg.toLocaleString() },
          { label: "최고 파티 평균", val: maxAvg.toLocaleString() },
          { label: "최저 파티 평균", val: minAvg.toLocaleString() },
          { label: "최대 편차", val: (maxAvg - minAvg).toLocaleString() },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="inline-flex items-baseline gap-1.5 rounded-lg border border-[#232C45] bg-[#131A2B] px-3 py-1.5 text-[12px] text-[#9AA6BF]"
          >
            <b className="text-[13px] font-bold tabular-nums text-[#E6ECF7]">
              {val}
            </b>{" "}
            {label}
          </div>
        ))}
      </div>

      {/* 공대별 출력 — plan.parties.length 기준으로 동적 렌더 */}
      {Array.from({ length: raidCount }, (_, r) => (
        <RaidBlock key={r} raidIndex={r} parties={plan.parties[r]} />
      ))}
    </section>
  );
}

// ─── RaidBlock ────────────────────────────────────────────────
function RaidBlock({
  raidIndex,
  parties,
}: {
  raidIndex: number;
  parties: ReturnType<typeof buildBestPlan>["parties"][number];
}): JSX.Element {
  const avg = (members: OptimizerChar[]) =>
    members.length
      ? Math.round(members.reduce((s, x) => s + x.power, 0) / members.length)
      : 0;
  const diff = Math.abs(avg(parties[0].members) - avg(parties[1].members));
  const warn = diff > 80_000;
  const [isCopied, setIsCopied] = useState(false);

  const formatPartiesForClipboard = (parties: PartyGroup[]): string => {
    // raidIndex 기준으로 그룹핑
    const raids = parties.reduce(
      (acc, party) => {
        if (!acc[party.raidIndex]) acc[party.raidIndex] = [];
        acc[party.raidIndex].push(party);
        return acc;
      },
      {} as Record<number, PartyGroup[]>,
    );

    return Object.entries(raids)
      .map(([raidIndex, raidParties]) => {
        const raidText = `${Number(raidIndex) + 1}공대`;

        const partiesText = raidParties
          .map((party) => {
            const partyText = `${party.partyIndex + 1}파티`;

            const main = party.members.find((m) => m.isMain);
            const subs = party.members.filter((m) => !m.isMain);

            const mainText = main ? `본 - ${main.name} (${main.job})` : "";
            const subText = subs.length
              ? `부 - ${subs.map((m) => `${m.name} (${m.job})`).join(" / ")}`
              : "";

            return [partyText, mainText, subText].filter(Boolean).join("\n");
          })
          .join("\n\n");

        return `${raidText}\n${partiesText}`;
      })
      .join("\n\n");
  };

  const handleCopy = () => {
    const text = formatPartiesForClipboard(parties);
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2.5 px-1">
        <div className="flex items-center gap-2 text-[14px] font-bold tracking-tight sm:text-[15px]">
          <span className="text-[14px] text-[#5CE3D0]">⚔︎</span>
          <span>{raidIndex + 1}공대</span>
        </div>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10.5px] font-semibold tabular-nums sm:text-[11px] ${
            warn
              ? "border-[rgba(255,140,140,0.28)] bg-[rgba(255,140,140,0.10)] text-[#FF9A9A]"
              : "border-[rgba(245,195,107,0.28)] bg-[rgba(245,195,107,0.10)] text-[#F5C36B]"
          }`}
        >
          전력차 {diff.toLocaleString()}
        </span>
        <span className="text-[11px] tabular-nums text-[#9AA6BF] sm:text-[12px]">
          1파티 평균 {avg(parties[0].members).toLocaleString()} · 2파티 평균{" "}
          {avg(parties[1].members).toLocaleString()}
        </span>
        <button
          onClick={handleCopy}
          className="relative w-5 h-5 cursor-pointer group"
        >
          {/* Copy 아이콘 */}
          <span
            className="absolute inset-0 flex items-center justify-center transition-all duration-200"
            style={{
              opacity: isCopied ? 0 : 1,
              transform: isCopied ? "scale(0.5)" : "scale(1)",
            }}
          >
            <CopyIcon className="stroke-white group-hover:stroke-white/60 transition-colors duration-200" />
          </span>

          {/* Check 아이콘 */}
          <span
            className="absolute inset-0 flex items-center justify-center transition-all duration-200"
            style={{
              opacity: isCopied ? 1 : 0,
              transform: isCopied ? "scale(1)" : "scale(0.5)",
            }}
          >
            <CheckIcon />
          </span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5">
        {parties.map((party, pi) => (
          <PartyCard
            key={pi}
            label={`${pi + 1}파티`}
            avg={avg(party.members)}
            members={party.members}
          />
        ))}
      </div>
    </div>
  );
}

// ─── PartyCard ────────────────────────────────────────────────
function PartyCard({
  label,
  avg,
  members,
}: {
  label: string;
  avg: number;
  members: OptimizerChar[];
}): JSX.Element {
  return (
    <div
      className="rounded-[12px] border border-[#232C45] px-3 py-3 sm:px-3.5
      bg-linear-to-b from-[rgba(24,32,55,0.55)] to-[rgba(16,22,38,0.55)]"
    >
      <div className="mb-1.5 flex items-center justify-between border-b border-[#1B2238] pb-2">
        <span className="text-[13.5px] font-bold">{label}</span>
        <span className="text-[11.5px] tabular-nums text-[#9AA6BF]">
          평균{" "}
          <b className="text-[13px] font-bold text-[#E6ECF7]">
            {avg.toLocaleString()}
          </b>
        </span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-px p-0">
        {members.map((m, i) => (
          <MemberLine key={i} m={m} />
        ))}
      </ul>
    </div>
  );
}

// ─── MemberLine ───────────────────────────────────────────────
function MemberLine({ m }: { m: OptimizerChar }): JSX.Element {
  const a = ATTRS[m.job as TAttrKey] ?? ATTRS["검성"];

  return (
    <li
      className="grid items-center gap-2 rounded-md px-1 py-1.5 text-[12px] transition hover:bg-white/2.5 sm:text-[12.5px]"
      style={{ gridTemplateColumns: "26px 50px minmax(0,1fr) auto" }}
    >
      <Pill
        kind={m.isMain ? "본" : "부"}
        className="h-[21px] min-w-[24px] px-1.5 text-[10.5px]"
      >
        {m.isMain ? "본" : "부"}
      </Pill>
      <span
        className={`inline-grid h-[21px] place-items-center rounded-md border px-2 text-[10.5px] font-bold tracking-tight`}
        style={{ color: a.fg, background: a.bg, borderColor: a.bd }}
      >
        {m.job}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#E6ECF7]">
        {m.name || "—"}
      </span>
      <span className="min-w-[48px] text-right font-mono text-[12px] font-bold tabular-nums text-[#E6ECF7]">
        {m.power.toLocaleString()}
      </span>
    </li>
  );
}
