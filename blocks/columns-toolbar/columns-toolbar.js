const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Popular' },
  { value: 'fee-asc', label: 'Annual Fee (Low to High)' },
  { value: 'fee-desc', label: 'Annual Fee (High to Low)' },
  { value: 'name-asc', label: 'Name (A to Z)' },
];

/**
 * Extract the numeric annual fee from a card <li>. Returns 0 for "$0",
 * and Infinity when no fee is found (so those sort last on ascending).
 */
function cardFee(li) {
  const txt = li.querySelector('.cards-product-annual-fee')?.textContent || '';
  const m = txt.replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
}

function cardName(li) {
  return (li.querySelector('h3')?.textContent || '').trim().toLowerCase();
}

/**
 * Reorder the cards-product grid per the chosen sort value. "featured" and
 * "popular" restore the original authored order (captured on first run).
 */
function applySort(value) {
  const grid = document.querySelector('.cards-product ul');
  if (!grid) return;
  const items = [...grid.children];

  // Capture the original order once, to restore for featured/popular.
  items.forEach((li, i) => {
    if (li.dataset.order === undefined) li.dataset.order = String(i);
  });

  const sorted = items.slice();
  if (value === 'fee-asc') {
    sorted.sort((a, b) => cardFee(a) - cardFee(b));
  } else if (value === 'fee-desc') {
    sorted.sort((a, b) => cardFee(b) - cardFee(a));
  } else if (value === 'name-asc') {
    sorted.sort((a, b) => cardName(a).localeCompare(cardName(b)));
  } else {
    // featured / popular → original order
    sorted.sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
  }

  sorted.forEach((li) => grid.append(li));
}

export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;
  const cells = [...row.children];
  const [leftCell, rightCell] = cells;

  // Left group: count + filters trigger
  if (leftCell) {
    leftCell.classList.add('columns-toolbar-left');
    [...leftCell.children].forEach((p, i) => {
      if (i === 0) p.classList.add('columns-toolbar-count');
      else p.classList.add('columns-toolbar-filters');
    });
  }

  // Right group: "Sort by:" label + a real <select> wired to sort the grid.
  if (rightCell) {
    rightCell.classList.add('columns-toolbar-right');
    const raw = rightCell.textContent.trim();
    const match = raw.match(/^(sort by:?)\s*(.*)$/i);
    rightCell.textContent = '';

    const label = document.createElement('span');
    label.className = 'columns-toolbar-sort-label';
    label.textContent = match ? match[1] : 'Sort by:';

    const select = document.createElement('select');
    select.className = 'columns-toolbar-select';
    SORT_OPTIONS.forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      select.append(o);
    });

    select.addEventListener('change', () => applySort(select.value));

    rightCell.append(label, select);
  }
}
