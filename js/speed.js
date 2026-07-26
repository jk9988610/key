/** 钢铁雄心4 速度档位（单按钮循环：暂停 → I → II → III → IV） */
export const HOI4_SPEEDS = [
  { level: 0, label: '暂停', paused: true, msPerHour: null },
  { level: 1, label: 'I', paused: false, msPerHour: 1200 },
  { level: 2, label: 'II', paused: false, msPerHour: 420 },
  { level: 3, label: 'III', paused: false, msPerHour: 140 },
  { level: 4, label: 'IV', paused: false, msPerHour: 45 },
];

export function getSpeedConfig(level) {
  return HOI4_SPEEDS.find((s) => s.level === level) || HOI4_SPEEDS[0];
}

export function cycleSpeedLevel(current) {
  const idx = HOI4_SPEEDS.findIndex((s) => s.level === current);
  const next = HOI4_SPEEDS[(idx + 1) % HOI4_SPEEDS.length];
  return next.level;
}
