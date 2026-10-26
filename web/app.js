/* Santhos IPTV — original SNWD web portal. No paid backend; publicly indexed stream directory. */
(() => {
  'use strict';
  const OWNER = 'https://raw.githubusercontent.com/snwebdev211-jpg/Tamil-World-IPTV/main/playlists/';
  const $ = s => document.querySelector(s);
  const main = $('#mainContent');
  const video = $('#videoPlayer');
  const overlay = $('#playerOverlay');
  const backdrop = $('#videoBackdrop');
  const STATE_KEY = 'santhos-iptv-v1';
  const PAGES = {home:'Home',live:'Live TV',tamil:'Tamil TV',movies:'Movies',sports:'Sports',news:'News',music:'Music',kids:'Kids',favorites:'Favorites',recent:'Recently Watched',settings:'Settings',search:'Search'};
  const VIEW_CAT = {sports:'Sports',news:'News',music:'Music',kids:'Kids'};
  const CAT_ICONS = {Entertainment:'✦',Movies:'▣',Sports:'◉',News:'⌁',Music:'♫',Kids:'✳',Documentary:'◈',Religious:'◇',Series:'▤',Comedy:'☺',Other:'▦'};
  const CATEGORIES = ['All','Entertainment','Movies','Sports','News','Music','Kids','Documentary','Series','Comedy','Religious','Other'];
  const STORAGE_DEFAULT = {favorites:[],recent:[],theme:'default',source:'checked',hidden:[]};
  let saved = loadSaved();
  let channels = [], byKey = new Map(), view = 'home', activeFilter = 'All', resultLimit = 48,
      playing = null, activeList = [], searchText = '', currentHls = null, fetchSerial = 0,
      toastTimer = null, refreshPending = false, lastError = '';
  const icon = cat => CAT_ICONS[cat] || '▦';
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function safeLink(url) {
    try { const parsed = new URL(url, location.href); return /^https?:$/.test(parsed.protocol) ? parsed.href : ''; }
    catch (_) { return ''; }
  }
  function loadSaved() {
    try {
      const x = JSON.parse(localStorage.getItem(STATE_KEY) || '{}');
      return {...STORAGE_DEFAULT,...x,
        favorites:Array.isArray(x.favorites)?x.favorites:[],
        recent:Array.isArray(x.recent)?x.recent:[],
        hidden:Array.isArray(x.hidden)?x.hidden:[]};
    } catch (_) { return {...STORAGE_DEFAULT}; }
  }
  function store() {try {localStorage.setItem(STATE_KEY,JSON.stringify(saved));} catch(_) {}}
  function toast(message) {
    const box=$('#toast'); box.textContent=message; box.classList.add('visible');
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>box.classList.remove('visible'),3800);
  }
  function parseM3U(text) {
    if (!/^#EXTM3U/.test(text.replace(/^\uFEFF/,''))) throw new Error('Invalid channel playlist');
    const lines=text.split(/\r?\n/), output=[], seen=new Set();
    let meta=null;
    for(const raw of lines) {
      const line=raw.trim();
      if(line.startsWith('#EXTINF:')) {meta=line;continue;}
      if(!meta || !line || line.startsWith('#')) continue;
      const url=safeLink(line);
      const name=(meta.split(',').slice(1).join(',')||'Untitled Channel').trim();
      const group=(meta.match(/group-title="([^"]*)"/)||[])[1]||'Other';
      const logo=(meta.match(/tvg-logo="([^"]*)"/)||[])[1]||'';
      const tvgId=(meta.match(/tvg-id="([^"]*)"/)||[])[1]||'';
      const language=(meta.match(/tvg-language="([^"]*)"/)||[])[1]||'';
      meta=null;
      if(!url || !name) continue;
      const uniq=tvgId.toLowerCase()+'|'+url;
      if(seen.has(uniq))continue;seen.add(uniq);
      let isTamil=/^Tamil\s*\|/i.test(group) || /tamil|tamizh|தமிழ்/i.test(name+' '+language);
      let category=group.replace(/^Tamil\s*\|\s*/i,'').trim();
      const found=CATEGORIES.find(c=>c.toLowerCase()===category.toLowerCase());
      category=found||'Other';
      const quality=(name.match(/\b(4K|1080p|720p|576p|480p|360p|HD|FHD|SD)\b/i)||[])[1]||'LIVE';
      output.push({key:uniq,id:tvgId,name:name.replace(/\s*\((\d{3,4}p)\)\s*$/,''),url,group,category,logo:safeLink(logo),tamil:isTamil,quality,language});
    }
    return output;
  }
  function setChannelData(list) {
    channels=list;
    byKey=new Map(list.map(item=>[item.key,item]));
    $('#sidebarDot').classList.toggle('ready',list.length>0);
    $('#sidebarStatus').textContent=list.length.toLocaleString()+' indexed streams';
    $('#favCount').textContent=saved.favorites.filter(id=>byKey.has(id)).length;
    if(list.length===0)toast('No channel entries returned.');
    render();
  }
  async function getPlaylist(suffix, bypass=false) {
    const variants = [
      './playlists/'+suffix,
      OWNER+suffix
    ];
    const errors=[];
    for(const source of variants) {
      const address=source+(source.includes('?')?'&':'?')+'v='+(bypass?Date.now():Math.floor(Date.now()/600000));
      try {
        const response=await fetch(address,{mode:'cors',cache:bypass?'no-store':'default'});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const text=await response.text();
        if(!text.startsWith('#EXTM3U'))throw new Error('Not an M3U playlist');
        return parseM3U(text);
      } catch(e){errors.push(String(e.message||e));}
    }
    throw new Error('Could not load channels ('+errors[errors.length-1]+')');
  }
  async function refresh(bypass=false) {
    const number=++fetchSerial;
    refreshPending=true;
    $('#refreshBtn').disabled=true;
    $('#sidebarStatus').textContent='Refreshing channels...';
    const file=saved.source==='full'?'all-sources.m3u':'all.m3u';
    try{
      const result=await getPlaylist(file,bypass);
      if(number!==fetchSerial)return;
      setChannelData(result);
      if(bypass)toast('Updated '+result.length.toLocaleString()+' channels');
      lastError='';
    }catch(err){
      if(number!==fetchSerial)return;
      lastError=err.message;
      $('#sidebarStatus').textContent='Directory unavailable';
      if(channels.length===0)main.innerHTML=emptyHTML('Connection unavailable','Could not load the channel directory. Check your connection or open Settings to try again.','↻');
      toast('Could not refresh playlist: '+err.message);
    }finally {
      if(number===fetchSerial){refreshPending=false;$('#refreshBtn').disabled=false;}
    }
  }
  function setTheme(theme) {
    document.body.classList.remove('theme-cinema','theme-ocean','theme-royal');
    if(['cinema','ocean','royal'].includes(theme))document.body.classList.add('theme-'+theme);
    saved.theme=theme;store();
  }
  function navigate(next) {
    view=PAGES[next]?next:'home';
    activeFilter='All';resultLimit=48;
    $('.breadcrumb').innerHTML='<span>SANTHOS IPTV</span> / '+escapeHTML(PAGES[view].toUpperCase());
    document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.view===view));
    const side=$('#sidebar');side.classList.remove('open');$('#menuScrim').hidden=true;
    history.replaceState(null,'','#'+(view==='search'?'search':view));
    if(view!=='search' && searchText) {
      searchText='';
      $('#searchInput').value='';
    }
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function matching(viewName=view) {
    let result=channels.filter(c=>!saved.hidden.includes(c.key));
    if(viewName==='tamil')result=result.filter(c=>c.tamil);
    else if(viewName==='movies')result=result.filter(c=>c.category==='Movies');
    else if(VIEW_CAT[viewName])result=result.filter(c=>c.category===VIEW_CAT[viewName]);
    else if(viewName==='favorites')result=result.filter(c=>saved.favorites.includes(c.key));
    else if(viewName==='recent') {
      const positions=new Map(saved.recent.map((k,i)=>[k,i]));
      result=result.filter(c=>positions.has(c.key)).sort((a,b)=>positions.get(a.key)-positions.get(b.key));
    }
    if(activeFilter!=='All')result=result.filter(c=>c.category===activeFilter);
    const query=(viewName==='search'?searchText:'').trim().toLowerCase();
    if(query)result=result.filter(c=>(c.name+' '+c.group+' '+c.id+' '+c.language).toLowerCase().includes(query));
    return result;
  }
  function chipHTML(label) {
    return '<button class="filter-chip'+(activeFilter===label?' active':'')+'" data-filter="'+escapeHTML(label)+'" data-focusable>'+escapeHTML(label)+'</button>';
  }
  function channelCard(c) {
    const favorite=saved.favorites.includes(c.key);
    const id=escapeHTML(c.key);
    const short=c.name.split(/\s+/).slice(0,2).map(s=>s[0]||'').join('').toUpperCase().slice(0,3);
    const image=c.logo?'<img class="channel-logo" loading="lazy" src="'+escapeHTML(c.logo)+'" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="poster-placeholder" hidden>'+escapeHTML(short)+'</span>':'<span class="poster-placeholder">'+escapeHTML(short)+'</span>';
    return '<article class="channel-card" tabindex="0" role="button" aria-label="Play '+escapeHTML(c.name)+'" data-play="'+id+'" data-category="'+escapeHTML(c.category)+'" data-focusable>'+
      '<div class="channel-poster">'+image+'<span class="quality-chip">'+escapeHTML(c.quality.toUpperCase())+'</span><button class="fav-button'+(favorite?' on':'')+'" aria-label="'+(favorite?'Remove favorite':'Add favorite')+'" title="'+(favorite?'Remove favorite':'Add favorite')+'" data-fav="'+id+'" data-focusable>'+(favorite?'♥':'♡')+'</button></div>'+
      '<div class="channel-info"><span class="channel-name">'+escapeHTML(c.name)+'</span><div class="channel-meta"><span>'+escapeHTML(c.tamil?'Tamil · '+c.category:c.category)+'</span><span>·</span><span>Live</span></div></div></article>';
  }
  function cards(list) {return '<div class="channels-grid">'+list.map(channelCard).join('')+'</div>';}
  function emptyHTML(title,desc,symbol='⌕') {return '<div class="empty"><div class="empty-icon">'+symbol+'</div><h3>'+escapeHTML(title)+'</h3><p>'+escapeHTML(desc)+'</p><button class="primary-btn" data-view="live" data-focusable>Explore Live TV →</button></div>';}
  function section(title,subtitle,list,link) {
    if(!list.length)return '';
    return '<section class="content-section"><div class="section-heading"><div><h2>'+escapeHTML(title)+'</h2><p>'+escapeHTML(subtitle)+'</p></div><button class="inline-link" data-view="'+link+'" data-focusable>Explore all →</button></div>'+cards(list.slice(0,10))+'</section>';
  }
  function hero() {
    return '<section class="hero"><div class="hero-content"><span class="eyebrow">✧ THE SANTHOS EXPERIENCE</span>'+
      '<h1>Your world.<br><span>On screen.</span></h1><p>Tamil-first entertainment, live sports, news and more. One beautiful place to discover your next channel.</p>'+
      '<div class="hero-buttons"><button class="primary-btn" data-view="tamil" data-focusable>▶ Explore Tamil TV</button><button class="secondary-btn" data-view="live" data-focusable>▦ Browse all channels</button></div></div><div class="hero-art"><div class="orb"></div></div></section>';
  }
  function categoryTiles() {
    const categories=[['tamil','Tamil TV','அ'],['movies','Movies','▤'],['sports','Sports','◉'],['news','News','⌁'],['music','Music','♫']];
    return '<div class="category-row">'+categories.map(([key,name,symbol])=>{
      const count=matching(key).length;
      return '<button class="category-tile" data-view="'+key+'" data-focusable><span class="cat-corner"></span><span class="cat-icon">'+symbol+'</span><span><strong>'+name+'</strong><small style="display:block">'+count.toLocaleString()+' channel'+(count===1?'':'s')+'</small></span></button>';
    }).join('')+'</div>';
  }
  function home() {
    const tamil=channels.filter(c=>c.tamil&&!saved.hidden.includes(c.key));
    const movies=channels.filter(c=>c.category==='Movies'&&!saved.hidden.includes(c.key));
    const sports=channels.filter(c=>c.category==='Sports'&&!saved.hidden.includes(c.key));
    const recents=saved.recent.map(k=>byKey.get(k)).filter(Boolean);
    main.innerHTML=hero()+
      '<div class="quick-stats">'+[
        ['◉',channels.length,'Live streams'],
        ['அ',tamil.length,'Tamil channels'],
        ['▤',movies.length,'Movie channels'],
        ['♡',saved.favorites.filter(k=>byKey.has(k)).length,'Your favorites']
      ].map(([symbol,num,label])=>'<div class="stat-tile"><span class="stat-icon">'+symbol+'</span><div><div class="stat-num">'+num.toLocaleString()+'</div><div class="stat-label">'+label+'</div></div></div>').join('')+'</div>'+
      '<section class="content-section"><div class="section-heading"><div><h2>Browse your way</h2><p>All your favorite categories, one click away</p></div></div>'+categoryTiles()+'</section>'+
      (recents.length?section('Continue watching','Pick up where you left off',recents,'recent'):'')+
      section('Tamil TV spotlight','Entertainment from across Tamil-speaking communities',tamil,'tamil')+
      section('Movie channels','Live stations showing films, not an on-demand movie library',movies,'movies')+
      section('Sports, live','Sports streams from the public directory',sports,'sports')+
      '<div class="banner-note"><div><strong>Public channels, real-world availability</strong><p>Streams may be offline, geo-blocked, or unsupported by your browser. Sun TV and paid film catalogues are not guaranteed.</p></div><button class="inline-link" data-view="settings" data-focusable>Source settings →</button></div>';
  }
  function titleForView() {
    const copy={
      live:['Live TV','Every channel. Every category. Make the screen yours.'],
      tamil:['தமிழ் · Tamil TV','Tamil entertainment, music, news, movies and live TV.'],
      movies:['Movies & Cinema','Live movie channels. On-demand films appear only when a public authorized stream exists.'],
      sports:['Live Sports','Find sports channels from the currently indexed sources.'],
      news:['News','News channels from around the world.'],
      music:['Music','Music stations, hits and entertainment channels.'],
      kids:['Kids & Family','Family and children’s channels from the public directory.'],
      favorites:['Your Favorites','The channels you saved on this device.'],
      recent:['Recently Watched','Return to channels you opened earlier.'],
      search:['Search Results','Find channels by title, category or region.']
    };
    return copy[view]||copy.live;
  }
  function listing() {
    const [title,subtitle]=titleForView();
    let list=matching();
    activeList=list;
    const enabledFilters=['live','tamil','favorites','recent','search'].includes(view);
    const note=view==='movies'
      ? '<div class="banner-note"><div><strong>Movies section: live movie TV channels</strong><p>This isn\'t a Netflix-style full-film library yet. Public-domain or licensed on-demand titles can be added separately; empty listings are not fabricated.</p></div><a class="notice-link" target="_blank" rel="noopener noreferrer" href="'+OWNER+'tamil-movies-on-demand.m3u">On-demand catalogue ↗</a></div>'
      : '';
    const queryCaption=view==='search'?'Results for “'+escapeHTML(searchText)+'”':enabledFilters?'Filter by category':'Live channel catalogue';
    const slices=list.slice(0,resultLimit);
    main.innerHTML='<div class="head-spread"><div class="title-block"><span class="eyebrow">EXPLORE SANTHOS IPTV</span><h1>'+escapeHTML(title)+'</h1><p class="lead">'+escapeHTML(subtitle)+'</p></div><select class="section-select" id="sortSelect" aria-label="Sort channels" data-focusable><option value="default">Recommended order</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option></select></div>'+
      note+
      (enabledFilters?'<div class="filters">'+CATEGORIES.map(chipHTML).join('')+'</div>':'')+
      '<div class="results-summary"><span>'+queryCaption+'</span><span>'+list.length.toLocaleString()+' listed channels</span></div>'+
      (slices.length?cards(slices):emptyHTML(view==='favorites'?'No favorites yet':view==='recent'?'Nothing watched yet':'No matching channels',view==='favorites'?'Tap the heart on a channel to save it.':view==='recent'?'Play a channel and it will appear here.':'Try another category or search term.'))+
      (list.length>resultLimit?'<div class="load-more-wrap"><button class="secondary-btn" id="loadMore" data-focusable>Load more channels ('+(list.length-resultLimit).toLocaleString()+' remaining) ↓</button></div>':'');
  }
  function settings() {
    const sources=[['checked','Stream-checked directory (recommended)'],['full','All public listings (unverified, may fail)']];
    const themes=[['default','SNWD Midnight (default)'],['ocean','Deep Ocean'],['cinema','Cinema Amber'],['royal','Royal Violet']];
    main.innerHTML='<div class="title-block"><span class="eyebrow">PERSONALIZE YOUR SCREEN</span><h1>Settings</h1><p class="lead">Your preferences are saved only in this browser. No account required.</p></div>'+
      '<div class="settings-grid">'+
      '<section class="setting-card"><h3>Appearance</h3><p>Pick your Santhos IPTV color mood. This does not affect the playlist itself.</p><select id="themeSelect" class="setting-select" data-focusable>'+themes.map(([k,v])=>'<option value="'+k+'"'+(saved.theme===k?' selected':'')+'>'+v+'</option>').join('')+'</select></section>'+
      '<section class="setting-card"><h3>Channel directory</h3><p>The checked directory only confirms stream manifests responded from GitHub; it is not a guarantee of playback in your country.</p><select id="sourceSelect" class="setting-select" data-focusable>'+sources.map(([k,v])=>'<option value="'+k+'"'+(saved.source===k?' selected':'')+'>'+v+'</option>').join('')+'</select></section>'+
      '<section class="setting-card"><h3>Playback & navigation</h3><p>Use arrow keys to move focus on TVs, Enter/OK to select, Escape/Backspace to close the player. Some channels require external playback.</p><div class="setting-rows"><button class="ghost-btn" id="testStream" data-focusable>▶ Test sample HLS</button><button class="ghost-btn" id="manualRefresh" data-focusable>↻ Reload channels</button></div></section>'+
      '<section class="setting-card"><h3>Your data</h3><p>Favorites, recently viewed channels and hidden entries are stored locally on your device.</p><div class="setting-rows"><button class="ghost-btn" id="clearRecent" data-focusable>Clear watch history</button><button class="ghost-btn" id="clearFaves" data-focusable>Clear favorites</button></div></section>'+
      '<section class="setting-card"><h3>IPTV playlist link</h3><p>For standard IPTV players, your original M3U URL remains unchanged. It cannot create a custom Movies or Home menu inside other apps.</p><div class="setting-rows"><button class="ghost-btn" id="copyPlaylist" data-focusable>Copy M3U URL</button><a class="ghost-btn" href="'+OWNER+'all.m3u" target="_blank" rel="noopener noreferrer">Open playlist ↗</a></div></section>'+
      '<section class="setting-card"><h3>About Santhos IPTV</h3><p>Built with the official SNWD logo. An independent open-source web guide for publicly indexed streams, not a subscription streaming service.</p><a class="ghost-btn" href="https://github.com/snwebdev211-jpg/Tamil-World-IPTV" target="_blank" rel="noopener noreferrer">GitHub source ↗</a><p class="subtle-small" style="margin-top:13px">Source availability, licensing and TV codecs remain the responsibility of each upstream broadcaster.</p></section>'+
      '</div>';
  }
  function render() {
    if(view==='home')home();
    else if(view==='settings')settings();
    else listing();
  }
  function toggleFavorite(key) {
    if(saved.favorites.includes(key))saved.favorites=saved.favorites.filter(k=>k!==key);
    else saved.favorites.unshift(key);
    store();$('#favCount').textContent=saved.favorites.filter(id=>byKey.has(id)).length;
    if(playing?.key===key)$('#playerFavorite').textContent=saved.favorites.includes(key)?'♥ Favorited':'♡ Favorite';
    render();
  }
  function recordRecent(c) {
    saved.recent=[c.key,...saved.recent.filter(key=>key!==c.key)].slice(0,60);
    store();
  }
  function cleanupPlayer() {
    try {video.pause();video.removeAttribute('src');video.load();}catch(_){}
    if(currentHls){try{currentHls.destroy();}catch(_){}currentHls=null;}
  }
  function playerMessage(message, error=false) {
    backdrop.hidden=false;
    $('#playbackStatus').textContent=message;
    $('#playbackStatus').style.color=error?'#ffb4b5':'';
  }
  function playerSuccess(){backdrop.hidden=true;}
  function startVideo(url) {
    cleanupPlayer();
    playerMessage('Connecting to live broadcast…');
    const source=safeLink(url);
    if(!source){playerMessage('This channel has no safe playable URL.',true);return;}
    const isHls=/\.m3u8(?:$|[?#])/i.test(source);
    if(video.canPlayType('application/vnd.apple.mpegurl') && isHls) {
      video.src=source;video.play().catch(()=>playerMessage('Press Play to start this stream.'));
    } else if (isHls && window.Hls?.isSupported()) {
      try {
        currentHls=new window.Hls({enableWorker:true,maxBufferLength:20,backBufferLength:15,liveSyncDurationCount:3});
        currentHls.loadSource(source);
        currentHls.attachMedia(video);
        currentHls.on(window.Hls.Events.MANIFEST_PARSED,()=>video.play().catch(()=>playerMessage('Press Play to start this stream.')));
        currentHls.on(window.Hls.Events.ERROR,(_event,data)=>{
          if(!data.fatal)return;
          const kind=data.type==='networkError'?'Network / location / CORS error':'This format or stream may be unsupported';
          playerMessage(kind+'. Try another channel or open the direct source.',true);
        });
      }catch(_){playerMessage('Could not initialize this HLS stream.',true);}
    }else {
      video.src=source;
      video.play().catch(()=>playerMessage('This browser may not support the video. Try the direct source.',true));
      if(isHls&&!window.Hls)playerMessage('HLS decoder unavailable. Try another browser or the direct link.',true);
    }
  }
  function playChannel(key) {
    const c=byKey.get(key);
    if(!c){toast('Channel no longer in this directory. Try refreshing.');return;}
    playing=c;recordRecent(c);
    const title=c.name+' — Santhos IPTV';
    document.title=title;
    $('#playerTitle').textContent=c.name;
    $('#playerSubtitle').textContent=(c.tamil?'Tamil · ':'')+c.category+' · '+c.quality+' · Public stream';
    $('#playerFavorite').textContent=saved.favorites.includes(c.key)?'♥ Favorited':'♡ Favorite';
    $('#directLink').href=c.url;
    overlay.hidden=false;document.body.style.overflow='hidden';
    activeList=matching(view==='home'?'live':view);
    if(!activeList.find(x=>x.key===key))activeList=channels;
    startVideo(c.url);
    $('#closePlayer').focus();
  }
  function closePlayer() {
    if(overlay.hidden)return;
    cleanupPlayer();overlay.hidden=true;playing=null;document.body.style.overflow='';
    document.title='Santhos IPTV — Your world, on screen.';
    if(view==='recent'||view==='home')render();
  }
  function nextChannel(dir) {
    if(!playing || !activeList.length)return;
    const i=activeList.findIndex(x=>x.key===playing.key);
    const next=activeList[(i+dir+activeList.length)%activeList.length];
    playChannel(next.key);
  }
  function remoteMove(key) {
    const visible=Array.from(document.querySelectorAll('[data-focusable]:not([disabled])')).filter(x=>{
      if(overlay.hidden && overlay.contains(x))return false;
      if(!overlay.hidden && !overlay.contains(x))return false;
      const rect=x.getBoundingClientRect();
      return rect.width>0 && rect.height>0;
    });
    const current=document.activeElement;
    if(!visible.includes(current)){visible[0]?.focus();return;}
    const rect=current.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const angle=key==='ArrowLeft'?'left':key==='ArrowRight'?'right':key==='ArrowUp'?'up':'down';
    let winner=null,best=Infinity;
    for(const node of visible){
      if(node===current)continue;
      const b=node.getBoundingClientRect(),nx=b.left+b.width/2,ny=b.top+b.height/2;
      const dx=nx-x,dy=ny-y;
      if(angle==='right'&&dx<5||angle==='left'&&dx>-5||angle==='down'&&dy<5||angle==='up'&&dy>-5)continue;
      const primary=(angle==='left'||angle==='right')?Math.abs(dx):Math.abs(dy);
      const secondary=(angle==='left'||angle==='right')?Math.abs(dy):Math.abs(dx);
      const score=primary+secondary*2.8;
      if(score<best){best=score;winner=node;}
    }
    winner?.focus({preventScroll:false});
  }
  function bindEvents() {
    document.addEventListener('click',e=>{
      const fav=e.target.closest('[data-fav]');
      if(fav){e.preventDefault();e.stopPropagation();toggleFavorite(fav.dataset.fav);return;}
      const card=e.target.closest('[data-play]');
      if(card){playChannel(card.dataset.play);return;}
      const button=e.target.closest('[data-view]');
      if(button){navigate(button.dataset.view);return;}
      const chip=e.target.closest('[data-filter]');
      if(chip){activeFilter=chip.dataset.filter;resultLimit=48;listing();return;}
      if(e.target.closest('#loadMore')){resultLimit+=48;listing();return;}
      if(e.target.closest('#refreshBtn,#manualRefresh')){refresh(true);return;}
      if(e.target.closest('#closePlayer')){closePlayer();return;}
      if(e.target.closest('#retryPlayback')){if(playing)startVideo(playing.url);return;}
      if(e.target.closest('#playerPrev')){nextChannel(-1);return;}
      if(e.target.closest('#playerNext')){nextChannel(1);return;}
      if(e.target.closest('#playerFavorite')){if(playing)toggleFavorite(playing.key);return;}
      if(e.target.closest('#fullscreenButton')){if(video.requestFullscreen)video.requestFullscreen().catch(()=>toast('Fullscreen unavailable'));return;}
      if(e.target.closest('#pipButton')){if(video.requestPictureInPicture)video.requestPictureInPicture().catch(()=>toast('Picture-in-picture unavailable'));else toast('Picture-in-picture not supported');return;}
      if(e.target.closest('#clearRecent')){saved.recent=[];store();toast('Watch history cleared');return;}
      if(e.target.closest('#clearFaves')){saved.favorites=[];store();$('#favCount').textContent='0';toast('Favorites cleared');return;}
      if(e.target.closest('#copyPlaylist')){navigator.clipboard?.writeText(OWNER+'all.m3u').then(()=>toast('M3U playlist link copied')).catch(()=>toast(OWNER+'all.m3u'));return;}
      if(e.target.closest('#testStream')){playDiagnostic();return;}
      if(e.target.closest('#menuToggle')){$('#sidebar').classList.add('open');$('#menuScrim').hidden=false;return;}
      if(e.target===$('#menuScrim')){$('#sidebar').classList.remove('open');$('#menuScrim').hidden=true;}
    });
    document.addEventListener('change',e=>{
      if(e.target.id==='themeSelect'){setTheme(e.target.value);toast('Theme applied');}
      if(e.target.id==='sourceSelect'){saved.source=e.target.value;store();toast('Switching catalogue');refresh(true);}
      if(e.target.id==='sortSelect'){
        const sort=e.target.value;
        if(sort==='az')channels.sort((a,b)=>a.name.localeCompare(b.name));
        else if(sort==='za')channels.sort((a,b)=>b.name.localeCompare(a.name));
        render();
      }
    });
    $('#searchInput').addEventListener('input',e=>{
      searchText=e.target.value;
      if(searchText.trim()){view='search';activeFilter='All';resultLimit=48;render();$('.breadcrumb').innerHTML='<span>SANTHOS IPTV</span> / SEARCH';}
      else navigate('home');
    });
    document.addEventListener('keydown',e=>{
      const key=e.key;
      const inInput=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
      if(key==='/'&&!inInput&&overlay.hidden){e.preventDefault();$('#searchInput').focus();return;}
      if(key==='Escape'||key==='Backspace'&&!inInput){
        if(!overlay.hidden){e.preventDefault();closePlayer();return;}
        if($('#sidebar').classList.contains('open')){$('#sidebar').classList.remove('open');$('#menuScrim').hidden=true;return;}
        if(key==='Escape'&&inInput){document.activeElement.blur();return;}
      }
      if(inInput)return;
      if(key.startsWith('Arrow')){e.preventDefault();remoteMove(key);return;}
      if(key==='Enter' && document.activeElement.matches('.channel-card')){e.preventDefault();playChannel(document.activeElement.dataset.play);}
    });
    video.addEventListener('playing',playerSuccess);
    video.addEventListener('loadeddata',playerSuccess);
    video.addEventListener('waiting',()=>playerMessage('Buffering live stream…'));
    video.addEventListener('stalled',()=>playerMessage('Stream stalled. Try Retry or another channel.',true));
    video.addEventListener('error',()=>{
      if(video.error)playerMessage('Cannot play this broadcast on your device (code '+video.error.code+').',true);
    });
    window.addEventListener('hashchange',()=>{if(overlay.hidden){const hash=location.hash.slice(1);if(PAGES[hash]&&hash!==view)navigate(hash);}});
  }
  function playDiagnostic() {
    const c={key:'diagnostic',name:'HLS Playback Test — Big Buck Bunny',url:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',category:'Other',tamil:false,quality:'720p'};
    channels.push(c);byKey.set(c.key,c);
    playChannel(c.key);
    toast('Sample test video, not a live TV channel');
  }
  bindEvents();
  setTheme(saved.theme);
  const hash=location.hash.replace('#','');
  view=PAGES[hash]?hash:'home';
  navigate(view);
  refresh();
  if('serviceWorker' in navigator && location.protocol==='https:') {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();