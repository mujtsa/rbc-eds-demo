import { getConfig, getMetadata } from '../../scripts/ak.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';

async function fetchFragment(path) {
  // Local preview / aem up serves content under /content; production DA/EDS serves at root.
  let resp = await fetch(`/content${path}.plain.html`);
  if (!resp.ok) resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) resp = await fetch(path);
  if (!resp.ok) throw Error(`Couldn't fetch ${path}`);
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Resolve relative fragment image paths against the fragment's directory.
  const dir = `/content${path}`.replace(/\/[^/]*$/, '/');
  doc.querySelectorAll('img[src^="./"]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), new URL(dir, window.location)).href;
  });
  // Fragment .plain.html places sections directly under <body> (no <main>).
  const sections = doc.body.querySelectorAll(':scope > div');
  return sections.length ? sections : doc.body.querySelectorAll('main > div');
}

function closeAllMenus(root) {
  root.querySelectorAll('.is-open').forEach((m) => m.classList.remove('is-open'));
}

function decorateDropdown(li, root) {
  const submenu = li.querySelector(':scope > ul');
  if (!submenu) return;
  li.classList.add('has-dropdown');
  const trigger = li.querySelector(':scope > p > a, :scope > p');
  if (!trigger) return;
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = li.classList.contains('is-open');
    closeAllMenus(root);
    if (!isOpen) li.classList.add('is-open');
  });
}

export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  const sections = await fetchFragment(`${locale.prefix}${path}`);

  const nav = document.createElement('nav');
  nav.className = 'rbc-header';
  const rows = [...sections];
  rows.forEach((section) => nav.append(section));

  // Sections are positional (authoring classes are stripped by DA/EDS):
  // 0 = utility bar, 1 = brand row, 2 = product (credit-cards) nav.
  const [utility, brand, product] = rows;

  if (utility) utility.classList.add('rbc-utility-row');

  if (brand) {
    brand.classList.add('rbc-brand-row');
    // Mobile hamburger toggle
    const toggle = document.createElement('button');
    toggle.className = 'rbc-menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle menu');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    toggle.addEventListener('click', () => {
      el.classList.toggle('is-mobile-open');
      toggle.classList.toggle('is-active');
    });
    brand.prepend(toggle);
    brand.querySelectorAll(':scope > ul > li').forEach((li) => decorateDropdown(li, nav));
  }

  if (product) {
    product.classList.add('rbc-product-row');
    product.querySelectorAll(':scope > ul > li').forEach((li) => decorateDropdown(li, nav));
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.rbc-header')) closeAllMenus(nav);
  });

  el.append(nav);
}
