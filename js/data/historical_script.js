/**
 * 史实 AI 剧本 — 后台推进，仅写入记事本或触发剧情
 * 参考 HOI4 1936–1939 德国周边时间线
 */

export default [
  {
    id: 'AI_1936_RHINELAND',
    date: '1936-03-07',
    skipIf: { flags: { rheinland_done: true } },
    notebook: { type: 'intel', text: '莱茵兰：德军已进驻（国际抗议中）' },
    effects: { tension: 4, diplomacy: { FRA: -5 } },
    silent: true,
  },
  {
    id: 'AI_1936_COMINTERN',
    date: '1936-11-25',
    skipIf: { flags: { anti_comintern: true } },
    notebook: { type: 'diplomacy', text: '德日反共产国际条约谈判中' },
    effects: { diplomacy: { SOV: -3 } },
    silent: true,
  },
  {
    id: 'AI_1937_SPAIN',
    date: '1937-07-17',
    notebook: { type: 'intel', text: '西班牙内战：可供试探国际反应' },
    silent: true,
  },
  {
    id: 'AI_1938_SCHUSCHNIG',
    date: '1938-02-12',
    skipIf: { flags: { austria_annexed: true } },
    story: 'STORY_SCHUSCHNIG',
  },
  {
    id: 'AI_1938_ANNEX_WINDOW',
    date: '1938-03-12',
    skipIf: { flags: { austria_annexed: true } },
    notebook: { type: 'diplomacy', text: '德奥合并窗口期：维也纳局势临界' },
    effects: { diplomacy: { AUS: 5 } },
    silent: true,
  },
  {
    id: 'AI_1938_MUNICH_WINDOW',
    date: '1938-09-01',
    skipIf: { flags: { munich_done: true } },
    notebook: { type: 'diplomacy', text: '苏台德危机：英法外交活动频繁' },
    effects: { tension: 5 },
    silent: true,
  },
  {
    id: 'AI_1939_CZECH',
    date: '1939-03-15',
    skipIf: { flags: { czech_annexed: true } },
    notebook: { type: 'intel', text: '布拉格：德军部署就绪' },
    silent: true,
  },
  {
    id: 'AI_1939_POLAND',
    date: '1939-08-23',
    notebook: { type: 'intel', text: '但泽走廊：波兰拒绝让步' },
    effects: { tension: 10, diplomacy: { POL: -10 } },
    silent: true,
  },
];
