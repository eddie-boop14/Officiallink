/* site.js — officiallink.org
   Handles: FAQ accordion + photo carousel
   Deploy to repo root: /site.js
   All venue pages load this via <script defer src="/site.js">
*/

/* ── FAQ accordion ──────────────────────────────────────────────── */
document.querySelectorAll('.fq-q').forEach(q => {
  q.addEventListener('click', () => q.parentElement.classList.toggle('open'))
})

/* ── Photo carousel ─────────────────────────────────────────────── */
;(function(){
  const dataEl = document.getElementById('venue-photos')
  if(!dataEl) return

  let photos
  try { photos = JSON.parse(dataEl.textContent) } catch(e){ return }
  if(!Array.isArray(photos) || photos.length === 0) return

  const mount = document.getElementById('carousel-mount')
  if(!mount) return

  // show the section now we know photos exist
  const sec = document.getElementById('photo-sec')
  if(sec) sec.style.display = ''

  const licenceURL = {
    '2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
    '3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
    '4.0': 'https://creativecommons.org/licenses/by-sa/4.0/'
  }

  const slides = photos.map(p => {
    const lic  = p.licence || '4.0'
    const lurl = licenceURL[lic] || licenceURL['4.0']
    return `
    <div class="car-slide">
      <img class="car-img" src="${p.src}" alt="${p.alt || ''}" loading="lazy"/>
      <div class="car-cap">
        <a href="${p.url}" target="_blank" rel="noopener">${p.author}</a>
        &nbsp;·&nbsp;Wikimedia Commons&nbsp;·&nbsp;
        <a href="${lurl}" target="_blank" rel="noopener">CC BY-SA ${lic}</a>
      </div>
    </div>`
  }).join('')

  const dots = photos.map((_,i) =>
    `<div class="car-dot${i===0?' active':''}" data-i="${i}"></div>`
  ).join('')

  mount.innerHTML = `
    <div class="car-wrap">
      <div class="car-track" id="carTrack">${slides}</div>
      <button class="car-btn car-prev" aria-label="Previous">&#8249;</button>
      <button class="car-btn car-next" aria-label="Next">&#8250;</button>
    </div>
    <div class="car-dots">${dots}</div>
  `

  const track     = mount.querySelector('#carTrack')
  const allSlides = mount.querySelectorAll('.car-slide')
  const allDots   = mount.querySelectorAll('.car-dot')
  const total     = allSlides.length
  let cur = 0

  function goTo(n){
    cur = (n + total) % total
    const w = allSlides[0].offsetWidth + 8
    track.style.transform = `translateX(-${cur * w}px)`
    allDots.forEach((d,i) => d.classList.toggle('active', i===cur))
  }

  mount.querySelector('.car-prev').addEventListener('click', () => goTo(cur-1))
  mount.querySelector('.car-next').addEventListener('click', () => goTo(cur+1))
  allDots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)))

  let sx = 0
  track.addEventListener('touchstart', e => { sx = e.touches[0].clientX }, {passive:true})
  track.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - sx
    if(Math.abs(dx) > 40) goTo(dx < 0 ? cur+1 : cur-1)
  }, {passive:true})

  window.addEventListener('resize', () => goTo(cur))
})()

