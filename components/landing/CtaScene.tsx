"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * The dark closing panel gets its own small WebGL layer: a slow aurora built
 * from brand colours, with a handful of paper rectangles tumbling through it.
 * It is cheap by design (one fullscreen shader plane plus one instanced mesh)
 * and it only renders while the panel is actually on screen.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uFade;
  uniform float uAspect;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    p += uMouse * 0.08;

    float t = uTime * 0.045;
    float warp = fbm(p * 1.6 + vec2(t, -t * 0.7));
    float band = fbm(p * 2.4 + warp * 1.1 + vec2(-t * 1.3, t));

    vec3 coral = vec3(1.0, 0.58, 0.45);
    vec3 peri = vec3(0.627, 0.71, 0.92);
    vec3 mint = vec3(0.655, 0.988, 0.804);
    vec3 gold = vec3(0.925, 0.855, 0.596);

    float m1 = smoothstep(-0.25, 0.55, band);
    float m2 = smoothstep(-0.1, 0.8, warp);

    vec3 col = mix(coral, peri, m1);
    col = mix(col, mint, smoothstep(0.35, 0.95, m2) * 0.75);
    col = mix(col, gold, smoothstep(0.6, 1.0, m1 * m2) * 0.4);

    // Keep the glow in the middle of the panel so the type stays readable.
    float vignette = smoothstep(1.05, 0.15, length(p * vec2(0.82, 1.25)));
    float energy = pow(smoothstep(0.1, 0.9, m1 * 0.6 + m2 * 0.6), 1.5);

    float alpha = energy * vignette * 0.72 * uFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function CtaScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: true });
    } catch {
      return; // The panel keeps its CSS washes without WebGL.
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 1.9));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.z = 6;

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const warm = new THREE.PointLight(0xff9473, 14, 18);
    warm.position.set(-3, 2, 4);
    scene.add(warm);
    const cool = new THREE.PointLight(0xa0b5eb, 16, 18);
    cool.position.set(3, -2, 4);
    scene.add(cool);

    /* ---------------- aurora ---------------- */
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uFade: { value: 0 },
      uAspect: { value: 1 },
    };
    const auroraGeo = new THREE.PlaneGeometry(1, 1);
    const auroraMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.position.z = -2;
    scene.add(aurora);

    /* ---------------- tumbling paper ---------------- */
    const COUNT = coarse ? 9 : 16;
    const paperGeo = new RoundedBoxGeometry(0.78, 1.04, 0.035, 4, 0.05);
    const paperMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6f3f1,
      roughness: 0.45,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      transparent: true,
      opacity: 0,
    });
    const papers = new THREE.InstancedMesh(paperGeo, paperMat, COUNT);
    papers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(papers);

    const seeds = Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4 - 0.5),
      rot: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.12),
      phase: Math.random() * Math.PI * 2,
      amp: 0.18 + Math.random() * 0.3,
      scale: 0.5 + Math.random() * 0.7,
    }));
    const mat4 = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const scaleV = new THREE.Vector3();
    const posV = new THREE.Vector3();

    /* ---------------- sizing ---------------- */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Stretch the shader plane to exactly fill the frustum at its depth.
      const dist = camera.position.z - aurora.position.z;
      const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * dist;
      aurora.scale.set(vh * camera.aspect, vh, 1);
      uniforms.uAspect.value = camera.aspect;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let onScreen = false;
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { rootMargin: "150px" });
    io.observe(mount);

    let awake = !document.hidden;
    const onVisibility = () => (awake = !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------------- loop ---------------- */
    const clock = new THREE.Clock();
    let raf = 0;
    let fade = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!awake) return;

      // Ease the whole layer in and out instead of popping it.
      const target = onScreen ? 1 : 0;
      fade += (target - fade) * 0.05;
      if (fade < 0.002 && target === 0) return;

      const t = reduced ? 8 : clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      uniforms.uTime.value = t;
      uniforms.uMouse.value.set(mouse.x, -mouse.y);
      uniforms.uFade.value = fade;
      paperMat.opacity = fade * 0.9;

      for (let i = 0; i < COUNT; i++) {
        const s = seeds[i];
        posV.set(
          s.pos.x + Math.sin(t * 0.12 + s.phase) * s.amp + mouse.x * 0.35,
          s.pos.y + Math.cos(t * 0.17 + s.phase) * s.amp - mouse.y * 0.25,
          s.pos.z
        );
        euler.set(s.rot.x + t * s.spin.x, s.rot.y + t * s.spin.y, s.rot.z + t * s.spin.z);
        quat.setFromEuler(euler);
        scaleV.setScalar(s.scale * (0.6 + fade * 0.4));
        papers.setMatrixAt(i, mat4.compose(posV, quat, scaleV));
      }
      papers.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      io.disconnect();
      auroraGeo.dispose();
      auroraMat.dispose();
      paperGeo.dispose();
      paperMat.dispose();
      papers.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="cta-canvas" aria-hidden="true" />;
}
