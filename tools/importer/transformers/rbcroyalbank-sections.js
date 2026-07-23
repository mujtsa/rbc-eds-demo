/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: rbcroyalbank section breaks.
 *
 * Inserts an <hr> before each non-first section and a Section Metadata block
 * after each section that declares a `style`, driven by the template's
 * `sections` definition in page-templates.json.
 *
 * Section selectors below come from the template (page-templates.json) which
 * was populated from migration-work/cleaned.html:
 *   #sticky-wrapper, #categories-filter, #cards-filter,
 *   #card-grid-container (fallback #dvl-wpr > main > section:nth-of-type(3)),
 *   #tool_callouts.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Resolve the first matching element for a section selector, which may be a
 * single selector string or an ordered list of fallback selectors.
 */
function findSectionElement(root, selector) {
  const selectors = Array.isArray(selector) ? selector : [selector];
  for (const sel of selectors) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = (template && template.sections) || [];
  if (sections.length < 2) return;

  const doc = element.ownerDocument;

  // Process in reverse so earlier insertions don't shift later section
  // positions. For each section: add a Section Metadata block after it when a
  // style is set, and insert an <hr> before it when it is not the first section.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const sectionEl = findSectionElement(element, section.selector);
    if (!sectionEl) continue;

    if (section.style) {
      const meta = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      sectionEl.after(meta);
    }

    if (i > 0) {
      const hr = doc.createElement('hr');
      sectionEl.before(hr);
    }
  }
}
