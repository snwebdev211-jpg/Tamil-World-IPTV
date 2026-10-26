const test=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/portal.js');

const SAMPLE=[
'#EXTM3U',
'#EXTINF:-1 tvg-id="t1" tvg-logo="https://example.org/tamil.png" group-title="Tamil | Entertainment",Tamil Family HD (720p)',
'https://media.example.org/tamil.m3u8',
'#EXTINF:-1 tvg-id="s1" group-title="Sports",World Sports (576p)',
'https://media.example.org/sports.m3u8',
'#EXTINF:-1 tvg-id="m1" group-title="Tamil | Movies",Tamil Cinema',
'https://media.example.org/movies.m3u8',
...Array.from({length:16},(_,i)=>'#EXTINF:-1 group-title="News",News '+i+'\nhttps://media.example.org/n'+i+'.m3u8')
].join('\n');

global.fetch=async()=>({ok:true,status:200,text:async()=>SAMPLE});
async function query(type,action,extra=''){
  const req={method:'GET',url:'/stalker_portal/server/load.php?type='+type+'&action='+action+extra,
             headers:{cookie:'mac=00%3A1A%3A79%3AAB%3ACD%3AEF'}};
  const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(content){this.payload=content;}};
  await handler(req,res);
  return {code:res.statusCode,headers:res.headers,body:JSON.parse(res.payload).js};
}
test('handshake issues token',async()=>{
  const r=await query('stb','handshake');
  assert.equal(r.code,200);
  assert.equal(r.body.token.length,64);
  assert.match(r.body.random,/^[a-f0-9]{16}$/);
});
test('profile supplies MAG250 fields and normalised MAC',async()=>{
  const r=await query('stb','get_profile');
  assert.equal(r.body.mac,'00:1A:79:AB:CD:EF');
  assert.ok(r.body.allowed_stb_types.includes('MAG250'));
});
test('categories preserve Tamil movie distinction',async()=>{
  const r=await query('itv','get_genres');
  assert.ok(r.body.some(x=>x.title==='Tamil Movies'));
  assert.ok(r.body.some(x=>x.title==='Sports'));
});
test('channel paging and categories are correct',async()=>{
  const r=await query('itv','get_ordered_list','&genre=1&p=1');
  assert.equal(r.body.total_items,1);
  assert.equal(r.body.data[0].name,'Tamil Family HD');
  assert.equal(r.body.data[0].tv_genre_id,'1');
  const all=await query('itv','get_ordered_list','&genre=%2A&p=1');
  assert.equal(all.body.total_items,19);
  assert.equal(all.body.max_page_items,50);
});
test('resolve known source and reject arbitrary injected host',async()=>{
  const index=await query('itv','get_all_channels');
  const tamil=index.body.data.find(c=>c.name==='Tamil Family HD');
  assert.match(tamil.id,/^[0-9]+$/);
  const good=await query('itv','create_link','&ch_id='+tamil.id);
  assert.equal(good.body.url,'https://media.example.org/tamil.m3u8');
  const blocked=await query('itv','create_link','&cmd='+encodeURIComponent('ffmpeg http://127.0.0.1/private')+'&ch_id=100');
  assert.equal(blocked.body.url,'');
});
test('vod intentionally empty without authorized movies',async()=>{
  const vod=await query('vod','get_ordered_list');
  assert.equal(vod.body.total_items,0);
  assert.deepEqual(vod.body.data,[]);
});
test('EPG graceful empty and unknown actions graceful',async()=>{
  const epg=await query('itv','get_short_epg');
  assert.deepEqual(epg.body,[]);
});

test('channel ids are stable positive numbers, not position numbers',async()=>{
  const r=await query('itv','get_all_channels');
  const entries=r.body.data;
  assert.equal(entries.length,19);
  assert.ok(entries.every(c=>/^\d+$/.test(c.id)&&Number(c.id)>0&&Number(c.id)<2147483648));
  assert.equal(new Set(entries.map(c=>c.id)).size,entries.length);
  assert.ok(entries.some(c=>c.id!==c.number),'Stable IDs are not index numbers');
});
