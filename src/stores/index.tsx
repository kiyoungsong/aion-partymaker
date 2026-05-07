import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IPlayerDraft } from "../types";
import type { Weights } from "../types/party";
import { DEFAULT_WEIGHTS } from "../meta";

interface BossState {
  raid: string;
  setRaid: (raid: string) => void;
  clearRaid: () => void;
}

export const useBossStore = create<BossState>()((set) => ({
  raid: "루드라",
  setRaid: (raid) => set({ raid }),
  clearRaid: () => set({ raid: "루드라" }),
}));

interface WeightState {
  weights: Weights;
  setWeights: (weights: Weights) => void;
  resetWeights: () => void;
}

export const useWeightStore = create<WeightState>()(
  persist(
    (set) => ({
      weights: DEFAULT_WEIGHTS,
      setWeights: (weights) => set({ weights }),
      resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
    }),
    {
      name: "aion-partymaker-weights",
    },
  ),
);

const uid = () => "x" + Math.random().toString(36).slice(2, 9);

function makeEmptyChar(kind: "본" | "부") {
  return { id: uid(), name: "", kind, job: "궁성", power: "" } as const;
}

function makeEmptyPlayer(): IPlayerDraft {
  return {
    id: uid(),
    chars: [
      { ...makeEmptyChar("본") },
      { ...makeEmptyChar("부") },
      { ...makeEmptyChar("부") },
      { ...makeEmptyChar("부") },
    ],
  };
}

type SetPlayersArg =
  | IPlayerDraft[]
  | ((prev: IPlayerDraft[]) => IPlayerDraft[]);

interface PlayerDraftState {
  players: IPlayerDraft[];
  altCount: number;
  setPlayers: (next: SetPlayersArg) => void;
  setAltCount: (n: number) => void;
  resetPlayers: () => void;
}

export const usePlayerDraftStore = create<PlayerDraftState>()(
  persist(
    (set) => ({
      players: Array.from({ length: 8 }, makeEmptyPlayer),
      altCount: 3,
      setPlayers: (next) =>
        set((state) => ({
          players: typeof next === "function" ? next(state.players) : next,
        })),
      setAltCount: (n) => set({ altCount: n }),
      resetPlayers: () =>
        set({
          players: Array.from({ length: 8 }, makeEmptyPlayer),
        }),
    }),
    {
      name: "aion-partymaker-player-drafts",
    },
  ),
);
