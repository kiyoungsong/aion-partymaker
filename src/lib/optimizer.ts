/**
 * optimizer.ts
 * C# PartyOptimizer → TypeScript 이식
 * 직업 가중치 기반 4공대 × 2파티 최적화
 */
import type { Weights } from "../types/party";
import { DEFAULT_WEIGHTS } from "../meta";

// ─── 상수 ─────────────────────────────────────────────────────
export const RAID_COUNT = 4;
export const PARTY_PER_RAID = 2;
const CANDIDATE_COUNT = 35000;

/** 2파티 메인으로 선호되는 직업 */
const PARTY2_PREFERRED_JOBS = new Set(["검성", "수호성", "호법성", "살성"]);

/** 치유성/호법성이 메인일 때 딜러 알트 조합에 보상을 주는 직업 */
const SPECIAL_MAIN_JOBS = new Set(["치유성", "호법성"]);

function getDamageWeight(job: string, weights: Weights): number {
  return weights.damage[job as keyof Weights["damage"]] ?? 0.7;
}

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

function shuffle<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/** C# Choose<T> — nCk 조합 열거 */
function* choose<T>(values: T[], k: number): Generator<T[]> {
  if (k < 0 || k > values.length) return;
  const idxs = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idxs.map((i) => values[i]);
    let i = k - 1;
    while (i >= 0 && idxs[i] === i + values.length - k) i--;
    if (i < 0) return;
    idxs[i]++;
    for (let j = i + 1; j < k; j++) idxs[j] = idxs[j - 1] + 1;
  }
}

// ─── 페널티 / 보상 함수 ────────────────────────────────────────
function supportPenalty(members: OptimizerChar[], weights: Weights): number {
  if (members.some((x) => x.job === "치유성")) return 0;
  if (members.some((x) => x.job === "호법성"))
    return 5_000 * weights.rules.party2Chanter;
  return 5_000_000 * weights.rules.party2Healer;
}

function specialMainStrongAltReward(
  members: OptimizerChar[],
  weights: Weights,
): number {
  const main = members.find((x) => x.isMain);
  if (!main || !SPECIAL_MAIN_JOBS.has(main.job)) return 0;
  const alts = members.filter((x) => !x.isMain);
  const weighted = alts.reduce(
    (s, x) => s + x.power * getDamageWeight(x.job, weights),
    0,
  );
  const lowPenalty = alts.reduce(
    (s, x) => s + (1 - getDamageWeight(x.job, weights)) * x.power * 0.04,
    0,
  );
  return (-weighted * 0.2 + lowPenalty) * weights.rules.specialMainBoost;
}

// ─── 공대 내 알트 분할 점수 ────────────────────────────────────
function scoreRaidSplit(
  p1base: OptimizerChar[],
  p2base: OptimizerChar[],
  p1alts: OptimizerChar[],
  p2alts: OptimizerChar[],
  weights: Weights,
): number {
  const p1 = [...p1base, ...p1alts];
  const p2 = [...p2base, ...p2alts];
  const avg = (arr: OptimizerChar[]) =>
    arr.reduce((s, x) => s + x.power, 0) / arr.length;
  let score = Math.abs(avg(p1) - avg(p2)) * 2.2 * weights.rules.cpBalance;
  score += supportPenalty(p2, weights) / 50;
  score += specialMainStrongAltReward(p1, weights);
  score += specialMainStrongAltReward(p2, weights);
  return score;
}

