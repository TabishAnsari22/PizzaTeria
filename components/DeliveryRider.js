"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COAT = "#202125";
const RED = "#b52624";
const PANTS = "#303137";
const SKIN = "#b58262";
const AXIS = new THREE.Vector3(0, 1, 0);

function Ellipsoid({ position, scale, color = COAT, roughness = 0.8, ...props }) {
  return <mesh position={position} scale={scale} castShadow {...props}><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={color} roughness={roughness} /></mesh>;
}

// Rounded, tapering garment volumes give the joints a human silhouette.
function Limb({ from, to, radius = 0.12, endRadius = 0.09, color = COAT, squash = 1 }) {
  const shape = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const length = a.distanceTo(b);
    const profile = [[0.03, -0.5], [0.65, -0.47], [0.94, -0.38], [1, -0.2], [0.99, 0.18], [0.87, 0.38], [0.57, 0.47], [0.03, 0.5]];
    const points = profile.map(([r, y]) => new THREE.Vector2(r * THREE.MathUtils.lerp(radius, endRadius, y + 0.5), y * length));
    return { geometry: new THREE.LatheGeometry(points, 20), position: a.add(b).multiplyScalar(0.5), quaternion: new THREE.Quaternion().setFromUnitVectors(AXIS, b.sub(new THREE.Vector3(...from)).normalize()) };
  }, [from.join(), to.join(), radius, endRadius]);
  useEffect(() => () => shape.geometry.dispose(), [shape]);
  return <mesh geometry={shape.geometry} position={shape.position} quaternion={shape.quaternion} scale={[1, 1, squash]} castShadow><meshStandardMaterial color={color} roughness={0.87} /></mesh>;
}

function Piping({ points, color = "#5b5c60", radius = 0.006 }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), 28, radius, 5, false), [points.map((p) => p.join()).join(), radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color={color} roughness={0.7} /></mesh>;
}

const TORSO_RINGS = [
  [0.81, -0.34, 0.19, 0.235], [0.85, -0.33, 0.218, 0.25],
  [1.01, -0.28, 0.225, 0.26], [1.22, -0.22, 0.235, 0.285],
  [1.43, -0.14, 0.222, 0.32], [1.55, -0.10, 0.20, 0.325],
  [1.63, -0.08, 0.15, 0.23], [1.66, -0.07, 0.12, 0.17],
];

function jacketGeometry(start = 0, end = Math.PI * 2, offset = 1) {
  const positions = [], indices = [];
  const segments = 40;
  TORSO_RINGS.forEach(([y, center, depth, width]) => {
    for (let i = 0; i <= segments; i++) {
      const angle = start + (end - start) * i / segments;
      const fold = 1 + Math.sin(y * 39 + angle * 4) * 0.014;
      positions.push(center + Math.cos(angle) * depth * offset * fold, y, Math.sin(angle) * width * offset);
    }
  });
  for (let row = 0; row < TORSO_RINGS.length - 1; row++) for (let i = 0; i < segments; i++) {
    const a = row * (segments + 1) + i, b = a + segments + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Jacket() {
  const geometry = useMemo(() => [jacketGeometry(), jacketGeometry(1.02, 2.05, 1.013), jacketGeometry(-2.05, -1.02, 1.013)], []);
  useEffect(() => () => geometry.forEach((item) => item.dispose()), [geometry]);
  return <group>
    <mesh geometry={geometry[0]} castShadow><meshStandardMaterial color={COAT} roughness={0.86} /></mesh>
    {[1, 2].map((i) => <mesh key={i} geometry={geometry[i]} castShadow><meshStandardMaterial color={RED} roughness={0.8} /></mesh>)}
    <Ellipsoid position={[-0.07, 1.65, 0]} scale={[0.17, 0.072, 0.19]} color="#15161a" />
    <Piping points={[[0.067, 0.86, 0], [0.028, 1.02, 0], [0.022, 1.22, 0], [0.09, 1.44, 0], [0.07, 1.59, 0]]} radius={0.008} color="#777574" />
    <mesh position={[0.081, 1.56, 0]} rotation={[0, 0, -0.15]}><boxGeometry args={[0.012, 0.04, 0.019]} /><meshStandardMaterial color="#9e9a91" metalness={0.8} roughness={0.35} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <Piping points={[[-0.22, 0.88, side * 0.255], [-0.16, 1.15, side * 0.292], [-0.09, 1.42, side * 0.325], [-0.02, 1.54, side * 0.3]]} color="#dd5048" radius={0.004} />
      <Piping points={[[0.04, 1.26, side * 0.13], [0.077, 1.34, side * 0.13], [0.086, 1.38, side * 0.17]]} color="#53555a" radius={0.005} />
    </group>)}
    <mesh position={[-0.18, 1.41, 0.324]}><planeGeometry args={[0.16, 0.07]} /><meshStandardMaterial color="#dfd8cd" roughness={0.75} /></mesh>
    <mesh position={[-0.18, 1.41, 0.326]}><planeGeometry args={[0.145, 0.045]} /><meshStandardMaterial color={RED} roughness={0.75} /></mesh>
  </group>;
}

