"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

const GREEN = "#173b2c";
const CREAM = "#efe9d8";
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

function makeBrandTexture(side = false) {
  return canvasTexture(1024, side ? 128 : 1024, (ctx, width, height) => {
    const random = randomGenerator(17);
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = `rgba(103,85,56,${random() * 0.05})`;
      ctx.fillRect(random() * width, random() * height, random() * 2, 1);
    }
    ctx.fillStyle = GREEN;
    ctx.strokeStyle = GREEN;
    ctx.textAlign = "center";
    if (side) {
      ctx.fillRect(0, 0, width, 5);
      ctx.fillRect(0, height - 5, width, 5);
      ctx.font = "600 39px Georgia, serif";
      ctx.fillText("FORNO  ·  FIRED WITH FEELING", width / 2, 78);
      return;
    }
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 54, 916, 916);
    ctx.strokeRect(66, 66, 892, 892);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(512, 313, 65, Math.PI, TAU);
    ctx.lineTo(577, 340);
    ctx.lineTo(447, 340);
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(512, 316, 31, Math.PI, TAU);
    ctx.lineTo(543, 340);
    ctx.moveTo(481, 340);
    ctx.lineTo(481, 316);
    ctx.stroke();
    ctx.font = "bold 172px Georgia, serif";
    ctx.fillText("FORNO", 512, 542);
    ctx.font = "22px Arial, sans-serif";
    ctx.fillText("F I R E D   W I T H   F E E L I N G", 512, 607);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(360, 659);
    ctx.lineTo(664, 659);
    ctx.stroke();
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillText("A little fire. A lot of soul.", 512, 718);
    ctx.font = "17px Arial, sans-serif";
    ctx.fillText("HANDCRAFTED   ·   GOOD THINGS TAKE FIRE", 512, 885);
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

function makeCrustGeometry() {
  const around = 180;
  const tube = 22;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= around; i++) {
    const a = (i / around) * TAU;
    const center = 2.005 + Math.sin(a * 5) * 0.025 + Math.cos(a * 9 + 0.8) * 0.021;
    const puff = 0.225 + Math.sin(a * 7 + 1) * 0.03 + Math.cos(a * 11) * 0.017;
    for (let j = 0; j <= tube; j++) {
      const b = (j / tube) * TAU;
      const surface = 1 + Math.sin(a * 29 + b * 5) * 0.025 + Math.cos(a * 41 - b * 3) * 0.018;
      const radius = center + Math.cos(b) * puff * surface;
      positions.push(Math.cos(a) * radius, 0.085 + Math.sin(b) * puff * 0.94 * surface, Math.sin(a) * radius);
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
  const rings = 18;
  const sectors = 128;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let ring = 0; ring <= rings; ring++) {
    for (let i = 0; i <= sectors; i++) {
      const a = (i / sectors) * TAU;
      const r = (ring / rings) * (1.9 + Math.sin(a * 5) * 0.023);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, 0.115 + Math.sin(x * 8 + z * 3) * 0.012 + Math.cos(z * 11 - x * 4) * 0.009, z);
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
  const crustMaterial = useRef();
  const cheeseMaterial = useRef();
  const falling = useRef([]);
  const invalidate = useThree((state) => state.invalidate);
  const textures = useMemo(() => ({ cooked: makeDoughTexture(), raw: makeDoughTexture(true), cheese: makeCheeseTexture(), leaf: makeLeafTexture() }), []);
  const crustGeometry = useMemo(makeCrustGeometry, []);
  const surfaceGeometry = useMemo(makeSurfaceGeometry, []);
  const leafGeometry = useMemo(makeLeafGeometry, []);
  const tomatoes = useMemo(() => [
    [-1.02, 0.17, -0.68], [0.25, 0.16, -1.12], [1.05, 0.17, -0.2], [0.73, 0.17, 0.93], [-0.55, 0.17, 1.03], [-1.23, 0.17, 0.37], [0.06, 0.17, 0.1],
  ], []);
  const basil = useMemo(() => [[-0.6, 0.19, -0.94], [0.98, 0.19, 0.25], [-0.73, 0.19, 0.61], [0.25, 0.19, 0.36]], []);

  useEffect(() => {
    // A generated food photograph supplies optional crust detail. Polar UVs wrap
    // its golden, blistered edge around actual toroidal dough geometry.
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
      const unwrapped = target.createImageData(output.width, output.height);
      const centerX = source.width / 2;
      const centerY = source.height / 2;
      for (let y = 0; y < output.height; y++) {
        const tubeAngle = (1 - y / output.height) * TAU;
        const radius = ((2.005 + Math.cos(tubeAngle) * 0.225) / 2.25) * source.width * 0.465;
        for (let x = 0; x < output.width; x++) {
          const angle = (x / output.width) * TAU;
          const sx = clamp(Math.round(centerX + Math.cos(angle) * radius), 0, source.width - 1);
          const sy = clamp(Math.round(centerY - Math.sin(angle) * radius), 0, source.height - 1);
          const from = (sy * source.width + sx) * 4;
          const to = (y * output.width + x) * 4;
          unwrapped.data[to] = pixels[from];
          unwrapped.data[to + 1] = pixels[from + 1];
          unwrapped.data[to + 2] = pixels[from + 2];
          unwrapped.data[to + 3] = 255;
        }
      }
      target.putImageData(unwrapped, 0, 0);
      textures.cooked.needsUpdate = true;
      invalidate();
    };
    reference.src = "/images/pizza-hero.webp";
    return () => { active = false; reference.onload = null; };
  }, [textures, invalidate]);

  useEffect(() => () => {
    Object.values(textures).forEach((texture) => texture.dispose());
    crustGeometry.dispose();
    surfaceGeometry.dispose();
    leafGeometry.dispose();
  }, [textures, crustGeometry, surfaceGeometry, leafGeometry]);

  useFrame(({ clock }) => {
    const p = hero ? 0.48 : progressRef.current;
    const sauce = hero ? 1 : smooth(p, 0.035, 0.16);
    const baked = hero ? 1 : smooth(p, 0.25, 0.4);
    if (cheeseMaterial.current) cheeseMaterial.current.opacity = sauce;
    const shader = crustMaterial.current?.userData.shader;
    if (shader) shader.uniforms.uBake.value = baked;
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
      item.visible = drop > 0.01;
      item.position.y = (1 - drop) * (2.8 + (index % 3) * 0.45);
      item.rotation.y = (1 - drop) * (index % 2 ? -1.5 : 1.2);
      item.scale.setScalar(0.84 + drop * 0.16);
    });
  });

  return (
    <group ref={group}>
      <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.01, 1.98, 0.18, 96]} />
        <meshStandardMaterial color="#d8ab70" roughness={0.86} map={textures.raw} />
      </mesh>
      <mesh geometry={crustGeometry} castShadow receiveShadow>
        <meshStandardMaterial ref={crustMaterial} map={textures.cooked} bumpMap={textures.cooked} bumpScale={0.022} roughness={0.72} onBeforeCompile={(shader) => {
          shader.uniforms.uRawMap = { value: textures.raw };
          shader.uniforms.uBake = { value: hero ? 1 : smooth(progressRef.current, 0.25, 0.4) };
          shader.fragmentShader = "uniform sampler2D uRawMap;\nuniform float uBake;\n" + shader.fragmentShader.replace("#include <map_fragment>", "#ifdef USE_MAP\nvec4 rawColor = texture2D(uRawMap, vMapUv);\nvec4 cookedColor = texture2D(map, vMapUv);\ndiffuseColor *= mix(rawColor, cookedColor, uBake);\n#endif");
          if (crustMaterial.current) crustMaterial.current.userData.shader = shader;
        }} />
      </mesh>
      <mesh geometry={surfaceGeometry} receiveShadow>
        <meshStandardMaterial ref={cheeseMaterial} map={textures.cheese} roughness={0.46} transparent opacity={hero ? 1 : 0} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {tomatoes.map((position, index) => <group key={`tomato-${index}`} ref={(element) => { falling.current[index] = element; }}><Tomato position={position} rotation={index * 2.41} /></group>)}
      {basil.map((position, index) => <group key={`basil-${index}`} ref={(element) => { falling.current[tomatoes.length + index] = element; }}><Basil position={position} rotation={index * 2.1} geometry={leafGeometry} texture={textures.leaf} /></group>)}
    </group>
  );
}

