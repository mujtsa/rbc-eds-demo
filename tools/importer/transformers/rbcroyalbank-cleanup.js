/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: rbcroyalbank site-wide cleanup.
 *
 * Removes non-authorable global chrome, cookie consent, tracking beacons,
 * commented-out sections, and leftover scripts/styles so the import contains
 * only page-level authorable content.
 *
 * ALL selectors below are verified against migration-work/cleaned.html for
 * https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html — none guessed.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie consent + tracking beacons — must be removed before block
    // parsing so they don't interfere with block matching.
    // Found in cleaned.html: <div id="onetrust-consent-sdk"> (line 4148),
    // <div class="onetrust-pc-dark-filter"> overlay, and the Bing beacon
    // <div id="batBeacon915393133977"> (line 4141) with an <img id="batBeacon...">.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.onetrust-pc-dark-filter',
      '[id^="batBeacon"]',
    ]);

    // Sticky-header chrome inside #sticky-wrapper. The <h1> page title is
    // kept as default content; only the "MENU" toggle button is non-authorable.
    // Found in cleaned.html: <div id="sticky-wrapper"> > .nav-bar > .nav-inner
    // > <div class="nav-btn"><span>MENU</span></div> (lines 1319-1327).
    WebImporter.DOMUtils.remove(element, ['#sticky-wrapper .nav-btn']);

    // Hidden "compare cards" tray drawer + compare-tool modal. These are
    // interactive UI chrome (initially hidden) that leak duplicate content
    // into the import (a second category filter row, "Add card to compare"
    // placeholders, a "Choose your card" heading, "Close"). Not authorable.
    WebImporter.DOMUtils.remove(element, [
      '.compare-tray',
      '#compareToolModal',
      '#compareToolModal_wrapper',
      '#compareToolModal_background',
    ]);

    // Hidden "no cards found" empty-state inside the card grid section
    // (cleaned.html line 3606: <div id="no-cards-found" class="... hide">).
    // Shown only when client-side filtering yields zero results; it carries a
    // magnifying-glass illustration + "We couldn't find any resources…" +
    // "Clear All Filters" that otherwise leak into the imported card grid.
    WebImporter.DOMUtils.remove(element, ['#no-cards-found']);

    // Stray decorative UI checkmark injected at runtime after the callouts
    // (an empty-alt ui-checkmark-blue.svg). Not authorable content.
    element.querySelectorAll('img[src*="ui-checkmark-blue"], img[src*="c3e5fc350e09889b8133a1e0df41172a"]').forEach((img) => {
      const p = img.closest('p') || img.closest('picture') || img;
      p.remove();
    });

    // Global site chrome (nav mega-menu + footer). These are auto-populated by
    // the header/footer blocks in EDS, so they are non-authorable page content.
    // Remove in beforeTransform so they never reach block parsing or leak into
    // the output — the RBC nav lives inside <header> as #nav-header/#header +
    // .mega-nav-wpr/.mega-menu-wpr, and the footer as .fat-footer/.main-footer.
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
      '#nav-header',
      '#header',
      '.mega-nav-wpr',
      '.mega-menu-wpr',
      '.fat-footer',
      '.main-footer',
      // Mobile side-menu drawer — a direct child of #dvl-wpr (sibling of
      // <header>), NOT inside <header>, so it survives the header removal and
      // leaks the full "Personal/Business/…" nav + "Search RBC" into the import.
      '#side-menu-id',
      '.side-menu',
    ]);

    // Commented-out #which-card-type section. The scraper preserved it as an
    // HTML comment node (cleaned.html line 3620: <!-- <section id="which-card-type"> ...).
    // Remove comment nodes so the disabled section never leaks into the import.
    const walker = element.ownerDocument.createTreeWalker(
      element,
      // NodeFilter.SHOW_COMMENT === 128
      128,
    );
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());
  }

  if (hookName === TransformHook.afterTransform) {
    // Global site chrome — auto-populated by header/footer blocks in EDS, so
    // they are non-authorable page content and must be removed.
    // Found in cleaned.html: <div id="dvl-wpr"> > <header> (line 3) and
    // <footer> (line 3801).
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer',
    ]);

    // Leftover non-authorable / non-content elements.
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // Stray decorative UI checkmark that sits after the callouts (empty-alt
    // ui-checkmark-blue.svg). Removed here in afterTransform because it is
    // injected late by page JS and is reliably present at this stage.
    element.querySelectorAll('img[src*="ui-checkmark-blue"], img[src*="c3e5fc350e09889b8133a1e0df41172a"]').forEach((img) => {
      const p = img.closest('p') || img.closest('picture') || img;
      p.remove();
    });

    // Strip inline event handlers and tracking attributes left on any element.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('onload');
    });
  }
}