function helmetSurface({ opening = false, visor = false, stripe = false } = {}) {
  const positions = [], indices = [];
  const rows = 36, columns = 64;
  const minPhi = visor ? 0.94 : 0, maxPhi = visor ? 1.77 : Math.PI;
  const minTheta = visor ? -1.13 : stripe ? 2.85 : -Math.PI;
  const maxTheta = visor ? 1.13 : stripe ? 3.43 : Math.PI;
  const scale = visor ? 1.035 : stripe ? 1.008 : 1;
  for (let row = 0; row <= rows; row++) for (let column = 0; column <= columns; column++) {
    const phi = minPhi + (maxPhi - minPhi) * row / rows;
    const theta = minTheta + (maxTheta - minTheta) * column / columns;
    positions.push(Math.sin(phi) * Math.cos(theta) * 0.29 * scale, Math.cos(phi) * 0.32 * scale, Math.sin(phi) * Math.sin(theta) * 0.253 * scale);
  }
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const phi = minPhi + (maxPhi - minPhi) * (row + 0.5) / rows;
    const theta = minTheta + (maxTheta - minTheta) * (column + 0.5) / columns;
    if (opening && Math.abs(theta) < 1.14 && phi > 0.94 && phi < 2.17) continue;
    const a = row * (columns + 1) + column, b = a + columns + 1;
    indices.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function helmetPoint(phi, theta, scale = 1.018) {
  return [Math.sin(phi) * Math.cos(theta) * 0.29 * scale, Math.cos(phi) * 0.32 * scale, Math.sin(phi) * Math.sin(theta) * 0.253 * scale];
}

function Helmet() {
  const geometry = useMemo(() => [helmetSurface({ opening: true }), helmetSurface({ visor: true }), helmetSurface({ stripe: true })], []);
  useEffect(() => () => geometry.forEach((item) => item.dispose()), [geometry]);
  const rim = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 18; i++) points.push(helmetPoint(0.94, -1.14 + 2.28 * i / 18));
    for (let i = 0; i <= 15; i++) points.push(helmetPoint(0.94 + 1.23 * i / 15, 1.14));
    for (let i = 0; i <= 18; i++) points.push(helmetPoint(2.17, 1.14 - 2.28 * i / 18));
    for (let i = 0; i <= 15; i++) points.push(helmetPoint(2.17 - 1.23 * i / 15, -1.14));
    return points;
  }, []);
  return <group position={[0.08, 2.065, 0]} rotation={[0, 0, -0.055]}>
    <Ellipsoid position={[-0.015, -0.015, 0]} scale={[0.245, 0.278, 0.211]} color={SKIN} roughness={0.75} />
    <Ellipsoid position={[0.225, -0.085, 0]} scale={[0.062, 0.086, 0.059]} color={SKIN} />
    <Ellipsoid position={[0.217, -0.158, 0]} scale={[0.039, 0.062, 0.118]} color="#a87557" />
    <Piping points={[[0.251, -0.157, -0.042], [0.258, -0.164, 0], [0.251, -0.157, 0.042]]} color="#754d3c" radius={0.004} />
    <mesh geometry={geometry[0]} castShadow><meshPhysicalMaterial color={RED} metalness={0.28} roughness={0.23} clearcoat={1} clearcoatRoughness={0.12} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geometry[2]}><meshStandardMaterial color="#13161b" roughness={0.3} metalness={0.18} /></mesh>
    <Piping points={rim} color="#111419" radius={0.012} />
    <mesh geometry={geometry[1]}><meshPhysicalMaterial color="#27353e" roughness={0.14} metalness={0.52} transparent opacity={0.89} clearcoat={1} side={THREE.DoubleSide} /></mesh>
    <Piping points={Array.from({ length: 20 }, (_, i) => helmetPoint(1.77, -1.13 + 2.26 * i / 19, 1.041))} color="#101419" radius={0.006} />
    {[-1, 1].map((side) => <group key={side} position={[0.035, 0.025, side * 0.249]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.041, 0.041, 0.012, 24]} /><meshStandardMaterial color="#161a20" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0, side * 0.008]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.016, 0.016, 0.013, 16]} /><meshStandardMaterial color="#a6a4a0" metalness={0.8} roughness={0.23} /></mesh>
    </group>)}
  </group>;
}

