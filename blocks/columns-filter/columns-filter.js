export default function decorate(block) {
  const row = block.firstElementChild;
  if (!row) return;

  const cells = [...row.children];
  block.classList.add(`columns-filter-${cells.length}-cols`);

  // First cell is the label; remaining cells each hold a filter pill link.
  cells.forEach((cell, i) => {
    if (i === 0) {
      cell.classList.add('columns-filter-label');
    } else {
      cell.classList.add('columns-filter-pill');
      const link = cell.querySelector('a');
      if (link) link.classList.add('columns-filter-btn');
    }
  });
}
