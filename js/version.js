/** 版本号以 index.html 中 <meta name="game-version"> 为唯一来源 */
export function getVersion() {
  return document.querySelector('meta[name="game-version"]')?.getAttribute('content')?.trim() || 'dev';
}
