import dailyEvents from './data/daily_events.js';
import { applyEffects } from './effects.js';
import { filterByConditions, pickRandom } from './conditions.js';

const AUDIENCE_COST = 8;
const DIPLOMACY_COST = 10;

const DIPLOMACY_ACTIONS = [
  {
    id: 'dip_aus_pressure',
    label: '施压维也纳',
    available: (s) => !s.flags.austria_annexed,
    effects: { diplomacy: { AUS: 8, ENG: -3 }, tension: 3 },
    narrative: '里宾特洛甫拟好致维也纳的照会。措辞强硬。',
  },
  {
    id: 'dip_eng_appease',
    label: '安抚伦敦',
    available: () => true,
    effects: { diplomacy: { ENG: 10 } },
    narrative: '一封措辞缓和的电报发往英国外交部。',
  },
  {
    id: 'dip_cze_threat',
    label: '威胁布拉格',
    available: (s) => s.flags.austria_annexed && !s.flags.czech_annexed,
    effects: { diplomacy: { CZE: -10 }, tension: 5, warSupport: 3 },
    narrative: '凯特尔在边境演习规模上加了一笔。布拉格会读懂的。',
  },
  {
    id: 'dip_fra_probe',
    label: '试探巴黎',
    available: () => true,
    effects: { diplomacy: { FRA: 5 } },
    narrative: '秘密渠道向巴黎传话：德国无意挑衅。',
  },
];

export function createActionSystem({ state, output, eventUI, onHUDUpdate }) {
  const audienceBtn = document.getElementById('btn-audience');
  const diplomacyBtn = document.getElementById('btn-diplomacy');

  function summonAudience() {
    if (state.awaitingChoice) return;
    if (state.politicalPower < AUDIENCE_COST) {
      output.append(`[SYS] 政治权力不足（接见需 ${AUDIENCE_COST}）`, 'sys');
      return;
    }

    const pool = filterByConditions(dailyEvents.audiences, state);
    if (!pool.length) {
      output.append('[SYS] 今日无人候见', 'sys');
      return;
    }

    const item = pickRandom(pool);
    state.politicalPower -= AUDIENCE_COST;
    onHUDUpdate?.();

    eventUI.showChoiceEvent({
      narrative: item.narrative,
      promptText: `接见 ${item.character}：`,
      choices: item.choices,
    }, state);
  }

  function showDiplomacyMenu() {
    if (state.awaitingChoice) return;

    const available = DIPLOMACY_ACTIONS.filter(
      (a) => a.available(state) && state.politicalPower >= DIPLOMACY_COST,
    );

    if (!available.length) {
      output.append('[DIP] 政治权力不足或无可行外交行动。', 'dip');
      return;
    }

    eventUI.showChoiceEvent({
      narrative: ['里宾特洛甫等待指示。'],
      promptText: '外交行动：',
      choices: available.map((a) => ({
        text: `${a.label}（${DIPLOMACY_COST}政治权力）`,
        onSelect: () => {
          state.politicalPower -= DIPLOMACY_COST;
          applyEffects(state, a.effects);
          output.append(`[DIP] ${a.label}`, 'dip');
          onHUDUpdate?.();
        },
      })),
    }, state);
  }

  function bind() {
    audienceBtn?.addEventListener('click', summonAudience);
    diplomacyBtn?.addEventListener('click', showDiplomacyMenu);
  }

  return { bind };
}
