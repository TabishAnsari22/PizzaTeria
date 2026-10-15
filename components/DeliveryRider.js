"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const TAU = Math.PI * 2;
const PIVOT = new THREE.Vector3(-0.34, 0.79, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;

function leanAt(progress, reducedMotion) {
  const p = clamp((progress - 0.82) / 0.18, 0, 1);
  return reducedMotion ? 0 : -Math.sin(p * Math.PI) * 0.022;
}

function leaned(point, lean) {
  return new THREE.Vector3(...point).sub(PIVOT).applyAxisAngle(Z_AXIS, lean).add(PIVOT);
}

function clothTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  const data = context.createImageData(128, 128);
  let seed = 193;
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    seed = (seed * 16807) % 2147483647;
    const weave = ((x + (y % 4 < 2 ? 0 : 2)) % 4 < 2 ? 8 : -8);
    const value = 128 + weave + (seed / 2147483647 - 0.5) * 18;
    const index = (y * 128 + x) * 4;
    data.data[index] = data.data[index + 1] = data.data[index + 2] = value;
    data.data[index + 3] = 255;
  }
  context.putImageData(data, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

function useMaterials() {
  const materials = useMemo(() => {
    const weave = clothTexture();
    const fabric = (color, roughness = 0.88) => new THREE.MeshStandardMaterial({ color, roughness, bumpMap: weave, bumpScale: 0.004 });
    return {
      coat: fabric("#282a2d"), panel: fabric("#a62525", 0.82), pants: fabric("#303236", 0.94),
      cuff: fabric("#16181b"), glove: new THREE.MeshStandardMaterial({ color: "#1b1d20", roughness: 0.7 }),
      shoe: new THREE.MeshStandardMaterial({ color: "#17191c", roughness: 0.67 }),
      sole: new THREE.MeshStandardMaterial({ color: "#090b0d", roughness: 0.85 }), weave,
    };
  }, []);
  useEffect(() => () => { Object.values(materials).forEach((item) => item.dispose()); }, [materials]);
  return materials;
}

function Volume({ position, scale, material, color = "#17191c", ...props }) {
  return <mesh position={position} scale={scale} material={material} castShadow {...props}>
    <sphereGeometry args={[1, 32, 24]} />
    {!material && <meshStandardMaterial color={color} roughness={0.75} />}
  </mesh>;
}

function Stitch({ points, color = "#5b5c5e", radius = 0.004 }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), 32, radius, 5, false), [points.map((p) => p.join()).join(), radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={0.8} /></mesh>;
}

const RINGS = [
  [0.765, -0.35, 0.225, 0.255], [0.81, -0.335, 0.25, 0.275],
  [0.91, -0.29, 0.254, 0.29], [1.06, -0.205, 0.255, 0.315],
  [1.23, -0.115, 0.245, 0.345], [1.38, -0.025, 0.215, 0.36],
  [1.46, 0.015, 0.18, 0.318], [1.52, 0.035, 0.13, 0.185],
];

