/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-filter. Base: columns.
 * Source: https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html (#categories-filter)
 * Structure: a leading "Filter by Category:" label followed by category filter links,
 * arranged side by side (label + one column per filter link).
 */
export default function parse(element, { document }) {
  // The flex row holds the label and the category buttons side by side.
  const row = element.querySelector('.flex, .container-fluid .container') || element;

  // Leading label (e.g. "Filter by Category:").
  const label = row.querySelector('p, .h5, h5, [class*="h5"]');

  // Category filter links. Scope to anchors that are direct/inner children of the row.
  const links = Array.from(row.querySelectorAll('a.category-btn, a[id^="filter-"], a'));

  // Bail gracefully if there is no meaningful content.
  if (!label && links.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build a single columns row: first column is the label, then one column per link.
  const columnRow = [];
  if (label) columnRow.push(label);
  links.forEach((link) => columnRow.push(link));

  const cells = [columnRow];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-filter', cells });
  element.replaceWith(block);
}
