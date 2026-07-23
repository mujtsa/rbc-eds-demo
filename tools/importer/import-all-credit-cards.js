/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsFilterParser from './parsers/columns-filter.js';
import columnsToolbarParser from './parsers/columns-toolbar.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsCalloutParser from './parsers/cards-callout.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/rbcroyalbank-cleanup.js';
import sectionsTransformer from './transformers/rbcroyalbank-sections.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'all-credit-cards',
  description: 'Credit cards listing page with category filters, a filterable grid of card offerings, and a how-to-apply callouts section, plus site header and footer.',
  urls: [
    'https://www.rbcroyalbank.com/credit-cards/all-credit-cards-p.html'
  ],
  blocks: [
    {
      name: 'columns-filter',
      instances: ['#categories-filter']
    },
    {
      name: 'columns-toolbar',
      instances: ['#cards-filter']
    },
    {
      name: 'cards-product',
      instances: ['#card-grid-container']
    },
    {
      name: 'cards-callout',
      instances: ['#tool_callouts .grid-wpr.eh-wpr']
    }
  ],
  sections: [
    {
      id: 'sticky-wrapper',
      name: 'Page Title',
      selector: '#sticky-wrapper',
      style: null,
      blocks: [],
      defaultContent: ['#sticky-wrapper h1']
    },
    {
      id: 'categories-filter',
      name: 'Category Filter',
      selector: '#categories-filter',
      style: null,
      blocks: ['columns-filter'],
      defaultContent: []
    },
    {
      id: 'cards-filter',
      name: 'Results Toolbar',
      selector: '#cards-filter',
      style: null,
      blocks: ['columns-toolbar'],
      defaultContent: []
    },
    {
      id: 'card-grid',
      name: 'Credit Card Grid',
      selector: ['#card-grid-container', '#dvl-wpr > main > section:nth-of-type(3)'],
      style: null,
      blocks: ['cards-product'],
      defaultContent: []
    },
    {
      id: 'tool-callouts',
      name: 'How To Apply Callouts',
      selector: '#tool_callouts',
      style: null,
      blocks: ['cards-callout'],
      defaultContent: ['#tool_callouts .how-to-apply-title']
    }
  ]
};

// PARSER REGISTRY
const parsers = {
  'columns-filter': columnsFilterParser,
  'columns-toolbar': columnsToolbarParser,
  'cards-product': cardsProductParser,
  'cards-callout': cardsCalloutParser,
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block, skipping any already replaced/detached
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Remove the stray decorative UI checkmark (empty-alt ui-checkmark-blue.svg)
    // that transformBackgroundImages surfaces from a CSS background after the
    // callouts — it runs after the transformer hooks, so it is stripped here.
    main.querySelectorAll('img[src*="ui-checkmark-blue"]').forEach((img) => {
      const p = img.closest('p') || img.closest('picture') || img;
      p.remove();
    });

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
