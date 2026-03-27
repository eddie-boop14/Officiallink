// detective-layer.js — Eddie v5 · officiallink.org
// Injected on every venue page. Activates via ?eddie=true

(function(){
  if(!window.location.search.includes('eddie=true')) return;

  const SB_URL = 'https://idbayfinsrdeuzeavsgc.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkYmF5Zmluc3JkZXV6ZWF2c2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjAyMzAsImV4cCI6MjA4OTIzNjIzMH0.vvwzfOLEBCPN8JAlBDcToLpV_k83SjK8AyZKWc89QVc';
  const SB_HEADERS = {'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'};

  // ── PARSE CURRENT PAGE ──────────────────────────────────────────
  function parsePage() {
    const d = document;
    const slug = window.location.pathname.replace(/^\/venue\//,'').replace(/\/$/,'').replace(/^.*\//,'') || 
                 window.location.pathname.split('/').filter(Boolean).pop() || '';

    const name   = d.querySelector('h1')?.textContent?.trim() || slug;
    const sub    = d.querySelector('.sub')?.textContent?.trim() || '';
    const crumbs = d.querySelectorAll('.crumb a');
    const city   = crumbs[1]?.textContent?.trim() || '';
    const country= crumbs[0]?.textContent?.trim() || '';

    // Links
    const sBook  = d.querySelector('.s-book');
    const sSite  = d.querySelector('.s-site');
    const sMap   = d.querySelector('.s-map');
    const bookUrl = sBook?.href || '';
    const siteUrl = sSite?.href || '';
    const mapsUrl = sMap?.href || '';

    // Price bars
    const pcOk   = d.querySelector('.pc-price.ok')?.textContent?.trim() || '';
    const pcBad  = d.querySelector('.pc-price.bad')?.textContent?.trim() || '';

    // Ticket tiers
    const tiers = [];
    d.querySelectorAll('.tix-card').forEach(card => {
      tiers.push({
        type:  card.querySelector('.tix-type')?.textContent?.trim() || '',
        price: card.querySelector('.tix-price')?.textContent?.trim() || '',
        note:  card.querySelector('.tix-note')?.textContent?.trim()  || ''
      });
    });

    // Toggles
    let hours='', closed='', metro='', duration='', audio='', freeDays='', photos='';
    d.querySelectorAll('.tg').forEach(tg => {
      const t = tg.textContent.trim();
      if(t.includes('🕐')) hours    = t.replace('🕐','').trim();
      if(t.includes('📅')) closed   = t.replace('📅','').replace('Closed','').trim();
      if(t.includes('🚇')) metro    = t.replace('🚇','').trim();
      if(t.includes('⏱'))  duration = t.replace('⏱','').trim();
      if(t.includes('🎧')) audio    = t.replace('🎧','').trim();
      if(t.includes('🆓')) freeDays = t.replace('🆓','').trim();
      if(t.includes('📷')) photos   = t.replace('📷','').trim();
    });

    // Crowd tip
    const crowdTip = d.querySelector('.crowd-tip')?.textContent?.replace('Best time:','').trim() || '';

    // Reseller range from pc-bad
    const reseller = pcBad || '';

    // Is free
    const isFree = !!d.querySelector('.alert-inner.green');

    // Verified badge
    const vcText = d.querySelector('.vc-text')?.textContent?.trim() || '';
    const vcDate = d.querySelector('.vc-date')?.textContent?.trim() || '';

    // Count filled fields for progress
    const fields = [bookUrl,siteUrl,mapsUrl,pcOk,reseller,hours,closed,metro,duration,audio,freeDays,photos,crowdTip,tiers.length>0?'y':''];
    const filled = fields.filter(Boolean).length;

    return {slug,name,sub,city,country,bookUrl,siteUrl,mapsUrl,pcOk,pcBad:reseller,tiers,hours,closed,metro,duration,audio,freeDays,photos,crowdTip,isFree,vcText,vcDate,filled,total:fields.length};
  }

  // ── STYLES ──────────────────────────────────────────────────────
  const css = `
  #eddie-panel{position:fixed;bottom:0;left:0;right:0;z-index:99999;font-family:'Figtree','Outfit',system-ui,sans-serif}
  #eddie-bar{background:linear-gradient(135deg,#1a0808,#2a0f0f);border-top:2px solid #ff4444;padding:.45rem .8rem;display:flex;align-items:center;gap:.6rem;cursor:pointer;user-select:none}
  #eddie-dot{width:10px;height:10px;background:#ff4444;border-radius:50%;animation:ep-pulse 1.5s infinite}
  @keyframes ep-pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.4)}50%{box-shadow:0 0 0 5px rgba(255,68,68,0)}}
  #eddie-title{font-size:.62rem;font-weight:800;color:#ff6666;flex:1;letter-spacing:.04em}
  #eddie-progress-wrap{flex:1;max-width:200px}
  #eddie-progress{height:4px;background:#2a1515;border-radius:2px;overflow:hidden}
  #eddie-progress-fill{height:100%;background:linear-gradient(90deg,#ff4444,#e8a832);border-radius:2px;transition:width .3s}
  #eddie-pct{font-size:.5rem;color:#888;margin-top:.15rem}
  #eddie-exp-gold{padding:.3rem .7rem;border-radius:5px;background:rgba(232,168,50,.15);color:#e8a832;border:1px solid rgba(232,168,50,.3);font-size:.58rem;font-weight:700;cursor:pointer;font-family:inherit}
  #eddie-exp-all{padding:.3rem .7rem;border-radius:5px;background:rgba(45,179,74,.12);color:#34c759;border:1px solid rgba(45,179,74,.25);font-size:.58rem;font-weight:700;cursor:pointer;font-family:inherit}
  #eddie-toggle{padding:.3rem .6rem;border-radius:5px;background:rgba(255,68,68,.1);color:#ff6666;border:1px solid rgba(255,68,68,.2);font-size:.58rem;font-weight:700;cursor:pointer;font-family:inherit}
  #eddie-form{background:#0d0f18;border-top:1px solid #252d3f;max-height:60vh;overflow-y:auto;padding:.8rem;display:none}
  #eddie-form.open{display:block}
  .ep-section{margin-bottom:1rem}
  .ep-sec-title{font-size:.52rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem;display:flex;align-items:center;gap:.3rem}
  .ep-sec-title.red{color:#ff4444}.ep-sec-title.gold{color:#e8a832}.ep-sec-title.blue{color:#4d8bff}
  .ep-row{margin-bottom:.4rem}
  .ep-label{font-size:.48rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.15rem}
  .ep-input{width:100%;background:#12151f;border:1px solid #252d3f;border-radius:6px;padding:.45rem .6rem;font-size:.7rem;color:#e2dfd8;font-family:'JetBrains Mono',monospace;outline:none;transition:border-color .15s}
  .ep-input:focus{border-color:#ff4444}
  .ep-hint{font-size:.42rem;color:#4a4d55;margin-top:.1rem}
  .ep-tiers{display:flex;flex-direction:column;gap:.3rem;margin-bottom:.3rem}
  .ep-tier{display:flex;gap:.3rem;align-items:center}
  .ep-tier input{flex:1;background:#12151f;border:1px solid #252d3f;border-radius:5px;padding:.35rem .5rem;font-size:.65rem;color:#e2dfd8;outline:none;font-family:inherit}
  .ep-tier input:focus{border-color:#e8a832}
  .ep-tier-del{width:22px;height:22px;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.2);border-radius:4px;color:#ff4444;cursor:pointer;font-size:.7rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .ep-add-tier{padding:.3rem .6rem;background:rgba(232,168,50,.08);color:#e8a832;border:1px dashed rgba(232,168,50,.3);border-radius:5px;font-size:.58rem;cursor:pointer;font-family:inherit;width:100%}
  .ep-toggles{display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.3rem}
  .ep-tg{padding:.3rem .6rem;border-radius:5px;font-size:.58rem;font-weight:600;cursor:pointer;border:1px solid;transition:all .15s;font-family:inherit}
  .ep-tg.off{background:#12151f;color:#4a4d55;border-color:#252d3f}
  .ep-tg.on{background:rgba(45,179,74,.1);color:#34c759;border-color:rgba(45,179,74,.25)}
  .ep-tg.on.reseller{background:rgba(255,68,68,.1);color:#ff4444;border-color:rgba(255,68,68,.25)}
  .ep-reseller-warn{font-size:.5rem;color:#e8a832;background:rgba(232,168,50,.06);border:1px solid rgba(232,168,50,.15);border-radius:5px;padding:.3rem .5rem;margin-top:.3rem}
  .ep-save{width:100%;padding:.6rem;background:linear-gradient(135deg,#cc2222,#ff4444);color:#fff;border:none;border-radius:7px;font-size:.72rem;font-weight:800;cursor:pointer;font-family:inherit;letter-spacing:.03em;margin-top:.3rem;transition:all .15s}
  .ep-save:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(255,68,68,.3)}
  .ep-saved{text-align:center;font-size:.58rem;color:#34c759;margin-top:.3rem;display:none}
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── BUILD PANEL ─────────────────────────────────────────────────
  const data = parsePage();
  let tiers = [...data.tiers];
  if(!tiers.length) tiers = [{type:'Adult',price:'',note:''},{type:'Under 18',price:'Free',note:'Worldwide'},{type:'Under 26 EU',price:'Free',note:'EU · ID'}];

  let toggles = {tour:false, audio:false, free:data.isFree, park:false, reseller:false};
  if(data.audio) toggles.audio = true;

  const pct = Math.round((data.filled/data.total)*100);
  const colorPct = pct >= 70 ? '#34c759' : pct >= 40 ? '#e8a832' : '#ff4444';

  const panel = document.createElement('div');
  panel.id = 'eddie-panel';
  panel.innerHTML = `
  <div id="eddie-bar" onclick="document.getElementById('eddie-form').classList.toggle('open');document.getElementById('eddie-toggle').textContent=document.getElementById('eddie-form').classList.contains('open')?'▼':'▲'">
    <div id="eddie-dot"></div>
    <div id="eddie-title">🔴 EDDIE v5 — ${data.name}</div>
    <div id="eddie-progress-wrap">
      <div id="eddie-progress"><div id="eddie-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${colorPct},${colorPct}aa)"></div></div>
      <div id="eddie-pct" style="color:${colorPct}">${data.filled}/${data.total} fields · ${pct}% ${pct<50?'🔴 Needs data':pct<80?'🟡 Good':'✅ Complete'}</div>
    </div>
    <button id="eddie-exp-gold" onclick="event.stopPropagation();exportGold()">📦 Export Gold</button>
    <button id="eddie-exp-all" onclick="event.stopPropagation();exportAll()">📦 Export All</button>
    <button id="eddie-toggle">▲</button>
  </div>

  <div id="eddie-form" class="open">

    <div class="ep-section">
      <div class="ep-sec-title red">📋 CORE — LINKS & PRICE</div>
      <div class="ep-row"><div class="ep-label">Price (official display)</div><input class="ep-input" id="ep-price" value="${data.pcOk}" placeholder="€16 or Free"></div>
      <div class="ep-row"><div class="ep-label">Book URL</div><input class="ep-input" id="ep-book" value="${data.bookUrl}" placeholder="https://..."><div class="ep-hint">Direct booking page</div></div>
      <div class="ep-row"><div class="ep-label">Website</div><input class="ep-input" id="ep-site" value="${data.siteUrl}" placeholder="https://..."></div>
      <div class="ep-row"><div class="ep-label">Maps</div><input class="ep-input" id="ep-maps" value="${data.mapsUrl}" placeholder="https://maps.app.goo.gl/..."></div>
    </div>

    <div class="ep-section">
      <div class="ep-sec-title gold">🎟 TICKET TIERS</div>
      <div class="ep-tiers" id="ep-tiers-list">${tiers.map((t,i)=>`
        <div class="ep-tier" id="ep-tier-${i}">
          <input placeholder="Type (Adult / Under 18...)" value="${t.type}">
          <input placeholder="€X or Free" value="${t.price}" style="max-width:80px">
          <input placeholder="Note" value="${t.note}">
          <div class="ep-tier-del" onclick="delTier(${i})">✕</div>
        </div>`).join('')}
      </div>
      <button class="ep-add-tier" onclick="addTier()">+ Add tier</button>
    </div>

    <div class="ep-section">
      <div class="ep-sec-title blue">🕐 VISIT INFO</div>
      <div class="ep-row"><div class="ep-label">Hours</div><input class="ep-input" id="ep-hours" value="${data.hours}" placeholder="Tue–Sun 9:00–18:00 | Mon closed"><div class="ep-hint">Days Time | Late night | Special hours</div></div>
      <div class="ep-row"><div class="ep-label">Closed</div><input class="ep-input" id="ep-closed" value="${data.closed}" placeholder="Mondays + Jan 1, May 1"></div>
      <div class="ep-row"><div class="ep-label">Metro</div><input class="ep-input" id="ep-metro" value="${data.metro}" placeholder="Line 4 · RER B"></div>
      <div class="ep-row"><div class="ep-label">Duration</div><input class="ep-input" id="ep-duration" value="${data.duration}" placeholder="1.5–2.5 hours"></div>
      <div class="ep-row"><div class="ep-label">Audio</div><input class="ep-input" id="ep-audio" value="${data.audio}" placeholder="€6 / included / none"></div>
      <div class="ep-row"><div class="ep-label">Free Days</div><input class="ep-input" id="ep-freedays" value="${data.freeDays}" placeholder="1st Sun / never"></div>
      <div class="ep-row"><div class="ep-label">Photos</div><input class="ep-input" id="ep-photos" value="${data.photos}" placeholder="OK · no flash / Not allowed"></div>
    </div>

    <div class="ep-section">
      <div class="ep-sec-title" style="color:#e04848">📊 CROWD & RESELLERS</div>
      <div class="ep-row"><div class="ep-label">Crowd note</div><input class="ep-input" id="ep-crowd" value="${data.crowdTip}" placeholder="Busiest: Sat. Quietest: Thu eve."></div>
      <div class="ep-row"><div class="ep-label">Reseller €</div><input class="ep-input" id="ep-reseller" value="${data.pcBad}" placeholder="€25–€45"><div class="ep-reseller-warn">⚠️ Check GYG/Viator — signal any reseller links found</div></div>
    </div>

    <div class="ep-section">
      <div class="ep-sec-title" style="color:#9b6bff">⚙️ TOGGLES</div>
      <div class="ep-toggles">
        <button class="ep-tg ${toggles.tour?'on':'off'}" id="tg-tour" onclick="togTg('tour',this)">🎫 Tour</button>
        <button class="ep-tg ${toggles.audio?'on':'off'}" id="tg-audio" onclick="togTg('audio',this)">🎧 Audio</button>
        <button class="ep-tg ${toggles.free?'on':'off'}" id="tg-free" onclick="togTg('free',this)">🆓 Free</button>
        <button class="ep-tg ${toggles.park?'on':'off'}" id="tg-park" onclick="togTg('park',this)">🌳 Park</button>
        <button class="ep-tg ${toggles.reseller?'on reseller':'off'}" id="tg-reseller" onclick="togTg('reseller',this)">🚩 Reseller Found</button>
      </div>
    </div>

    <button class="ep-save" onclick="saveGold()">💾 Save Gold Standard</button>
    <div class="ep-saved" id="ep-saved">✅ Saved to session</div>

  </div>
  `;

  document.body.appendChild(panel);
  // Add bottom padding so sticky buttons aren't hidden
  document.body.style.paddingBottom = '200px';

  // ── TIER MANAGEMENT ─────────────────────────────────────────────
  window.addTier = function(){
    tiers.push({type:'',price:'',note:''});
    renderTiers();
  };
  window.delTier = function(i){
    tiers.splice(i,1);
    renderTiers();
  };

  function renderTiers(){
    const list = document.getElementById('ep-tiers-list');
    list.innerHTML = tiers.map((t,i)=>`
      <div class="ep-tier" id="ep-tier-${i}">
        <input placeholder="Type" value="${t.type}" oninput="tiers[${i}].type=this.value">
        <input placeholder="€X or Free" value="${t.price}" style="max-width:80px" oninput="tiers[${i}].price=this.value">
        <input placeholder="Note" value="${t.note}" oninput="tiers[${i}].note=this.value">
        <div class="ep-tier-del" onclick="delTier(${i})">✕</div>
      </div>`).join('');
  }

  // ── TOGGLES ─────────────────────────────────────────────────────
  window.togTg = function(key, btn){
    toggles[key] = !toggles[key];
    btn.className = 'ep-tg ' + (toggles[key] ? (key==='reseller'?'on reseller':'on') : 'off');
  };

  // ── COLLECT DATA ────────────────────────────────────────────────
  function collect(){
    // Sync tier inputs before export
    document.querySelectorAll('.ep-tier').forEach((row,i)=>{
      const inputs = row.querySelectorAll('input');
      if(inputs[0]) tiers[i] = {type:inputs[0].value, price:inputs[1]?.value||'', note:inputs[2]?.value||''};
    });
    return {
      name: data.name,
      slug: data.slug,
      city: data.city,
      country: data.country,
      status: 'verified',
      verified_by: 'eddie',
      version: 'gold-v5',
      timestamp: new Date().toISOString(),
      website_url: document.getElementById('ep-site').value.trim(),
      site_enabled: !!document.getElementById('ep-site').value.trim(),
      booking_url: document.getElementById('ep-book').value.trim(),
      book_enabled: !!document.getElementById('ep-book').value.trim(),
      maps_url: document.getElementById('ep-maps').value.trim(),
      price: document.getElementById('ep-price').value.trim(),
      reseller_range: document.getElementById('ep-reseller').value.trim(),
      ticket_tiers: JSON.stringify(tiers.filter(t=>t.type||t.price)),
      hours: document.getElementById('ep-hours').value.trim(),
      closed_days: document.getElementById('ep-closed').value.trim(),
      metro: document.getElementById('ep-metro').value.trim(),
      duration: document.getElementById('ep-duration').value.trim(),
      audio_price: document.getElementById('ep-audio').value.trim(),
      free_days: document.getElementById('ep-freedays').value.trim(),
      photos: document.getElementById('ep-photos').value.trim(),
      crowd_tip: document.getElementById('ep-crowd').value.trim(),
      is_free: toggles.free,
      tour_available: toggles.tour,
      audio_available: toggles.audio,
      reseller_found: toggles.reseller,
    };
  }

  // ── SAVE ────────────────────────────────────────────────────────
  window.saveGold = async function(){
    const v = collect();
    // Save to localStorage session
    const log = JSON.parse(localStorage.getItem('eddie_session')||'[]');
    const idx = log.findIndex(l=>l.slug===v.slug);
    if(idx>=0) log[idx]=v; else log.push(v);
    localStorage.setItem('eddie_session', JSON.stringify(log));
    // Show saved
    const s = document.getElementById('ep-saved');
    s.style.display='block';
    setTimeout(()=>s.style.display='none', 2000);
    // Try Supabase
    try {
      await fetch(SB_URL+'/rest/v1/verifications', {
        method:'POST',
        headers:{...SB_HEADERS,'Prefer':'resolution=merge-duplicates'},
        body: JSON.stringify({...v, page: window.location.pathname})
      });
    } catch(e){}
    // Update progress
    updateProgress(v);
  };

  function updateProgress(v){
    const fields = [v.booking_url,v.website_url,v.maps_url,v.price,v.reseller_range,v.hours,v.closed_days,v.metro,v.duration,v.audio_price,v.free_days,v.photos,v.crowd_tip,v.ticket_tiers&&v.ticket_tiers!=='[]'?'y':''];
    const filled = fields.filter(Boolean).length;
    const pct = Math.round((filled/fields.length)*100);
    const color = pct>=70?'#34c759':pct>=40?'#e8a832':'#ff4444';
    document.getElementById('eddie-progress-fill').style.cssText = `width:${pct}%;background:linear-gradient(90deg,${color},${color}aa)`;
    document.getElementById('eddie-pct').textContent = `${filled}/${fields.length} fields · ${pct}% ${pct<50?'🔴 Needs data':pct<80?'🟡 Good':'✅ Complete'}`;
    document.getElementById('eddie-pct').style.color = color;
  }

  // ── EXPORT ──────────────────────────────────────────────────────
  window.exportGold = function(){
    const v = collect();
    download([v], `eddie-gold-${v.slug}.json`);
  };

  window.exportAll = function(){
    const log = JSON.parse(localStorage.getItem('eddie_session')||'[]');
    const v = collect();
    // Merge current into session
    const idx = log.findIndex(l=>l.slug===v.slug);
    if(idx>=0) log[idx]=v; else log.push(v);
    download(log, `eddie-session-${Date.now()}.json`);
  };

  function download(data, filename){
    const a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));
    a.download = filename;
    a.click();
  }

})();
