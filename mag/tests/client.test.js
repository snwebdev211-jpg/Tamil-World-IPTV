const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('mag/c/index.html','utf8');
const errors=[];
function mockWindow(w){
  const list=[
    {id:'1',number:'1',name:'Tamil News One',logo:'',genre_id:'3',url:'https://media.example.org/tamil.m3u8'},
    {id:'2',number:'2',name:'World Sports',logo:'',genre_id:'8',url:'https://media.example.org/sport.m3u8'},
    {id:'3',number:'3',name:'Tamil Cinema',logo:'',genre_id:'2',url:'https://media.example.org/cinema.m3u8'},
  ];
  const groups=[
    {id:'*',title:'All',alias:'all',number:3},
    {id:'3',title:'Tamil News',alias:'Tamil | News',number:1},
    {id:'8',title:'Sports',alias:'Sports',number:1},
    {id:'2',title:'Tamil Movies',alias:'Tamil | Movies',number:1}
  ];
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
      if(action==='get_genres')data=groups;
      if(action==='get_all_channels')data={data:list,total_items:list.length};
      if(action==='get_ordered_list'){
        let items=list.filter(x=>p.get('genre')==='*'||x.genre_id===p.get('genre'));
        if(p.get('search'))items=items.filter(x=>x.name.toLowerCase().includes(p.get('search').toLowerCase()));
        data={data:items,total_items:items.length,cur_page:1,max_page_items:50};
      }
      if(action==='create_link')data={url:list.find(x=>x.id===p.get('ch_id'))?.url||''};
      this.responseText=JSON.stringify({js:data||[]});
      this.readyState=4;if(this.onreadystatechange)this.onreadystatechange();
    }
  };
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
test('classic Santhos MAG UI navigates all key screens, bookmarks and player',async()=>{
  const vc=new VirtualConsole();
  vc.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://santhos-iptv.vercel.app/stalker_portal/c/index.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse:mockWindow});
  const w=dom.window,d=w.document;
  try {
    await pause(130);
    assert.match(d.querySelector('#main').textContent,/SANTHOS IPTV/);
    assert.ok(d.querySelector('.classic-home'),'Classic MAG home is visible');
    assert.ok(d.querySelector('.classic-categories'),'TV categories panel is visible');
    assert.equal(d.querySelectorAll('.classic-card-box').length,3,'Three home carousel tiles');
    assert.match(d.querySelector('#classic-carousel-cards').textContent,/VIDEO CLUB/);
    w.changeHomeCarousel(1);
    assert.match(d.querySelector('#classic-carousel-cards').textContent,/TAMIL TV/);
    w.changeHomeCarousel(-1);
    d.querySelector('.classic-tile[title="Live television"]').click();
    assert.match(d.querySelector('#main').textContent,/Live Television/,'TV tile opens categories');
    w.go('home');
    assert.match(d.querySelector('#main').textContent,/3 streams indexed/);
    w.go('tamil');
    assert.match(d.querySelector('#main').textContent,/Tamil News/);
    w.go('group:3');
    assert.match(d.querySelector('#main').textContent,/Tamil News One/);
    const star=d.querySelector('button.star');
    assert.ok(star,'Favorite star visible alongside channel');
    star.click();
    w.go('favorites');
    assert.match(d.querySelector('#main').textContent,/Tamil News One/);
    assert.ok(w.localStorage.getItem('snwd_santhos_favorites'));
    d.querySelector('.row[data-channel="1"]').click();
    await pause(5);
    assert.equal(d.querySelector('#videoPanel').style.display,'block');
    w.closeVideo();
    w.go('recent');
    assert.match(d.querySelector('#main').textContent,/Tamil News One/);
    w.go('movies');
    assert.match(d.querySelector('#main').textContent,/Tamil Movies/);
    w.go('sports');
    assert.match(d.querySelector('#main').textContent,/Sports/);
    w.go('search');
    d.getElementById('filter').value='sport';
    w.searchNow();
    assert.match(d.querySelector('#main').textContent,/World Sports/);
    assert.equal(d.querySelectorAll('.row[data-channel]').length,1);
    w.go('home');
    assert.match(d.querySelector('#main').textContent,/FAVORITES/);
    assert.equal(errors.length,0,'No browser script errors: '+errors.join(' | '));
  } finally {dom.window.close();}
});
