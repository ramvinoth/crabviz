// Export main generator class
export { GraphGenerator } from './generator';

// Export graph visualization
export { DotGenerator } from './graph/dot';
export type { TableNode, Edge, Subgraph, Cell } from './types/graph';

// Export types
export type * from './types/graph';
export type * from './types/lsp-types';
export type * from './types/language';
export type * from './generator/types';
export type { CssClass } from './types/css-classes';

// Export language support
export { getLanguage as getLanguageSupport } from './lang';

// Initialize Viz.js
import { DotGenerator } from './graph/dot';
import { instance } from '@viz-js/viz';

declare global {
  interface Window {
    Viz?: {
      render(dot: string): Promise<string>;
    };
  }
}

export async function initialize(): Promise<void> {
  try {
    // Initialize any required resources
    if (typeof window !== 'undefined') {
      // Browser environment
      if (!window.Viz) {
        const viz = await instance();
        window.Viz = {
          render: async (dot: string) => {
            return viz.renderString(dot);
          }
        };
      }
      await window.Viz.render('digraph { }'); // Test initialization
    } else {
      // Node.js environment
      const viz = await instance();
      DotGenerator.setVizInstance(viz);
      await DotGenerator.renderToSvg('digraph { }'); // Test initialization
    }
  } catch (error) {
    console.error('Failed to initialize Viz.js:', error);
    throw error;
  }
}
