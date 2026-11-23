// Tiny bridge so page modules can navigate / re-render without importing app.js (avoids import cycles).
export const nav = {
  go: (path) => { location.hash = '#/' + path; },
  render: () => {},
};
