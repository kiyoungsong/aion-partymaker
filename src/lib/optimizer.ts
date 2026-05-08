/**
 * optimizer.ts
 * 직업 가중치 기반 N공대 × 2파티 최적화
 *
 * ★ 구조 정의 ★
 *   - 플레이어 8명, 각자 본캐1 + 부캐N개 보유
 *   - 공대 수 = 부캐 수 + 1
 *       부캐 1개 → 16캐릭터 → 2공대
 *       부캐 2개 → 24캐릭터 → 3공대
 *       부캐 3개 → 32캐릭터 → 4공대
 *   - 1공대 = 파티1(4명) + 파티2(4명) = 8캐릭터
 *   - 각 파티에 본캐 최소 1명
 *   - 같은 플레이어 캐릭터는 같은 공대 불가
 *
 * ★ 2파티 배치 우선순위 ★
 *   1. 본캐 (isMain)
 *   2. 치유성
 *   3. 근접 (살성 / 검성 / 호법성)
 *   4. 나머지
 *
 * ★ 전투력 / 가중치 반영 ★
 *   - 유효 전투력 = power × damageWeight(job)
 *   - 부캐 공대 배정: 유효 전투력 합 적은 공대 우선 → 공대 간 균등 분배
 *   - 파티 분할: 같은 우선순위 내에서 유효 전투력 내림차순
 *   - scorePlan: 유효 전투력 + raw 전투력 분산/편차 모두 반영
 *   - 30,000회 후보 중 최저 점수 선택
 */
import type { Weights } from "../types/party";
import { DEFAULT_WEIGHTS } from "../meta";

// ─── 상수 ─────────────────────────────────────────────────────
export const PARTY_PER_RAID = 2;
const PARTY_SIZE = 4;
const CANDIDATE_COUNT = 30000;

export function getRaidCount(altCount: number): number {
  return altCount + 1;
}

const HEAL_JOBS = new Set(["치유성"]);
const MELEE_JOBS = new Set(["살성", "검성", "호법성"]);

// ─── 타입 ─────────────────────────────────────────────────────
export interface OptimizerChar {
  userIndex: number;
  charIndex: number;
  name: string;
  job: string;
  power: number;
  isMain: boolean;
  uniqueKey: string;
}

export interface OptimizerUser {
  userIndex: number;
  main: OptimizerChar;
  alts: OptimizerChar[];
}

export interface PartyGroup {
  raidIndex: number;
  partyIndex: number;
  members: OptimizerChar[];
}

export interface PartyPlan {
  parties: PartyGroup[][];
  warnings: string[];
}

// ─── Seeded PRNG (Mulberry32) ──────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── 유효 전투력 (전투력 × 직업 가중치) ──────────────────────
function effectivePower(c: OptimizerChar, weights: Weights): number {
  const w = weights.damage[c.job as keyof Weights["damage"]] ?? 0.7;
  return c.power * w;
}

// ─── 2파티 배치 우선순위 (낮을수록 2파티 우선) ───────────────
function p2Priority(c: OptimizerChar): number {
  if (c.isMain) return 0;
  if (HEAL_JOBS.has(c.job)) return 1;
  if (MELEE_JOBS.has(c.job)) return 2;
  return 3;
}

// ─── 전체 플랜 점수 (낮을수록 좋음) ──────────────────────────
/**
 * 유효 전투력(가중치 적용) + raw 전투력(실제 체감) 모두 반영
 * - epAvg  : 딜기여도 기준 균등화
 * - rawAvg : 실제 전투력 수치 기준 균등화 (치유/호법 포함 체감)
 * - raidDiff : 같은 공대 내 파티 간 전력차 최소화
 * - healPenalty : 파티2에 치유/근접 없으면 페널티
 */
