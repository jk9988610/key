/** 钢铁雄心4 速度档位 I–IV（暂停与速度分离） */
export const HOI4_SPEEDS = [
  { level: 1, label: 'I', msPerHour: 1200 },
  { level: 2, label: 'II', msPerHour: 420 },
  { level: 3, label: 'III', msPerHour: 140 },
  { level: 4, label: 'IV', msPerHour: 45 },
];

const MIN_LEVEL = 1;
const MAX_LEVEL = 4;

export function getSpeedConfig(level) {
  const clamped = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level || MIN_LEVEL));
  return HOI4_SPEEDS.find((s) => s.level === clamped) || HOI4_SPEEDS[0];
}

export function stepSpeedLevel(current, delta) {
  const level = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, (current || MIN_LEVEL) + delta));
  return level;
}
