import { setCategory, norm } from '../cards-product/cards-filter-sort.js';

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
        setCategory(''); // toggling off resets to all
      } else {
        link.classList.add('active');
        setCategory(norm(link.textContent));
      }
    });
  });
}
