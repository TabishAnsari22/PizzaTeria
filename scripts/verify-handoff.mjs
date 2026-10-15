import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import * as THREE from 'three';

// Next transpiles the app's ES-module .js files, while this project deliberately
// keeps Node's default package type. Import the exact, dependency-free motion
// source as an ES module rather than duplicating its choreography in the test.
const source = await readFile(new URL('../lib/journeyMotion.js', import.meta.url), 'utf8');
const {
  PACKAGE_SCALE, BOX_HALF, RACK_HALF, RACK_POSITION,
  STATION_NEAR, STATION_FAR, STATION_RIGHT, STATION_EXTENSION_WIDTH,
  DECK_HEIGHT, PACKING_POSITION, getJourneyPose, getJourneyCamera,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

const EPSILON = 1e-9;
const SAMPLE_COUNT = 10_000;
const BOX_BOTTOM = -0.3475;
const BOX_TOP = 0.3425;
const near = (actual, expected, message, tolerance = EPSILON) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} versus ${expected}`);
};
const overlapLength = (a0, a1, b0, b1) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
const overlaps = (a, b) => a.every(([min, max], axis) => overlapLength(min, max, ...b[axis]) > EPSILON);
const packageBounds = pose => {
  const [x, y, z] = pose.packagePosition;
  return [
    [x - BOX_HALF, x + BOX_HALF],
    [y + BOX_BOTTOM * pose.packageScale, y + BOX_TOP * pose.packageScale],
    [z - BOX_HALF, z + BOX_HALF],
  ];
};
const numericFields = pose => Object.fromEntries(Object.entries(pose).flatMap(([key, value]) => {
  if (typeof value === 'number') return [[key, value]];
  if (Array.isArray(value)) return value.map((number, axis) => [`${key}.${axis}`, number]);
  return [];
}));

test('package retains its physical size and the approach never crosses the rider', () => {
  let previousWheelDistance = -Infinity;
  for (let index = 0; index <= SAMPLE_COUNT; index++) {
    const p = index / SAMPLE_COUNT;
    const pose = getJourneyPose(p);
    for (const [field, value] of Object.entries(numericFields(pose))) {
      assert.ok(Number.isFinite(value), `Finite ${field} at progress ${p}`);
    }
    near(pose.packageScale, PACKAGE_SCALE, `Fixed package size at ${p}`);
    assert.ok(pose.wheelDistance >= previousWheelDistance - EPSILON, `Wheels roll forward at ${p}`);
    near(pose.wheelDistance - pose.scooterX, 5.2, `Wheel travel matches scooter travel at ${p}`);
    previousWheelDistance = pose.wheelDistance;
    if (p < 0.78) continue;

    // Conservative bounds include helmet, the complete seated body, both
    // sleeves, physical fingers and feet; this is larger than the torso alone.
    const rider = [
      [pose.scooterX - 0.65, pose.scooterX + 1.16],
      [-0.30, 2.25],
      [-0.62, 0.62],
    ];
    assert.ok(!overlaps(packageBounds(pose), rider), `Package must clear rider at ${p}`);
    near(pose.lidAngle, 0, `Lid is closed before scooter arrival at ${p}`);
    near(pose.boxX, 0, `Carton is assembled before scooter arrival at ${p}`);
  }
});

test('loading stays on the counter and rack, with the underside touching the deck', () => {
  const bridgeGap = STATION_NEAR - RACK_HALF;
  assert.ok(bridgeGap >= 0 && bridgeGap <= 0.025, 'Only a narrow bridge gap separates the two supports');
  near(RACK_POSITION[1] + 0.055 / 2, DECK_HEIGHT, 'Rendered rack top matches the shared deck');
  near(PACKING_POSITION[1] + BOX_BOTTOM * PACKAGE_SCALE, DECK_HEIGHT, 'Carton underside rests on the packing counter');

  for (let index = 0; index <= SAMPLE_COUNT; index++) {
    const p = 0.885 + (0.95 - 0.885) * index / SAMPLE_COUNT;
    const pose = getJourneyPose(p);
    const [[minX, maxX], [bottom], [minZ, maxZ]] = packageBounds(pose);
    near(pose.scooterX, 0, `Scooter is parked during loading at ${p}`);
    near(bottom, DECK_HEIGHT, `No floating or deck penetration at ${p}`);
    assert.ok(minX >= PACKING_POSITION[0] - RACK_HALF - EPSILON, `Rear edge has deck support at ${p}`);
    assert.ok(maxX <= PACKING_POSITION[0] + RACK_HALF + EPSILON, `Front edge has deck support at ${p}`);
    assert.ok(minZ >= -RACK_HALF - EPSILON && maxZ <= STATION_FAR + EPSILON, `Box remains above the two supports at ${p}`);
    const supportedWidth = overlapLength(minZ, maxZ, -RACK_HALF, RACK_HALF)
      + overlapLength(minZ, maxZ, STATION_NEAR, STATION_FAR);
    assert.ok(supportedWidth >= 2 * BOX_HALF - bridgeGap - EPSILON, `Box bridges only the narrow deck gap at ${p}`);
  }
});

test('landed package stays attached to the rack throughout departure', () => {
  for (let index = 0; index <= 1_000; index++) {
    const p = 0.95 + 0.05 * index / 1_000;
    const pose = getJourneyPose(p);
    near(pose.packagePosition[0] - pose.scooterX, RACK_POSITION[0], `Rack-relative x stays fixed at ${p}`);
    near(pose.packagePosition[2], RACK_POSITION[2], `Rack-relative z stays fixed at ${p}`);
    near(packageBounds(pose)[1][0], DECK_HEIGHT, `Box stays seated during departure at ${p}`);
    assert.ok(BOX_HALF < RACK_HALF, 'The rack supports the complete carton footprint');
  }
});

test('the full timeline reverses deterministically and has no velocity jumps at stage boundaries', () => {
  const forward = Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => getJourneyPose(index / SAMPLE_COUNT));
  for (let index = SAMPLE_COUNT; index >= 0; index--) {
    assert.deepEqual(getJourneyPose(index / SAMPLE_COUNT), forward[index], `Reverse pose equals forward pose at ${index / SAMPLE_COUNT}`);
  }
  assert.deepEqual(getJourneyPose(-1), getJourneyPose(0), 'Progress clamps before the story');
  assert.deepEqual(getJourneyPose(2), getJourneyPose(1), 'Progress clamps after the story');

  const boundaries = [0, 0.44, 0.49, 0.575, 0.60, 0.63, 0.635, 0.69, 0.76, 0.78, 0.875, 0.885, 0.95, 0.96, 1];
  const step = 0.00001;
  for (const boundary of boundaries) {
    const before = numericFields(getJourneyPose(boundary - step));
    const before2 = numericFields(getJourneyPose(boundary - 2 * step));
    const at = numericFields(getJourneyPose(boundary));
    const after = numericFields(getJourneyPose(boundary + step));
    const after2 = numericFields(getJourneyPose(boundary + 2 * step));
    for (const field of Object.keys(at)) {
      // Second-order one-sided differences avoid mistaking normal acceleration
      // inside a stage for a discontinuity between its two velocity limits.
      const leftVelocity = (3 * at[field] - 4 * before[field] + before2[field]) / (2 * step);
      const rightVelocity = (-3 * at[field] + 4 * after[field] - after2[field]) / (2 * step);
      near(leftVelocity, rightVelocity, `${field} has continuous velocity at ${boundary}`, 0.002);
    }
  }
});

test('the complete open carton and delivered rider/cargo fit desktop and mobile cameras', t => {
  const assemblyAxis = new THREE.Vector3(0, 1, 0);
  const lidAxis = new THREE.Vector3(1, 0, 0);
  const corners = (xBounds, yBounds, zBounds, label) => xBounds.flatMap(x => yBounds.flatMap(y => zBounds.map(z => ({
    label, point: new THREE.Vector3(x, y, z),
  }))));
  const cartonPoints = pose => {
    const base = corners([-2.495, 2.495], [BOX_BOTTOM, 0.275], [-2.495, 2.495], 'carton-base');
    const lid = [
      ...corners([-2.5175, 2.5175], [-0.0375, 0.0375], [-0.0325, 5.0025], 'lid'),
      ...corners([-2.44, 2.44], [-0.19, -0.01], [4.9525, 4.9975], 'lid-tuck-flap'),
    ];
    // Match rendered ancestry: lid rotation -> hinge translation -> carton
    // slide -> package scale/translation -> assembly rotation. Transforming a
    // loose bounding box after rotation would miss the actual open lid height.
    for (const { point } of lid) point.applyAxisAngle(lidAxis, pose.lidAngle).add(new THREE.Vector3(0, 0.305, -2.485));
    return [...base, ...lid].map(({ label, point }) => ({
      label,
      point: point.add(new THREE.Vector3(pose.boxX, pose.boxY, 0))
        .multiplyScalar(pose.packageScale).add(new THREE.Vector3(...pose.packagePosition))
        .applyAxisAngle(assemblyAxis, -0.12),
    }));
  };
  const deliveryPoints = pose => [
    ...cartonPoints(pose),
    // These conservative body bounds include the helmet, shoulders, both
    // hands and feet; wheel bounds additionally guard the complete bike.
    ...corners([-0.65, 1.16], [-0.30, 2.25], [-0.62, 0.62], 'rider'),
    ...corners([-1.55, -0.65], [-1.15, -0.25], [-0.105, 0.105], 'rear-wheel'),
    ...corners([0.67, 1.57], [-1.15, -0.25], [-0.105, 0.105], 'front-wheel'),
    ...corners([RACK_POSITION[0] - RACK_HALF, RACK_POSITION[0] + RACK_HALF], [0.5625, DECK_HEIGHT], [-RACK_HALF, RACK_HALF], 'cargo-rack'),
  ].map(({ label, point }) => label.startsWith('carton') || label.startsWith('lid')
    ? { label, point }
    : { label, point: point.add(new THREE.Vector3(pose.scooterX, 0, 0)).applyAxisAngle(assemblyAxis, -0.12) });

  const report = [];
  for (const viewport of [{ name: 'desktop', width: 834, height: 790 }, { name: 'mobile', width: 390, height: 430 }]) {
    for (const stage of [
      { name: 'carton-opening', start: 0.50, end: 0.78, samples: 560, points: cartonPoints },
      { name: 'delivery', start: 0.875, end: 1, samples: 250, points: deliveryPoints },
    ]) {
      const camera = new THREE.OrthographicCamera(-viewport.width / 2, viewport.width / 2, viewport.height / 2, -viewport.height / 2, 0.1, 50);
      let worst = { extent: 0 };
      for (let index = 0; index <= stage.samples; index++) {
        const progress = stage.start + (stage.end - stage.start) * index / stage.samples;
        const frame = getJourneyCamera(progress);
        camera.position.set(...frame.position);
        camera.lookAt(...frame.target);
        camera.zoom = Math.min(viewport.width / frame.width, viewport.height / frame.height);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        for (const { label, point } of stage.points(getJourneyPose(progress))) {
          const projected = point.project(camera);
          const extent = Math.max(Math.abs(projected.x), Math.abs(projected.y));
          if (extent > worst.extent) worst = { extent, progress, label, x: projected.x, y: projected.y };
          assert.ok(projected.z >= -1 && projected.z <= 1, `${viewport.name} ${stage.name} remains between the near/far planes at ${progress}`);
        }
      }
      report.push({ viewport: viewport.name, stage: stage.name, ...worst });
    }
  }
  for (const result of report) t.diagnostic(JSON.stringify(result));
  for (const result of report) {
    assert.ok(result.extent <= 0.94, `${result.viewport} ${result.stage}: ${result.label} at ${result.progress} projects to NDC (${result.x.toFixed(4)}, ${result.y.toFixed(4)}), beyond the 0.94 safe frame`);
  }
});

test('the pizza stays within the safe frame before the carton arrives', t => {
  const axis = new THREE.Vector3(0, 1, 0);
  const report = [];
  for (const viewport of [{ name: 'desktop', width: 834, height: 790 }, { name: 'mobile', width: 390, height: 430 }]) {
    const camera = new THREE.OrthographicCamera(-viewport.width / 2, viewport.width / 2, viewport.height / 2, -viewport.height / 2, 0.1, 50);
    let worst = { extent: 0 };
    for (let index = 0; index <= 980; index++) {
      const progress = 0.49 * index / 980;
      const pose = getJourneyPose(progress);
      const frame = getJourneyCamera(progress);
      camera.position.set(...frame.position);
      camera.lookAt(...frame.target);
      camera.zoom = Math.min(viewport.width / frame.width, viewport.height / frame.height);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const rotationAmount = Math.min(1, Math.max(0, progress / 0.48));
      const pizzaRotation = -0.3 + 0.46 * rotationAmount * rotationAmount * (3 - 2 * rotationAmount);
      for (let angle = 0; angle < 128; angle++) for (const height of [-0.065, 0.27]) {
        const theta = angle / 128 * Math.PI * 2;
        const point = new THREE.Vector3(Math.cos(theta) * 2.25, height, Math.sin(theta) * 2.25)
          .applyAxisAngle(axis, pizzaRotation).add(new THREE.Vector3(0, pose.pizzaY, 0))
          .multiplyScalar(pose.packageScale).add(new THREE.Vector3(...pose.packagePosition))
          .applyAxisAngle(axis, -0.12).project(camera);
        const extent = Math.max(Math.abs(point.x), Math.abs(point.y));
        if (extent > worst.extent) worst = { extent, progress, x: point.x, y: point.y };
      }
    }
    report.push({ viewport: viewport.name, stage: 'pizza-preparation', ...worst });
  }
  for (const result of report) t.diagnostic(JSON.stringify(result));
  for (const result of report) {
    assert.ok(result.extent <= 0.94, `${result.viewport} early pizza at ${result.progress} projects to NDC (${result.x.toFixed(4)}, ${result.y.toFixed(4)}), beyond the 0.94 safe frame`);
  }
});

test('the roller extension supports the entering carton until it reaches the fixed counter', () => {
  const stationLeft = 2 * PACKING_POSITION[0] - STATION_RIGHT;
  for (let index = 0; index <= SAMPLE_COUNT; index++) {
    const progress = 0.49 + (0.575 - 0.49) * index / SAMPLE_COUNT;
    const pose = getJourneyPose(progress);
    const centerX = pose.packagePosition[0] + pose.boxX * pose.packageScale;
    const minX = centerX - BOX_HALF;
    const maxX = centerX + BOX_HALF;
    const minZ = pose.packagePosition[2] - BOX_HALF;
    const maxZ = pose.packagePosition[2] + BOX_HALF;
    const extensionLeft = STATION_RIGHT + pose.extensionX;
    const extensionRight = extensionLeft + STATION_EXTENSION_WIDTH;
    near(pose.extensionDrop, 0, `Extension remains at deck height while the carton enters at ${progress}`);
    near(pose.extensionX, 0, `Extension stays fully extended while the carton enters at ${progress}`);
    near(pose.packagePosition[1] + (pose.boxY + BOX_BOTTOM) * pose.packageScale, DECK_HEIGHT, `Entering carton touches the roller deck at ${progress}`);
    const supportedLength = overlapLength(minX, maxX, stationLeft, STATION_RIGHT)
      + overlapLength(minX, maxX, extensionLeft, extensionRight);
    near(supportedLength, 2 * BOX_HALF, `Complete carton footprint has counter/extension support at ${progress}`);
    assert.ok(minZ >= STATION_NEAR && maxZ <= STATION_FAR, `Entering carton fits across the roller deck at ${progress}`);
    assert.ok(pose.pizzaY - 0.065 > 0.275, `Raised pizza clears the entering carton walls at ${progress}`);
  }
  for (let index = 0; index <= 1_000; index++) {
    const progress = 0.575 + (0.69 - 0.575) * index / 1_000;
    const pose = getJourneyPose(progress);
    near(pose.boxX, 0, `Carton is on the fixed deck before extension retraction at ${progress}`);
    assert.ok(pose.extensionDrop >= 0 && pose.extensionX <= 0, `Extension withdraws below the seated carton at ${progress}`);
  }
});
