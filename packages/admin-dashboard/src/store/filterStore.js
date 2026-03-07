import { create } from 'zustand';

/**
 * Zustand store for global website filter state
 */
export const useFilterStore = create((set) => ({
  // 'ALL' | 'CABINETS_DEALS' | 'NORTHVILLE_CABINETRY'
  sourceWebsite: 'ALL',
  setSourceWebsite: (sourceWebsite) => set({ sourceWebsite }),
}));