function scorePlan(parties: PartyGroup[][], weights: Weights): number {
  const all = parties.flat();

  const partyAvg = (members: OptimizerChar[], useEP: boolean) =>
    members.length === 0
      ? 0
      : members.reduce(
          (s, x) => s + (useEP ? effectivePower(x, weights) : x.power),
          0,
        ) / members.length;

  // 유효 전투력 기준 분산 / 편차
  const epAvgs = all.map((p) => partyAvg(p.members, true));
  const epMean = epAvgs.reduce((s, x) => s + x, 0) / epAvgs.length;
  const epVariance =
    epAvgs.reduce((s, a) => s + (a - epMean) ** 2, 0) / epAvgs.length;
  const epRange = Math.max(...epAvgs) - Math.min(...epAvgs);

  // raw 전투력 기준 분산 / 편차 (가중치 낮은 직업 포함 실제 체감 균형)
  const rawAvgs = all.map((p) => partyAvg(p.members, false));
  const rawMean = rawAvgs.reduce((s, x) => s + x, 0) / rawAvgs.length;
  const rawVariance =
    rawAvgs.reduce((s, a) => s + (a - rawMean) ** 2, 0) / rawAvgs.length;
  const rawRange = Math.max(...rawAvgs) - Math.min(...rawAvgs);

  // 공대 내 파티 간 유효 전투력 차이
  const raidDiff = parties.reduce((s, raid) => {
    return (
      s +
      Math.abs(
        partyAvg(raid[0].members, true) - partyAvg(raid[1].members, true),
      )
    );
  }, 0);

  // 파티2에 치유 없으면 페널티
  const healPenalty = parties.reduce((s, raid) => {
    const p2 = raid[1].members;
    if (p2.some((x) => HEAL_JOBS.has(x.job))) return s;
    if (p2.some((x) => MELEE_JOBS.has(x.job))) return s + 50_000;
    return s + 500_000;
  }, 0);

  return (
    // 유효 전투력 균형 (가중치 반영 딜 기여도)
    (epVariance / 1000) * weights.rules.cpBalance +
    epRange * 3 * weights.rules.cpBalance +
    // raw 전투력 균형 (실제 체감 전투력)
    (rawVariance / 2000) * weights.rules.cpBalance +
    rawRange * 1.5 * weights.rules.cpBalance +
    // 공대 내 파티 균형
    raidDiff * 1.4 * weights.rules.raidBalance +
    healPenalty
  );
}

// ─── 파티 분할 ────────────────────────────────────────────────
/**
 * 우선순위 정렬 후 p2 먼저 채움
 * 같은 우선순위 내에서는 유효 전투력 내림차순 → 강한 캐릭터가 p2 우선
 * 마지막에 각 파티 본캐 최소 1명 스왑 보장
 */
function splitIntoParties(
  chars: OptimizerChar[],
  weights: Weights,
  rand: () => number,
): [OptimizerChar[], OptimizerChar[]] | null {
  const p1: OptimizerChar[] = [];
  const p2: OptimizerChar[] = [];

  const sorted = shuffle(chars, rand).sort((a, b) => {
    const pd = p2Priority(a) - p2Priority(b);
    if (pd !== 0) return pd;
    // 같은 우선순위면 유효 전투력 강한 캐릭터 먼저 p2
    return effectivePower(b, weights) - effectivePower(a, weights);
  });

  for (const c of sorted) {
    if (p2.length < PARTY_SIZE) p2.push(c);
    else p1.push(c);
  }

  if (p1.length !== PARTY_SIZE || p2.length !== PARTY_SIZE) return null;

  // 각 파티에 본캐 최소 1명 보장 (스왑)
  if (!p1.some((c) => c.isMain)) {
    const fromP2 = p2.findIndex((c) => c.isMain);
    const toP1 = p1.findIndex((c) => !c.isMain);
    if (fromP2 === -1 || toP1 === -1) return null;
    [p1[toP1], p2[fromP2]] = [p2[fromP2], p1[toP1]];
  }
  if (!p2.some((c) => c.isMain)) {
    const fromP1 = p1.findIndex((c) => c.isMain);
    const toP2 = p2.findIndex((c) => !c.isMain);
    if (fromP1 === -1 || toP2 === -1) return null;
    [p2[toP2], p1[fromP1]] = [p1[fromP1], p2[toP2]];
  }

  return [p1, p2];
}

