// Centralized config for shop options. Keep it minimal and data-only.
// We intentionally do not import React or any UI code here.

// Active flags keyed by individual option title
// Only "Dinner" is active/clickable per requirement.
export const isActiveByTitle = {
  Brunch: false,
  "Happy Hour": false,
  Dinner: true,
  // Additional placeholders for inactive options if/when added later
  Coffee: false,
  "Wine Night": false,
  "Outdoor Picnic": false,
};

// Type mapping if needed later (e.g., 'individual' | 'bundle')
export const optionTypeByTitle = {
  Brunch: 'individual',
  "Happy Hour": 'individual',
  Dinner: 'individual',
  Coffee: 'individual',
  "Wine Night": 'individual',
  "Outdoor Picnic": 'individual',
};

// Bundles activation map. Set to false to gray out and disable.
export const bundleActiveByTitle = {
  'The Adventure': false,
  'The Connection': false,
  'The Introduction': false,
};


