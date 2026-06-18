import '@testing-library/jest-dom';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'vitest-axe/matchers';

// vitest-axe@0.1.0's own "vitest-axe/extend-expect" entry point ships an empty
// compiled dist/extend-expect.js (a broken build artifact in the published
// package -- confirmed by inspecting node_modules directly), so it never
// registers the matcher and every toHaveNoViolations() call fails with
// "Invalid Chai property: toHaveNoViolations" regardless of what imports it.
// Register the matcher by hand from the one dist file that does work.
expect.extend({ toHaveNoViolations });
