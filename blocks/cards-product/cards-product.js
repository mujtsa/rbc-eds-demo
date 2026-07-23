export default function decorate(block) {
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

    // Badge: leading bare paragraph before the title (e.g. "AWARD WINNING")
    const title = body.querySelector('h3');
    if (title && title.previousElementSibling
      && title.previousElementSibling.tagName === 'P') {
      title.previousElementSibling.classList.add('cards-product-badge');
    }

    // Annual fee: the paragraph beginning with "Annual Fee"
    const feeP = kids.find((el) => el.tagName === 'P' && /^annual fee/i.test(el.textContent.trim()));
    if (feeP) feeP.classList.add('cards-product-annual-fee');

    // Offer group: paragraphs between the annual-fee line and the first list.
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
        // First short paragraph acts as the caption pill.
        offerParas[0].classList.add('cards-product-offer-caption');
        offerParas.slice(1).forEach((p) => p.classList.add('cards-product-offer-content'));
        offerParas.forEach((p) => wrap.append(p));
      }
    }

    // Group the trailing CTA links (Compare / View / Apply)
    const links = kids.filter((el) => el.tagName === 'P' && el.querySelector('a'));
    const applyP = links[links.length - 1];
    if (applyP && /apply/i.test(applyP.textContent)) {
      applyP.classList.add('cards-product-apply');
    }
  });

  block.textContent = '';
  block.append(ul);
}
