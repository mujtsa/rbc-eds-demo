/**
 * Normalize a label/category to a comparable token.
 */
function norm(s) {
  return (s || '').trim().toLowerCase();
}

/**
 * Apply a category filter to the cards-product grid and update the toolbar
 * count. `filter` is a normalized category string, or '' / 'special offers'
 * to show all cards.
 */
function applyFilter(filter) {
  const grid = document.querySelector('.cards-product ul');
  if (!grid) return;
  const items = [...grid.children];
  const showAll = !filter || filter === 'special offers';

  let visible = 0;
  items.forEach((li) => {
    const cat = norm(li.dataset.category);
    let match = showAll || cat === filter;
    // Special data-driven filter: "No Annual Fee" = cards whose annual-fee
    // line is exactly $0 (read the fee paragraph, not the whole tile text).
    if (!showAll && filter === 'no annual fee') {
      const feeText = li.querySelector('.cards-product-annual-fee')?.textContent || '';
      const feeVal = feeText.replace(/^annual fee:?\s*/i, '').trim();
      match = /^\$0(\.0+)?$/.test(feeVal);
    }
    li.style.display = match ? '' : 'none';
    if (match) visible += 1;
  });

  // Update the toolbar "Showing N cards" count if present.
  const count = document.querySelector('.columns-toolbar-count');
  if (count) count.textContent = `Showing ${visible} card${visible === 1 ? '' : 's'}`;
}

export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  block.classList.add(`columns-filter-${cells.length}-cols`);

  const pills = [];
  cells.forEach((cell, i) => {
    if (i === 0) {
      cell.classList.add('columns-filter-label');
      return;
    }
    cell.classList.add('columns-filter-pill');
    const link = cell.querySelector('a');
    if (!link) return;
    link.classList.add('columns-filter-btn');
    pills.push(link);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const isActive = link.classList.contains('active');
      pills.forEach((p) => p.classList.remove('active'));
      if (isActive) {
        // Toggling off the active pill resets to all cards.
        applyFilter('');
      } else {
        link.classList.add('active');
        applyFilter(norm(link.textContent));
      }
    });
  });
}