function PizzaBox({ progressRef }) {
  const group = useRef();
  const lid = useRef();
  const brandTexture = useMemo(() => makeBrandTexture(), []);
  const sideTexture = useMemo(() => makeBrandTexture(true), []);
  useEffect(() => () => { brandTexture.dispose(); sideTexture.dispose(); }, [brandTexture, sideTexture]);
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
      <RoundedBox args={[4.94, 0.095, 4.94]} radius={0.025} smoothness={2} position={[0, -0.3, 0]} receiveShadow castShadow><meshStandardMaterial color={CREAM} roughness={0.88} /></RoundedBox>
      {[-1, 1].map((side) => <mesh key={side} position={[side * 2.455, -0.015, 0]} castShadow receiveShadow><boxGeometry args={[0.075, 0.58, 4.94]} /><meshStandardMaterial color={CREAM} roughness={0.9} /></mesh>)}
      {[-1, 1].map((side) => <mesh key={`end-${side}`} position={[0, -0.015, side * 2.455]} castShadow receiveShadow><boxGeometry args={[4.94, 0.58, 0.075]} /><meshStandardMaterial color={CREAM} roughness={0.9} /></mesh>)}
      <mesh position={[0, 0, 2.496]}><planeGeometry args={[4.83, 0.39]} /><meshStandardMaterial map={sideTexture} roughness={0.88} /></mesh>
      <mesh position={[2.496, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[4.83, 0.39]} /><meshStandardMaterial map={sideTexture} roughness={0.88} /></mesh>
      <group ref={lid} position={[0, 0.305, -2.485]} rotation={[-2.02, 0, 0]}>
        <RoundedBox args={[5.035, 0.075, 5.035]} radius={0.025} smoothness={2} position={[0, 0, 2.485]} castShadow receiveShadow><meshStandardMaterial color={CREAM} roughness={0.86} /></RoundedBox>
        <mesh position={[0, 0.039, 2.485]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[4.97, 4.97]} /><meshStandardMaterial map={brandTexture} roughness={0.87} /></mesh>
        <mesh position={[0, -0.039, 2.485]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[3.7, 3.7]} /><meshStandardMaterial map={brandTexture} roughness={0.92} /></mesh>
        <mesh position={[0, -0.1, 4.975]}><boxGeometry args={[4.88, 0.18, 0.045]} /><meshStandardMaterial color="#e5ddc8" roughness={0.9} /></mesh>
      </group>
    </group>
  );
}

