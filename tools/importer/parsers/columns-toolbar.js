/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-toolbar. Base: columns.
 * Source: https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html (#cards-filter)
 * Structure: a results toolbar with two visually side-by-side groups —
 *   left: results count ("Showing 16 cards") + "Card Filters (0)" trigger
 *   right: "Sort by:" label + sort <select> dropdown
 * Modeled as a 2-column columns block (left group | right group).
 */
export default function parse(element, { document }) {
  const toolbar = element.querySelector('.app-toolbar') || element;

  const leftGroup = toolbar.querySelector('.app-toolbar-left');
  const rightGroup = toolbar.querySelector('.app-toolbar-right');

  // Bail gracefully if neither group is present.
  if (!leftGroup && !rightGroup) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Left column: results count and the card-filters trigger.
  const leftCell = [];
  if (leftGroup) {
    const count = leftGroup.querySelector('.cards-showing-container');
    const filtersTrigger = leftGroup.querySelector('.card-filters, button');
    if (count) leftCell.push(count);
    if (filtersTrigger) leftCell.push(filtersTrigger);
    // Fallback: if nothing matched, take the whole left group's content.
    if (leftCell.length === 0) leftCell.push(...leftGroup.childNodes);
  }

  // Right column: sort label and the sort dropdown.
  const rightCell = [];
  if (rightGroup) {
    const label = rightGroup.querySelector('label');
    const select = rightGroup.querySelector('select');
    if (label) rightCell.push(label);
    if (select) rightCell.push(select);
    if (rightCell.length === 0) rightCell.push(...rightGroup.childNodes);
  }

  // Every row must have the same number of cells (2). Pad missing side with ''.
  const cells = [[
    leftCell.length ? leftCell : '',
    rightCell.length ? rightCell : '',
  ]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-toolbar', cells });
  element.replaceWith(block);
}
