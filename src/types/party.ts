// ─── 직업 ────────────────────────────────────────────────────
export const ATTR_LIST = [
  "궁성",
  "살성",
  "검성",
  "치유성",
  "수호성",
  "호법성",
  "정령성",
  "마도성",
] as const;

export type AttrKey = (typeof ATTR_LIST)[number];

export interface AttrToken {
  fg: string;
  bg: string;
  bd: string;
}

export const ATTRS: Record<AttrKey, AttrToken> = {
  궁성: {
    fg: "#C4A8FF",
    bg: "rgba(160,120,255,0.14)",
    bd: "rgba(160,120,255,0.32)",
  },
  살성: {
    fg: "#FF9A9A",
    bg: "rgba(255,90,90,0.14)",
    bd: "rgba(255,90,90,0.32)",
  },
  검성: {
    fg: "#C9D1E2",
    bg: "rgba(180,195,220,0.10)",
    bd: "rgba(180,195,220,0.24)",
  },
  치유성: {
    fg: "#7FE3A6",
    bg: "rgba(80,210,130,0.13)",
    bd: "rgba(80,210,130,0.30)",
  },
  수호성: {
    fg: "#6FE0D0",
    bg: "rgba(60,210,200,0.13)",
    bd: "rgba(60,210,200,0.30)",
  },
  호법성: {
    fg: "#86B4FF",
    bg: "rgba(90,140,255,0.14)",
    bd: "rgba(90,140,255,0.32)",
  },
  정령성: {
    fg: "#FFA6CD",
    bg: "rgba(255,130,190,0.13)",
    bd: "rgba(255,130,190,0.30)",
  },
  마도성: {
    fg: "#F5C36B",
    bg: "rgba(230,170,70,0.14)",
    bd: "rgba(230,170,70,0.32)",
  },
};

// ─── 가중치 ──────────────────────────────────────────────────
export type DamageWeights = Record<AttrKey, number>;

export interface RuleWeights {
  cpBalance: number;
  raidBalance: number;
  party2Healer: number;
  party2Chanter: number;
  party2MainPref: number;
  specialMainBoost: number;
  duplicateUserPenalty: number;
}

export interface Weights {
  damage: DamageWeights;
  rules: RuleWeights;
}
