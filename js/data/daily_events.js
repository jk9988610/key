export default {
  "scheduleWeights": {
    "quiet": 60,
    "routine": 25,
    "decision": 10,
    "travel": 5
  },
  "routineMix": {
    "telegram": 40,
    "briefing": 40,
    "desk": 20
  },
  "decisionMix": {
    "audience": 70,
    "lunch": 20,
    "desk": 10
  },
  "quiet": [
    { "id": "Q01", "text": "今日无大事。柏林的天空灰白，像一块旧铁。" },
    { "id": "Q02", "text": "雪落在总理府的窗台上。我批完文件，天已黑。" },
    { "id": "Q03", "text": "春泥路泞，幕僚迟到。我不在意。" },
    { "id": "Q04", "text": "夏日闷热，电风扇嗡嗡转了一整天。" },
    { "id": "Q05", "text": "秋雨敲窗。戈培尔送来的宣传简报厚得像砖。" },
    { "id": "Q06", "text": "今日日程空。我在地图前站了很久，没人敢打扰。" },
    { "id": "Q07", "text": "听了一下午瓦格纳。里宾特洛甫的电话我没接。" }
  ],
  "telegrams": [
    {
      "id": "TEL-01",
      "text": "法国外交部发来抗议照会。措辞比上次更硬。",
      "effects": { "diplomacy": { "FRA": -3 }, "tension": 2 },
      "notebook": { "type": "diplomacy", "text": "法国抗议照会" }
    },
    {
      "id": "TEL-02",
      "text": "英国外交大臣来信试探。口气还算客气。",
      "effects": { "diplomacy": { "ENG": 5 } },
      "notebook": { "type": "diplomacy", "text": "英国试探来信" }
    },
    {
      "id": "TEL-03",
      "text": "奥地利公使请求礼节性拜访。",
      "effects": { "diplomacy": { "AUS": 2 } },
      "notebook": { "type": "diplomacy", "text": "奥地利公使拜访" }
    },
    {
      "id": "TEL-04",
      "conditions": { "tension_gt": 20 },
      "text": "边境报告：与苏联边防部队发生摩擦。",
      "effects": { "diplomacy": { "SOV": -5 }, "tension": 3 },
      "notebook": { "type": "intel", "text": "苏德边境摩擦" }
    },
    {
      "id": "TEL-05",
      "text": "墨索里尼邀请访问罗马。里宾特洛甫建议接受。",
      "effects": { "diplomacy": { "ITA": 5 } },
      "notebook": { "type": "diplomacy", "text": "意大利邀请访罗马" }
    }
  ],
  "briefings": [
    {
      "id": "BRF-01",
      "conditions": { "tension_gt": 15 },
      "narrative": "凯特尔把东部地图铺开。「元首，波兰边境目前约 8 个师。但泽走廊在此。」他用铅笔圈了一下，没看我。",
      "sys": "东线兵力: 8 | 波兰紧张度: 低",
      "notebook": { "type": "intel", "text": "波兰边境约 8 师" }
    },
    {
      "id": "BRF-02",
      "conditions": { "date_after": "1936-02-01", "date_before": "1936-04-30" },
      "narrative": "军方简报：莱茵兰对岸法军阵地无异常。我方边防团已就位。",
      "sys": "莱茵兰: 德军已进驻 | 法军: 无调动",
      "notebook": { "type": "intel", "text": "莱茵兰局势稳定" }
    },
    {
      "id": "BRF-03",
      "conditions": { "diplomacy_gt": { "AUS": 50 } },
      "narrative": "里宾特洛甫指维也纳。「舒施尼格政府内部亲德派约占三成，还在涨。」",
      "sys": "奥地利: 亲德派上升",
      "notebook": { "type": "intel", "text": "奥国内亲德派约三成" }
    }
  ],
  "audiences": [
    {
      "id": "AUD-01",
      "character": "戈培尔",
      "conditions": { "stability_lt": 70 },
      "weight": 15,
      "narrative": [
        "戈培尔把一叠剪报放在桌上。",
        "「元首，国外又在说我们。需要加大宣传吗？」"
      ],
      "choices": [
        { "text": "加大宣传力度", "effects": { "stability": 5, "warSupport": 3, "tension": 1 }, "trust": { "goebbels": 5 } },
        { "text": "训斥他夸大其词", "effects": { "stability": 2 }, "trust": { "goebbels": -10 } },
        { "text": "今日不见", "effects": {} }
      ]
    },
    {
      "id": "AUD-02",
      "character": "戈林",
      "weight": 10,
      "narrative": [
        "戈林穿着浮夸的制服走进来，皮带扣叮当作响。",
        "「元首，空军需要更多配额。英国人的空军在扩编。」"
      ],
      "choices": [
        { "text": "追加空军预算", "effects": { "factories": 3, "tension": 2 }, "trust": { "goering": 10 } },
        { "text": "维持现状", "effects": {}, "trust": { "goering": -5 } },
        { "text": "削减其权限", "effects": { "stability": 2 }, "trust": { "goering": -15 } }
      ]
    },
    {
      "id": "AUD-03",
      "character": "希姆莱",
      "conditions": { "tension_gt": 25 },
      "weight": 12,
      "narrative": [
        "希姆莱轻声说话，像怕惊动什么。",
        "「元首，边境异动增多。盖世太保可以加强监控。」"
      ],
      "choices": [
        { "text": "批准", "effects": { "stability": 3, "tension": -1 }, "notebook": { "type": "intel", "text": "加强国内监控" } },
        { "text": "暂不动", "effects": {} },
        { "text": "警告他别越权", "effects": { "stability": -1 }, "trust": { "himmler": -10 } }
      ]
    },
    {
      "id": "AUD-04",
      "character": "里宾特洛甫",
      "conditions": { "tension_gt": 20 },
      "weight": 12,
      "narrative": [
        "里宾特洛甫拿着电报，手指很兴奋。",
        "「元首，奥地利那边可以施压了。英国人不会动。」"
      ],
      "choices": [
        { "text": "采纳建议", "effects": { "diplomacy": { "AUS": 5, "ENG": -3 } }, "trust": { "ribbentrop": 5 } },
        { "text": "自行其是", "effects": { "politicalPower": 2 }, "trust": { "ribbentrop": -5 } },
        { "text": "斥其鲁莽", "effects": { "diplomacy": { "AUS": -2 } }, "trust": { "ribbentrop": -10 } }
      ]
    },
    {
      "id": "AUD-05",
      "character": "凯特尔",
      "conditions": { "date_after": "1936-03-01" },
      "weight": 10,
      "narrative": [
        "凯特尔摊开小地图，动作像在课堂上。",
        "「元首，西部边境部队请求扩大演习规模。」"
      ],
      "choices": [
        { "text": "批准演习", "effects": { "warSupport": 5, "tension": 4 }, "flags": { "rheinland_done": true } },
        { "text": "克制", "effects": { "stability": 2, "warSupport": -2 } },
        { "text": "听详细报告", "effects": { "warSupport": 3, "politicalPower": -3 } }
      ]
    },
    {
      "id": "AUD-06",
      "character": "党内元老",
      "conditions": { "stability_lt": 80 },
      "weight": 8,
      "narrative": [
        "一位老党员在门外等了一上午，终于见到我。",
        "「元首，基层有怨言。物价涨得厉害……」"
      ],
      "choices": [
        { "text": "安抚", "effects": { "stability": 4, "politicalPower": -5 } },
        { "text": "冷落", "effects": { "stability": -2, "politicalPower": 3 } },
        { "text": "交给鲍曼处理", "effects": {}, "trust": { "bormann": 5 } }
      ]
    },
    {
      "id": "AUD-07",
      "character": "科学家",
      "weight": 5,
      "narrative": [
        "一位科学家紧张地站在门口，手里攥着帽子。",
        "「元首，火箭项目需要拨款……或者喷气机。」"
      ],
      "choices": [
        { "text": "资助火箭", "effects": {}, "notebook": { "type": "intel", "text": "火箭项目已批" } },
        { "text": "资助喷气机", "effects": {}, "notebook": { "type": "intel", "text": "喷气机项目已批" } },
        { "text": "拒绝", "effects": {} }
      ]
    }
  ],
  "lunches": [
    {
      "id": "LNC-01",
      "conditions": { "factories_gt": 40 },
      "narrative": [
        "午餐时戈林和一位工业专家几乎同时要同一块肉。桌上安静了。",
        "所有人都在看我。"
      ],
      "choices": [
        { "text": "支持戈林", "effects": {}, "trust": { "goering": 10 } },
        { "text": "支持工业派", "effects": { "factories": 2 }, "trust": { "goering": -10 } },
        { "text": "和稀泥", "effects": { "stability": 2 } }
      ]
    },
    {
      "id": "LNC-02",
      "narrative": [
        "鲍曼递来一张纸条，上面只有两个字：戈培尔。",
        "「宣传预算上，有些账目对不上。」"
      ],
      "choices": [
        { "text": "追查", "effects": { "stability": -2 }, "trust": { "goebbels": -15, "bormann": 5 } },
        { "text": "忽略", "effects": {}, "trust": { "bormann": -5 } },
        { "text": "当面问戈培尔", "effects": { "stability": 1 }, "trust": { "goebbels": -5 } }
      ]
    },
    {
      "id": "LNC-03",
      "conditions": { "diplomacy_gt": { "ITA": 0 } },
      "narrative": [
        "有人提起墨索里尼。",
        "「领袖在埃塞俄比亚惹了麻烦。我们要表态吗？」"
      ],
      "choices": [
        { "text": "表示支持", "effects": { "diplomacy": { "ITA": 10 } } },
        { "text": "保持距离", "effects": { "diplomacy": { "ITA": -3 } } },
        { "text": "提议轴心条约", "effects": { "diplomacy": { "ITA": 15 }, "tension": 5 }, "flags": { "axis_discussed": true } }
      ]
    }
  ],
  "desk": [
    {
      "id": "DSK-01",
      "narrative": ["鲍曼递来任命书。", "「是否批准新任驻维也纳公使？」"],
      "choices": [
        { "text": "批准", "effects": { "diplomacy": { "AUS": 3 }, "politicalPower": -5 } },
        { "text": "搁置", "effects": {} },
        { "text": "驳回", "effects": { "stability": 1 } }
      ]
    },
    {
      "id": "DSK-02",
      "narrative": ["戈培尔送来明日头条草案。", "标题留白，等我定夺。"],
      "choices": [
        { "text": "「德意志觉醒」", "effects": { "warSupport": 3 } },
        { "text": "「和平与秩序」", "effects": { "stability": 3 } },
        { "text": "「警告维也纳」", "effects": { "diplomacy": { "AUS": -5 }, "warSupport": 5 } }
      ]
    },
    {
      "id": "DSK-03",
      "narrative": ["里宾特洛甫拟好致伦敦电报。", "措辞强硬，还是缓和？"],
      "choices": [
        { "text": "强硬", "effects": { "diplomacy": { "ENG": -8 }, "tension": 3 } },
        { "text": "缓和", "effects": { "diplomacy": { "ENG": 5 } } },
        { "text": "撕掉重拟", "effects": { "politicalPower": -3, "diplomacy": { "ENG": 2 } } }
      ]
    }
  ],
  "travel": [
    {
      "id": "TRV-01",
      "destination": "贝希特斯加登",
      "narrative": [
        "天气不错。幕僚建议去贝希特斯加登住几天。",
        "「伯格霍夫的空气对您有好处，元首。」"
      ],
      "choices": [
        { "text": "前往贝希特斯加登", "effects": { "location": "berchtesgaden", "stability": 2 } },
        { "text": "留在柏林", "effects": {} }
      ]
    },
    {
      "id": "TRV-02",
      "conditions": { "month": 9 },
      "destination": "纽伦堡",
      "narrative": [
        "党代会快到了。戈培尔问：「今年去纽伦堡现场，还是广播演说？」"
      ],
      "choices": [
        { "text": "亲赴纽伦堡", "effects": { "location": "nuremberg", "stability": 10, "warSupport": 5 } },
        { "text": "广播演说", "effects": { "stability": 5, "warSupport": 2 } }
      ]
    }
  ]
};
