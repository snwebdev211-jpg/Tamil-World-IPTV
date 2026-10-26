const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('mag/c/index.html','utf8');
const list=[
 {id:'1',number:'1',name:'Tamil News One',logo:'',genre_id:'3',url:'https://media.example.org/tamil.m3u8'},
 {id:'2',number:'2',name:'World Sports',logo:'',genre_id:'8',url:'https://media.example.org/sport.m3u8'},
 {id:'3',number:'3',name:'Tamil Cinema',logo:'',genre_id:'2',url:'https://media.example.org/cinema.m3u8'}
];
const groups=[
 {id:'*',title:'All',alias:'all',number:3},
 {id:'3',title:'Tamil News',alias:'Tamil | News',number:1},
 {id:'8',title:'Sports',alias:'Sports',number:1},
 {id:'2',title:'Tamil Movies',alias:'Tamil | Movies',number:1}
];
function mockWindow(w){
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();
 w.HTMLMediaElement.prototype.pause=()=>{};
 w.HTMLMediaElement.prototype.load=()=>{};
 w.XMLHttpRequest=class {
  constructor(){this.status=200;this.readyState=0;}
  open(_method,url){this.url=url;}
  send(){
   const p=new URL(this.url,'https://santhos-iptv.vercel.app').searchParams;
   const action=p.get('action'),type=p.get('type');
   let data=null;
   if(action==='handshake')data={token:'test',random:'ok'};
   else if(action==='get_genres')data=type==='vod'?[]:groups;
   else if(action==='get_all_channels')data={data:list,total_items:list.length};
   else if(action==='get_ordered_list'){
    let items=type==='vod'?[]:list.filter(x=>p.get('genre')==='*'||x.genre_id===p.get('genre'));
    if(p.get('search'))items=items.filter(x=>x.name.toLowerCase().includes(p.get('search').toLowerCase()));
    data={data:items,total_items:items.length,cur_page:1,max_page_items:50};
   }
   else if(action==='create_link'){
    data={url:(list.find(x=>x.id===p.get('ch_id'))||{}).url||'',alternatives:[]};
   }
   this.responseText=JSON.stringify({js:data||[]});
   this.readyState=4;if(this.onreadystatechange)this.onreadystatechange();
  }
 };
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
function orsay(w,k){
 const e=new w.Event('keydown',{bubbles:true,cancelable:true});
 Object.defineProperty(e,'keyCode',{value:k});
 w.document.body.dispatchEvent(e);
}
test('Santhos screenshot-based MAG Home, TV and Orsay remote navigation',async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse:mockWindow});
 const w=dom.window,d=w.document;
 try{
  await pause(50);
  assert.ok(d.querySelector('.classic-home'),'MAG Home exists');
  assert.equal(d.querySelectorAll('.classic-card-box').length,3,'Three photographic modules');
  assert.equal(d.querySelectorAll('.classic-category').length,6,'Six selector rows');
  assert.match(d.querySelector('#classic-carousel-cards').textContent,/MEDIA BROWSER.*TV.*VIDEOCLUB/);
  assert.equal(d.querySelector('.classic-category.is-selected').textContent,'ALL');
  assert.equal(d.querySelector('.classic-card-box.mag-active .classic-tile-name').textContent,'TV');
  assert.ok(d.querySelector('img[src="/c/mag-tv.jpg"]'),'Uses original MAG photographic tile, not an SVG drawing');
  orsay(w,29461);
  assert.equal(d.querySelector('.classic-category.is-selected').textContent,'INFORMATION','Orsay DOWN moves selector highlight');
  orsay(w,29460); // Move back to ALL before opening the complete TV directory
  orsay(w,29443);
  assert.ok(d.querySelector('#magGroups'),'Orsay OK opens TV category/channel UI');
  assert.ok(d.querySelector('#magList'),'Separate channel pane exists');
  orsay(w,5);
  assert.ok(d.querySelector('.mag-entry.mag-selected'),'Orsay RIGHT selects a channel');
  orsay(w,29443);
  assert.equal(d.querySelector('#videoPanel').style.display,'block','Orsay OK launches playback');
  orsay(w,88);
  assert.equal(d.querySelector('#videoPanel').style.display,'none','Orsay RETURN closes playback');
  orsay(w,88);
  assert.ok(d.querySelector('.classic-home'),'Orsay RETURN restores MAG Home');
  d.querySelector('.classic-tile[data-module="0"]').click();
  assert.ok(d.querySelector('#mediaUrl'),'Media Browser opens a distinct network-media screen');
  d.querySelector('#mediaUrl').value='https://media.example.org/clip.mp4';
  w.playMediaURL();
  assert.equal(d.querySelector('#videoPanel').style.display,'block','Media Browser can launch a valid network media URL');
  w.closeVideo();
  w.go('home');
  d.querySelector('.classic-tile[data-module="2"]').click();
  assert.match(d.querySelector('#vodContent').textContent,/No on-demand titles are configured/,'No fake VOD movies');
  w.go('home');
  assert.equal(errors.length,0,'No client errors: '+errors.join('; '));
 }finally{dom.window.close();}
});
test('MAG Home stays interactive and shows reconnect action when server fails',async()=>{
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
  w.XMLHttpRequest=class {
   open(){this.status=0;}
   send(){this.readyState=4;if(this.onreadystatechange)this.onreadystatechange();}
  };
 }});
 try{
  await pause(30);const w=dom.window,d=w.document;
  assert.ok(d.querySelector('.classic-home'),'Home still displays without backend');
  assert.match(d.querySelector('#mag-info').textContent,/Unable to reach portal server/);
  assert.ok(d.querySelector('.classic-reconnect'),'Visible MAG-style reconnect button');
  mockWindow(w);w.retryPortal();await pause(20);
  assert.match(d.querySelector('#mag-info').textContent,/3 streams/,'Retry updates directory status');
 }finally{dom.window.close();}
});

