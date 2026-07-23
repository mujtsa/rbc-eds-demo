/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-product. Base: cards.
 * Source: https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html (#card-grid-container)
 * Structure: 16 repeating credit-card product tiles. Modeled as the 2-column `cards`
 * block — cell 1: card image, cell 2: text content (badge, title, annual fee, offer,
 * features, rate details, and Compare/View/Apply CTAs).
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > .card-container, .card-container'));

  // Bail gracefully if no cards were found.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    // --- Cell 1: card image ---
    const img = card.querySelector('.card-image-container .card-image, .card-image-container img, img');

    // --- Cell 2: text content ---
    const contentCell = [];

    // Badge / caption (e.g. "AWARD WINNING") if present.
    const badge = card.querySelector('.card-image-caption');
    if (badge && badge.textContent.trim()) {
      const badgeEl = document.createElement('p');
      badgeEl.append(...badge.childNodes);
      contentCell.push(badgeEl);
    }

    // Title.
    const title = card.querySelector('.card-title, h3, h2, [class*="card-title"]');
    if (title) contentCell.push(title);

    // Annual fee (label + value).
    const feeContainer = card.querySelector('.card-details-annual-fee-container');
    if (feeContainer) {
      const feeLabel = feeContainer.querySelector('.no-wrap, span');
      const feeValue = feeContainer.querySelector('.card-details-annual-fee');
      const feeP = document.createElement('p');
      const parts = [];
      if (feeLabel && feeLabel.textContent.trim()) parts.push(feeLabel.textContent.trim());
      if (feeValue && feeValue.textContent.trim()) parts.push(feeValue.textContent.trim());
      if (parts.length) {
        feeP.textContent = parts.join(': ');
        contentCell.push(feeP);
      }
    }

    // Offer (caption + content).
    const offer = card.querySelector('.card-details-offer-container');
    if (offer) {
      const offerCaption = offer.querySelector('.card-details-offer-caption');
      if (offerCaption && offerCaption.textContent.trim()) {
        const cap = document.createElement('p');
        cap.append(...offerCaption.childNodes);
        contentCell.push(cap);
      }
      const offerContent = offer.querySelector('.card-details-offer-content');
      if (offerContent && offerContent.textContent.trim()) {
        const oc = document.createElement('p');
        oc.append(...offerContent.childNodes);
        contentCell.push(oc);
      }
    }

    // Features — use the desktop container only (mobile accordion duplicates these).
    const featuresContainer = card.querySelector('.card-details-features-container.desktop-only-flex')
      || card.querySelector('.card-details-features-container');
    if (featuresContainer) {
      const featureItems = Array.from(featuresContainer.querySelectorAll(
        '.card-details-features-heading, .card-details-features-item-content',
      ));
      if (featureItems.length) {
        const ul = document.createElement('ul');
        featureItems.forEach((fi) => {
          if (!fi.textContent.trim()) return;
          const li = document.createElement('li');
          li.append(...fi.childNodes);
          ul.append(li);
        });
        if (ul.children.length) contentCell.push(ul);
      }
    }

    // Rate details (label/value pairs).
    const rateContainer = card.querySelector('.card-details-rate-container');
    if (rateContainer) {
      const rateItems = Array.from(rateContainer.querySelectorAll('.card-details-rate-item-container'));
      if (rateItems.length) {
        const ul = document.createElement('ul');
        rateItems.forEach((ri) => {
          const label = ri.querySelector('.card-details-rate-item-label');
          const value = ri.querySelector('.card-details-rate-item-value');
          const li = document.createElement('li');
          const labelText = label ? label.textContent.trim() : '';
          if (labelText) li.append(`${labelText}: `);
          if (value) li.append(...value.childNodes);
          if (li.textContent.trim()) ul.append(li);
        });
        if (ul.children.length) contentCell.push(ul);
      }
    }

    // CTAs: Compare (first visible), View Credit Card, Apply Now.
    const compareLink = card.querySelector('.compare-card-button a[href]:not([style*="display: none"])')
      || card.querySelector('.compare-card-button a[href]');
    if (compareLink) contentCell.push(compareLink);

    const viewLink = card.querySelector('.card-view-card a[href]');
    if (viewLink) contentCell.push(viewLink);

    const applyLink = card.querySelector('.apply-now-container[href], a.apply-now-container');
    if (applyLink) contentCell.push(applyLink);

    // Row: [image, content]. Pad image cell if missing to keep 2 columns.
    cells.push([img || '', contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
