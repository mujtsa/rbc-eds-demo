/**
 * Shared filter + sort controller for the credit-cards grid.
 *
 * Both columns-filter and columns-toolbar import this so filtering and sorting
 * compose: cards are filtered by the active category, then sorted within that
 * subset, and the toolbar count reflects the visible cards.
 */

const state = {
  category: '', // '' or 'special offers' == all
  sort: 'featured',
};

function norm(s) {
  return (s || '').trim().toLowerCase();
}

function grid() {
  return document.querySelector('.cards-product ul');
}

function cardFee(li) {
  const txt = li.querySelector('.cards-product-annual-fee')?.textContent || '';
  const m = txt.replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
}

function cardName(li) {
  return (li.querySelector('h3')?.textContent || '').trim().toLowerCase();
}

function matchesCategory(li, category) {
  if (!category || category === 'special offers') return true;
  if (category === 'no annual fee') {
    const feeText = li.querySelector('.cards-product-annual-fee')?.textContent || '';
    const feeVal = feeText.replace(/^annual fee:?\s*/i, '').trim();
    return /^\$0(\.0+)?$/.test(feeVal);
  }
  return norm(li.dataset.category) === category;
}

/**
 * Apply the current filter + sort state to the grid and update the count.
 */
export function render() {
  const ul = grid();
  if (!ul) return;
  const items = [...ul.children];

  // Capture original order once (for featured/popular restore).
  items.forEach((li, i) => {
    if (li.dataset.order === undefined) li.dataset.order = String(i);
  });

  // 1) Filter.
  let visible = 0;
  items.forEach((li) => {
    const show = matchesCategory(li, state.category);
    li.style.display = show ? '' : 'none';
    if (show) visible += 1;
  });

  // 2) Sort (reorder all items; hidden ones move too but stay hidden).
  const sorted = items.slice();
  const { sort } = state;
  if (sort === 'fee-asc') {
    sorted.sort((a, b) => cardFee(a) - cardFee(b));
  } else if (sort === 'fee-desc') {
    sorted.sort((a, b) => cardFee(b) - cardFee(a));
  } else if (sort === 'name-asc') {
    sorted.sort((a, b) => cardName(a).localeCompare(cardName(b)));
  } else {
    sorted.sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
  }
  sorted.forEach((li) => ul.append(li));

  // 3) Update toolbar count.
  const count = document.querySelector('.columns-toolbar-count');
  if (count) count.textContent = `Showing ${visible} card${visible === 1 ? '' : 's'}`;
}

export function setCategory(category) {
  state.category = norm(category);
  render();
}

export function setSort(sort) {
  state.sort = sort || 'featured';
  render();
}

export { norm };