test('HLS in an MSE-capable browser uses a media engine rather than assigning a raw m3u8 to video.src',async()=>{
 let engine=null;
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  mockWindow(w);w.MediaSource=function(){};
  function Hls(){
   engine=this;this.handlers={};
   this.on=(name,callback)=>{this.handlers[name]=callback;};
   this.attachMedia=media=>{this.media=media;this.handlers['attached']();};
   this.loadSource=url=>{this.loaded=url;};
   this.destroy=()=>{this.destroyed=true;};
  }
  Hls.Events={MEDIA_ATTACHED:'attached',MANIFEST_PARSED:'parsed',ERROR:'error'};
  Hls.isSupported=()=>true;w.Hls=Hls;
 }});
 try{
  const w=dom.window,d=w.document;await pause(30);
  w.go('tv');w.chooseMagChannel(0);
  assert.ok(engine,'HLS engine is created');
  assert.equal(engine.loaded,'https://media.example.org/tamil.m3u8');
  assert.equal(engine.media,d.getElementById('video'));
  assert.equal(d.getElementById('video').getAttribute('src'),null,'Raw HLS URL was not assigned to the video tag');
  assert.equal(d.getElementById('videoPanel').style.display,'block');
 }finally{dom.window.close();}
});
test('a rejected HTML video play reports a genuine playback error rather than a fake success',async()=>{
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  mockWindow(w);w.HTMLMediaElement.prototype.play=()=>Promise.reject(new Error('cannot decode'));
 }});
 try{
  const w=dom.window,d=w.document;await pause(30);
  w.go('tv');w.chooseMagChannel(0);
  await pause(30);
  assert.equal(d.getElementById('message').style.display,'block');
  assert.match(d.getElementById('message').textContent,/rejected this stream/i);
  assert.doesNotMatch(d.getElementById('playerStatus').textContent,/Live video playing/);
 }finally{dom.window.close();}
});
