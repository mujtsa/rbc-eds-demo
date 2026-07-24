/**
 * Shared "compare" controller + bottom tray for the credit-cards demo.
 *
 * The cards-product block registers each card and calls toggle() from its
 * compare checkbox. This controller keeps the selection (max 3), renders a
 * fixed bottom tray with slots + a Compare button, and builds the shareable
 * compare-page URL (?cards=id1,id2,id3).
 */

const MAX = 3;
const COMPARE_PATH = '/credit-cards/compare';
const STORAGE_KEY = 'rbc-compare';

// id -> { id, title, image }
const selected = new Map();
// id -> checkbox input, so the controller can sync checkbox state
const registry = new Map();
let tray;

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selected.keys()]));
  } catch (e) { /* ignore */ }
}

function compareUrl() {
  const ids = [...selected.keys()];
  return `${COMPARE_PATH}?cards=${encodeURIComponent(ids.join(','))}`;
}

/**
 * Enable/disable not-yet-selected checkboxes when the max is reached.
 */
function syncDisabled() {
  const atMax = selected.size >= MAX;
  registry.forEach((input, id) => {
    input.disabled = atMax && !selected.has(id);
    input.closest('.cards-product-compare')?.classList.toggle('is-disabled', input.disabled);
  });
}

function renderTray() {
  if (!tray) return;
  const count = selected.size;
  tray.classList.toggle('is-visible', count > 0);

  const slotsEl = tray.querySelector('.compare-tray-slots');
  slotsEl.textContent = '';
  const cards = [...selected.values()];
  for (let i = 0; i < MAX; i += 1) {
    const slot = document.createElement('div');
    slot.className = 'compare-tray-slot';
    const card = cards[i];
    if (card) {
      slot.classList.add('filled');
      if (card.image) {
        const img = document.createElement('img');
        img.src = card.image;
        img.alt = card.title;
        slot.append(img);
      }
      const name = document.createElement('span');
      name.className = 'compare-tray-name';
      name.textContent = card.title;
      slot.append(name);
      const remove = document.createElement('button');
      remove.className = 'compare-tray-remove';
      remove.setAttribute('aria-label', `Remove ${card.title}`);
      remove.textContent = '×';
      // eslint-disable-next-line no-use-before-define
      remove.addEventListener('click', () => toggle(card, false));
      slot.append(remove);
    } else {
      const plus = document.createElement('span');
      plus.className = 'compare-tray-plus';
      plus.textContent = '+';
      slot.append(plus);
      const hint = document.createElement('span');
      hint.className = 'compare-tray-hint';
      hint.textContent = 'Add card to compare';
      slot.append(hint);
    }
    slotsEl.append(slot);
  }

  const btn = tray.querySelector('.compare-tray-btn');
  const enabled = count >= 2;
  btn.classList.toggle('is-disabled', !enabled);
  if (enabled) btn.href = compareUrl();
  else btn.removeAttribute('href');
}

function ensureTray() {
  if (tray) return tray;
  tray = document.createElement('div');
  tray.className = 'compare-tray';
  tray.innerHTML = `
    <div class="compare-tray-inner">
      <p class="compare-tray-title">Compare up to ${MAX} Credit Cards</p>
      <div class="compare-tray-slots"></div>
      <a class="compare-tray-btn" href="${COMPARE_PATH}">Compare</a>
    </div>`;
  document.body.append(tray);
  return tray;
}

/**
 * Add or remove a card from the comparison.
 * @param {{id,title,image}} card
 * @param {boolean} [on] force state; if omitted, toggles
 */
export function toggle(card, on) {
  const shouldSelect = on === undefined ? !selected.has(card.id) : on;
  if (shouldSelect) {
    if (selected.size >= MAX && !selected.has(card.id)) return; // enforce max
    selected.set(card.id, card);
  } else {
    selected.delete(card.id);
  }
  // Sync the card's checkbox (e.g. when removed from the tray).
  const input = registry.get(card.id);
  if (input) input.checked = selected.has(card.id);

  persist();
  syncDisabled();
  renderTray();
}

/**
 * Register a card's compare checkbox with the controller.
 */
export function register(card, input) {
  registry.set(card.id, input);
  ensureTray();
  input.addEventListener('change', () => toggle(card, input.checked));
  // Restore prior selection (sessionStorage) on re-render.
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    if (saved.includes(card.id)) {
      input.checked = true;
      toggle(card, true);
    }
  } catch (e) { /* ignore */ }
}