function jacketGeometry(start = 0, end = TAU, offset = 1) {
  const positions = [], uvs = [], indices = [];
  const rows = 42, columns = 56;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows * (RINGS.length - 1);
    const i = Math.min(Math.floor(t), RINGS.length - 2), amount = t - i;
    const [y, center, depth, width] = RINGS[i].map((value, k) => mix(value, RINGS[i + 1][k], amount));
    for (let column = 0; column <= columns; column++) {
      const angle = mix(start, end, column / columns);
      const hem = Math.exp(-Math.pow((y - 0.86) / 0.115, 2));
      const underarm = Math.exp(-Math.pow((y - 1.27) / 0.13, 2));
      const fold = 1 + Math.sin(y * 58 + angle * 3) * 0.025 * hem + Math.sin(y * 49 - angle * 4) * 0.018 * underarm;
      positions.push(center + Math.cos(angle) * depth * offset * fold, y, Math.sin(angle) * width * offset * fold);
      uvs.push(column / columns, row / rows);
    }
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Jacket({ materials }) {
  const geometry = useMemo(() => [jacketGeometry(), jacketGeometry(1.1, 1.91, 1.012), jacketGeometry(-1.91, -1.1, 1.012)], []);
  useEffect(() => () => geometry.forEach((item) => item.dispose()), [geometry]);
  return <group>
    <mesh geometry={geometry[0]} material={materials.coat} castShadow />
    {[1, 2].map((i) => <mesh key={i} geometry={geometry[i]} material={materials.panel} castShadow />)}
    <mesh position={[0.044, 1.525, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.1, 1]}>
      <torusGeometry args={[0.135, 0.045, 12, 40]} /><meshStandardMaterial color="#15171a" roughness={0.95} />
    </mesh>
    <Volume position={[0.06, 1.595, 0]} scale={[0.105, 0.1, 0.108]} material={materials.cuff} />
    <Stitch points={[[-0.087, 0.815, 0], [-0.032, 0.95, 0], [0.054, 1.08, 0], [0.134, 1.24, 0], [0.18, 1.39, 0], [0.16, 1.47, 0]]} color="#73706b" radius={0.006} />
    <mesh position={[0.174, 1.405, 0]} rotation={[0, 0, -0.28]}><boxGeometry args={[0.012, 0.029, 0.016]} /><meshStandardMaterial color="#aaa49a" metalness={0.7} roughness={0.38} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <Stitch points={[[-0.27, 0.81, side * 0.265], [-0.19, 1.01, side * 0.315], [-0.05, 1.27, side * 0.345], [0.055, 1.42, side * 0.313]]} color="#c64a43" radius={0.0035} />
      <Stitch points={[[0.097, 1.04, side * 0.12], [0.14, 1.12, side * 0.13], [0.17, 1.18, side * 0.16]]} color="#55575b" radius={0.0045} />
    </group>)}
    <mesh position={[-0.08, 1.30, 0.346]} rotation={[0, 0, 0.03]}><planeGeometry args={[0.14, 0.023]} /><meshStandardMaterial color="#bdb6ab" roughness={0.7} /></mesh>
  </group>;
}

// Each bent sleeve and trouser leg is one continuous fabric surface.
function makeGarment(points, radii, folds = 0.006) {
  const rows = 40, columns = 24, indices = [], uvs = [];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array((rows + 1) * (columns + 1) * 3), 3));
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) uvs.push(column / columns, row / rows);
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const a = row * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  updateGarment(geometry, points, radii, folds);
  return geometry;
}

function updateGarment(geometry, points, radii, folds) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => p.isVector3 ? p : new THREE.Vector3(...p)), false, "centripetal");
  const rows = 40, columns = 24;
  const frames = curve.computeFrenetFrames(rows, false);
  const attribute = geometry.getAttribute("position");
  const point = new THREE.Vector3();
  for (let row = 0; row <= rows; row++) {
    const t = row / rows, sample = t * (radii.length - 1);
    const index = Math.min(Math.floor(sample), radii.length - 2);
    const radius = mix(radii[index], radii[index + 1], sample - index);
    const center = curve.getPointAt(t);
    for (let column = 0; column <= columns; column++) {
      const angle = column / columns * TAU;
      const crease = Math.sin(t * 37 + angle * 2) * folds * Math.pow(Math.sin(t * Math.PI), 2);
      point.copy(center).addScaledVector(frames.normals[row], Math.cos(angle) * (radius + crease)).addScaledVector(frames.binormals[row], Math.sin(angle) * (radius * 0.94 + crease));
      attribute.setXYZ(row * (columns + 1) + column, point.x, point.y, point.z);
    }
  }
  attribute.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

function sleevePose(side, lean) {
  const shoulder = leaned([0.015, 1.435, side * 0.303], lean);
  const offset = shoulder.clone().sub(new THREE.Vector3(0.015, 1.435, side * 0.303));
  return [
    shoulder, leaned([0.17, 1.333, side * 0.38], lean),
    new THREE.Vector3(0.405, 1.145, side * 0.475).addScaledVector(offset, 0.4),
    [0.66 + offset.x * 0.15, 1.155 + offset.y * 0.15, side * 0.457],
    [0.915, 1.175, side * 0.432],
  ];
}

