/** 中欧静态战略地图（1936 简图） */

const REGIONS = [
  { id: 'ENG', name: '英国', path: 'M20,40 L55,35 L60,70 L25,75 Z', relationKey: 'ENG' },
  { id: 'FRA', name: '法国', path: 'M55,70 L95,55 L100,110 L60,115 Z', relationKey: 'FRA' },
  { id: 'GER', name: '德意志国', path: 'M95,55 L155,50 L160,105 L100,110 Z', relationKey: null, player: true },
  { id: 'ITA', name: '意大利', path: 'M95,115 L130,110 L125,175 L85,170 Z', relationKey: 'ITA' },
  { id: 'AUS', name: '奥地利', path: 'M130,105 L165,100 L168,130 L133,135 Z', relationKey: 'AUS', annexFlag: 'austria_annexed' },
  { id: 'CZE', name: '捷克斯洛伐克', path: 'M155,75 L200,70 L205,120 L160,125 Z', relationKey: 'CZE', annexFlag: 'czech_annexed' },
  { id: 'POL', name: '波兰', path: 'M160,45 L230,40 L235,95 L165,100 Z', relationKey: 'POL' },
  { id: 'SOV', name: '苏联', path: 'M230,30 L320,25 L325,140 L235,135 Z', relationKey: 'SOV' },
];

const MARKERS = [
  { id: 'berlin', name: '柏林', x: 128, y: 82 },
  { id: 'vienna', name: '维也纳', x: 152, y: 118 },
  { id: 'prague', name: '布拉格', x: 182, y: 98 },
  { id: 'munich', name: '慕尼黑', x: 118, y: 100 },
  { id: 'warsaw', name: '华沙', x: 198, y: 68 },
];

function relationLabel(val) {
  if (val >= 40) return '友好';
  if (val >= 10) return '中立';
  if (val >= -20) return '冷淡';
  return '敌对';
}

function regionStatus(state, region) {
  if (region.player) return { label: '核心领土', cls: 'player' };
  if (region.annexFlag && state.flags[region.annexFlag]) {
    return { label: '已合并', cls: 'annexed' };
  }
  const rel = state.diplomacy[region.relationKey];
  if (rel === undefined) return { label: '—', cls: 'neutral' };
  return { label: `关系 ${rel}（${relationLabel(rel)}）`, cls: rel >= 10 ? 'friendly' : rel >= -20 ? 'neutral' : 'hostile' };
}

export function createMap({ overlayEl, svgEl, infoEl, state }) {
  function render() {
    svgEl.innerHTML = '';

    REGIONS.forEach((region) => {
      const status = regionStatus(state, region);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', region.path);
      path.setAttribute('class', `map-region map-${status.cls}`);
      path.dataset.id = region.id;
      path.addEventListener('click', () => showInfo(region, status));
      svgEl.appendChild(path);

      const bbox = path.getBBox();
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', bbox.x + bbox.width / 2);
      text.setAttribute('y', bbox.y + bbox.height / 2);
      text.setAttribute('class', 'map-label');
      text.textContent = region.name;
      svgEl.appendChild(text);
    });

    MARKERS.forEach((m) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'map-marker');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', m.x);
      circle.setAttribute('cy', m.y);
      circle.setAttribute('r', 3);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', m.x);
      label.setAttribute('y', m.y - 6);
      label.setAttribute('class', 'map-marker-label');
      label.textContent = m.name;
      g.appendChild(circle);
      g.appendChild(label);
      svgEl.appendChild(g);
    });

    infoEl.textContent = '点击领土查看简报。地图为幕僚整理的静态态势图。';
  }

  function showInfo(region, status) {
    infoEl.textContent = `${region.name} — ${status.label}`;
  }

  function open() {
    render();
    overlayEl.hidden = false;
    document.body.classList.add('map-open');
  }

  function close() {
    overlayEl.hidden = true;
    document.body.classList.remove('map-open');
  }

  return { open, close, render };
}
