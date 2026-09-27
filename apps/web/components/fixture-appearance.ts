const fixtureFills: Record<string, string> = {
  gondola: '#f8fafc',
  'wall-shelf': '#f8fafc',
  rack: '#f8fafc',
  freezer: '#83b9d2',
  checkout: '#a7a2cf',
  'promotion-island': '#d7aa73',
};

export const fixtureOutline = '#475569';
export const fixtureCenterLine = '#94a3b8';
export const fixtureFrontLine = '#0f172a';
export const fixtureFill = (definitionId: string): string => fixtureFills[definitionId] ?? fixtureFills.gondola;