function Arm({ side, materials, progressRef, reducedMotion }) {
  const radii = [0.172, 0.152, 0.124, 0.113, 0.073];
  const geometry = useMemo(() => makeGarment(sleevePose(side, 0), radii, 0.006), [side]);
  const lastLean = useRef(NaN);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const lean = leanAt(progressRef.current, reducedMotion);
    if (Math.abs(lean - lastLean.current) < 0.000015) return;
    updateGarment(geometry, sleevePose(side, lean), radii, 0.006);
    lastLean.current = lean;
  });
  return <group>
    <mesh geometry={geometry} material={materials.coat} castShadow />
    <Volume position={[0.911, 1.175, side * 0.432]} scale={[0.061, 0.071, 0.072]} material={materials.cuff} rotation={[0, 0, -0.025]} />
    <Volume position={[0.98, 1.193, side * 0.43]} scale={[0.1, 0.064, 0.082]} material={materials.glove} />
    <Volume position={[0.971, 1.145, side * 0.377]} scale={[0.058, 0.033, 0.036]} material={materials.glove} />
    {[0, 1, 2, 3].map((finger) => <Stitch key={finger} points={[[1.025, 1.212, side * (0.383 + finger * 0.026)], [1.052, 1.181, side * (0.383 + finger * 0.026)], [1.035, 1.146, side * (0.383 + finger * 0.026)]]} color="#0f1114" radius={0.004} />)}
  </group>;
}