function Fire({ progressRef, reducedMotion }) {
  const group = useRef();
  const flames = useRef([]);
  const embers = useRef([]);
  const light = useRef();
  const geometry = useMemo(() => {
    const shape = new THREE.SphereGeometry(1, 12, 12);
    const vertices = shape.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const y = vertices.getY(i);
      const taper = 0.6 + (1 - y) * 0.3;
      vertices.setXYZ(i, vertices.getX(i) * taper + y * y * 0.12, y, vertices.getZ(i) * taper);
    }
    shape.computeVertexNormals();
    return shape;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    const p = progressRef.current;
    const intensity = smooth(p, 0.26, 0.32) * (1 - smooth(p, 0.45, 0.54));
    group.current.visible = intensity > 0.005;
    light.current.intensity = intensity * 9;
    const time = reducedMotion ? 0 : clock.elapsedTime;
    flames.current.forEach((mesh, index) => {
      if (!mesh) return;
      const flicker = 0.8 + Math.sin(time * 7 + index * 2.4) * 0.2;
      mesh.scale.set(0.07 + (index % 3) * 0.015, (0.24 + (index % 4) * 0.07) * flicker * intensity, 0.07);
      mesh.material.opacity = intensity * (0.45 + Math.sin(index) * 0.12);
    });
    embers.current.forEach((mesh, index) => {
      if (!mesh) return;
      const rise = ((time * 0.25 + index * 0.13) % 1);
      mesh.position.y = -0.3 + rise * 1.5;
      mesh.material.opacity = intensity * (1 - rise) * 0.8;
    });
  });
  return (
    <group ref={group} visible={false}>
      <pointLight ref={light} position={[0, -0.45, 0]} color="#ff8732" intensity={0} distance={7} decay={2} />
      {Array.from({ length: 25 }, (_, index) => {
        const angle = (index / 25) * TAU;
        return <mesh key={`flame-${index}`} ref={(element) => { flames.current[index] = element; }} geometry={geometry} position={[Math.cos(angle) * 1.83, -0.2, Math.sin(angle) * 1.83]} rotation={[0.15 * Math.cos(angle), 0, -0.16 * Math.sin(angle)]}><meshBasicMaterial color={index % 2 ? "#ffb24b" : "#ec6b21"} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>;
      })}
      {Array.from({ length: 16 }, (_, index) => {
        const angle = index * 2.399;
        return <mesh key={`ember-${index}`} ref={(element) => { embers.current[index] = element; }} position={[Math.cos(angle) * (1.8 + (index % 4) * 0.1), 0, Math.sin(angle) * (1.8 + (index % 3) * 0.1)]}><sphereGeometry args={[0.012 + (index % 3) * 0.004, 6, 6]} /><meshBasicMaterial color="#ffab42" transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>;
      })}
    </group>
  );
}

