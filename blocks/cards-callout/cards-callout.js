const CALLOUT_VARIANTS = ['light-blue', 'steel-blue', 'grey'];

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    // cycle through the RBC callout colour variants
    li.classList.add(`callout-${CALLOUT_VARIANTS[index % CALLOUT_VARIANTS.length]}`);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture, img')) {
        div.className = 'cards-callout-card-image';
      } else {
        div.className = 'cards-callout-card-body';
      }
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