// ─── 전체 플랜 점수 ────────────────────────────────────────────
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
  const raidDiff = parties.reduce(
    (s, raid) =>
      s +
      Math.abs(
        raid[0].members.reduce((a, x) => a + x.power, 0) /
          Math.max(raid[0].members.length, 1) -
          raid[1].members.reduce((a, x) => a + x.power, 0) /
            Math.max(raid[1].members.length, 1),
      ),
    0,
  );
  const suppPenalty = parties
    .flatMap((r) => r)
    .filter((p) => p.partyIndex === 1)
    .reduce((s, p) => s + supportPenalty(p.members, weights), 0);
  const p2MainPenalty = parties.reduce((s, raid) => {
    const m = raid[1].members.find((x) => x.isMain);
    return (
      s +
      (m && !PARTY2_PREFERRED_JOBS.has(m.job)
        ? 200000000 * weights.rules.party2MainPref
        : 0)
    );
  }, 0);
  const specialReward = parties
    .flat()
    .reduce((s, p) => s + specialMainStrongAltReward(p.members, weights), 0);
  const dupPenalty = constraintPenalty(parties, all, weights);

  return (
    (variance / 1_000) * weights.rules.cpBalance +
    range * 4 * weights.rules.cpBalance +
    raidDiff * 1.4 * weights.rules.raidBalance +
    suppPenalty +
    p2MainPenalty +
    specialReward +
    dupPenalty
  );
}

function constraintPenalty(
  parties: PartyGroup[][],
  allMembers: PartyGroup[],
  weights: Weights,
): number {
  let penalty = 0;
  const duplicatePenaltyWeight = weights.rules.duplicateUserPenalty;
  const altCount = parties[0][0].members.length - 1; // partySize - 1 main
  const partySize = altCount + 1;

  for (const raid of parties) {
    const raidMembers = raid.flatMap((p) => p.members);
    const uniqueUsers = new Set(raidMembers.map((x) => x.userIndex)).size;
    penalty +=
      Math.max(0, raidMembers.length - uniqueUsers) *
      10_000_000 *
      duplicatePenaltyWeight;
  }

  const flat = allMembers.flatMap((p) => p.members);
  const uniqueKeys = new Set(flat.map((x) => x.uniqueKey)).size;
  penalty +=
    Math.max(0, flat.length - uniqueKeys) * 10_000_000 * duplicatePenaltyWeight;

  for (const party of allMembers) {
    penalty += Math.abs(partySize - party.members.length) * 10_000_000;
    penalty +=
      Math.abs(1 - party.members.filter((x) => x.isMain).length) * 10_000_000;
  }

  return penalty;
}

