import { formatDateISO } from './state.js';

export function applyEffects(state, effects = {}, extras = {}) {
  const merged = { ...effects };
  if (extras.trust) merged.trust = { ...(merged.trust || {}), ...extras.trust };
  if (extras.flags) merged.flags = { ...(merged.flags || {}), ...extras.flags };
  if (extras.notebook) merged.notebook = extras.notebook;

  const logs = [];

  for (const [key, val] of Object.entries(merged)) {
    switch (key) {
      case 'stability':
        state.stability = clamp(state.stability + val, 0, 100);
        logs.push(`稳定 ${val > 0 ? '+' : ''}${val}`);
        break;
      case 'warSupport':
        state.warSupport = clamp(state.warSupport + val, 0, 100);
        logs.push(`战争支持 ${val > 0 ? '+' : ''}${val}`);
        break;
      case 'tension':
        state.tension = clamp(state.tension + val, 0, 100);
        logs.push(`紧张度 ${val > 0 ? '+' : ''}${val}%`);
        break;
      case 'politicalPower':
        state.politicalPower = Math.max(0, state.politicalPower + val);
        logs.push(`政治权力 ${val > 0 ? '+' : ''}${val}`);
        break;
      case 'factories':
        state.factories = Math.max(0, state.factories + val);
        logs.push(`工厂 ${val > 0 ? '+' : ''}${val}`);
        break;
      case 'location':
        state.location = val;
        logs.push(`驻地 → ${val}`);
        break;
      case 'diplomacy':
        for (const [c, delta] of Object.entries(val)) {
          state.diplomacy[c] = clamp((state.diplomacy[c] ?? 0) + delta, -100, 100);
          logs.push(`${c} 关系 ${delta > 0 ? '+' : ''}${delta}`);
        }
        break;
      case 'trust':
        for (const [c, delta] of Object.entries(val)) {
          state.trust[c] = clamp((state.trust[c] ?? 50) + delta, 0, 100);
        }
        break;
      case 'flags':
        Object.assign(state.flags, val);
        break;
      default:
        break;
    }
  }

  return { logs, notebook: merged.notebook };
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function dailyTick(state) {
  state.politicalPower += 1;
  if (state.focusActive) state.focusProgress += 1;
}

export function sysStatusLine(state) {
  return `[SYS] ${formatDateISO(state.date)} | 稳定 ${state.stability} | 战争支持 ${state.warSupport} | 政治权力 ${state.politicalPower} | 工厂 ${state.factories}`;
}