function Arm({ side }) {
  return <group>
    <Ellipsoid position={[-0.075, 1.535, side * 0.294]} scale={[0.16, 0.178, 0.145]} />
    <Limb from={[-0.055, 1.535, side * 0.3]} to={[0.375, 1.255, side * 0.47]} radius={0.145} endRadius={0.108} />
    <Ellipsoid position={[0.372, 1.255, side * 0.47]} scale={[0.112, 0.108, 0.108]} />
    <Limb from={[0.375, 1.255, side * 0.47]} to={[0.915, 1.175, side * 0.435]} radius={0.116} endRadius={0.074} />
    <Limb from={[0.84, 1.185, side * 0.44]} to={[0.93, 1.17, side * 0.433]} radius={0.079} endRadius={0.072} color="#121317" />
    <Ellipsoid position={[0.977, 1.195, side * 0.432]} scale={[0.105, 0.066, 0.087]} color="#26282b" roughness={0.68} />
    <Ellipsoid position={[0.959, 1.148, side * 0.379]} scale={[0.061, 0.032, 0.036]} color="#26282b" />
    {[0, 1, 2, 3].map((finger) => <Piping key={finger} points={[[1.025, 1.217, side * (0.38 + finger * 0.028)], [1.058, 1.182, side * (0.38 + finger * 0.028)], [1.04, 1.145, side * (0.38 + finger * 0.028)]]} color="#16181c" radius={0.005} />)}
    <Piping points={[[0.19, 1.397, side * 0.407], [0.275, 1.344, side * 0.453], [0.335, 1.307, side * 0.476]]} color="#56565a" radius={0.004} />
  </group>;
}

function Leg({ side }) {
  return <group>
    <Limb from={[-0.34, 0.765, side * 0.205]} to={[0.335, 0.385, side * 0.365]} radius={0.167} endRadius={0.13} color={PANTS} squash={0.94} />
    <Ellipsoid position={[0.332, 0.386, side * 0.365]} scale={[0.138, 0.132, 0.128]} color={PANTS} />
    <Limb from={[0.33, 0.385, side * 0.365]} to={[0.363, -0.155, side * 0.298]} radius={0.125} endRadius={0.082} color={PANTS} />
    <Piping points={[[-0.24, 0.801, side * 0.333], [0.04, 0.648, side * 0.386], [0.335, 0.413, side * 0.485], [0.4, 0.12, side * 0.394], [0.4, -0.112, side * 0.377]]} color="#494b50" radius={0.004} />
    <Ellipsoid position={[0.47, -0.232, side * 0.3]} scale={[0.236, 0.04, 0.105]} color="#090a0d" />
    <Ellipsoid position={[0.475, -0.18, side * 0.3]} scale={[0.216, 0.085, 0.095]} color="#16181c" roughness={0.65} />
    <Ellipsoid position={[0.37, -0.115, side * 0.3]} scale={[0.095, 0.116, 0.087]} color="#1c1e22" />
    {[0, 1, 2].map((lace) => <Piping key={lace} points={[[0.455 + lace * 0.035, -0.103 - lace * 0.014, side * 0.245], [0.455 + lace * 0.035, -0.092 - lace * 0.014, side * 0.355]]} color="#696966" radius={0.004} />)}
  </group>;
}

/** Seated in the scooter's local coordinates, with scroll-driven suspension only. */
export default function DeliveryRider({ progressRef, reducedMotion = false }) {
  const group = useRef();
  useFrame(() => {
    if (!group.current) return;
    const p = THREE.MathUtils.clamp((progressRef.current - 0.82) / 0.18, 0, 1);
    const riding = p * p * (3 - 2 * p);
    group.current.position.y = reducedMotion ? 0 : Math.sin(p * Math.PI * 4) * 0.007 * riding;
    group.current.rotation.y = reducedMotion ? 0 : Math.sin(p * Math.PI * 2) * 0.006 * riding;
  });
  return <group ref={group} name="pizza-teria-delivery-rider">
    <Ellipsoid position={[-0.355, 0.77, 0]} scale={[0.245, 0.192, 0.272]} color={PANTS} />
    <Leg side={-1} /><Leg side={1} />
    <Ellipsoid position={[-0.035, 1.75, 0]} scale={[0.103, 0.15, 0.107]} color={SKIN} />
    <Jacket /><Arm side={-1} /><Arm side={1} /><Helmet />
  </group>;
}
