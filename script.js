const body = document.body;
const header = document.querySelector('#site-header');
const hero = document.querySelector('.hero-section');
const story = document.querySelector('.story-section');
const about = document.querySelector('.about-section');
const kineticTrack = document.querySelector('#kinetic-track');
const intro = document.querySelector('#intro');
const menuButton = document.querySelector('#menu-toggle');
const nav = document.querySelector('#site-nav');
const viewer = document.querySelector('#photo-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerTitle = document.querySelector('#viewer-title');
const viewerClose = document.querySelector('.viewer-close');
const viewerCount = document.querySelector('#viewer-count');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let lastViewerTrigger = null;
let motionActivated = false;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function scrollProgress(section) {
  const rect = section.getBoundingClientRect();
  return clamp(-rect.top / Math.max(section.offsetHeight - window.innerHeight, 1));
}

function updateScrollScenes() {
  header.classList.toggle('is-scrolled', window.scrollY > 32);
  if (!reducedMotion.matches) {
    hero.style.setProperty('--hero-progress', scrollProgress(hero).toFixed(3));
    story.style.setProperty('--story-progress', scrollProgress(story).toFixed(3));
    about.style.setProperty('--about-progress', scrollProgress(about).toFixed(3));
    const ribbon = kineticTrack.parentElement.getBoundingClientRect();
    const ribbonProgress = clamp((window.innerHeight - ribbon.top) / (window.innerHeight + ribbon.height));
    kineticTrack.style.setProperty('--ribbon-offset', ribbonProgress.toFixed(3));
  }
}

function prepareTextReveal(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  let wordIndex = 0;
  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(document.createTextNode(part));
        return;
      }
      const word = document.createElement('span');
      const inner = document.createElement('span');
      word.className = 'word';
      word.style.setProperty('--word-index', wordIndex);
      inner.textContent = part;
      word.append(inner);
      fragment.append(word);
      wordIndex += 1;
    });
    node.replaceWith(fragment);
  });
}

function activateTextMotion() {
  if (motionActivated) return;
  motionActivated = true;
  const animatedText = [...document.querySelectorAll('[data-text-reveal]')];
  animatedText.forEach(prepareTextReveal);
  document.querySelectorAll('[data-fade]').forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 85}ms`);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  [...animatedText, ...document.querySelectorAll('[data-fade]')].forEach((element) => observer.observe(element));
}

function dismissIntro() {
  activateTextMotion();
  intro.classList.add('done');
  window.setTimeout(() => intro.remove(), 950);
}

window.addEventListener('scroll', updateScrollScenes, { passive: true });
window.addEventListener('resize', updateScrollScenes);
updateScrollScenes();
if (reducedMotion.matches) dismissIntro();
else window.setTimeout(dismissIntro, 2200);
document.querySelector('#skip-intro').addEventListener('click', dismissIntro);

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
  body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  nav.classList.remove('is-open');
  body.classList.remove('menu-open');
}));

const photoItems = [...document.querySelectorAll('.photo-item')];
photoItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    lastViewerTrigger = item;
    viewerImage.src = item.dataset.image;
    viewerImage.alt = item.dataset.alt;
    viewerTitle.textContent = item.dataset.title;
    viewerCount.textContent = `Selected work ${String(index + 1).padStart(2, '0')}`;
    viewer.showModal();
    viewerClose.focus();
  });
});

function closeViewer() {
  viewer.close();
  viewerImage.src = '';
  lastViewerTrigger?.focus();
}
viewerClose.addEventListener('click', closeViewer);
viewer.addEventListener('click', (event) => {
  if (event.target === viewer) closeViewer();
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && viewer.open) closeViewer();
});

const cursor = document.querySelector('.cursor-dot');
if (cursor && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  photoItems.forEach((item) => {
    item.addEventListener('pointerenter', () => cursor.classList.add('is-viewing'));
    item.addEventListener('pointerleave', () => cursor.classList.remove('is-viewing'));
  });
}

document.querySelector('#year').textContent = new Date().getFullYear();
