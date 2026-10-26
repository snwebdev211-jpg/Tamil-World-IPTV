/* Browser checks for the screenshot-based MAG 250 UI.
   API replies are mocked; physical Samsung remote and stream decoding
   require a real Orsay Smart-STB test and are NOT asserted here. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CHANNELS=[
 {id:'123',number:'1',name:'Tamil Demo TV',tv_genre_id:'1',genre_id:'1',logo:'',cmd:'ffmpeg https://example.org/tamil.m3u8'},
 {id:'456',number:'2',name:'World Sport Demo',tv_genre_id:'8',genre_id:'8',logo:'',cmd:'ffmpeg https://example.org/sport.m3u8'},
 {id:'789',number:'3',name:'Movie Demo',tv_genre_id:'7',genre_id:'7',logo:'',cmd:'ffmpeg https://example.org/movie.m3u8'}
];
const GENRES=[
 {id:'*',title:'All',alias:'all',number:3},
 {id:'1',title:'Tamil Entertainment',alias:'Tamil | Entertainment',number:1},
 {id:'7',title:'Movie Channels',alias:'Movies',number:1},
 {id:'8',title:'Sports',alias:'Sports',number:1}
];
function api(url){
 const q=new URL(url).searchParams,action=q.get('action'),type=q.get('type');
 if(action==='handshake')return {token:'test-token'};
 if(action==='get_genres'||action==='get_categories')return type==='vod'?[]:GENRES;
 if(action==='get_all_channels')return {data:CHANNELS,total_items:CHANNELS.length};
 if(action==='get_ordered_list'){
  if(type==='vod')return {data:[],total_items:0};
  let data=CHANNELS.filter(c=>!q.get('genre')||q.get('genre')==='*'||q.get('genre')===c.genre_id);
  if(q.get('search'))data=data.filter(c=>c.name.toLowerCase().includes(q.get('search').toLowerCase()));
  return {data,total_items:data.length,max_page_items:50,cur_page:1};
 }
 if(action==='create_link')return {url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'};
 return [];
}
async function sendOrsay(page,keyCode){
 await page.evaluate(code=>{
  const e=new Event('keydown',{bubbles:true,cancelable:true});
  Object.defineProperty(e,'keyCode',{value:code});
  document.body.dispatchEvent(e);
 },keyCode);
}
async function main(){
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/stalker_portal/server/load.php?**',route=>route.fulfill({
  status:200,contentType:'application/json',body:JSON.stringify({js:api(route.request().url())})
 }));
 try{
  await page.goto(process.env.MAG_TEST_URL||'http://127.0.0.1:8765/c/index.html',{waitUntil:'domcontentloaded'});
  await page.locator('.classic-home').waitFor({state:'visible',timeout:12000});
  assert.equal(await page.locator('.classic-card-box').count(),3,'Exactly three original MAG photo tiles');
  assert.equal(await page.locator('.classic-category').count(),6,'Six vertical MAG-style categories');
  assert.equal(await page.locator('.classic-category.is-selected').textContent(),'ALL','ALL initially highlighted');
  assert.equal(await page.locator('.classic-card-box.mag-active .classic-tile-name').textContent(),'TV','TV initially selected');
  assert.equal(await page.locator('#logo').getAttribute('src'),'/c/snwd-logo.jpg');
  const positions=await page.evaluate(()=>{
   const r=document.querySelector('.classic-categories').getBoundingClientRect();
   const tiles=[...document.querySelectorAll('.classic-card-box')].map(e=>e.getBoundingClientRect());
   const photos=[...document.querySelectorAll('.classic-tile img')].map(e=>({loaded:e.complete&&e.naturalWidth>0,src:e.getAttribute('src')}));
   return {cat:{x:r.x,y:r.y,w:r.width,h:r.height},tiles:tiles.map(t=>({x:t.x,y:t.y,w:t.width})),photos};
  });
  assert.ok(positions.cat.x>350&&positions.cat.x<530&&positions.cat.y<200,'Category list centred in top half');
  assert.ok(positions.tiles[0].x<positions.tiles[1].x&&positions.tiles[1].x<positions.tiles[2].x,'Three photo cards in one horizontal row');
  assert.ok(positions.tiles[1].y>320,'Photo carousel below category selector');
  assert.ok(positions.photos.every(x=>x.loaded),'Original screenshot photographic assets all loaded');
  fs.mkdirSync('mag/browser-shots',{recursive:true});
  await page.screenshot({path:path.join('mag/browser-shots','mag-reference-home.png'),fullPage:true});
  await sendOrsay(page,29461); // DOWN
  assert.equal(await page.locator('.classic-category.is-selected').textContent(),'INFORMATION','Orsay DOWN moves selected row');
  await sendOrsay(page,29460); // UP returns to ALL for mock catalogue
  await sendOrsay(page,29443); // OK
  await page.locator('.mag-browser').waitFor({state:'visible'});
  assert.ok(await page.locator('.mag-groups').isVisible(),'MAG category pane visible');
  assert.ok(await page.locator('.mag-list').isVisible(),'MAG channels pane visible');
  const panes=await page.evaluate(()=>{const l=document.querySelector('.mag-groups').getBoundingClientRect(),r=document.querySelector('.mag-list').getBoundingClientRect();return {left:{x:l.x,w:l.width},right:{x:r.x,w:r.width}};});
  assert.ok(panes.right.x>panes.left.x+panes.left.w,'TV categories are in a separate LEFT pane, channels in RIGHT pane');
  await page.screenshot({path:path.join('mag/browser-shots','mag-two-pane-tv.png'),fullPage:true});
  await sendOrsay(page,5); // RIGHT
  assert.equal(await page.locator('.mag-entry.mag-selected').count(),1,'Orsay RIGHT selects channel pane');
  await sendOrsay(page,29443); // OK
  await page.locator('#videoPanel').waitFor({state:'visible'});
  await sendOrsay(page,88); // RETURN
  await page.locator('.mag-browser').waitFor({state:'visible'});
  await sendOrsay(page,88);
  await page.locator('.classic-home').waitFor({state:'visible'});
  await page.locator('.classic-tile[data-module="0"]').click();
  await page.locator('#mediaUrl').waitFor({state:'visible'});
  await sendOrsay(page,88);
  await page.locator('.classic-tile[data-module="2"]').click();
  await page.locator('#vodContent').waitFor({state:'visible'});
  await page.getByText('No on-demand titles are configured.',{exact:false}).waitFor();
  assert.equal(errors.length,0,'No browser JS exceptions: '+errors.join('; '));
  console.log('PASS screenshot-style MAG photo Home, 2-pane TV, Orsay DOWN/RIGHT/OK/RETURN, Media Browser and distinct empty Video Club. Physical Orsay and live media NOT tested.');
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exit(1);});
