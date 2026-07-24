/**
 * cards-compare — renders selected credit cards side-by-side.
 *
 * Reads the selected card ids from the URL (?cards=id1,id2,id3), fetches the
 * shared card data sheet, and builds a comparison table. The data source is
 * authored in the block as a link to the .json sheet (like cards-product).
 */

const ROWS = [
  { key: 'image', label: '', type: 'image' },
  { key: 'title', label: 'Card', type: 'heading' },
  { key: 'fee', label: 'Annual Fee', type: 'fee' },
  { key: 'category', label: 'Category', type: 'text' },
  { key: 'applyUrl', label: '', type: 'apply' },
];

function getDataSource(block) {
  const link = block.querySelector('a[href*=".json"]');
  if (link) return link.getAttribute('href');
  const text = block.textContent.trim();
  if (/\.json(\?|$)/.test(text) && !/\s/.test(text)) return text;
  return '/credit-cards/cards-data.json';
}

function selectedIds() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('cards') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function cell(row, card) {
  const td = document.createElement('td');
  const value = card[row.key];
  if (row.type === 'image' && value) {
    const img = document.createElement('img');
    img.src = value;
    img.alt = card.title || '';
    td.append(img);
  } else if (row.type === 'heading') {
    const h = document.createElement('h3');
    h.textContent = value || '';
    td.append(h);
  } else if (row.type === 'fee') {
    td.textContent = value ? `${value}` : '—';
  } else if (row.type === 'apply' && value) {
    const a = document.createElement('a');
    a.href = value;
    a.className = 'button';
    a.textContent = 'Apply Now';
    td.append(a);
  } else {
    td.textContent = value || '—';
  }
  return td;
}

export default async function decorate(block) {
  const dataSource = getDataSource(block);
  const ids = selectedIds();
  block.textContent = '';

  if (!ids.length) {
    const empty = document.createElement('p');
    empty.className = 'cards-compare-empty';
    empty.innerHTML = 'No cards selected to compare. '
      + '<a href="/credit-cards/all-credit-cards-dynamic">Browse credit cards</a> '
      + 'and use the Compare checkbox to add up to three.';
    block.append(empty);
    return;
  }

  let rows;
  try {
    const resp = await fetch(dataSource);
    if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
    const json = await resp.json();
    rows = Array.isArray(json) ? json : (json.data || []);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('cards-compare: could not load data source', dataSource, e);
    return;
  }

  // Resolve selected ids to card records, preserving URL order.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const cards = ids.map((id) => byId.get(id)).filter(Boolean);

  if (!cards.length) {
    const empty = document.createElement('p');
    empty.className = 'cards-compare-empty';
    empty.textContent = 'The selected cards could not be found.';
    block.append(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'cards-compare-table';
  ROWS.forEach((row) => {
    const tr = document.createElement('tr');
    if (row.label) {
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = row.label;
      tr.append(th);
    } else {
      tr.append(document.createElement('th'));
    }
    cards.forEach((card) => tr.append(cell(row, card)));
    table.append(tr);
  });

  block.append(table);
}
