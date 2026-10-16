// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom does not implement scrolling; the router scrolls to top on navigation.
window.scrollTo = () => {};
Element.prototype.scrollTo = () => {};

// jsdom does not support WebGL; mock the 3D Drone viewer for unit tests
jest.mock('./components/drone/DroneViewer3D', () => ({
  DroneViewer3D: () => <div data-testid="mock-drone-viewer-3d" />,
}));
