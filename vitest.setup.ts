import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

// jsdom does not implement ResizeObserver. Radix UI primitives that measure
// their own size (Tooltip/Popover/Select content via @radix-ui/react-use-size,
// used throughout the Painel Reserve portal's glossary tooltips and menus)
// throw "ResizeObserver is not defined" the moment their content actually
// mounts in a test. A minimal no-op stub is enough since these tests assert
// on rendered content/attributes, not on real resize-driven layout.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// vitest-axe@0.1.0's own "vitest-axe/extend-expect" entry point ships an empty
// compiled dist/extend-expect.js (a broken build artifact in the published
// package -- confirmed by inspecting node_modules directly), so it never
// registers the matcher and every toHaveNoViolations() call fails with
// "Invalid Chai property: toHaveNoViolations" regardless of what imports it.
// Register the matcher by hand from the one dist file that does work.
expect.extend({ toHaveNoViolations });
