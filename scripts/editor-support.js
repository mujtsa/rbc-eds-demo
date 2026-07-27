// Instruments the rendered DOM with data-aue-* attributes for Universal Editor.
// These are declarative HTML data attributes — no effect on rendering, CSS, or
// JS behavior outside of the UE canvas. Safe to load on all page visits.

function getPagePath() {
  return window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
}

function instrument() {
  const main = document.querySelector('main');
  if (!main) return;

  const path = getPagePath();

  // Page document root
  main.setAttribute('data-aue-resource', `urn:aemconnection:${path}`);
  main.setAttribute('data-aue-type', 'document');
  main.setAttribute('data-aue-filter', 'main');

  // Sections — AuthorKit decorates main > div elements into .section
  const sections = [...main.querySelectorAll(':scope > .section')];
  sections.forEach((section, si) => {
    section.setAttribute('data-aue-resource', `urn:aemconnection:${path}#section-${si}`);
    section.setAttribute('data-aue-type', 'container');
    section.setAttribute('data-aue-model', 'section');
    section.setAttribute('data-aue-filter', 'section');
    section.setAttribute('data-aue-label', `Section ${si + 1}`);

    // Blocks — AK sets data-block-name on each block element inside .block-content
    const blocks = [...section.querySelectorAll('[data-block-name]')];
    blocks.forEach((block, bi) => {
      const name = block.dataset.blockName;
      block.setAttribute('data-aue-resource', `urn:aemconnection:${path}#section-${si}-block-${bi}`);
      block.setAttribute('data-aue-type', 'block');
      block.setAttribute('data-aue-model', name);
      block.setAttribute('data-aue-filter', name);
      block.setAttribute('data-aue-label', name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    });
  });
}

try {
  // Run after all blocks have been decorated by AuthorKit (ak.js loadArea completes
  // before the window load event fires, so this is the right timing point).
  if (document.readyState === 'complete') {
    instrument();
  } else {
    window.addEventListener('load', instrument);
  }
} catch {
  // Never crash the page — UE instrumentation is additive only.
}
