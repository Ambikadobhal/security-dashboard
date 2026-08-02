import { create } from 'zustand';
import type { Findings } from '../parser/types';

interface FindingsState {
  findings: Findings[];
  fileName: string;
  setFindings: (findings: Findings[], fileName?: string) => void;
  resetFindings: () => void;
}

export const useFindingsStore = create<FindingsState>((set) => ({
  findings: [],
  fileName: '',
  setFindings: (findings, fileName = '') => set({ findings, fileName }),
  resetFindings: () => set({ findings: [], fileName: '' }),
}));