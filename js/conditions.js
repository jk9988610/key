import { formatDateISO } from './state.js';

export function checkConditions(conditions, state) {
  if (!conditions) return true;

  if (conditions.stability_lt !== undefined && state.stability >= conditions.stability_lt) return false;
  if (conditions.stability_gt !== undefined && state.stability <= conditions.stability_gt) return false;
  if (conditions.tension_gt !== undefined && state.tension <= conditions.tension_gt) return false;
  if (conditions.tension_lt !== undefined && state.tension >= conditions.tension_lt) return false;
  if (conditions.factories_gt !== undefined && state.factories <= conditions.factories_gt) return false;
  if (conditions.month !== undefined && state.date.getMonth() + 1 !== conditions.month) return false;

  if (conditions.date_after) {
    if (formatDateISO(state.date) < conditions.date_after) return false;
  }
  if (conditions.date_before) {
    if (formatDateISO(state.date) > conditions.date_before) return false;
  }

  if (conditions.diplomacy_gt) {
    for (const [k, v] of Object.entries(conditions.diplomacy_gt)) {
      if ((state.diplomacy[k] ?? 0) <= v) return false;
    }
  }

  if (conditions.flags) {
    for (const [k, v] of Object.entries(conditions.flags)) {
      if (Boolean(state.flags[k]) !== v) return false;
    }
  }

  return true;
}

export function filterByConditions(items, state) {
  return items.filter((item) => checkConditions(item.conditions, state));
}

export function pickWeighted(items) {
  const pool = items.filter((i) => (i.weight ?? 10) > 0);
  if (!pool.length) return null;
  const total = pool.reduce((s, i) => s + (i.weight ?? 10), 0);
  let r = Math.random() * total;
  for (const item of pool) {
    r -= item.weight ?? 10;
    if (r <= 0) return item;
  }
  return pool[pool.length - 1];
}

export function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rollSchedule(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

export function pickFromMix(mix, buckets, state) {
  const types = Object.keys(mix);
  const weights = types.map((t) => mix[t]);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  let chosen = types[0];
  for (let i = 0; i < types.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      chosen = types[i];
      break;
    }
  }
  const pool = filterByConditions(buckets[chosen] ?? [], state);
  return pool.length ? pickRandom(pool) : null;
}
