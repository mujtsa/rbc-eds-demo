function createOptimizedPicture(src, alt = '') {
  // DA-hosted media_ URLs are already optimized by the EDS pipeline; external
  // URLs are used as-is. A plain <img> keeps this block runtime-agnostic.
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = alt;
  img.src = src;
  picture.append(img);
  return picture;
}

/**
 * Render one card <li> from a sheet data row.
 */
function renderCardFromData(row) {
  const li = document.createElement('li');

  const imageCell = document.createElement('div');
  imageCell.className = 'cards-product-card-image';
  if (row.image) imageCell.append(createOptimizedPicture(row.image, row.title || ''));
  li.append(imageCell);

  const body = document.createElement('div');
  body.className = 'cards-product-card-body';

  if (row.badge) {
    const badge = document.createElement('p');
    badge.className = 'cards-product-badge';
    badge.textContent = row.badge;
    body.append(badge);
  }

  if (row.title) {
    const h3 = document.createElement('h3');
    h3.textContent = row.title;
    body.append(h3);
  }

  if (row.fee) {
    const fee = document.createElement('p');
    fee.className = 'cards-product-annual-fee';
    fee.textContent = `Annual Fee: ${row.fee}`;
    body.append(fee);
  }

  if (row.offer) {
    const wrap = document.createElement('div');
    wrap.className = 'cards-product-offer';
    if (row.offerCaption) {
      const cap = document.createElement('p');
      cap.className = 'cards-product-offer-caption';
      cap.textContent = row.offerCaption;
      wrap.append(cap);
    }
    const content = document.createElement('p');
    content.className = 'cards-product-offer-content';
    content.textContent = row.offer;
    wrap.append(content);
    body.append(wrap);
  }

  const ctas = document.createElement('p');
  ctas.className = 'cards-product-apply';
  if (row.viewUrl) {
    const view = document.createElement('a');
    view.href = row.viewUrl;
    view.textContent = 'View Credit Card';
    ctas.append(view);
  }
  if (row.applyUrl) {
    const apply = document.createElement('a');
    apply.href = row.applyUrl;
    apply.textContent = 'Apply Now';
    ctas.append(apply);
  }
  if (ctas.children.length) body.append(ctas);

  li.append(body);
  li.dataset.category = (row.category || '').toLowerCase();
  return li;
}

/**
 * Original authored-row decoration (fallback when no data source is given).
 */
function decorateAuthoredRows(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture, img')) {
        div.className = 'cards-product-card-image';
      } else {
        div.className = 'cards-product-card-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('.cards-product-card-body').forEach((body) => {
    const kids = [...body.children];
    const title = body.querySelector('h3');
    if (title && title.previousElementSibling
      && title.previousElementSibling.tagName === 'P') {
      title.previousElementSibling.classList.add('cards-product-badge');
    }
    const feeP = kids.find((el) => el.tagName === 'P' && /^annual fee/i.test(el.textContent.trim()));
    if (feeP) feeP.classList.add('cards-product-annual-fee');
    const firstList = body.querySelector('ul');
    if (feeP && firstList) {
      const offerParas = [];
      let node = feeP.nextElementSibling;
      while (node && node !== firstList) {
        if (node.tagName === 'P') offerParas.push(node);
        node = node.nextElementSibling;
      }
      if (offerParas.length) {
        const wrap = document.createElement('div');
        wrap.className = 'cards-product-offer';
        offerParas[0].before(wrap);
        offerParas[0].classList.add('cards-product-offer-caption');
        offerParas.slice(1).forEach((p) => p.classList.add('cards-product-offer-content'));
        offerParas.forEach((p) => wrap.append(p));
      }
    }
    const links = kids.filter((el) => el.tagName === 'P' && el.querySelector('a'));
    const applyP = links[links.length - 1];
    if (applyP && /apply/i.test(applyP.textContent)) {
      applyP.classList.add('cards-product-apply');
    }
  });

  block.textContent = '';
  block.append(ul);
}

/**
 * Detect a data-source link in the block (sheet mode). Authored as a single
 * link/text pointing at a `.json` sheet, e.g. /credit-cards/cards-data.json
 */
function getDataSource(block) {
  const link = block.querySelector('a[href*=".json"]');
  if (link) return link.getAttribute('href');
  const text = block.textContent.trim();
  if (/\.json(\?|$)/.test(text) && !/\s/.test(text)) return text;
  return null;
}

export default async function decorate(block) {
  const dataSource = getDataSource(block);

  if (!dataSource) {
    decorateAuthoredRows(block);
    return;
  }

  block.textContent = '';
  const ul = document.createElement('ul');
  block.append(ul);

  try {
    const resp = await fetch(dataSource);
    if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
    const json = await resp.json();
    const rows = Array.isArray(json) ? json : (json.data || []);
    rows.forEach((row) => ul.append(renderCardFromData(row)));
    block.dataset.count = rows.length;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('cards-product: could not load data source', dataSource, e);
  }
}