function Wheel({ position, wheelRef }) {
  return (
    <group position={position}>
      <group ref={wheelRef}>
        <mesh castShadow><torusGeometry args={[0.345, 0.105, 12, 40]} /><meshStandardMaterial color="#292c27" roughness={0.92} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.288, 0.288, 0.18, 32]} /><meshStandardMaterial color="#c9c5b7" metalness={0.75} roughness={0.3} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[0, 0, side * 0.105]}><torusGeometry args={[0.22, 0.027, 6, 30]} /><meshStandardMaterial color={CREAM} metalness={0.25} roughness={0.5} /></mesh>)}
        {Array.from({ length: 8 }, (_, index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 4]} position={[0, 0, 0.115]}><boxGeometry args={[0.43, 0.018, 0.018]} /><meshStandardMaterial color="#8b9184" metalness={0.8} roughness={0.32} /></mesh>)}
        <mesh position={[0, 0, 0.125]}><sphereGeometry args={[0.08, 16, 8]} /><meshStandardMaterial color={GREEN} metalness={0.4} roughness={0.3} /></mesh>
      </group>
      <mesh position={[0, 0.025, 0]} castShadow><torusGeometry args={[0.44, 0.075, 8, 30, Math.PI]} /><meshStandardMaterial color={GREEN} metalness={0.18} roughness={0.3} /></mesh>
    </group>
  );
}

