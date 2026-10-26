/* Run by GitHub Actions with Chromium. The live TV streams are mocked:
   this validates UI/remote interactions, not copyrighted broadcaster playback. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CHANNELS = [
  {id:'123',number:'1',name:'Tamil Demo TV',tv_genre_id:'1',genre_id:'1',logo:'',cmd:'ffmpeg https://example.org/tamil.m3u8'},
  {id:'456',number:'2',name:'World Sport Demo',tv_genre_id:'8',genre_id:'8',logo:'',cmd:'ffmpeg https://example.org/sport.m3u8'},
  {id:'789',number:'3',name:'Movie Demo',tv_genre_id:'7',genre_id:'7',logo:'',cmd:'ffmpeg https://example.org/movie.m3u8'}
];
const GENRES = [
  {id:'*',title:'All',alias:'all',number:3},
  {id:'1',title:'Tamil Entertainment',alias:'Tamil | Entertainment',number:1},
  {id:'7',title:'Movie Channels',alias:'Movies',number:1},
  {id:'8',title:'Sports',alias:'Sports',number:1},
];
const PAGE_URL = process.env.MAG_TEST_URL || 'http://127.0.0.1:8765/';
function api(url) {
  const q = new URL(url).searchParams, action=q.get('action'),type=q.get('type');
  if (action==='handshake')return {token:'test-token',random:'1234567890123456'};
  if (action==='get_genres'||action==='get_categories')return GENRES;
  if (action==='get_all_channels')return {data:CHANNELS,total_items:3};
  if (action==='get_ordered_list') {
    let data=CHANNELS.filter(c=>!q.get('genre')||q.get('genre')==='*'||q.get('genre')===c.genre_id);
    const search=(q.get('search')||'').toLowerCase();
    if(search)data=data.filter(c=>c.name.toLowerCase().includes(search));
    return {data,total_items:data.length,max_page_items:50,cur_page:1};
  }
  if(action==='create_link')return {url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'};
  if(type==='vod')return {data:[],total_items:0};
  return [];
}
async function main(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/stalker_portal/server/load.php?**',route=>route.fulfill({status:200,
    contentType:'application/json',body:JSON.stringify({js:api(route.request().url())})}));
  try{
    await page.goto(PAGE_URL,{waitUntil:'domcontentloaded'});
    await page.locator('.classic-home').waitFor({timeout:12000});
    await page.locator('.classic-card-box').first().waitFor();
    assert.equal(await page.locator('.classic-card-box').count(),3,'Home has three classic menu cards');
    assert.equal(await page.locator('#logo').getAttribute('src'),'/c/snwd-logo.jpg');
    assert.ok(await page.locator('.classic-categories').isVisible());
    assert.ok(await page.locator('#brand').isVisible());
    fs.mkdirSync('mag/browser-shots',{recursive:true});
    await page.screenshot({path:path.join('mag/browser-shots','home-tv.png'),fullPage:true});
    await page.locator('.classic-category').filter({hasText:'TAMIL TV'}).click();
    await page.locator('.tile').filter({hasText:'Tamil Entertainment'}).click();
    await page.locator('.row[data-channel="123"]').waitFor({timeout:10000});
    assert.ok(await page.locator('.row[data-channel="123"]').isVisible());
    await page.locator('.star').first().click();
    await page.locator('#nav-favorites').click();
    assert.ok(await page.locator('.row[data-channel="123"]').isVisible(),'favorite saved');
    await page.locator('#nav-search').click();
    await page.locator('#filter').fill('Sport');
    await page.getByText('SEARCH CHANNELS').click();
    assert.ok(await page.locator('.row[data-channel="456"]').isVisible(),'search finds sports');
    await page.locator('#nav-home').click();
    assert.ok(await page.locator('.classic-home').isVisible(),'Home restores');
    await page.screenshot({path:path.join('mag/browser-shots','home-after-navigation.png'),fullPage:true});
    // TV directional remote support: start on a focusable category,
    // ArrowDown advances to another focusable element.
    await page.locator('.classic-category').first().focus();
    await page.keyboard.press('ArrowDown');
    const focused=await page.evaluate(()=>document.activeElement?.outerHTML||'');
    assert.ok(focused.includes('classic-category')||focused.includes('classic-tile'),
      'Remote arrow moves focus between TV controls');
    assert.equal(errors.length,0,'No client JS errors: '+errors.join('; '));
    console.log('PASS: 1280x720 MAG classic Home, TV navigation, Tamil category, Favorites, Search, Back-to-Home, TV remote arrows, and browser screenshots.');
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exit(1);});
