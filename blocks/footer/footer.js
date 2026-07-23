import { getConfig, getMetadata } from '../../scripts/ak.js';

const { locale } = getConfig();

const FOOTER_PATH = '/fragments/nav/footer';

async function fetchFragment(path) {
  let resp = await fetch(`/content${path}.plain.html`);
  if (!resp.ok) resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) resp = await fetch(path);
  if (!resp.ok) throw Error(`Couldn't fetch ${path}`);
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.querySelectorAll('main > div');
}

export default async function init(el) {
  const footerMeta = getMetadata('footer');
  const path = footerMeta || FOOTER_PATH;
  const sections = await fetchFragment(`${locale.prefix}${path}`);

  const inner = document.createElement('div');
  inner.className = 'rbc-footer';
  sections.forEach((section) => inner.append(section));

  inner.querySelector('.footer-links')?.classList.add('rbc-footer-links');
  inner.querySelector('.footer-social')?.classList.add('rbc-footer-social');
  inner.querySelector('.footer-legal')?.classList.add('rbc-footer-legal');
  inner.querySelector('.footer-copyright')?.classList.add('rbc-footer-copyright');

  el.append(inner);
}
