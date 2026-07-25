export function createInitialState() {
  return {
    date: new Date(1936, 0, 1),
    paused: true,
    speed: 1,
    autoPauseOnEvent: true,
    stability: 75,
    tension: 12,
    warSupport: 30,
    politicalPower: 50,
    factories: 50,
    location: 'berlin',
    diplomacy: { AUS: 55, CZE: 10, FRA: -40, ENG: -10, ITA: 20, SOV: -30, POL: -15 },
    trust: { goebbels: 50, goering: 50, himmler: 50, ribbentrop: 50, bormann: 40 },
    flags: {},
    focusActive: null,
    focusProgress: 0,
    quietBuffer: 0,
    awaitingChoice: false,
  };
}

export function formatDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateCN(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export const LOCATION_NAMES = {
  berlin: '柏林总理府',
  berchtesgaden: '贝希特斯加登',
  nuremberg: '纽伦堡',
  munich: '慕尼黑',
};
