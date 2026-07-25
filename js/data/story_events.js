/**
 * 剧情事件 — 仅由国策完成 / 史实节点触发，会暂停游戏
 */

export default {
  STORY_RHINELAND_FALLOUT: {
    id: 'STORY_RHINELAND_FALLOUT',
    critical: true,
    narrative: [
      '「他们除了抗议还会什么？」',
      '办公室里有人笑了，笑声里有紧绷。',
    ],
    choices: [
      { text: '让戈培尔加大宣传', effects: { stability: 3, warSupport: 3 } },
      { text: '保持低调', effects: { stability: 1, diplomacy: { FRA: 3 } } },
    ],
  },
  STORY_SCHUSCHNIG: {
    id: 'STORY_SCHUSCHNIG',
    critical: true,
    narrative: [
      '奥地利总理来了。他比照片上更矮，手在发抖。',
      '「德国不会干涉奥地利内政。」我说。我说得很慢。',
    ],
    choices: [
      { text: '继续施压', effects: { diplomacy: { AUS: 10 }, tension: 5 } },
      { text: '暂时安抚', effects: { diplomacy: { AUS: -5 }, stability: 2 } },
    ],
  },
  STORY_ANNEX_AUSTRIA: {
    id: 'STORY_ANNEX_AUSTRIA',
    critical: true,
    narrative: [
      '法国和英国的外交照会雪片般飞来。',
      '里宾特洛甫说：「他们会抗议，仅此而已。」',
    ],
    choices: [
      { text: '无视抗议', effects: { tension: 5, warSupport: 3 } },
      { text: '发表声明安抚', effects: { diplomacy: { ENG: 5, FRA: 3 }, stability: -2 } },
    ],
  },
  STORY_MUNICH: {
    id: 'STORY_MUNICH',
    critical: true,
    narrative: [
      '张伯伦把雨伞放在门边。慕尼黑的气氛闷热。',
      '他问我：「这会是您最后的领土要求吗？」',
    ],
    choices: [
      { text: '「是的，首相先生。」', effects: { diplomacy: { ENG: 15 }, tension: 5 }, flags: { munich_done: true } },
      { text: '「这取决于局势。」', effects: { diplomacy: { ENG: -10 }, tension: 10 }, flags: { munich_done: true } },
    ],
  },
  STORY_PRAGUE: {
    id: 'STORY_PRAGUE',
    critical: true,
    narrative: [
      '波兰和英国的外交备忘录几乎同时到达。',
      '「下一步是但泽吗，元首？」鲍曼问。',
    ],
    choices: [
      { text: '「时候未到。」', effects: { stability: 3 } },
      { text: '「在考虑之中。」', effects: { warSupport: 5, tension: 8 } },
    ],
  },
  STORY_ANTI_COMINTERN: {
    id: 'STORY_ANTI_COMINTERN',
    critical: false,
    narrative: ['德日条约在柏林签署。', '苏联人的反应在预料之中。'],
    choices: [
      { text: '继续', effects: { diplomacy: { SOV: -5 } } },
    ],
  },
};
