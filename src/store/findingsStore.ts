import { create } from 'zustand';
import type { Findings } from '../parser/types';

interface FindingsState {
  findings: Findings[];
  setFindings: (findings: Findings[]) => void;
  resetFindings: () => void;
}

export const useFindingsStore = create<FindingsState>((set) => ({
  findings: [],
  setFindings: (findings) => set({ findings }),
  resetFindings: () => set({ findings: [] }),
}));
