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
 *   - 치유성은 파티2 우선 배치
 */
import type { Weights } from "../types/party";
import { DEFAULT_WEIGHTS } from "../meta";

// ─── 상수 ─────────────────────────────────────────────────────
export const PARTY_PER_RAID = 2;
const PARTY_SIZE = 4;
const CANDIDATE_COUNT = 30000;

/** 부캐 수 → 공대 수 */
export function getRaidCount(altCount: number): number {
  return altCount + 1;
}

const HEAL_JOBS = new Set(["치유성"]);
const SUPPORT_JOBS = new Set(["호법성", "수호성"]);

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
  parties: PartyGroup[][]; // [raidIndex][partyIndex]
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

// ─── 점수 계산 (낮을수록 좋음) ────────────────────────────────
function scorePlan(parties: PartyGroup[][], weights: Weights): number {
  const all = parties.flat();
  const avgs = all.map((p) =>
    p.members.length === 0
      ? 0
      : p.members.reduce((s, x) => s + x.power, 0) / p.members.length,
  );

  const totalAvg = avgs.reduce((s, x) => s + x, 0) / avgs.length;
  const variance =
    avgs.reduce((s, a) => s + (a - totalAvg) ** 2, 0) / avgs.length;
  const range = Math.max(...avgs) - Math.min(...avgs);

  // 공대 내 파티 간 전력차
  const raidDiff = parties.reduce((s, raid) => {
    const a0 =
      raid[0].members.reduce((a, x) => a + x.power, 0) /
      Math.max(raid[0].members.length, 1);
    const a1 =
      raid[1].members.reduce((a, x) => a + x.power, 0) /
      Math.max(raid[1].members.length, 1);
    return s + Math.abs(a0 - a1);
  }, 0);

  // 파티2에 치유 없으면 페널티
  const healPenalty = parties.reduce((s, raid) => {
    const p2 = raid[1].members;
    if (p2.some((x) => HEAL_JOBS.has(x.job))) return s;
    if (p2.some((x) => SUPPORT_JOBS.has(x.job))) return s + 50_000;
    return s + 500_000;
  }, 0);

  return (
    (variance / 1000) * weights.rules.cpBalance +
    range * 4 * weights.rules.cpBalance +
    raidDiff * 1.4 * weights.rules.raidBalance +
    healPenalty
  );
}

// ─── 후보 1개 빌드 ─────────────────────────────────────────────
function buildCandidate(
  users: OptimizerUser[],
  altCount: number,
  raidCount: number,
  rand: () => number,
): PartyGroup[][] | null {
  const totalChars = users.length * (1 + altCount);
  const charsPerRaid = totalChars / raidCount;

  // 공대당 인원이 파티2개 × PARTY_SIZE로 딱 떨어져야 함
  if (
    !Number.isInteger(charsPerRaid) ||
    charsPerRaid !== PARTY_SIZE * PARTY_PER_RAID
  ) {
    return null;
  }

  // ── 1. 공대별 캐릭터 풀 초기화 ──
  const raidChars: OptimizerChar[][] = Array.from(
    { length: raidCount },
    () => [],
  );
  const userInRaid: Set<number>[] = Array.from(
    { length: raidCount },
    () => new Set(),
  );

  // ── 2. 본캐를 라운드로빈으로 공대에 배정 ──
  const mains = shuffle(
    users.map((u) => u.main),
    rand,
  );
  for (let i = 0; i < mains.length; i++) {
    const raidIdx = i % raidCount;
    raidChars[raidIdx].push(mains[i]);
    userInRaid[raidIdx].add(mains[i].userIndex);
  }

  // ── 3. 부캐를 배정 (본캐와 다른 공대, 인원 적은 공대 우선) ──
  const alts: OptimizerChar[] = [];
  for (const user of users) {
    for (const alt of user.alts.slice(0, altCount)) alts.push(alt);
  }

  for (const alt of shuffle(alts, rand)) {
    const candidates = Array.from({ length: raidCount }, (_, r) => r)
      .filter((r) => !userInRaid[r].has(alt.userIndex))
      .sort((a, b) => raidChars[a].length - raidChars[b].length);

    if (candidates.length === 0) return null;
    raidChars[candidates[0]].push(alt);
    userInRaid[candidates[0]].add(alt.userIndex);
  }

  // ── 4. 공대 인원 수 검증 ──
  for (let r = 0; r < raidCount; r++) {
    if (raidChars[r].length !== charsPerRaid) return null;
  }

  // ── 5. 각 공대를 파티1 / 파티2(4명씩)로 분할 ──
  const parties: PartyGroup[][] = Array.from({ length: raidCount }, (_, r) =>
    Array.from({ length: PARTY_PER_RAID }, (_, p) => ({
      raidIndex: r,
      partyIndex: p,
      members: [] as OptimizerChar[],
    })),
  );

  for (let r = 0; r < raidCount; r++) {
    const chars = raidChars[r];
    const raidMains = shuffle(
      chars.filter((c) => c.isMain),
      rand,
    );
    const raidAlts = chars.filter((c) => !c.isMain);

    // 치유/서포트 본캐 → 파티2 우선
    const mainsP2: OptimizerChar[] = [];
    const mainsP1: OptimizerChar[] = [];
    const maxP2Mains = Math.floor(raidMains.length / 2) + 1;

    for (const m of raidMains) {
      if (
        (HEAL_JOBS.has(m.job) || SUPPORT_JOBS.has(m.job)) &&
        mainsP2.length < maxP2Mains
      ) {
        mainsP2.push(m);
      } else {
        mainsP1.push(m);
      }
    }

    // 각 파티에 본캐 최소 1명 보장
    if (mainsP1.length === 0 && mainsP2.length > 1)
      mainsP1.push(mainsP2.pop()!);
    if (mainsP2.length === 0 && mainsP1.length > 1)
      mainsP2.push(mainsP1.pop()!);
    if (mainsP1.length === 0 || mainsP2.length === 0) return null;

    const p1: OptimizerChar[] = [...mainsP1];
    const p2: OptimizerChar[] = [...mainsP2];

    // 치유 부캐 → 파티2 우선, 나머지 → 빈 쪽 채움
    const sortedAlts = shuffle(raidAlts, rand).sort((a, b) => {
      const score = (c: OptimizerChar) =>
        HEAL_JOBS.has(c.job) ? -2 : SUPPORT_JOBS.has(c.job) ? -1 : 0;
      return score(a) - score(b);
    });

    for (const alt of sortedAlts) {
      if (p2.length < PARTY_SIZE) p2.push(alt);
      else if (p1.length < PARTY_SIZE) p1.push(alt);
    }

    if (p1.length !== PARTY_SIZE || p2.length !== PARTY_SIZE) return null;

    parties[r][0].members = p1;
    parties[r][1].members = p2;
  }

  return parties;
}

// ─── 경고 생성 ────────────────────────────────────────────────
function buildWarnings(parties: PartyGroup[][]): string[] {
  const warns: string[] = [];
  for (let r = 0; r < parties.length; r++) {
    const p2 = parties[r][1].members;
    if (
      !p2.some((x) => HEAL_JOBS.has(x.job)) &&
      !p2.some((x) => SUPPORT_JOBS.has(x.job))
    ) {
      warns.push(`${r + 1}공대 2파티에 치유성/호법성/수호성이 없습니다.`);
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
    const cand = buildCandidate(users, altCountPerParty, raidCount, rand);
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
