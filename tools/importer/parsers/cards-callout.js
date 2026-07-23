/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-callout. Base: cards.
 * Source: https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html (#tool_callouts .grid-wpr.eh-wpr)
 * Structure: 3 colored callout cards, each with an icon image + heading + paragraph +
 * optional CTA link. Modeled as the 2-column `cards` block — cell 1: icon, cell 2: text.
 */
export default function parse(element, { document }) {
  // Each callout card lives in a .grid-one-third wrapper.
  const callouts = Array.from(element.querySelectorAll(':scope > .grid-one-third, .grid-one-third'));

  // Fallback: if the grid layout differs, use the inner callout wrappers directly.
  const cards = callouts.length
    ? callouts
    : Array.from(element.querySelectorAll('.block-inner, .block-wpr'));

  // Bail gracefully if no cards were found.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    const inner = card.querySelector('.block-inner') || card;

    // --- Cell 1: icon image ---
    const icon = inner.querySelector('img');

    // --- Cell 2: text content (heading, paragraph, optional CTA) ---
    const contentCell = [];

    const heading = inner.querySelector('.how-to-apply-heading, h3, h2, [class*="heading"]');
    if (heading) contentCell.push(heading);

    const paragraph = inner.querySelector('.how-to-apply-paragraph, p');
    if (paragraph) contentCell.push(paragraph);

    // Optional CTA (some callouts have none, e.g. "Apply Online Today").
    const cta = inner.querySelector('a[href]');
    if (cta) contentCell.push(cta);

    // Row: [icon, content]. Keep 2 columns even if a cell would be empty.
    cells.push([icon || '', contentCell.length ? contentCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-callout', cells });
  element.replaceWith(block);
}
