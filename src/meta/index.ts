import type { DamageWeights, RuleWeights, Weights } from "../types/party";

// ─── 기본 가중치 ─────────────────────────────────────────────
export const DEFAULT_DAMAGE_WEIGHTS: DamageWeights = {
  살성: 1.0,
  마도성: 0.92,
  정령성: 0.92,
  궁성: 0.92,
  수호성: 0.72,
  검성: 0.72,
  호법성: 0.25,
  치유성: 0.25,
};

export const DEFAULT_RULE_WEIGHTS: RuleWeights = {
  cpBalance: 1.0,
  raidBalance: 1.0,
  party2Healer: 1.0,
  party2Chanter: 0.5,
  party2MainPref: 1.0,
  specialMainBoost: 1.0,
  duplicateUserPenalty: 1.0,
};

export const DEFAULT_WEIGHTS: Weights = {
  damage: { ...DEFAULT_DAMAGE_WEIGHTS },
  rules: { ...DEFAULT_RULE_WEIGHTS },
};
