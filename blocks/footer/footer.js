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
  const rows = [...sections];
  rows.forEach((section) => inner.append(section));

  // Sections are positional (authoring classes are stripped by DA/EDS):
  // 0 = link columns, 1 = social, 2 = legal, 3 = copyright.
  const [links, social, legal, copyright] = rows;
  links?.classList.add('rbc-footer-links');
  social?.classList.add('rbc-footer-social');
  legal?.classList.add('rbc-footer-legal');
  copyright?.classList.add('rbc-footer-copyright');

  el.append(inner);
}
