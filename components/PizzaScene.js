"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import DeliveryRider from "./DeliveryRider";

const RED = "#c32e2a";
const BLACK = "#111111";
const CREAM = "#f4eee5";
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (p, from, to) => {
  const t = clamp((p - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const mix = THREE.MathUtils.lerp;

function randomGenerator(seed = 721) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeDoughTexture(raw = false) {
  return canvasTexture(1024, 256, (ctx, width, height) => {
    const random = randomGenerator(73);
    ctx.fillStyle = raw ? "#ecd6aa" : "#d99b4b";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 1800; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 3 + random() * 30;
      const shade = raw ? "rgba(255,246,220,.12)" : random() > 0.4 ? "rgba(255,218,145,.17)" : "rgba(122,61,15,.12)";
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, shade);
      gradient.addColorStop(1, "rgba(235,177,99,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius, radius * 0.65, random(), 0, TAU);
      ctx.fill();
    }
    if (!raw) {
      for (let i = 0; i < 165; i++) {
        const x = random() * width;
        const y = 25 + random() * (height - 45);
        const radius = 1.8 + Math.pow(random(), 3) * 18;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.8);
        gradient.addColorStop(0, "rgba(46,22,9,.94)");
        gradient.addColorStop(0.38, "rgba(66,31,11,.86)");
        gradient.addColorStop(0.64, "rgba(116,57,17,.7)");
        gradient.addColorStop(1, "rgba(144,78,25,0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.8, radius, random() * TAU, 0, TAU);
        ctx.fill();
      }
    }
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(255,245,216,${random() * 0.12})`;
      ctx.fillRect(random() * width, random() * height, 1, 1);
    }
  });
}

function makeCheeseTexture() {
  return canvasTexture(1024, 1024, (ctx, width, height) => {
    const random = randomGenerator(37);
    ctx.fillStyle = "#b3381d";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 150; i++) {
      const x = random() * width;
      const y = random() * height;
      const r = 20 + random() * 75;
      ctx.fillStyle = random() > 0.5 ? "rgba(224,78,30,.27)" : "rgba(97,30,10,.2)";
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, random() * TAU, 0, TAU);
      ctx.fill();
    }
    // Broad, irregular pools read as melted mozzarella instead of a flat disc.
    for (let i = 0; i < 35; i++) {
      const a = random() * TAU;
      const distance = Math.sqrt(random()) * 430;
      const x = 512 + Math.cos(a) * distance;
      const y = 512 + Math.sin(a) * distance;
      const radius = 70 + random() * 90;
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius * 1.15);
      gradient.addColorStop(0, "#fff3c8");
      gradient.addColorStop(0.65, "#f0d995");
      gradient.addColorStop(1, "#ddad5e");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      for (let j = 0; j <= 24; j++) {
        const angle = (j / 24) * TAU;
        const irregular = radius * (0.88 + 0.18 * Math.sin(angle * 3 + i) + 0.1 * Math.sin(angle * 5 + i));
        const px = x + Math.cos(angle) * irregular;
        const py = y + Math.sin(angle) * irregular * 0.9;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 190; i++) {
      const x = random() * width;
      const y = random() * height;
      const radius = 1 + random() * 8;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
      gradient.addColorStop(0, "rgba(118,52,12,.65)");
      gradient.addColorStop(0.45, "rgba(183,98,24,.37)");
      gradient.addColorStop(1, "rgba(203,143,58,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 2, radius, random() * TAU, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = `rgba(95,63,13,${random() * 0.12})`;
      ctx.fillRect(random() * width, random() * height, 1, 1);
    }
  });
}

function makeBrandTexture(side = false, interior = false) {
  return canvasTexture(1024, side ? 128 : 1024, (ctx, width, height) => {
    if (interior) {
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.fillStyle = "#e5392f";
    ctx.strokeStyle = "#e5392f";
    ctx.textAlign = "center";
    if (side) {
      ctx.fillRect(0, 8, width, 2);
      ctx.fillRect(0, height - 8, width, 2);
      ctx.font = "600 32px Georgia, serif";
      ctx.fillText("PIZZA TERIA   /   CRAFTED. FIRED. DELIVERED.", width / 2, 77);
      return;
    }
    ctx.lineWidth = 1.5;
    ctx.strokeRect(73, 73, 878, 878);
    ctx.strokeRect(86, 86, 852, 852);
    // Fine line orbital mark, printed as red foil on the matte black lid.
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(512, 270);
      ctx.rotate(i * Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 68, 37, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(512, 270, 12, 0, TAU);
    ctx.stroke();
    ctx.font = "bold 139px Georgia, serif";
    ctx.fillText("PIZZA", 512, 498);
    ctx.fillText("TERIA", 512, 633);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(342, 695);
    ctx.lineTo(682, 695);
    ctx.stroke();
    ctx.font = "18px Arial, sans-serif";
    ctx.fillText(interior ? "FRESH FROM THE FIRE. ALL YOURS." : "THE ART OF A GOOD PIZZA", 512, 763);
    ctx.font = "italic 23px Georgia, serif";
    ctx.fillText("Made with fire. Served with soul.", 512, 867);
  });
}

function makeWispTexture() {
  return canvasTexture(64, 256, (ctx) => {
    ctx.filter = "blur(7px)";
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.35, "rgba(255,255,255,.45)");
    gradient.addColorStop(0.75, "rgba(255,255,255,.8)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(28, 250);
    ctx.bezierCurveTo(5, 180, 59, 132, 30, 66);
    ctx.bezierCurveTo(17, 35, 39, 15, 34, 0);
    ctx.stroke();
  });
}

function makeEmberGlowTexture() {
  return canvasTexture(128, 128, (ctx, width) => {
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, "rgba(255,90,13,0)");
    glow.addColorStop(0.59, "rgba(255,90,13,0)");
    glow.addColorStop(0.72, "rgba(255,111,26,.3)");
    glow.addColorStop(0.8, "rgba(255,54,5,.48)");
    glow.addColorStop(0.9, "rgba(166,20,2,.12)");
    glow.addColorStop(1, "rgba(255,50,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, width);
  });
}

function makeLeafTexture() {
  return canvasTexture(128, 256, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#173f16");
    gradient.addColorStop(0.48, "#38722a");
    gradient.addColorStop(1, "#1a471b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    const random = randomGenerator(91);
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = `rgba(113,151,65,${random() * 0.12})`;
      ctx.fillRect(random() * width, random() * height, 1, 2);
    }
    ctx.strokeStyle = "rgba(163,190,104,.5)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(64, 256);
    ctx.lineTo(64, 0);
    ctx.stroke();
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 8; i++) {
      const y = 35 + i * 27;
      ctx.beginPath();
      ctx.moveTo(64, y + 36);
      ctx.quadraticCurveTo(35, y + 18, 0, y - 14);
      ctx.moveTo(64, y + 36);
      ctx.quadraticCurveTo(95, y + 18, 128, y - 14);
      ctx.stroke();
    }
  });
}

function makeShadowTexture() {
  return canvasTexture(128, 128, (ctx, width, height) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 3, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, "rgba(5,17,9,.8)");
    gradient.addColorStop(0.38, "rgba(5,17,9,.64)");
    gradient.addColorStop(0.7, "rgba(5,17,9,.2)");
    gradient.addColorStop(1, "rgba(5,17,9,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  });
}

function makeBaseGeometry() {
  // A thin, rounded bread underside: no straight cylinder wall under the pizza.
  const profile = [[0, -0.064], [1.5, -0.064], [1.93, -0.05], [2.11, -0.018], [2.115, 0.018], [1.91, 0.036], [0, 0.035]].map(([radius, height]) => new THREE.Vector2(radius, height));
  const geometry = new THREE.LatheGeometry(profile, 144);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const angle = Math.atan2(z, x);
    const radial = Math.hypot(x, z) / 2.115;
    const irregular = (Math.sin(angle * 5 + 0.4) * 0.024 + Math.cos(angle * 9) * 0.019 + Math.sin(angle * 3) * 0.015) * radial;
    position.setXYZ(i, x * (1 + irregular), position.getY(i) + Math.sin(angle * 7 + 0.5) * 0.006 * radial, z * (1 + irregular));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeCrustGeometry() {
  const around = 180;
  const tube = 22;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= around; i++) {
    const a = (i / around) * TAU;
    const center = 2.005 + Math.sin(a * 5) * 0.033 + Math.cos(a * 9 + 0.8) * 0.025 + Math.sin(a * 3 + 0.3) * 0.02;
    const puff = 0.205 + Math.sin(a * 7 + 1) * 0.034 + Math.cos(a * 11) * 0.022 + Math.sin(a * 17) * 0.012;
    const verticalPuff = puff * (0.67 + Math.sin(a * 4 + 0.6) * 0.11);
    const centerHeight = 0.075 + Math.sin(a * 3) * 0.012 + Math.cos(a * 8) * 0.009;
    for (let j = 0; j <= tube; j++) {
      const b = (j / tube) * TAU;
      const surface = 1 + Math.sin(a * 29 + b * 5) * 0.034 + Math.cos(a * 41 - b * 3) * 0.022;
      const radius = center + Math.cos(b) * puff * surface;
      const height = Math.max(-0.065 + Math.sin(a * 9) * 0.006, centerHeight + Math.sin(b) * verticalPuff * surface);
      positions.push(Math.cos(a) * radius, height, Math.sin(a) * radius);
      uvs.push(i / around, j / tube);
      if (i < around && j < tube) {
        const index = i * (tube + 1) + j;
        indices.push(index, index + 1, index + tube + 1, index + 1, index + tube + 2, index + tube + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeSurfaceGeometry() {
  const rings = 46;
  const sectors = 180;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    for (let i = 0; i <= sectors; i++) {
      const a = (i / sectors) * TAU;
      const r = (ring / rings) * (1.9 + Math.sin(a * 5) * 0.032 + Math.cos(a * 9) * 0.017);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, 0.082 + Math.sin(x * 5 + z * 3) * 0.009 + Math.cos(z * 8 - x * 4) * 0.008 + Math.sin(x * 17 - z * 21) * 0.002, z);
      uvs.push(x / 3.8 + 0.5, z / 3.8 + 0.5);
      if (ring < rings && i < sectors) {
        const index = ring * (sectors + 1) + i;
        indices.push(index, index + 1, index + sectors + 1, index + 1, index + sectors + 2, index + sectors + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeLeafGeometry() {
  const lengthSteps = 18;
  const widthSteps = 8;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= lengthSteps; j++) {
    const t = j / lengthSteps;
    for (let i = 0; i <= widthSteps; i++) {
      const side = (i / widthSteps) * 2 - 1;
      const width = Math.pow(Math.sin(t * Math.PI), 0.8) * 0.195 * (1 + Math.sin(t * 15) * 0.03);
      positions.push(side * width, Math.sin(t * Math.PI) * (0.05 + 0.055 * (1 - Math.abs(side))) + side * side * Math.sin(t * 8) * 0.014, t * 0.69);
      uvs.push(i / widthSteps, t);
      if (j < lengthSteps && i < widthSteps) {
        const index = j * (widthSteps + 1) + i;
        indices.push(index, index + widthSteps + 1, index + 1, index + 1, index + widthSteps + 1, index + widthSteps + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Basil({ position, rotation = 0, geometry, texture }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 2.25, 4.45].map((angle, index) => (
        <group key={angle} rotation={[index === 1 ? 0.16 : 0, angle, 0]} scale={index === 2 ? 0.72 : 1}>
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial map={texture} color={index === 1 ? "#d4e2b9" : "#c1d6ae"} roughness={0.43} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Tomato({ position, rotation }) {
  return (
    <group position={position} rotation={[0.08, rotation, -0.05]}>
      <mesh castShadow receiveShadow scale={[1, 0.32, 0.8]}>
        <sphereGeometry args={[0.27, 24, 12]} />
        <meshStandardMaterial color="#a92410" roughness={0.36} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.064, 0]} scale={[1, 0.8, 1]}>
        <circleGeometry args={[0.235, 32]} />
        <meshStandardMaterial color="#bd3c21" roughness={0.43} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * TAU;
        return <mesh key={i} position={[Math.cos(a) * (i % 2 ? 0.13 : 0.1), 0.069, Math.sin(a) * 0.1]} rotation={[0, -a + 0.2, 0]} scale={[1, 0.24, 0.5]}><sphereGeometry args={[0.026, 8, 6]} /><meshStandardMaterial color="#d8b05c" roughness={0.48} /></mesh>;
      })}
      <mesh position={[0, 0.073, 0]} scale={[1, 0.15, 0.8]}><sphereGeometry args={[0.045, 12, 8]} /><meshStandardMaterial color="#dc7641" roughness={0.45} /></mesh>
    </group>
  );
}

function Pizza({ progressRef, hero, reducedMotion }) {
  const group = useRef();
  const baseMaterial = useRef();
  const crustMaterial = useRef();
  const cheeseMaterial = useRef();
  const ingredients = useRef();
  const ingredientMaterials = useRef([]);
  const photoReady = useRef(false);
  const relief = useRef(null);
  const lastBake = useRef(-1);
  const falling = useRef([]);
  const invalidate = useThree((state) => state.invalidate);
  const textures = useMemo(() => ({ cooked: makeDoughTexture(), bread: makeDoughTexture(), raw: makeDoughTexture(true), cheese: makeCheeseTexture(), finished: makeCheeseTexture(), leaf: makeLeafTexture() }), []);
  const baseGeometry = useMemo(makeBaseGeometry, []);
  const crustGeometry = useMemo(makeCrustGeometry, []);
  const surfaceGeometry = useMemo(makeSurfaceGeometry, []);
  const surfaceHeights = useMemo(() => Float32Array.from({ length: surfaceGeometry.attributes.position.count }, (_, index) => surfaceGeometry.attributes.position.getY(index)), [surfaceGeometry]);
  const leafGeometry = useMemo(makeLeafGeometry, []);
  const tomatoes = useMemo(() => [
    [-1.02, 0.17, -0.68], [0.25, 0.16, -1.12], [1.05, 0.17, -0.2], [0.73, 0.17, 0.93], [-0.55, 0.17, 1.03], [-1.23, 0.17, 0.37], [0.06, 0.17, 0.1],
  ], []);
  const basil = useMemo(() => [[-0.6, 0.19, -0.94], [0.98, 0.19, 0.25], [-0.73, 0.19, 0.61], [0.25, 0.19, 0.36]], []);

  useEffect(() => {
    ingredientMaterials.current = [];
    ingredients.current.traverse((object) => {
      if (!object.material) return;
      object.material.transparent = true;
      ingredientMaterials.current.push(object.material);
    });
  }, []);

  useEffect(() => {
    // Both maps sample the same generated photograph in matching coordinates:
    // the actual raised crust unwraps its perimeter, while the undulating top
    // receives its glossy sauce, melted cheese, oil and charred ingredient detail.
    let active = true;
    const reference = new Image();
    reference.onload = () => {
      if (!active) return;
      const source = document.createElement("canvas");
      source.width = reference.naturalWidth;
      source.height = reference.naturalHeight;
      const context = source.getContext("2d", { willReadFrequently: true });
      context.drawImage(reference, 0, 0);
      const pixels = context.getImageData(0, 0, source.width, source.height).data;
      const output = textures.cooked.image;
      const target = output.getContext("2d");
      const toastedBread = target.getImageData(0, 0, output.width, output.height).data;
      const unwrapped = target.createImageData(output.width, output.height);
      const centerX = source.width / 2;
      const centerY = source.height / 2;
      for (let y = 0; y < output.height; y++) {
        const tubeAngle = (1 - y / output.height) * TAU;
        // A photograph is appropriate on the crown, where the dough faces up.
        // The vertical sides retain toasted bread rather than stretched pixels.
        const photoWeight = smooth(Math.sin(tubeAngle), 0.12, 0.66);
        const radius = ((2.005 + Math.cos(tubeAngle) * 0.225) / 2.25) * source.width * 0.475;
        for (let x = 0; x < output.width; x++) {
          const angle = (x / output.width) * TAU;
          let sampleRadius = radius;
          let sx = clamp(Math.round(centerX + Math.cos(angle) * sampleRadius), 0, source.width - 1);
          let sy = clamp(Math.round(centerY - Math.sin(angle) * sampleRadius), 0, source.height - 1);
          let from = (sy * source.width + sx) * 4;
          while (pixels[from + 3] < 220 && sampleRadius > radius * 0.9) {
            sampleRadius *= 0.99;
            sx = clamp(Math.round(centerX + Math.cos(angle) * sampleRadius), 0, source.width - 1);
            sy = clamp(Math.round(centerY - Math.sin(angle) * sampleRadius), 0, source.height - 1);
            from = (sy * source.width + sx) * 4;
          }
          const to = (y * output.width + x) * 4;
          unwrapped.data[to] = mix(toastedBread[to], pixels[from], photoWeight);
          unwrapped.data[to + 1] = mix(toastedBread[to + 1], pixels[from + 1], photoWeight);
          unwrapped.data[to + 2] = mix(toastedBread[to + 2], pixels[from + 2], photoWeight);
          unwrapped.data[to + 3] = 255;
        }
      }
      target.putImageData(unwrapped, 0, 0);
      textures.cooked.needsUpdate = true;
      const top = textures.finished.image;
      const topContext = top.getContext("2d");
      const crop = source.width * 0.475 * (1.9 / 2.25);
      topContext.drawImage(source, centerX - crop, centerY - crop, crop * 2, crop * 2, 0, 0, top.width, top.height);
      textures.finished.needsUpdate = true;
      const topPixels = topContext.getImageData(0, 0, top.width, top.height).data;
      const sample = (x, z) => {
        const px = clamp(Math.round((x / 3.8 + 0.5) * (top.width - 1)), 0, top.width - 1);
        const py = clamp(Math.round((0.5 - z / 3.8) * (top.height - 1)), 0, top.height - 1);
        const index = (py * top.width + px) * 4;
        return [topPixels[index], topPixels[index + 1], topPixels[index + 2]];
      };
      const cheeseMask = ([r, g, b]) => clamp((g - 95) / 105) * clamp((r - g + 18) / 42) * clamp((g - b) / 35);
      const random = randomGenerator(536);
      const blisters = [];
      for (let trial = 0; trial < 150 && blisters.length < 22; trial++) {
        const x = (random() * 2 - 1) * 1.65;
        const z = (random() * 2 - 1) * 1.65;
        if (Math.hypot(x, z) < 1.72 && cheeseMask(sample(x, z)) > 0.55) blisters.push({ x, z, radius: 0.055 + random() * 0.055, height: 0.009 + random() * 0.014 });
      }
      const vertices = surfaceGeometry.attributes.position;
      const offsets = new Float32Array(vertices.count);
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const z = vertices.getZ(i);
        const [r, g, b] = sample(x, z);
        const cheese = cheeseMask([r, g, b]);
        const sauce = clamp((r - g - 55) / 95);
        const leaf = g > r * 0.9 && g > b * 1.5 ? 1 : 0;
        let height = cheese * 0.032 + sauce * 0.012 + leaf * 0.016;
        for (const blister of blisters) {
          const distance = (x - blister.x) ** 2 + (z - blister.z) ** 2;
          if (distance < blister.radius ** 2 * 5) height += blister.height * Math.exp(-distance / (blister.radius ** 2));
        }
        offsets[i] = height;
      }
      relief.current = offsets;
      lastBake.current = -1;
      photoReady.current = true;
      invalidate();
    };
    reference.onerror = () => {
      if (active && reference.src.endsWith("pizza-signature.webp")) reference.src = "/images/pizza-hero.webp";
    };
    reference.src = "/images/pizza-signature.webp";
    return () => { active = false; reference.onload = null; reference.onerror = null; };
  }, [textures, surfaceGeometry, invalidate]);

  useEffect(() => () => {
    Object.values(textures).forEach((texture) => texture.dispose());
    baseGeometry.dispose();
    crustGeometry.dispose();
    surfaceGeometry.dispose();
    leafGeometry.dispose();
  }, [textures, baseGeometry, crustGeometry, surfaceGeometry, leafGeometry]);

  useFrame(({ clock }) => {
    const p = hero ? 0.48 : progressRef.current;
    const sauce = hero ? 1 : smooth(p, 0.035, 0.16);
    const baked = hero ? 1 : smooth(p, 0.25, 0.4);
    if (relief.current && Math.abs(lastBake.current - baked) > 0.0001) {
      const vertices = surfaceGeometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) vertices.setY(i, surfaceHeights[i] + relief.current[i] * baked);
      vertices.needsUpdate = true;
      surfaceGeometry.computeVertexNormals();
      lastBake.current = baked;
    }
    const finish = photoReady.current ? (hero ? 1 : smooth(p, 0.27, 0.39)) : 0;
    if (cheeseMaterial.current) cheeseMaterial.current.opacity = sauce;
    const topShader = cheeseMaterial.current?.userData.shader;
    if (topShader) topShader.uniforms.uFinish.value = finish;
    ingredientMaterials.current.forEach((material) => { material.opacity = 1 - finish; material.depthWrite = finish < 0.02; });
    const shader = crustMaterial.current?.userData.shader;
    if (shader) shader.uniforms.uBake.value = baked;
    const undersideShader = baseMaterial.current?.userData.shader;
    if (undersideShader) undersideShader.uniforms.uBake.value = baked;
    if (group.current) {
      group.current.position.y = hero ? Math.sin(reducedMotion ? 0 : clock.elapsedTime * 0.5) * 0.025 : mix(0.2, -0.12, smooth(p, 0.53, 0.67));
      group.current.rotation.y = hero ? 0.18 : mix(-0.3, 0.16, smooth(p, 0, 0.48));
    }
    falling.current.forEach((item, index) => {
      if (!item) return;
      const isBasil = index >= tomatoes.length;
      const order = isBasil ? index - tomatoes.length : index;
      const start = isBasil ? 0.18 + order * 0.014 : 0.07 + order * 0.012;
      const drop = hero ? 1 : smooth(p, start, start + 0.12);
      item.visible = drop > 0.01 && finish < 0.995;
      item.position.y = (1 - drop) * (2.8 + (index % 3) * 0.45);
      item.rotation.y = (1 - drop) * (index % 2 ? -1.5 : 1.2);
      item.scale.setScalar(0.84 + drop * 0.16);
    });
  });

  return (
    <group ref={group}>
      <mesh geometry={baseGeometry} castShadow receiveShadow>
        <meshStandardMaterial ref={baseMaterial} map={textures.bread} roughness={0.94} bumpMap={textures.bread} bumpScale={0.008} onBeforeCompile={(shader) => {
          shader.uniforms.uRawMap = { value: textures.raw };
          shader.uniforms.uBake = { value: hero ? 1 : smooth(progressRef.current, 0.25, 0.4) };
          shader.fragmentShader = "uniform sampler2D uRawMap;\nuniform float uBake;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#ifdef USE_MAP\nvec4 rawColor = texture2D(uRawMap, vMapUv);\nvec4 breadColor = texture2D(map, vMapUv);\ndiffuseColor *= mix(rawColor, breadColor, uBake);\n#endif");
          if (baseMaterial.current) baseMaterial.current.userData.shader = shader;
        }} />
      </mesh>
      <mesh geometry={crustGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial ref={crustMaterial} map={textures.cooked} bumpMap={textures.cooked} bumpScale={0.012} roughness={0.75} clearcoat={0.035} clearcoatRoughness={0.6} onBeforeCompile={(shader) => {
          shader.uniforms.uRawMap = { value: textures.raw };
          shader.uniforms.uBake = { value: hero ? 1 : smooth(progressRef.current, 0.25, 0.4) };
          shader.fragmentShader = "uniform sampler2D uRawMap;\nuniform float uBake;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#ifdef USE_MAP\nvec4 rawColor = texture2D(uRawMap, vMapUv);\nvec4 cookedColor = texture2D(map, vMapUv);\ndiffuseColor *= mix(rawColor, cookedColor, uBake);\n#endif");
          if (crustMaterial.current) crustMaterial.current.userData.shader = shader;
        }} />
      </mesh>
      <mesh geometry={surfaceGeometry} receiveShadow>
        <meshPhysicalMaterial ref={cheeseMaterial} map={textures.cheese} bumpMap={textures.finished} bumpScale={0.01} roughness={0.53} clearcoat={0.12} clearcoatRoughness={0.32} transparent opacity={hero ? 1 : 0} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} onBeforeCompile={(shader) => {
          shader.uniforms.uFinishedMap = { value: textures.finished };
          shader.uniforms.uFinish = { value: photoReady.current ? (hero ? 1 : smooth(progressRef.current, 0.27, 0.39)) : 0 };
          shader.fragmentShader = "uniform sampler2D uFinishedMap;\nuniform float uFinish;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#ifdef USE_MAP\nvec4 ingredientColor = texture2D(map, vMapUv);\nvec4 finishedColor = texture2D(uFinishedMap, vMapUv);\ndiffuseColor *= mix(ingredientColor, finishedColor, uFinish);\n#endif");
          if (cheeseMaterial.current) cheeseMaterial.current.userData.shader = shader;
        }} />
      </mesh>
      <group ref={ingredients}>
      {tomatoes.map((position, index) => <group key={`tomato-${index}`} ref={(element) => { falling.current[index] = element; }}><Tomato position={position} rotation={index * 2.41} /></group>)}
      {basil.map((position, index) => <group key={`basil-${index}`} ref={(element) => { falling.current[tomatoes.length + index] = element; }}><Basil position={position} rotation={index * 2.1} geometry={leafGeometry} texture={textures.leaf} /></group>)}
      </group>
    </group>
  );
}

function PizzaBox({ progressRef }) {
  const group = useRef();
  const lid = useRef();
  const brandTexture = useMemo(() => makeBrandTexture(), []);
  const sideTexture = useMemo(() => makeBrandTexture(true), []);
  const innerTexture = useMemo(() => makeBrandTexture(false, true), []);
  useEffect(() => () => { brandTexture.dispose(); sideTexture.dispose(); innerTexture.dispose(); }, [brandTexture, sideTexture, innerTexture]);
  useFrame(() => {
    const p = progressRef.current;
    const appear = smooth(p, 0.465, 0.57);
    group.current.visible = appear > 0.002;
    group.current.scale.setScalar(0.86 + appear * 0.14);
    group.current.position.y = -(1 - appear) * 1.6;
    lid.current.rotation.x = mix(-2.02, 0, smooth(p, 0.58, 0.755));
  });
  return (
    <group ref={group} visible={false}>
      <RoundedBox args={[4.94, 0.095, 4.94]} radius={0.025} smoothness={2} position={[0, -0.3, 0]} receiveShadow castShadow><meshStandardMaterial color={BLACK} roughness={0.82} /></RoundedBox>
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[4.85, 4.85]} /><meshStandardMaterial color={CREAM} roughness={0.95} /></mesh>
      {[-1, 1].map((side) => <group key={side}><mesh position={[side * 2.455, -0.015, 0]} castShadow receiveShadow><boxGeometry args={[0.075, 0.58, 4.94]} /><meshStandardMaterial color={BLACK} roughness={0.82} /></mesh><mesh position={[side * 2.414, -0.015, 0]} rotation={[0, -side * Math.PI / 2, 0]}><planeGeometry args={[4.82, 0.55]} /><meshStandardMaterial color={CREAM} roughness={0.94} /></mesh></group>)}
      {[-1, 1].map((side) => <group key={`end-${side}`}><mesh position={[0, -0.015, side * 2.455]} castShadow receiveShadow><boxGeometry args={[4.94, 0.58, 0.075]} /><meshStandardMaterial color={BLACK} roughness={0.82} /></mesh><mesh position={[0, -0.015, side * 2.414]} rotation={[0, side === 1 ? Math.PI : 0, 0]}><planeGeometry args={[4.82, 0.55]} /><meshStandardMaterial color="#ae2925" roughness={0.9} /></mesh></group>)}
      <mesh position={[0, 0, 2.496]}><planeGeometry args={[4.83, 0.39]} /><meshPhysicalMaterial map={sideTexture} transparent metalness={0.48} roughness={0.35} /></mesh>
      <mesh position={[2.496, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[4.83, 0.39]} /><meshPhysicalMaterial map={sideTexture} transparent metalness={0.48} roughness={0.35} /></mesh>
      <group ref={lid} position={[0, 0.305, -2.485]} rotation={[-2.02, 0, 0]}>
        <RoundedBox args={[5.035, 0.075, 5.035]} radius={0.025} smoothness={2} position={[0, 0, 2.485]} castShadow receiveShadow><meshStandardMaterial color={BLACK} roughness={0.8} /></RoundedBox>
        <mesh position={[0, 0.039, 2.485]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.97, 4.97]} /><meshPhysicalMaterial map={brandTexture} transparent metalness={0.55} roughness={0.31} clearcoat={0.15} /></mesh>
        <mesh position={[0, -0.039, 2.485]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[4.97, 4.97]} /><meshStandardMaterial map={innerTexture} roughness={0.94} /></mesh>
        <mesh position={[0, -0.1, 4.975]}><boxGeometry args={[4.88, 0.18, 0.045]} /><meshStandardMaterial color="#252323" roughness={0.9} /></mesh>
      </group>
    </group>
  );
}

function Fire({ progressRef, reducedMotion }) {
  const group = useRef();
  const wisps = useRef([]);
  const embers = useRef([]);
  const light = useRef();
  const glow = useRef();
  const wispTexture = useMemo(makeWispTexture, []);
  const glowTexture = useMemo(makeEmberGlowTexture, []);
  useEffect(() => () => { wispTexture.dispose(); glowTexture.dispose(); }, [wispTexture, glowTexture]);
  useFrame(({ clock, camera }) => {
    const p = progressRef.current;
    const intensity = smooth(p, 0.26, 0.32) * (1 - smooth(p, 0.45, 0.54));
    group.current.visible = intensity > 0.005;
    light.current.intensity = intensity * 7.5;
    glow.current.material.opacity = intensity * 0.67;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    wisps.current.forEach((mesh, index) => {
      if (!mesh) return;
      const rise = (time * 0.13 + index * 0.173) % 1;
      const angle = index * 2.399;
      const steam = index > 4;
      const radius = steam ? 0.9 + (index % 3) * 0.35 : 2.08;
      mesh.position.set(Math.cos(angle) * radius + Math.sin(time + index) * 0.08, (steam ? 0.5 : -0.2) + rise * (steam ? 1.3 : 0.65), Math.sin(angle) * radius);
      mesh.scale.set(steam ? 0.4 + rise * 0.3 : 0.2, steam ? 1.1 + rise * 0.4 : 0.65, 1);
      mesh.quaternion.copy(camera.quaternion);
      mesh.material.opacity = intensity * Math.sin(rise * Math.PI) * (steam ? 0.14 : 0.3);
    });
    embers.current.forEach((mesh, index) => {
      if (!mesh) return;
      const rise = ((time * 0.24 + index * 0.13) % 1);
      mesh.position.y = -0.2 + rise * 0.9;
      mesh.material.opacity = intensity * Math.sin(rise * Math.PI) * 0.85;
    });
  });
  return (
    <group ref={group} visible={false}>
      <pointLight ref={light} position={[0, -0.4, 0]} color="#ff6925" intensity={0} distance={7} decay={2} />
      <mesh ref={glow} position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[5.9, 5.9]} /><meshBasicMaterial map={glowTexture} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      {Array.from({ length: 9 }, (_, index) => <mesh key={`wisp-${index}`} ref={(element) => { wisps.current[index] = element; }}><planeGeometry args={[1, 1]} /><meshBasicMaterial map={wispTexture} color={index > 4 ? "#f0d9c3" : "#ff9d45"} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>)}
      {Array.from({ length: 24 }, (_, index) => {
        const angle = index * 2.399;
        return <mesh key={`ember-${index}`} ref={(element) => { embers.current[index] = element; }} position={[Math.cos(angle) * (2.02 + (index % 4) * 0.07), 0, Math.sin(angle) * (2.02 + (index % 3) * 0.09)]}><sphereGeometry args={[0.008 + (index % 3) * 0.003, 6, 6]} /><meshBasicMaterial color={index % 2 ? "#ffad51" : "#ed5423"} transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>;
      })}
    </group>
  );
}

function Wheel({ position, wheelRef }) {
  return (
    <group position={position}>
      <group ref={wheelRef}>
        <mesh castShadow><torusGeometry args={[0.345, 0.105, 12, 40]} /><meshStandardMaterial color="#1d1d1d" roughness={0.92} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.288, 0.288, 0.18, 32]} /><meshStandardMaterial color="#c9c5b7" metalness={0.75} roughness={0.3} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[0, 0, side * 0.105]}><torusGeometry args={[0.22, 0.027, 6, 30]} /><meshStandardMaterial color={CREAM} metalness={0.25} roughness={0.5} /></mesh>)}
        {Array.from({ length: 8 }, (_, index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 4]} position={[0, 0, 0.115]}><boxGeometry args={[0.43, 0.018, 0.018]} /><meshStandardMaterial color="#8b9184" metalness={0.8} roughness={0.32} /></mesh>)}
        <mesh position={[0, 0, 0.125]}><sphereGeometry args={[0.08, 16, 8]} /><meshStandardMaterial color={RED} metalness={0.4} roughness={0.3} /></mesh>
      </group>
      <mesh position={[0, 0.025, 0]} castShadow><torusGeometry args={[0.44, 0.075, 8, 30, Math.PI]} /><meshStandardMaterial color={RED} metalness={0.18} roughness={0.3} /></mesh>
    </group>
  );
}

function Scooter({ progressRef, reducedMotion }) {
  const group = useRef();
  const wheels = useRef([]);
  useFrame(() => {
    const p = progressRef.current;
    const reveal = smooth(p, 0.76, 0.855);
    group.current.visible = reveal > 0.002;
    group.current.scale.setScalar(reveal);
    group.current.position.y = -(1 - reveal) * 1.4;
    const distance = 1.3 * smooth(p, 0.85, 1);
    wheels.current.forEach((wheel) => { if (wheel) wheel.rotation.z = -distance / 0.45; });
  });
  return (
    <group ref={group} visible={false}>
      <DeliveryRider progressRef={progressRef} reducedMotion={reducedMotion} />
      <Wheel position={[-1.1, -0.7, 0]} wheelRef={(element) => { wheels.current[0] = element; }} />
      <Wheel position={[1.12, -0.7, 0]} wheelRef={(element) => { wheels.current[1] = element; }} />
      <mesh position={[-0.76, -0.08, 0]} scale={[0.87, 0.47, 0.37]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={RED} metalness={0.18} roughness={0.3} /></mesh>
      <mesh position={[-0.78, -0.12, 0.32]} scale={[0.54, 0.29, 0.045]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#8d1f20" metalness={0.16} roughness={0.32} /></mesh>
      <RoundedBox args={[1.6, 0.13, 0.67]} radius={0.06} smoothness={3} position={[0.17, -0.38, 0]} castShadow><meshStandardMaterial color={CREAM} metalness={0.12} roughness={0.45} /></RoundedBox>
      <RoundedBox args={[0.75, 0.035, 0.5]} radius={0.015} smoothness={2} position={[0.28, -0.296, 0]}><meshStandardMaterial color="#a49f8c" roughness={0.88} /></RoundedBox>
      <mesh position={[0.87, 0.05, 0]} rotation={[0, 0, -0.17]} scale={[0.21, 0.75, 0.39]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={RED} metalness={0.16} roughness={0.29} /></mesh>
      <mesh position={[1.04, -0.16, 0]} rotation={[0, 0, 0.1]} castShadow><cylinderGeometry args={[0.055, 0.055, 1, 12]} /><meshStandardMaterial color="#b7b6aa" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0.92, 0.87, 0]} rotation={[0, 0, -0.12]} castShadow><cylinderGeometry args={[0.045, 0.05, 0.79, 12]} /><meshStandardMaterial color="#a8ab9d" metalness={0.8} roughness={0.27} /></mesh>
      <mesh position={[0.98, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.99, 12]} /><meshStandardMaterial color="#adb1a3" metalness={0.8} roughness={0.26} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[0.98, 1.17, side * 0.43]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.058, 0.058, 0.24, 12]} /><meshStandardMaterial color="#1a1a1a" roughness={0.9} /></mesh>)}
      <mesh position={[1.01, 1.06, 0]} scale={[0.22, 0.23, 0.3]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={RED} metalness={0.2} roughness={0.3} /></mesh>
      <mesh position={[1.213, 1.063, 0]} scale={[0.035, 0.17, 0.205]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#fff2c7" emissive="#f3d88b" emissiveIntensity={0.42} roughness={0.2} metalness={0.1} /></mesh>
      <RoundedBox args={[1.15, 0.18, 0.68]} radius={0.085} smoothness={4} position={[-0.39, 0.49, 0]} castShadow><meshStandardMaterial color="#151515" roughness={0.86} /></RoundedBox>
      <RoundedBox args={[1.08, 0.035, 0.61]} radius={0.016} smoothness={2} position={[-0.4, 0.58, 0]}><meshStandardMaterial color="#252525" roughness={0.85} /></RoundedBox>
      <RoundedBox args={[0.65, 0.055, 0.73]} radius={0.025} smoothness={2} position={[-1.22, 0.59, 0]} castShadow><meshStandardMaterial color="#c0bcad" metalness={0.8} roughness={0.3} /></RoundedBox>
      <mesh position={[-1.55, 0.07, 0]} scale={[0.07, 0.1, 0.2]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#a93622" emissive="#87190e" emissiveIntensity={0.3} roughness={0.35} /></mesh>
      {[-1, 1].map((side) => <group key={`mirror-${side}`}><mesh position={[0.98, 1.43, side * 0.41]} rotation={[side * 0.15, 0, 0.1]}><cylinderGeometry args={[0.018, 0.018, 0.5, 8]} /><meshStandardMaterial color="#acb3a4" metalness={0.85} roughness={0.2} /></mesh><mesh position={[0.95, 1.69, side * 0.45]} scale={[0.055, 0.11, 0.15]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#c4c8bc" metalness={0.9} roughness={0.2} /></mesh></group>)}
      <mesh position={[-0.83, 0.03, 0.371]}><circleGeometry args={[0.14, 32]} /><meshStandardMaterial color={CREAM} roughness={0.7} /></mesh>
      <mesh position={[-0.83, 0.03, 0.375]}><torusGeometry args={[0.11, 0.008, 6, 24]} /><meshStandardMaterial color={RED} /></mesh>
    </group>
  );
}

const CAMERA_STOPS = [
  { p: 0, position: [0.12, 11, 0.7], target: [0, 0.1, 0], width: 5.65, height: 5.65 },
  { p: 0.22, position: [1.6, 9.2, 4.5], target: [0, 0.55, 0], width: 5.8, height: 6.1 },
  { p: 0.4, position: [3.8, 6.1, 8.2], target: [0, 0.18, 0], width: 6.15, height: 5.5 },
  { p: 0.56, position: [5.2, 8.2, 9.5], target: [0, 1.0, -0.3], width: 8.1, height: 7.1 },
  { p: 0.72, position: [4.4, 8.1, 8.6], target: [0, 0.45, 0], width: 7.2, height: 6.1 },
  { p: 0.87, position: [4.4, 4.8, 8.4], target: [0, 0.8, 0], width: 6.3, height: 5.7 },
  { p: 1, position: [3.2, 4.6, 8.6], target: [0.25, 0.8, 0], width: 6.3, height: 5.7 },
];

function CameraRig({ hero, progressRef }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => { invalidate(); }, [size, invalidate]);
  useFrame(() => {
    const p = progressRef.current;
    if (hero) {
      camera.position.set(0.1, 8.4, 4.4);
      camera.lookAt(0, 0, 0);
      camera.zoom = Math.min(size.width / 5.1, size.height / 4.65);
    } else {
      const next = CAMERA_STOPS.findIndex((stop) => stop.p >= p);
      const end = CAMERA_STOPS[next < 0 ? CAMERA_STOPS.length - 1 : next];
      const start = CAMERA_STOPS[Math.max(0, next < 0 ? CAMERA_STOPS.length - 2 : next - 1)];
      const t = start === end ? 0 : smooth(p, start.p, end.p);
      camera.position.set(...start.position.map((value, index) => mix(value, end.position[index], t)));
      camera.lookAt(...start.target.map((value, index) => mix(value, end.target[index], t)));
      camera.zoom = Math.min(size.width / mix(start.width, end.width, t), size.height / mix(start.height, end.height, t));
    }
    camera.updateProjectionMatrix();
  });
  return null;
}

const MemoPizza = memo(Pizza);
const MemoPizzaBox = memo(PizzaBox);
const MemoFire = memo(Fire);
const MemoScooter = memo(Scooter);

function SceneContents({ progress, hero, reducedMotion, hoveredRef }) {
  const progressRef = useRef(progress);
  const assembly = useRef();
  const packageGroup = useRef();
  const road = useRef();
  const shadow = useRef();
  const { pointer, invalidate } = useThree();
  const shadowTexture = useMemo(makeShadowTexture, []);
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture]);
  useEffect(() => {
    progressRef.current = clamp(Number.isFinite(progress) ? progress : 0);
    invalidate();
  }, [progress, invalidate]);
  useFrame((state, delta) => {
    const p = progressRef.current;
    const delivery = hero ? 0 : smooth(p, 0.755, 0.86);
    const roadDistance = 1.3 * smooth(p, 0.85, 1);
    const heroHover = hero && !reducedMotion && hoveredRef.current;
    const targetY = heroHover ? pointer.x * 0.12 - 0.12 : -0.12;
    const targetX = heroHover ? pointer.y * 0.045 : 0;
    assembly.current.rotation.y = hero ? THREE.MathUtils.damp(assembly.current.rotation.y, targetY, 4, delta) : -0.12 + Math.sin(roadDistance * 1.6) * 0.025 * delivery;
    assembly.current.rotation.x = hero ? THREE.MathUtils.damp(assembly.current.rotation.x, targetX, 4, delta) : (reducedMotion ? 0 : Math.sin(roadDistance * 3) * 0.012 * delivery);
    assembly.current.position.x = hero ? 0 : -0.6 * smooth(p, 0.76, 0.85) + 1.3 * smooth(p, 0.85, 1);
    assembly.current.position.y = hero || reducedMotion ? 0 : Math.sin(roadDistance * 10) * 0.009 * delivery;
    packageGroup.current.position.set(mix(0, -1.12, delivery), mix(0, 0.71, delivery), 0);
    packageGroup.current.scale.setScalar(mix(1, 0.255, delivery));
    if (road.current) {
      road.current.visible = p > 0.79;
      road.current.scale.setScalar(delivery);
      road.current.quaternion.copy(assembly.current.quaternion).invert();
      road.current.position.set(-assembly.current.position.x, -1.158 - assembly.current.position.y, 0).applyQuaternion(road.current.quaternion);
    }
    shadow.current.position.x = assembly.current.position.x;
    shadow.current.scale.set(mix(1, 0.82, delivery), mix(1, 0.5, delivery), 1);
    // Scroll changes schedule one frame. Only active flames and a hovered hero
    // request continuous frames; idle or offscreen story stages use no GPU loop.
    const settlingTilt = hero && (Math.abs(assembly.current.rotation.y - targetY) > 0.0002 || Math.abs(assembly.current.rotation.x - targetX) > 0.0002);
    if (heroHover || settlingTilt || (!reducedMotion && p > 0.26 && p < 0.54)) state.invalidate();
  });
  return (
    <>
      <CameraRig hero={hero} progressRef={progressRef} />
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#fff3e4", "#221b18", 0.72]} />
      <directionalLight position={[-3.5, 7, 5]} intensity={2.5} color="#fff1e6" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-near={0.1} shadow-camera-far={24} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0006} shadow-normalBias={0.03} />
      <directionalLight position={[4, 3, -5]} intensity={1.5} color="#d8dce4" />
      <directionalLight position={[-5, 1, -3]} intensity={0.7} color="#f7ae91" />
      <pointLight position={[4, 3, -2]} intensity={8} color="#e5392f" distance={12} decay={2} />
      <group ref={assembly} rotation={[0, -0.12, 0]}>
        <group ref={packageGroup}>
          <MemoPizza progressRef={progressRef} hero={hero} reducedMotion={reducedMotion} />
          {!hero && <MemoPizzaBox progressRef={progressRef} />}
        </group>
        {!hero && <><MemoFire progressRef={progressRef} reducedMotion={reducedMotion} /><MemoScooter progressRef={progressRef} reducedMotion={reducedMotion} /><group ref={road} visible={false} position={[0, -1.158, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[7.2, 2.1]} /><meshStandardMaterial color="#343132" transparent opacity={0.24} roughness={1} depthWrite={false} /></mesh>
          {[-2.8, -1.7, -0.6, 0.5, 1.6, 2.7].map((x) => <mesh key={x} position={[x, 0.006, 0.82]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 0.03]} /><meshBasicMaterial color="#b5a9a3" transparent opacity={0.35} /></mesh>)}
        </group></>}
      </group>
      <mesh ref={shadow} position={[0, hero ? -0.85 : -1.169, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.7, 6.7]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={hero ? 0.27 : 0.32} depthWrite={false} />
      </mesh>
      <mesh position={[0, hero ? -0.86 : -1.17, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <shadowMaterial transparent opacity={0.14} color="#050505" depthWrite={false} />
      </mesh>
    </>
  );
}

/** A fully procedural, reversible pizza-to-delivery story. No remote models or maps. */
export default function PizzaScene({ progress = 0, hero = false, reducedMotion = false }) {
  const hoveredRef = useRef(false);
  const invalidateRef = useRef(null);
  return (
    <Canvas orthographic shadows frameloop="demand" dpr={[1, 1.65]} camera={{ position: [0, 7, 6], near: 0.1, far: 50, zoom: 85 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} style={{ width: "100%", height: "100%", background: "transparent", touchAction: "pan-y" }} onPointerEnter={() => { hoveredRef.current = true; invalidateRef.current?.(); }} onPointerLeave={() => { hoveredRef.current = false; invalidateRef.current?.(); }} onCreated={({ gl, invalidate }) => { invalidateRef.current = invalidate; gl.setClearColor(0x000000, 0); gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
      <SceneContents progress={progress} hero={hero} reducedMotion={reducedMotion} hoveredRef={hoveredRef} />
    </Canvas>
  );
}
