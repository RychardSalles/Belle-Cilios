// ============ CATÁLOGO ============
// Os produtos vêm de js/products-data.js (catálogo local) e js/products-store.js
// (camada que troca automaticamente para o Firestore quando configurado).

const WHATSAPP_NUMBER = "5511978869996";

function buildWhatsappLink(productName){
  const msg = `Oi, Belle Cílios! Tenho interesse no modelo "${productName}" ✨ Pode me passar mais informações?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ============ RENDER CATÁLOGO ============
function renderProducts(products){
  const grid = document.getElementById("productGrid");
  if(!grid) return;

  grid.innerHTML = products.map(p => {
    const tags = p.tags || [];
    const thumbMedia = p.img
      ? `<img src="${p.img}" alt="${p.nome} - Belle Cílios" loading="lazy">`
      : `<div class="product-placeholder"><span class="ph-emoji">${p.emoji || "✨"}</span><small>${p.nome}</small></div>`;
    const lightboxAttr = p.img ? ` data-lightbox="${p.img}"` : "";
    const badge = p.status === "disponivel"
      ? `<span class="product-badge badge-disponivel">Disponível</span>`
      : `<span class="product-badge badge-esgotado">Esgotado</span>`;
    const promoBadge = tags.includes("promocao") ? `<span class="product-badge badge-promo" style="top:auto;bottom:12px">Promoção</span>` : "";
    const priceBlock = p.precoAntigo
      ? `<span class="price-old">R$ ${formatPrice(p.precoAntigo)}</span><span class="price-new">R$ ${formatPrice(p.preco)}</span>`
      : `<span class="price-new">R$ ${formatPrice(p.preco)}</span>`;
    const buyBtn = p.status === "disponivel"
      ? `<a class="product-buy" href="${buildWhatsappLink(p.nome)}" target="_blank" rel="noopener">Pedir no WhatsApp</a>`
      : `<a class="product-buy" style="opacity:.5;pointer-events:none">Esgotado</a>`;

    return `
    <div class="product-card" data-tags="${tags.join(" ")}" data-reveal>
      <div class="product-thumb"${lightboxAttr}>
        ${badge}
        ${promoBadge}
        ${thumbMedia}
      </div>
      <div class="product-info">
        <h4>${p.emoji || ""} ${p.nome}</h4>
        <div class="product-price">${priceBlock}</div>
        ${buyBtn}
      </div>
    </div>`;
  }).join("");

  observeReveal();
  bindProductThumbClicks();
  applyFilter();
}

// ============ FILTROS ============
let currentFilter = "todos";

function bindFilters(){
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyFilter();
    });
  });
}

function applyFilter(){
  document.querySelectorAll(".product-card").forEach(card => {
    const tags = card.dataset.tags.split(" ");
    const show = currentFilter === "todos" || tags.includes(currentFilter);
    card.classList.toggle("hidden-item", !show);
  });
}

// ============ LIGHTBOX ============
// bindLightboxShell roda uma única vez (fecha no X, clique fora, Esc).
// bindProductThumbClicks roda a cada renderização do catálogo (os cards são recriados).
function bindLightboxShell(){
  const lightbox = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightboxClose");
  const close = () => lightbox.classList.remove("active");

  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", (e) => { if(e.target === lightbox) close(); });
  document.addEventListener("keydown", (e) => { if(e.key === "Escape") close(); });
}

function bindProductThumbClicks(){
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  document.querySelectorAll("[data-lightbox]").forEach(el => {
    el.addEventListener("click", () => {
      lightboxImg.src = el.dataset.lightbox;
      lightbox.classList.add("active");
    });
  });
}

// ============ SCROLL REVEAL ============
let revealObserver;
function observeReveal(){
  if(!revealObserver){
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
  }
  document.querySelectorAll("[data-reveal]:not(.in-view)").forEach(el => revealObserver.observe(el));
}

// ============ HEADER SCROLL STATE ============
function bindHeaderScroll(){
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
}

// ============ MOBILE NAV ============
function bindMobileNav(){
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("open");
    nav.classList.toggle("open");
  });
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      toggle.classList.remove("open");
      nav.classList.remove("open");
    });
  });
}

// ============ CURSOR GLOW ============
function bindCursorGlow(){
  const glow = document.getElementById("cursorGlow");
  if(!glow || window.matchMedia("(max-width: 900px)").matches) return;
  window.addEventListener("mousemove", (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
  });
}

// ============ PARTICLES ============
function createParticles(){
  const container = document.getElementById("particles");
  if(!container) return;
  const count = window.innerWidth < 760 ? 10 : 22;

  for(let i = 0; i < count; i++){
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 8 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.bottom = `-20px`;
    p.style.animationDuration = `${Math.random() * 10 + 10}s`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    container.appendChild(p);
  }
}

// ============ COUNTER ANIMATION ============
function bindCounters(){
  const stats = document.querySelectorAll("[data-count]");
  if(!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

function animateCount(el){
  const target = parseInt(el.dataset.count, 10);
  const duration = 1400;
  const start = performance.now();

  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if(progress < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

// ============ LOADER ============
function bindLoader(){
  window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    setTimeout(() => loader.classList.add("hide"), 600);
  });
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  bindLightboxShell();
  bindFilters();
  subscribeProducts(renderProducts);
  observeReveal();
  bindHeaderScroll();
  bindMobileNav();
  bindCursorGlow();
  createParticles();
  bindCounters();
  bindLoader();
});
