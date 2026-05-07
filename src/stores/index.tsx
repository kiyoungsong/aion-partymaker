import { create } from "zustand";

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