function Scooter({ progressRef }) {
  const group = useRef();
  const wheels = useRef([]);
  useFrame(() => {
    const p = progressRef.current;
    const reveal = smooth(p, 0.76, 0.855);
    group.current.visible = reveal > 0.002;
    group.current.scale.setScalar(reveal);
    group.current.position.y = -(1 - reveal) * 1.4;
    wheels.current.forEach((wheel) => { if (wheel) wheel.rotation.z = -(p - 0.76) * 25; });
  });
  return (
    <group ref={group} visible={false}>
      <Wheel position={[-1.1, -0.7, 0]} wheelRef={(element) => { wheels.current[0] = element; }} />
      <Wheel position={[1.12, -0.7, 0]} wheelRef={(element) => { wheels.current[1] = element; }} />
      <mesh position={[-0.76, -0.08, 0]} scale={[0.87, 0.47, 0.37]} castShadow><sphereGeometry args={[1, 32, 24]} /><meshStandardMaterial color={GREEN} metalness={0.18} roughness={0.3} /></mesh>
      <mesh position={[-0.78, -0.12, 0.32]} scale={[0.54, 0.29, 0.045]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#214a36" metalness={0.16} roughness={0.32} /></mesh>
      <RoundedBox args={[1.6, 0.13, 0.67]} radius={0.06} smoothness={3} position={[0.17, -0.38, 0]} castShadow><meshStandardMaterial color={CREAM} metalness={0.12} roughness={0.45} /></RoundedBox>
      <RoundedBox args={[0.75, 0.035, 0.5]} radius={0.015} smoothness={2} position={[0.28, -0.296, 0]}><meshStandardMaterial color="#a49f8c" roughness={0.88} /></RoundedBox>
      <mesh position={[0.87, 0.05, 0]} rotation={[0, 0, -0.17]} scale={[0.21, 0.75, 0.39]} castShadow><sphereGeometry args={[1, 28, 20]} /><meshStandardMaterial color={GREEN} metalness={0.16} roughness={0.29} /></mesh>
      <mesh position={[1.04, -0.16, 0]} rotation={[0, 0, 0.1]} castShadow><cylinderGeometry args={[0.055, 0.055, 1, 12]} /><meshStandardMaterial color="#b7b6aa" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0.92, 0.87, 0]} rotation={[0, 0, -0.12]} castShadow><cylinderGeometry args={[0.045, 0.05, 0.79, 12]} /><meshStandardMaterial color="#a8ab9d" metalness={0.8} roughness={0.27} /></mesh>
      <mesh position={[0.98, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.045, 0.045, 0.99, 12]} /><meshStandardMaterial color="#adb1a3" metalness={0.8} roughness={0.26} /></mesh>
      {[-1, 1].map((side) => <mesh key={side} position={[0.98, 1.17, side * 0.43]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.058, 0.058, 0.24, 12]} /><meshStandardMaterial color="#33372d" roughness={0.9} /></mesh>)}
      <mesh position={[1.01, 1.06, 0]} scale={[0.22, 0.23, 0.3]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={GREEN} metalness={0.2} roughness={0.3} /></mesh>
      <mesh position={[1.213, 1.063, 0]} scale={[0.035, 0.17, 0.205]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#fff2c7" emissive="#f3d88b" emissiveIntensity={0.42} roughness={0.2} metalness={0.1} /></mesh>
      <RoundedBox args={[1.15, 0.18, 0.68]} radius={0.085} smoothness={4} position={[-0.39, 0.49, 0]} castShadow><meshStandardMaterial color="#6c4730" roughness={0.86} /></RoundedBox>
      <RoundedBox args={[1.08, 0.035, 0.61]} radius={0.016} smoothness={2} position={[-0.4, 0.58, 0]}><meshStandardMaterial color="#8d6041" roughness={0.85} /></RoundedBox>
      <RoundedBox args={[0.65, 0.055, 0.73]} radius={0.025} smoothness={2} position={[-1.22, 0.59, 0]} castShadow><meshStandardMaterial color="#c0bcad" metalness={0.8} roughness={0.3} /></RoundedBox>
      <mesh position={[-1.55, 0.07, 0]} scale={[0.07, 0.1, 0.2]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#a93622" emissive="#87190e" emissiveIntensity={0.3} roughness={0.35} /></mesh>
      {[-1, 1].map((side) => <group key={`mirror-${side}`}><mesh position={[0.98, 1.43, side * 0.41]} rotation={[side * 0.15, 0, 0.1]}><cylinderGeometry args={[0.018, 0.018, 0.5, 8]} /><meshStandardMaterial color="#acb3a4" metalness={0.85} roughness={0.2} /></mesh><mesh position={[0.95, 1.69, side * 0.45]} scale={[0.055, 0.11, 0.15]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#c4c8bc" metalness={0.9} roughness={0.2} /></mesh></group>)}
      <mesh position={[-0.83, 0.03, 0.371]}><circleGeometry args={[0.14, 32]} /><meshStandardMaterial color={CREAM} roughness={0.7} /></mesh>
      <mesh position={[-0.83, 0.03, 0.375]}><torusGeometry args={[0.11, 0.008, 6, 24]} /><meshStandardMaterial color={GREEN} /></mesh>
    </group>
  );
}

function CameraRig({ hero }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(hero ? 0.1 : 4.6, hero ? 7.1 : 6.8, hero ? 5.4 : 8.3);
    camera.lookAt(0, hero ? 0 : 0.55, 0);
    camera.zoom = Math.min(size.width / (hero ? 5.3 : 7.6), size.height / (hero ? 4.85 : 6.7));
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, hero, invalidate]);
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
    const heroHover = hero && !reducedMotion && hoveredRef.current;
    const targetY = heroHover ? pointer.x * 0.12 - 0.12 : -0.12;
    const targetX = heroHover ? pointer.y * 0.045 : 0;
    assembly.current.rotation.y = THREE.MathUtils.damp(assembly.current.rotation.y, targetY, 4, delta);
    assembly.current.rotation.x = THREE.MathUtils.damp(assembly.current.rotation.x, targetX, 4, delta);
    assembly.current.position.x = hero ? 0 : -0.6 * smooth(p, 0.76, 0.85) + 1.3 * smooth(p, 0.85, 1);
    packageGroup.current.position.set(mix(0, -1.12, delivery), mix(0, 0.71, delivery), 0);
    packageGroup.current.scale.setScalar(mix(1, 0.255, delivery));
    if (road.current) {
      road.current.visible = p > 0.79;
      road.current.scale.setScalar(delivery);
      road.current.position.x = -assembly.current.position.x;
    }
    shadow.current.position.x = assembly.current.position.x;
    shadow.current.scale.set(mix(1, 0.82, delivery), mix(1, 0.5, delivery), 1);
    // Scroll changes schedule one frame. Only active flames and a hovered hero
    // request continuous frames; idle or offscreen story stages use no GPU loop.
    const settlingTilt = Math.abs(assembly.current.rotation.y - targetY) > 0.0002 || Math.abs(assembly.current.rotation.x - targetX) > 0.0002;
    if (heroHover || settlingTilt || (!reducedMotion && p > 0.26 && p < 0.54)) state.invalidate();
  });
  return (
    <>
      <CameraRig hero={hero} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={["#fff6de", "#a0a88e", 1.35]} />
      <directionalLight position={[-3.5, 7, 5]} intensity={3.4} color="#fff5e0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-near={0.1} shadow-camera-far={24} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0006} shadow-normalBias={0.03} />
      <directionalLight position={[4, 3, -5]} intensity={1.7} color="#fff4d6" />
      <directionalLight position={[-5, 1, -3]} intensity={0.8} color="#bdc9bb" />
      <group ref={assembly} rotation={[0, -0.12, 0]}>
        <group ref={packageGroup}>
          <MemoPizza progressRef={progressRef} hero={hero} reducedMotion={reducedMotion} />
          {!hero && <MemoPizzaBox progressRef={progressRef} />}
        </group>
        {!hero && <><MemoFire progressRef={progressRef} reducedMotion={reducedMotion} /><MemoScooter progressRef={progressRef} /><group ref={road} visible={false} position={[0, -1.158, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[7.2, 2.1]} /><meshStandardMaterial color="#cfcebc" transparent opacity={0.24} roughness={1} depthWrite={false} /></mesh>
          {[-2.8, -1.7, -0.6, 0.5, 1.6, 2.7].map((x) => <mesh key={x} position={[x, 0.006, 0.82]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 0.03]} /><meshBasicMaterial color="#a8af98" transparent opacity={0.35} /></mesh>)}
        </group></>}
      </group>
      <mesh ref={shadow} position={[0, hero ? -0.85 : -1.169, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.7, 6.7]} />
        <meshBasicMaterial map={shadowTexture} transparent opacity={hero ? 0.27 : 0.32} depthWrite={false} />
      </mesh>
      <mesh position={[0, hero ? -0.86 : -1.17, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <shadowMaterial transparent opacity={0.14} color="#0a1c10" depthWrite={false} />
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
