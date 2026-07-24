import { setSort } from '../cards-product/cards-filter-sort.js';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Popular' },
  { value: 'fee-asc', label: 'Annual Fee (Low to High)' },
  { value: 'fee-desc', label: 'Annual Fee (High to Low)' },
  { value: 'name-asc', label: 'Name (A to Z)' },
];

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

    select.addEventListener('change', () => setSort(select.value));

    rightCell.append(label, select);
  }
}
