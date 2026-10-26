/* Santhos IPTV MAG / Stalker compatibility API.
 * Public catalogue only; does not host/proxy media or bypass DRM.
 * The /c/ page provides our own classic remote-friendly UI.
 */
'use strict';
const crypto = require('node:crypto');
const SOURCE = 'https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/all.m3u';
const CATS = [
  ['1','Tamil Entertainment','Tamil | Entertainment'],
  ['2','Tamil Movies','Tamil | Movies'],
  ['3','Tamil News','Tamil | News'],
  ['4','Tamil Music','Tamil | Music'],
  ['5','Tamil Sports','Tamil | Sports'],
  ['6','Entertainment','Entertainment'],
  ['7','Movie Channels','Movies'],
  ['8','Sports','Sports'],
  ['9','News','News'],
  ['10','Music','Music'],
  ['11','Kids','Kids'],
  ['12','Documentary','Documentary'],
  ['13','Series','Series'],
  ['14','Religious','Religious'],
  ['15','Comedy','Comedy'],
  ['16','Other','Other'],
];
let cached = {expires:0, channels:[], updated:null, error:null};
let pending = null;
const TTL = 10*60*1000;
const MAX_CHANNELS = 3000;
function clean(text){return String(text||'').replace(/[\u0000-\u001f]/g,'').slice(0,300);}
function parseM3U(text){
  if (!/^#EXTM3U/.test(text.replace(/^\uFEFF/,''))) throw Error('Invalid upstream M3U');
  const entries = [], seen = new Set(), usedIds = new Set();
  let meta = null;
  for (const line0 of text.split(/\r?\n/)) {
    const line=line0.trim();
    if(line.startsWith('#EXTINF:')){meta=line;continue;}
    if(!meta||!line||line.startsWith('#'))continue;
    const old=meta;meta=null;
    let u;try{u=new URL(line);}catch(_){continue;}
    if(!['http:','https:'].includes(u.protocol)||u.username||u.password)continue;
    const a={};
    for(const m of old.matchAll(/([\w-]+)="([^"]*)"/g))a[m[1]]=m[2];
    const title=clean(old.slice(old.indexOf(',')+1)).replace(/\s*\(\d{3,4}p\)\s*$/,'');
    const group=clean(a['group-title']||'Other');
    if(!title||seen.has(title+'|'+line))continue;
    seen.add(title+'|'+line);
    // Stable 31-bit channel IDs mean channel URLs can move in the playlist
    // without pointing existing favorites or playback actions to a new station.
    const fingerprint=String(a['tvg-id']||title).toLowerCase()+'|'+line;
    let numeric=crypto.createHash('sha256').update(fingerprint).digest().readUInt32BE(0)&0x7fffffff;
    if(!numeric)numeric=1;
    while(usedIds.has(numeric)){numeric=(numeric%0x7fffffff)+1;}
    usedIds.add(numeric);
    const c={ id:String(numeric), name:title, number:String(entries.length+1),
      logo:a['tvg-logo']||'', tvg_id:a['tvg-id']||'', group, url:line };
    c.genre_id=(CATS.find(x=>x[2].toLowerCase()===group.toLowerCase())||CATS[15])[0];
    entries.push(c);
    if(entries.length>=MAX_CHANNELS)break;
  }
  return entries;
}
async function catalogue(){
  if(cached.channels.length && cached.expires>Date.now())return cached;
  if(pending)return pending;
  pending=(async()=>{
    try {
      const resp=await fetch(SOURCE,{headers:{'User-Agent':'Santhos-MAG/1.0'},signal:AbortSignal.timeout(9000)});
      if(!resp.ok)throw Error('Public playlist HTTP '+resp.status);
      const body=await resp.text();
      if(body.length>2500000)throw Error('Playlist exceeds safe size');
      const items=parseM3U(body);
      if(items.length<12)throw Error('Not enough public channels to serve');
      cached={expires:Date.now()+TTL,channels:items,updated:new Date().toISOString(),error:null};
    }catch(e){
      cached.error=String(e.message||e);
      cached.expires=Date.now()+60000;
      if(!cached.channels.length)throw e;
    }finally{pending=null;}
    return cached;
  })();
  return pending;
}
function cookieMac(req,params){
  const cookies={};
  for(const piece of String(req.headers.cookie||'').split(';')){
    const i=piece.indexOf('=');
    if(i>0){
      const name=piece.slice(0,i).trim(),raw=piece.slice(i+1).trim();
      // Malformed cookies must not take down the whole portal for an old TV.
      try{cookies[name]=decodeURIComponent(raw);}catch(_){cookies[name]=raw;}
    }
  }
  const raw=String(params.mac||cookies.mac||req.headers['x-device-mac']||'00:1A:79:00:00:01');
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(raw)?raw.toUpperCase():'00:1A:79:00:00:01';
}
function newToken(mac){
  const secret=process.env.MAG_PORTAL_SECRET||'public-open-playlist-non-authenticated';
  const slot=Math.floor(Date.now()/86400000);
  const sig=crypto.createHmac('sha256',secret).update(mac+'|'+slot).digest('hex');
  return sig;
}
function profile(mac){
  return {id:'1',name:'Santhos IPTV',fname:'Santhos',login:'Santhos Public',mac,
    status:0,stb_type:'MAG250',hd:'1',locale:'en_GB.utf8',lang:'en',
    timezone:'America/Toronto',default_timezone:'America/Toronto',
    country:'CA',city:'Toronto',max_locales:1,allowed_stb_types:['MAG250','MAG254','MAG322'],
    watchdog_timeout:120,playback_limit:0,now_playing_start:null,now_playing_type:null,
    time_shift_on:'0',time_shift_hours:'0',parent_password:'',pass:'',password:'',
    tariff_id:1,tariff_plan:'Free Public Streams',expire_billing_date:null,
    subscribed:'1',service_on:'1',account_page_by_password:'0',
    enable_tv:'1',enable_vod:'1',enable_series:'0',enable_radio:'0',
    enable_recorder:'0',enable_time_shift:'0',
    default_lang:'en',screensaver_delay:0,logo:'',units:'metric'};
}
function actionArgs(req){
  const base='https://localhost'+(req.url||'/');
  const query=new URL(base).searchParams;
  const params=Object.fromEntries(query.entries());
  if(req.body && typeof req.body==='object'){
    for(const [k,v] of Object.entries(req.body))if(!Object.hasOwn(params,k))params[k]=v;
  } else if(typeof req.body==='string'){
    for(const [k,v] of new URLSearchParams(req.body))if(!Object.hasOwn(params,k))params[k]=v;
  }
  return params;
}
function output(res,data,code=200){
  res.statusCode=code;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-User-Agent');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  return res.end(JSON.stringify({js:data}));
}
function mappedChannel(c){
  return {id:c.id,number:c.number,name:c.name,cmd:'ffmpeg '+c.url,
    logo:c.logo, tv_genre_id:c.genre_id, genre_id:c.genre_id,
    tv_archive:0, tv_archive_duration:0, tv_archive_type:0,
    use_http_tmp_link:1,status:1,enable_tv_archive:0,
    lock:0, bonus_ch:0, cname:c.name, xmltv_id:c.tvg_id,
    open:1, volume_correction:0, allow_pvr:0, time_shifted:0};
}
function ordered(items,params){
  const page=Math.max(1,Math.min(10000,parseInt(params.p,10)||1));
  const size=50;
  const start=(page-1)*size;
  return {data:items.slice(start,start+size).map(mappedChannel),
    total_items:items.length,max_page_items:size,cur_page:page};
}
module.exports=async function handler(req,res) {
  if(req.method==='OPTIONS'){res.statusCode=204;res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,X-User-Agent');res.end();return;}
  try {
    const p=actionArgs(req), action=String(p.action||'handshake'),type=String(p.type||'stb').toLowerCase();
    const mac=cookieMac(req,p);
    if(action==='handshake')return output(res,{token:newToken(mac),random:crypto.randomBytes(8).toString('hex'),not_valid_token:false});
    if(action==='get_profile')return output(res,profile(mac));
    if(action==='get_localization')return output(res,{locale:'en_GB.utf8',time_format:'24',language:'en'});
    if(action==='get_modules')return output(res,[
      {name:'TV',type:'itv',title:'Live TV'},
      {name:'Video club',type:'vod',title:'Movies (catalogue empty)'},
      {name:'Settings',type:'settings',title:'Settings'}
    ]);
    if(action==='get_main_info')return output(res,{phone:'',account_page_by_password:'0',login:'Santhos IPTV',tariff_id:'1',expire_billing_date:'unlimited',status:0,
      services:[{name:'itv',title:'Live TV',enabled:true},{name:'vod',title:'Movies',enabled:true}]});
    if(action==='get_time')return output(res,{time:new Date().toISOString(),timezone:'America/Toronto'});
    if(action==='get_fav_ids')return output(res,[]);
    if(action==='set_fav'||action==='set_last_id')return output(res,true);
    if(type==='vod'||type==='series') {
      if(action==='get_categories'||action==='get_genres')return output(res,[]);
      if(action==='get_ordered_list'||action==='get_all'||action==='get_all_channels')return output(res,{data:[],total_items:0,max_page_items:50,cur_page:1});
      if(action==='create_link')return output(res,{cmd:'',url:''});
      return output(res,[]);
    }
    const cat=await catalogue(), channels=cat.channels;
    if(action==='get_categories'||action==='get_genres'){
      const counts=new Map();
      for(const channel of channels)counts.set(channel.genre_id,(counts.get(channel.genre_id)||0)+1);
      return output(res,[{id:'*',title:'All',alias:'all',number:channels.length},
        ...CATS.filter(([id])=>(counts.get(id)||0)>0)
          .map(([id,title,group])=>({id,title,alias:group,number:counts.get(id)||0}))]);
    }
    if(action==='get_all_channels')return output(res,{data:channels.map(mappedChannel),total_items:channels.length,max_page_items:channels.length,cur_page:1});
    if(action==='get_ordered_list') {
      const genre=String(p.genre||p.category||'*');
      let list=(genre==='*'||genre==='0'||genre==='all')?channels:channels.filter(c=>c.genre_id===genre);
      const search=String(p.search||'').trim().toLowerCase().slice(0,80);
      if(search)list=list.filter(c=>c.name.toLowerCase().includes(search));
      return output(res,ordered(list,p));
    }
    if(action==='create_link'){
      // Never accept arbitrary commands, hosts, or URLs from a client.
      const id=String(p.ch_id||p.id||'');
      const cmd=String(p.cmd||'').trim();
      const byCmd=cmd.match(/^ffmpeg\s+(https?:\/\/\S+)$/i);
      const found=channels.find(c=>c.id===id || (byCmd && c.url===byCmd[1]));
      if(!found)return output(res,{cmd:'',url:'',error:'Unknown stream id'});
      // Alternatives are always from the published public catalogue; never
      // resolve arbitrary user-supplied addresses or private-network targets.
      const group=found.group.toLowerCase(),title=found.name.toLowerCase();
      const alternatives=channels.filter(c=>c.id!==found.id &&
        c.name.toLowerCase()===title && c.group.toLowerCase()===group)
        .slice(0,4).map(c=>c.url);
      return output(res,{cmd:'ffmpeg '+found.url,url:found.url,
        alternatives,load:1,streamer_id:0});
    }
    if(action==='get_short_epg'||action==='get_epg_info')return output(res,[]);
    if(action==='get_last_id')return output(res,{id:'0'});
    if(action==='get_account_info')return output(res,{login:'Santhos IPTV',tariff_plan:'Public streams',status:0,expire_billing_date:null});
    return output(res,[]);
  }catch(e){
    return output(res,{error:'Directory temporarily unavailable',details:String(e.message||e).slice(0,140)},503);
  }
};