// ─── 후보 1개 빌드 ─────────────────────────────────────────────
function buildCandidate(
  users: OptimizerUser[],
  altCountPerParty: number,
  iteration: number,
  rand: () => number,
  weights: Weights,
): PartyGroup[][] | null {
  const raidAltCap = PARTY_PER_RAID * altCountPerParty;

  // 빈 파티 구조 초기화
  const parties: PartyGroup[][] = Array.from({ length: RAID_COUNT }, (_, r) =>
    Array.from({ length: PARTY_PER_RAID }, (_, p) => ({
      raidIndex: r,
      partyIndex: p,
      members: [] as OptimizerChar[],
    })),
  );
  const raidAltPool: OptimizerChar[][] = Array.from(
    { length: RAID_COUNT },
    () => [],
  );
  const raidUserSets: Set<number>[] = Array.from(
    { length: RAID_COUNT },
    () => new Set(),
  );
  const mainRaidByUser: number[] = new Array(users.length).fill(-1);

  // ── 메인 배정 ──
  const userIdxs = users.map((_, i) => i);
  shuffle(userIdxs, rand);

  const p2Slots = Array.from({ length: RAID_COUNT }, (_, r) => ({
    raidIdx: r,
    partyIdx: 1,
  }));
  shuffle(p2Slots, rand);

  const preferred = userIdxs.filter((i) =>
    PARTY2_PREFERRED_JOBS.has(users[i].main.job),
  );
  shuffle(preferred, rand);

  const assigned = new Set<number>();
  // preferred를 2파티에 먼저 배정
  for (let i = 0; i < preferred.length && i < RAID_COUNT; i++) {
    const ui = preferred[i];
    parties[i][1].members.push(users[ui].main); // 무조건 partyIndex=1
    mainRaidByUser[ui] = i;
    raidUserSets[i].add(ui);
    assigned.add(ui);
  }

  // 남은 슬롯에 남은 유저 배정
  const remSlots: { raidIdx: number; partyIdx: number }[] = [];
  for (let r = 0; r < RAID_COUNT; r++)
    for (let p = 0; p < PARTY_PER_RAID; p++)
      if (parties[r][p].members.length === 0)
        remSlots.push({ raidIdx: r, partyIdx: p });
  shuffle(remSlots, rand);

  let remUsers = userIdxs.filter((i) => !assigned.has(i));
  if (iteration % 5 === 0) {
    remUsers = [...remUsers].sort(
      (a, b) => users[b].main.power - users[a].main.power,
    );
  }

  for (let i = 0; i < remUsers.length; i++) {
    const ui = remUsers[i];
    const slot = remSlots[i];
    parties[slot.raidIdx][slot.partyIdx].members.push(users[ui].main);
    mainRaidByUser[ui] = slot.raidIdx;
    raidUserSets[slot.raidIdx].add(ui);
  }

  // ── 알트 공대 배정 ──
  for (const user of users) {
    const alts = [...user.alts]
      .sort((a, b) => b.power - a.power)
      .slice(0, altCountPerParty);
    if (iteration % 3 !== 0) shuffle(alts, rand);

    for (const alt of alts) {
      const candidates = Array.from({ length: RAID_COUNT }, (_, r) => r)
        .filter(
          (r) =>
            r !== mainRaidByUser[user.userIndex] &&
            !raidUserSets[r].has(user.userIndex) &&
            raidAltPool[r].length < raidAltCap,
        )
        .sort((a, b) => {
          const sa = raidAltPool[a].reduce((s, x) => s + x.power, 0);
          const sb = raidAltPool[b].reduce((s, x) => s + x.power, 0);
          return sa !== sb ? sa - sb : rand() - 0.5;
        });

      if (candidates.length === 0) return null;
      raidAltPool[candidates[0]].push(alt);
      raidUserSets[candidates[0]].add(user.userIndex);
    }
  }

  // ── 공대별 알트를 1·2파티로 분배 ──
  for (let r = 0; r < RAID_COUNT; r++) {
    const alts = raidAltPool[r];
    const p1base = parties[r][0].members;
    const p2base = parties[r][1].members;
    let bestP1: OptimizerChar[] | null = null;
    let bestP2: OptimizerChar[] | null = null;
    let bestSc = Infinity;

    for (const p1alts of choose(alts, altCountPerParty)) {
      const p2alts = alts.filter((x) => !p1alts.includes(x));
      const sc = scoreRaidSplit(p1base, p2base, p1alts, p2alts, weights);
      if (sc < bestSc) {
        bestSc = sc;
        bestP1 = p1alts;
        bestP2 = p2alts;
      }
    }

    if (!bestP1 || !bestP2) return null;
    parties[r][0].members.push(...bestP1);
    parties[r][1].members.push(...bestP2);
  }

  return parties;
}

// ─── 경고 생성 ────────────────────────────────────────────────
function buildWarnings(parties: PartyGroup[][]): string[] {
  const warns: string[] = [];
  for (let r = 0; r < RAID_COUNT; r++) {
    const p2 = parties[r][1].members;
    const hasCleric = p2.some((x) => x.job === "치유성");
    const hasChanter = p2.some((x) => x.job === "호법성");
    if (!hasCleric && !hasChanter) {
      warns.push(`${r + 1}공대 2파티에 치유성 또는 호법성이 없습니다.`);
    }
  }
  return warns;
}

// ─── 메인 엔트리 ──────────────────────────────────────────────
/**
 * C# PartyOptimizer.BuildBestPlan() 에 해당.
 * 35,000회 후보를 생성해 최저 점수 플랜을 반환한다.
 */
export function buildBestPlan(
  users: OptimizerUser[],
  altCountPerParty: number = 3,
  weights: Weights = DEFAULT_WEIGHTS,
): PartyPlan {
  const rand = makePrng(20260507);
  let best: PartyGroup[][] | null = null;
  let bestScore = Infinity;

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const cand = buildCandidate(users, altCountPerParty, i, rand, weights);
    if (!cand) continue;
    const sc = scorePlan(cand, weights);
    if (sc < bestScore) {
      bestScore = sc;
      best = cand;
    }
  }

  if (!best) throw new Error("파티 편성 실패: 유효한 플랜을 찾지 못했습니다.");

  return { parties: best, warnings: buildWarnings(best) };
}
