import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import Page from '../app/model/page';

it('server-renders SVG tooltips as single text strings for hydration', () => {
  const html = renderToString(createElement(Page));
  expect(html).toContain('<title>entrance: 2 m</title>');
  expect(html).toContain('<title>shelf-1: 4 × 0.8 m</title>');
});
