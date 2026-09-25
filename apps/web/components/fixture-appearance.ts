const fixtureFills: Record<string, string> = {
  gondola: '#80b5a4',
  'wall-shelf': '#82a9c4',
  rack: '#bdad85',
  freezer: '#83b9d2',
  checkout: '#a7a2cf',
  'promotion-island': '#d7aa73',
};

export const fixtureOutline = '#4d8976';
export const fixtureCenterLine = '#d5e9e0';
export const fixtureFill = (definitionId: string): string => fixtureFills[definitionId] ?? fixtureFills.gondola;