function Leg({ side, materials }) {
  const geometry = useMemo(() => makeGarment([
    [-0.37, 0.755, side * 0.195], [-0.06, 0.663, side * 0.285],
    [0.415, 0.377, side * 0.377], [0.405, 0.06, side * 0.326], [0.369, -0.165, side * 0.3],
  ], [0.195, 0.186, 0.145, 0.122, 0.087], 0.008), [side]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group>
    <mesh geometry={geometry} material={materials.pants} castShadow />
    <Volume position={[0.475, -0.244, side * 0.3]} scale={[0.23, 0.034, 0.104]} material={materials.sole} />
    <Volume position={[0.48, -0.192, side * 0.3]} scale={[0.216, 0.078, 0.096]} material={materials.shoe} />
    <Volume position={[0.374, -0.123, side * 0.3]} scale={[0.099, 0.115, 0.089]} material={materials.shoe} />
    <Stitch points={[[0.36, -0.205, side * 0.391], [0.5, -0.208, side * 0.394], [0.63, -0.222, side * 0.373]]} color="#515256" radius={0.004} />
    {[0, 1, 2].map((lace) => <Stitch key={lace} points={[[0.455 + lace * 0.033, -0.118 - lace * 0.012, side * 0.251], [0.455 + lace * 0.033, -0.108 - lace * 0.012, side * 0.349]]} color="#696966" radius={0.0035} />)}
  </group>;
}

function helmetPoint(phi, theta, scale = 1) {
  const front = Math.max(0, Math.cos(theta));
  const chin = Math.sin(clamp((phi - 1.55) / 1.25, 0, 1) * Math.PI) * 0.045 * front;
  return [(Math.sin(phi) * Math.cos(theta) * 0.275 + chin) * scale, Math.cos(phi) * 0.294 * scale, Math.sin(phi) * Math.sin(theta) * 0.235 * scale];
}

function helmetGeometry(visor = false, stripe = false) {
  const positions = [], indices = [];
  const rows = 44, columns = 72;
  const phiStart = visor ? 0.93 : 0, phiEnd = visor ? 1.8 : 2.77;
  const thetaStart = visor ? -1.15 : stripe ? 2.91 : -Math.PI;
  const thetaEnd = visor ? 1.15 : stripe ? 3.37 : Math.PI;
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
    positions.push(...helmetPoint(mix(phiStart, phiEnd, row / rows), mix(thetaStart, thetaEnd, column / columns), visor ? 1.022 : stripe ? 1.009 : 1));
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const phi = mix(phiStart, phiEnd, (row + 0.5) / rows), theta = mix(thetaStart, thetaEnd, (column + 0.5) / columns);
    if (!visor && !stripe && phi > 0.93 && phi < 1.8 && Math.abs(theta) < 1.15) continue;
    const a = row * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Helmet() {
  const geometry = useMemo(() => [helmetGeometry(), helmetGeometry(true), helmetGeometry(false, true)], []);
  useEffect(() => () => geometry.forEach((item) => item.dispose()), [geometry]);
  const rim = useMemo(() => [
    ...Array.from({ length: 25 }, (_, i) => helmetPoint(0.93, mix(-1.15, 1.15, i / 24), 1.025)),
    ...Array.from({ length: 15 }, (_, i) => helmetPoint(mix(0.93, 1.8, i / 14), 1.15, 1.025)),
    ...Array.from({ length: 25 }, (_, i) => helmetPoint(1.8, mix(1.15, -1.15, i / 24), 1.025)),
    ...Array.from({ length: 15 }, (_, i) => helmetPoint(mix(1.8, 0.93, i / 14), -1.15, 1.025)),
  ], []);
  return <group position={[0.16, 1.835, 0]} rotation={[0, 0, -0.105]}>
    <Volume position={[0, -0.01, 0]} scale={[0.253, 0.275, 0.217]} color="#151719" />
    <mesh geometry={geometry[0]} castShadow><meshPhysicalMaterial color="#b52625" roughness={0.28} metalness={0.2} clearcoat={0.9} clearcoatRoughness={0.18} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geometry[2]}><meshStandardMaterial color="#181c21" roughness={0.34} metalness={0.2} /></mesh>
    <Stitch points={rim} color="#11151a" radius={0.011} />
    <mesh geometry={geometry[1]}><meshPhysicalMaterial color="#18232b" roughness={0.17} metalness={0.62} clearcoat={1} side={THREE.DoubleSide} /></mesh>
    <Stitch points={Array.from({ length: 49 }, (_, i) => helmetPoint(2.77, mix(-Math.PI, Math.PI, i / 48), 1.01))} color="#13171c" radius={0.016} />
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[0.047, 0.012, side * 0.235]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.034, 0.034, 0.014, 24]} /><meshStandardMaterial color="#151b20" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0.047, 0.012, side * 0.245]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.011, 0.011, 0.009, 16]} /><meshStandardMaterial color="#7e8487" metalness={0.8} roughness={0.3} /></mesh>
      <Volume position={[0.291, -0.137, side * 0.06]} scale={[0.007, 0.011, 0.034]} color="#171c20" rotation={[0, side * 0.2, 0]} />
    </group>)}
  </group>;
}

/** A connected, clothed adult silhouette; wrists and feet remain on the scooter. */
export default function DeliveryRider({ progressRef, reducedMotion = false }) {
  const upperBody = useRef();
  const materials = useMaterials();
  useFrame(() => { if (upperBody.current) upperBody.current.rotation.z = leanAt(progressRef.current, reducedMotion); });
  return <group name="pizza-teria-delivery-rider">
    <Volume position={[-0.345, 0.744, 0]} scale={[0.257, 0.172, 0.283]} material={materials.pants} />
    <Leg side={-1} materials={materials} /><Leg side={1} materials={materials} />
    <group position={PIVOT}>
      <group ref={upperBody}>
        <group position={[0.34, -0.79, 0]}><Jacket materials={materials} /><Helmet /></group>
      </group>
    </group>
    <Arm side={-1} materials={materials} progressRef={progressRef} reducedMotion={reducedMotion} />
    <Arm side={1} materials={materials} progressRef={progressRef} reducedMotion={reducedMotion} />
  </group>;
}
