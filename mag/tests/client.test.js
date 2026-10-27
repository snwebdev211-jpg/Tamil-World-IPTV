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
    let items=type==='vod'?[]:list.filter(x=>p.get('genre')==='*'||(p.get('genre')==='__tamil__'?/Tamil/i.test(x.name):x.genre_id===p.get('genre')));
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
  assert.ok(d.querySelector('#magPreviewVideo #video'),'OK puts video in the right-hand preview pane');
  assert.equal(d.querySelector('#videoPanel').style.display,'none','Preview keeps the channel list visible');
  assert.match(d.querySelector('#magGuide').textContent,/Programme schedule unavailable/,'EPG is not fabricated');
  assert.equal(d.querySelector('#video').muted,false,'Preview audio is not deliberately muted');
  orsay(w,29443);
  assert.equal(d.querySelector('#videoPanel').style.display,'block','Second OK opens fullscreen');
  orsay(w,88);
  assert.equal(d.querySelector('#videoPanel').style.display,'none','RETURN restores preview');
  assert.ok(d.querySelector('#magPreviewVideo #video'),'Same video element returns to preview');
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
  assert.ok(d.querySelector('#streamTestShortcut'),'Visible stream test shortcut');
  orsay(w,48);
  assert.match(d.querySelector('#cards').textContent,/TEST MP4 VIDEO.*TEST HLS VIDEO/,
   '0 key opens both video diagnostics');
  orsay(w,88);
  assert.ok(d.querySelector('.classic-home'),'Return goes Home');
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
  assert.equal(d.getElementById('videoPanel').style.display,'none');
  assert.ok(d.getElementById('magPreviewVideo').contains(d.getElementById('video')));
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
  assert.equal(d.getElementById('message').style.display,'none','Errors stay inside the preview pane');
  assert.match(d.getElementById('magPreviewStatus').textContent,/PLAYBACK REJECTED \(Error\)/i);
  assert.doesNotMatch(d.getElementById('playerStatus').textContent,/Live video playing/);
 }finally{dom.window.close();}
});


test('native gSTB decoder path can request live playback and optional picture-in-guide positioning',async()=>{
 const calls=[];
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  mockWindow(w);
  w.gSTB={
   Stop:()=>calls.push(['stop']),
   Play:source=>{calls.push(['play',source]);return true;},
   SetPIG:(...args)=>calls.push(['pig',...args])
  };
 }});
 try{
  const w=dom.window,d=w.document;await pause(30);
  w.go('tv');
  d.getElementById('magPreviewVideo').getBoundingClientRect=()=>({left:630,top:110,width:500,height:260});
  w.chooseMagChannel(0);
  assert.ok(calls.some(x=>x[0]==='play'&&x[1]==='ffmpeg https://media.example.org/tamil.m3u8'),
   'Browser uses supported native MAG player rather than assigning an unsupported URL');
  assert.ok(calls.some(x=>x[0]==='pig'&&x[1]===0),
   'Optional native PIG API is given a bounded preview rectangle');
  w.goFullScreen();
  assert.ok(calls.some(x=>x[0]==='pig'&&x[1]===1),
   'Native TV decoder can be returned to fullscreen');
  w.go('home');
  assert.ok(calls.some(x=>x[0]==='stop'),'Leaving TV stops native playback');
 }finally{dom.window.close();}
});

test('a browser autoplay block retries the same stream muted and GREEN can re-enable audio',async()=>{
 let tries=0;
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  mockWindow(w);
  w.HTMLMediaElement.prototype.play=function(){
   tries++;
   if(this.muted)return Promise.resolve();
   return Promise.reject(Object.assign(new Error('user gesture required'),{name:'NotAllowedError'}));
  };
 }});
 try{
  const w=dom.window,d=dom.window.document;
  await pause(30);w.go('tv');w.chooseMagChannel(0);await pause(30);
  const video=d.getElementById('video');
  assert.equal(tries,2,'First unmuted autoplay is rejected, second is retried muted');
  assert.equal(video.muted,true,'Muted fallback is explicit and visible');
  assert.match(d.getElementById('magMuteButton').textContent,/AUDIO OFF/);
  orsay(w,404);await pause(30);
  assert.equal(video.muted,false,'Remote GREEN requests audio restoration');
  assert.ok(tries>=3,'Unmute attempts playback in the remote-key event');
 }finally{dom.window.close();}
});

test('unsupported HLS is diagnosed as decoder limitation rather than generic rejection',async()=>{
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:w=>{
  mockWindow(w);
  w.HTMLMediaElement.prototype.play=()=>Promise.reject(Object.assign(new Error('video not supported'),{name:'NotSupportedError'}));
 }});
 try{
  const w=dom.window,d=dom.window.document;
  await pause(30);w.go('tv');w.chooseMagChannel(0);await pause(30);
  assert.match(d.getElementById('magPreviewStatus').textContent,/UNSUPPORTED HLS/i);
  w.go('settings');
  assert.match(d.getElementById('decoderStatus').textContent,/Native MAG player: not exposed/);
  assert.match(d.getElementById('decoderStatus').textContent,/MSE: not available/);
 }finally{dom.window.close();}
});

test('Tamil TV opens all Tamil channels together and visibly distinguishes absent Sun Network stations',async()=>{
 const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,beforeParse:mockWindow});
 try{
  const w=dom.window,d=w.document;await pause(30);
  w.go('tamil');await pause(15);
  assert.equal(d.querySelector('.mag-group').textContent,'ALL TAMIL');
  assert.equal(d.querySelector('.mag-group').getAttribute('data-group'),'__tamil__');
  assert.equal(d.querySelectorAll('.mag-entry').length,2,'Tamil channels from distinct genres are collected');
  assert.match(d.querySelector('#status').textContent,/Sun TV \/ KTV \/ Sun Music are not in this public catalogue/);
  w.go('settings');
  assert.match(d.querySelector('#cards').textContent,/legacy-tamil\.m3u/);
 }finally{dom.window.close();}
});
