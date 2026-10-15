// One reversible timeline for the pizza, packing station and delivery scooter.
// Physical sizes stay fixed; the camera supplies the cinematic change in scale.
export const PACKAGE_SCALE = 0.255;
export const BOX_HALF = 2.5175 * PACKAGE_SCALE;
export const RACK_HALF = 0.7;
export const RACK_POSITION = [-1.66, 0.59, 0];
export const STATION_NEAR = 0.72;
export const STATION_FAR = 2.44;
export const STATION_RIGHT = -0.91;
export const STATION_EXTENSION_WIDTH = 1.5;
export const DECK_HEIGHT = 0.6175;
export const PACKING_POSITION = [-1.66, DECK_HEIGHT + 0.3475 * PACKAGE_SCALE, 1.6];

const clamp = value => Math.min(1, Math.max(0, value));
export function easeJourney(progress, start, end) {
  const t = clamp((progress - start) / (end - start));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getJourneyPose(progress) {
  const p = clamp(progress);
  const loading = easeJourney(p, 0.885, 0.95);
  const departure = easeJourney(p, 0.96, 1);
  const scooterX = -5.2 * (1 - easeJourney(p, 0.78, 0.875)) + departure;
  const lift = easeJourney(p, 0.44, 0.49);
  const seat = easeJourney(p, 0.575, 0.63);
  return {
    scooterX,
    wheelDistance: scooterX + 5.2,
    packageScale: PACKAGE_SCALE,
    packagePosition: [PACKING_POSITION[0] + departure, PACKING_POSITION[1], PACKING_POSITION[2] * (1 - loading)],
    boxX: 5.6 * (1 - easeJourney(p, 0.49, 0.575)),
    boxY: 0,
    lidAngle: -2.02 * (1 - easeJourney(p, 0.635, 0.76)),
    pizzaY: (0.2 + 0.45 * lift) * (1 - seat) - 0.185 * seat,
    loading,
    departure,
    extensionDrop: 0.10 * easeJourney(p, 0.575, 0.60),
    extensionX: -STATION_EXTENSION_WIDTH * easeJourney(p, 0.60, 0.69),
  };
}

const rotateAssembly = ([x, y, z]) => [Math.cos(-0.12) * x + Math.sin(-0.12) * z, y, -Math.sin(-0.12) * x + Math.cos(-0.12) * z];
const packingStop = (p, position, target, width, height) => ({
  p, position: rotateAssembly(position.map((value, i) => PACKING_POSITION[i] + value * PACKAGE_SCALE)),
  target: rotateAssembly(target.map((value, i) => PACKING_POSITION[i] + value * PACKAGE_SCALE)),
  width: width * PACKAGE_SCALE, height: height * PACKAGE_SCALE,
});
const CAMERA_STOPS = [
  packingStop(0, [0.12, 11, 0.7], [0, 0.1, 0], 5.65, 5.65),
  packingStop(0.22, [1.6, 9.2, 4.5], [0, 0.55, 0], 5.8, 6.1),
  packingStop(0.4, [3.8, 6.1, 8.2], [0, 0.18, 0], 6.15, 5.5),
  { p: 0.49, position: [-0.4, 4.5, 6.5], target: [-1.3, 1.25, 1.3], width: 4.0, height: 3.3 },
  { p: 0.60, position: [-0.4, 4.5, 6.5], target: [-1.5, 1.25, 1.2], width: 3.1, height: 3.0 },
  { p: 0.76, position: [0.3, 3.8, 6.0], target: [-1.5, 0.85, 1.4], width: 3.1, height: 2.9 },
  { p: 0.875, position: [3.8, 4.5, 8.0], target: [-0.7, 0.6, 0.5], width: 5.9, height: 4.8 },
  { p: 0.95, position: [3.8, 4.5, 8.0], target: [-0.7, 0.6, 0.5], width: 5.9, height: 4.8 },
  { p: 1, position: [3.8, 4.5, 8.0], target: [-0.15, 0.6, 0.5], width: 6.1, height: 4.8 },
];

function cameraTrack(values) {
  const slopes = values.slice(1).map((value, i) => (value - values[i]) / (CAMERA_STOPS[i + 1].p - CAMERA_STOPS[i].p));
  const tangents = values.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === values.length - 1) return slopes[slopes.length - 1];
    const before = slopes[i - 1], after = slopes[i];
    if (before * after <= 0) return 0;
    const h0 = CAMERA_STOPS[i].p - CAMERA_STOPS[i - 1].p, h1 = CAMERA_STOPS[i + 1].p - CAMERA_STOPS[i].p;
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / before + w1 / after);
  });
  return { values, tangents };
}
const CAMERA_TRACKS = [
  ...[0, 1, 2].map(axis => cameraTrack(CAMERA_STOPS.map(stop => stop.position[axis]))),
  ...[0, 1, 2].map(axis => cameraTrack(CAMERA_STOPS.map(stop => stop.target[axis]))),
  cameraTrack(CAMERA_STOPS.map(stop => stop.width)), cameraTrack(CAMERA_STOPS.map(stop => stop.height)),
];
export function getJourneyCamera(progress) {
  const p = clamp(progress);
  const next = CAMERA_STOPS.findIndex(stop => stop.p >= p);
  const segment = Math.min(CAMERA_STOPS.length - 2, Math.max(0, next < 0 ? CAMERA_STOPS.length - 2 : next - 1));
  const span = CAMERA_STOPS[segment + 1].p - CAMERA_STOPS[segment].p;
  const t = clamp((p - CAMERA_STOPS[segment].p) / span), t2 = t * t, t3 = t2 * t;
  const values = CAMERA_TRACKS.map(track => {
    const a = track.values[segment], b = track.values[segment + 1];
    const value = (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * span * track.tangents[segment]
      + (-2 * t3 + 3 * t2) * b + (t3 - t2) * span * track.tangents[segment + 1];
    return Math.min(Math.max(a, b), Math.max(Math.min(a, b), value));
  });
  return { position: values.slice(0, 3), target: values.slice(3, 6), width: values[6], height: values[7] };
}
