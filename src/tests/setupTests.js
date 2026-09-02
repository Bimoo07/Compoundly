import "@testing-library/jest-dom/vitest";
import "@testing-library/jest-dom";

// jsdom does not implement window.matchMedia at all. Several components use
// Motion's useReducedMotion() (InsightCard, JourneyMapPage, BurlVisualization),
// which calls matchMedia internally — without this mock, any test that
// renders those components throws "matchMedia is not a function".
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated but some libs still call it
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
