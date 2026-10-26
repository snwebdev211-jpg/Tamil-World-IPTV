const fs = require('node:fs');
const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const html = fs.readFileSync('web/index.html','utf8');
const app = fs.readFileSync('web/app.js','utf8');
const fixture = [
  '#EXTM3U',
  '#EXTINF:-1 tvg-id="tamil" tvg-logo="" group-title="Tamil | Entertainment",Tamil One HD',
  'https://example.org/tamil.m3u8',
  '#EXTINF:-1 tvg-id="sport" tvg-logo="" group-title="Sports",Sports Network',
  'https://example.org/sports.m3u8',
  '#EXTINF:-1 tvg-id="movie" tvg-logo="" group-title="Movies",Movie Channel',
  'https://example.org/movie.m3u8',
].join('\n');
const dom = new JSDOM(html,{url:'https://santhos-iptv.vercel.app/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window, doc=w.document;
w.scrollTo=()=>{};
w.fetch=async()=>({ok:true,status:200,text:async()=>fixture});
w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
w.HTMLMediaElement.prototype.pause=()=>{};
w.HTMLMediaElement.prototype.load=()=>{};
w.HTMLMediaElement.prototype.canPlayType=()=>''; 
w.eval(app);
const wait = ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  await wait(100);
  assert.match(doc.querySelector('#mainContent').textContent,/Your world/i,'Home page hero visible');
  assert.match(doc.querySelector('#sidebarStatus').textContent,/3 indexed streams/i,'Fixture loaded');
  doc.querySelector('[data-view="tamil"]').click();
  assert.match(doc.querySelector('#mainContent').textContent,/Tamil One HD/,'Tamil channel rendered');
  assert.ok(!doc.querySelector('#mainContent').textContent.includes('Sports Network'),'Tamil filtering excludes global sports');
  doc.querySelector('[data-view="sports"]').click();
  assert.match(doc.querySelector('#mainContent').textContent,/Sports Network/,'Sports tab renders');
  const card=doc.querySelector('.channel-card');
  assert.ok(card,'Sports card exists');
  card.querySelector('[data-fav]').click();
  doc.querySelector('[data-view="favorites"]').click();
  assert.match(doc.querySelector('#mainContent').textContent,/Sports Network/,'Favorites persist in current session');
  doc.querySelector('[data-view="movies"]').click();
  assert.match(doc.querySelector('#mainContent').textContent,/Movie Channel/,'Movie-channel section renders');
  doc.querySelector('[data-view="live"]').click();
  assert.equal(doc.querySelectorAll('.channel-card').length,3,'All live channels rendered');
  doc.querySelector('[data-view="news"]').click();
  assert.match(doc.querySelector('#mainContent').textContent,/No matching channels/,'Empty state shown');
  doc.querySelector('[data-view="settings"]').click();
  assert.ok(doc.querySelector('#themeSelect'),'Theme selector works');
  doc.querySelector('#themeSelect').value='royal';
  doc.querySelector('#themeSelect').dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.ok(doc.body.classList.contains('theme-royal'),'Theme applied');
  doc.querySelector('[data-view="live"]').click();
  doc.querySelector('.channel-card').click();
  assert.equal(doc.querySelector('#playerOverlay').hidden,false,'Player opens from channel card');
  doc.querySelector('#closePlayer').click();
  assert.equal(doc.querySelector('#playerOverlay').hidden,true,'Player closes');
  console.log('PASS: home, Tamil, sports, movie, live, news empty state, favorites, settings, themes, player open/close');
})().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>{setTimeout(()=>w.close(),100)});