// ─── 후보 1개 빌드 ─────────────────────────────────────────────
function buildCandidate(
  users: OptimizerUser[],
  altCount: number,
  raidCount: number,
  weights: Weights,
  rand: () => number,
): PartyGroup[][] | null {
  const totalChars = users.length * (1 + altCount);
  const charsPerRaid = totalChars / raidCount;

  if (
    !Number.isInteger(charsPerRaid) ||
    charsPerRaid !== PARTY_SIZE * PARTY_PER_RAID
  ) {
    return null;
  }

  const raidChars: OptimizerChar[][] = Array.from(
    { length: raidCount },
    () => [],
  );
  const userInRaid: Set<number>[] = Array.from(
    { length: raidCount },
    () => new Set(),
  );

  // ── 본캐 라운드로빈 배정 ──
  const mains = shuffle(users.map((u) => u.main), rand);
  for (let i = 0; i < mains.length; i++) {
    const r = i % raidCount;
    raidChars[r].push(mains[i]);
    userInRaid[r].add(mains[i].userIndex);
  }

  // ── 부캐 배정: 강한 부캐부터 유효 전투력 합 적은 공대 우선 ──
  const alts: OptimizerChar[] = [];
  for (const user of users) {
    for (const alt of user.alts.slice(0, altCount)) alts.push(alt);
  }

  const sortedAlts = shuffle(alts, rand).sort(
    (a, b) => effectivePower(b, weights) - effectivePower(a, weights),
  );

  for (const alt of sortedAlts) {
    const epSum = (r: number) =>
      raidChars[r].reduce((s, x) => s + effectivePower(x, weights), 0);

    const candidates = Array.from({ length: raidCount }, (_, r) => r)
      .filter((r) => !userInRaid[r].has(alt.userIndex))
      .sort((a, b) => epSum(a) - epSum(b));

    if (candidates.length === 0) return null;
    raidChars[candidates[0]].push(alt);
    userInRaid[candidates[0]].add(alt.userIndex);
  }

  // ── 인원 검증 ──
  for (let r = 0; r < raidCount; r++) {
    if (raidChars[r].length !== charsPerRaid) return null;
  }

  // ── 파티 분할 ──
  const parties: PartyGroup[][] = Array.from({ length: raidCount }, (_, r) =>
    Array.from({ length: PARTY_PER_RAID }, (_, p) => ({
      raidIndex: r,
      partyIndex: p,
      members: [] as OptimizerChar[],
    })),
  );

  for (let r = 0; r < raidCount; r++) {
    const result = splitIntoParties(raidChars[r], weights, rand);
    if (!result) return null;
    parties[r][0].members = result[0];
    parties[r][1].members = result[1];
  }

  return parties;
}

// ─── 경고 생성 ────────────────────────────────────────────────
function buildWarnings(parties: PartyGroup[][]): string[] {
  const warns: string[] = [];
  for (let r = 0; r < parties.length; r++) {
    const p2 = parties[r][1].members;
    if (!p2.some((x) => HEAL_JOBS.has(x.job))) {
      if (p2.some((x) => MELEE_JOBS.has(x.job))) {
        warns.push(
          `${r + 1}공대 2파티에 치유성이 없어 근접(살성/검성/호법성)으로 대체됩니다.`,
        );
      } else {
        warns.push(`${r + 1}공대 2파티에 치유성/근접 계열이 없습니다.`);
      }
    }
  }
  return warns;
}

// ─── 메인 엔트리 ──────────────────────────────────────────────
export function buildBestPlan(
  users: OptimizerUser[],
  altCountPerParty: number = 2,
  weights: Weights = DEFAULT_WEIGHTS,
): PartyPlan {
  const raidCount = getRaidCount(altCountPerParty);
  const rand = makePrng(20260507);
  let best: PartyGroup[][] | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const cand = buildCandidate(
      users,
      altCountPerParty,
      raidCount,
      weights,
      rand,
    );
    if (!cand) continue;
    const sc = scorePlan(cand, weights);
    if (sc < bestScore) {
      bestScore = sc;
      best = cand;
    }
  }

  if (!best) {
    throw new Error(
      `파티 편성 실패: 유효한 플랜을 찾지 못했습니다.\n` +
        `(플레이어 ${users.length}명, 부캐 ${altCountPerParty}개, ${raidCount}공대)`,
    );
  }

  return { parties: best, warnings: buildWarnings(best) };
}
