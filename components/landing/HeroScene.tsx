"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Props = {
  /** 0..1 scroll progress through the hero, written by the parent each frame. */
  progress: React.RefObject<number>;
  /** Flips true once the preloader is out of the way. */
  ready: React.RefObject<boolean>;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------------- canvas textures ---------------- */

/** A miniature email, drawn once and mapped onto the letter. */
function makeLetterTexture(maxAniso: number, aspect: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = Math.round(1400 / aspect);
  const g = c.getContext("2d")!;
  const W = c.width;
  const H = c.height;

  g.fillStyle = "#fffdfb";
  g.fillRect(0, 0, W, H);

  const grad = g.createLinearGradient(0, 0, 520, H);
  grad.addColorStop(0, "#ff9473");
  grad.addColorStop(0.5, "#a0b5eb");
  grad.addColorStop(1, "#a7fccd");
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(56, 56, 470, H - 112, 36);
  g.fill();

  const x = 590;
  g.fillStyle = "#797776";
  g.font = "500 26px monospace";
  g.fillText("POSTCRAFT  ·  ISSUE 01", x, 130);

  g.fillStyle = "#242424";
  g.font = "400 92px Georgia, serif";
  g.fillText("Hello, Prajwal.", x - 4, 250);
  g.font = "italic 400 52px Georgia, serif";
  g.fillStyle = "#4e4d4d";
  g.fillText("Something beautiful", x, 330);
  g.fillText("just arrived for you.", x, 392);

  g.fillStyle = "#e1dcd8";
  [0.92, 0.8, 0.86].forEach((w, i) => {
    g.beginPath();
    g.roundRect(x, 450 + i * 40, (W - x - 80) * w, 14, 7);
    g.fill();
  });

  g.fillStyle = "#2b59d1";
  g.beginPath();
  g.roundRect(x, H - 190, 330, 84, 42);
  g.fill();
  g.fillStyle = "#ffffff";
  g.font = "500 26px monospace";
  g.fillText("READ MORE", x + 70, H - 138);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/** Address block and a postage stamp, drawn on transparent pixels. */
function makeAddressTexture(maxAniso: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;

  g.strokeStyle = "#bdb7b2";
  g.lineWidth = 5;
  g.lineCap = "round";
  [0.62, 0.46, 0.54].forEach((w, i) => {
    g.beginPath();
    g.moveTo(70, 250 + i * 54);
    g.lineTo(70 + 760 * w, 250 + i * 54);
    g.stroke();
  });

  g.fillStyle = "#8d8884";
  g.font = "500 30px monospace";
  g.fillText("TO", 70, 200);

  // postage stamp, perforated edge
  g.save();
  g.translate(784, 70);
  g.rotate(-0.04);
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#d8d2cd";
  g.lineWidth = 4;
  g.setLineDash([10, 9]);
  g.beginPath();
  g.roundRect(0, 0, 170, 200, 8);
  g.fill();
  g.stroke();
  g.setLineDash([]);
  const sg = g.createLinearGradient(0, 0, 170, 200);
  sg.addColorStop(0, "#ff9473");
  sg.addColorStop(1, "#a0b5eb");
  g.fillStyle = sg;
  g.beginPath();
  g.roundRect(16, 16, 138, 138, 6);
  g.fill();
  g.fillStyle = "#4e4d4d";
  g.font = "500 20px monospace";
  g.fillText("SMTP", 44, 185);
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

/** Soft round sprite, reused by the dust field and the contact shadow. */
function makeRadialTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function HeroScene({ progress, ready }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !coarse,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // No WebGL: the typographic hero still stands on its own.
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.75 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 5, 6);
    scene.add(key);
    const warm = new THREE.PointLight(0xff9473, 18, 20);
    warm.position.set(-4, -1, 3);
    scene.add(warm);
    const cool = new THREE.PointLight(0xa0b5eb, 22, 20);
    cool.position.set(4, 2, 3);
    scene.add(cool);

    /* ---------------- envelope ---------------- */
    const W = 3.4;
    const H = 2.2;
    const root = new THREE.Group(); // laid out per viewport
    const env = new THREE.Group(); // tilted by the pointer
    root.add(env);
    scene.add(root);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(x: T): T => {
      disposables.push(x);
      return x;
    };

    const lineMat = track(new THREE.LineBasicMaterial({ color: 0xb9b4b0, transparent: true, opacity: 0.9 }));
    const paperMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf1ebe6, roughness: 0.85, metalness: 0, side: THREE.DoubleSide })
    );
    const paperMat2 = track(
      new THREE.MeshStandardMaterial({ color: 0xece5df, roughness: 0.9, metalness: 0, side: THREE.DoubleSide })
    );
    const innerMat = track(new THREE.MeshStandardMaterial({ color: 0xcfdaf5, roughness: 0.8, side: THREE.DoubleSide }));

    const outline = (geo: THREE.BufferGeometry, parent: THREE.Object3D) => {
      parent.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(geo, 1)), lineMat));
    };

    // soft contact shadow, which reads as depth behind the paper
    const shadowTex = track(makeRadialTexture("rgba(60,48,40,0.38)", "rgba(60,48,40,0)"));
    const shadow = new THREE.Mesh(
      track(new THREE.PlaneGeometry(W * 2.1, H * 1.5)),
      track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }))
    );
    shadow.position.set(0, -H * 0.52, -0.6);
    env.add(shadow);

    const back = new THREE.Mesh(track(new THREE.PlaneGeometry(W, H)), paperMat2);
    back.position.z = -0.02;
    env.add(back);
    const lining = new THREE.Mesh(track(new THREE.PlaneGeometry(W - 0.12, H - 0.12)), innerMat);
    lining.position.z = -0.015;
    env.add(lining);

    // the letter itself
    const LW = W - 0.3;
    const LH = H - 0.14;
    const letterTex = track(makeLetterTexture(maxAniso, LW / LH));
    const letterGeo = track(new THREE.PlaneGeometry(LW, LH));
    const letter = new THREE.Mesh(
      letterGeo,
      track(new THREE.MeshStandardMaterial({ map: letterTex, roughness: 0.75, side: THREE.DoubleSide }))
    );
    const letterRest = -0.02;
    letter.position.set(0, letterRest, 0);
    outline(letterGeo, letter);
    env.add(letter);

    // front pocket, with the V cut
    const pocketShape = new THREE.Shape();
    pocketShape.moveTo(-W / 2, -H / 2);
    pocketShape.lineTo(W / 2, -H / 2);
    pocketShape.lineTo(W / 2, H / 2);
    pocketShape.lineTo(0, -H * 0.06);
    pocketShape.lineTo(-W / 2, H / 2);
    pocketShape.lineTo(-W / 2, -H / 2);
    const pocketGeo = track(new THREE.ShapeGeometry(pocketShape));
    const pocket = new THREE.Mesh(pocketGeo, paperMat);
    pocket.position.z = 0.03;
    outline(pocketGeo, pocket);
    env.add(pocket);

    // address block and stamp, floated just off the pocket face
    const addressMat = track(
      new THREE.MeshBasicMaterial({ map: track(makeAddressTexture(maxAniso)), transparent: true, depthWrite: false })
    );
    const address = new THREE.Mesh(track(new THREE.PlaneGeometry(W * 0.74, W * 0.37)), addressMat);
    address.position.set(0, -H * 0.17, 0.034);
    env.add(address);

    // flap, hinged on the top edge
    const flapShape = new THREE.Shape();
    flapShape.moveTo(-W / 2, 0);
    flapShape.lineTo(W / 2, 0);
    flapShape.lineTo(0, -H * 0.62);
    flapShape.lineTo(-W / 2, 0);
    const flapGeo = track(new THREE.ShapeGeometry(flapShape));
    const flapPivot = new THREE.Group();
    flapPivot.position.set(0, H / 2, 0.045);
    const flap = new THREE.Mesh(flapGeo, paperMat);
    outline(flapGeo, flap);
    flapPivot.add(flap);
    env.add(flapPivot);

    // wax seal
    const seal = new THREE.Mesh(
      track(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 48)),
      track(new THREE.MeshPhysicalMaterial({ color: 0xff9473, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.25 }))
    );
    seal.rotation.x = Math.PI / 2;
    seal.position.set(0, -H * 0.62 + 0.06, 0.03);
    flap.add(seal);

    /* ---------------- floating pastel shapes ---------------- */
    const mkMat = (color: number, opacity = 0.92) =>
      track(
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.28,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.15,
          sheen: 1,
          sheenColor: new THREE.Color(0xffffff),
          sheenRoughness: 0.5,
          iridescence: 0.35,
          transparent: opacity < 1,
          opacity,
        })
      );

    type Floater = {
      mesh: THREE.Mesh;
      base: THREE.Vector3;
      spin: THREE.Vector3;
      phase: number;
      amp: number;
      push: THREE.Vector3;
      scale: number;
    };
    const floaters: Floater[] = [];
    const addFloater = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      pos: [number, number, number],
      scale: number,
      push: [number, number, number]
    ) => {
      const mesh = new THREE.Mesh(track(geo), mat);
      mesh.position.set(...pos);
      mesh.scale.setScalar(scale);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      root.add(mesh);
      floaters.push({
        mesh,
        base: new THREE.Vector3(...pos),
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5, 0),
        phase: Math.random() * Math.PI * 2,
        amp: 0.12 + Math.random() * 0.12,
        push: new THREE.Vector3(...push),
        scale,
      });
    };

    // Phones get fewer, simpler shapes so the first frame stays cheap.
    const seg = (n: number) => (coarse ? Math.max(8, Math.round(n * 0.55)) : n);

    addFloater(new THREE.SphereGeometry(1, seg(64), seg(64)), mkMat(0xff9473), [-3.6, 0.9, -0.8], 0.62, [-1.6, 0.6, 0]);
    addFloater(new THREE.TorusGeometry(0.8, 0.3, seg(48), seg(120)), mkMat(0xa0b5eb), [3.7, 1.1, -0.6], 0.72, [1.8, 0.8, 0]);
    addFloater(new RoundedBoxGeometry(1, 1, 1, 6, 0.22), mkMat(0xa7fccd), [3.1, -1.5, 0.4], 0.78, [1.4, -0.8, 0]);
    addFloater(new THREE.CapsuleGeometry(0.42, 0.9, seg(12), seg(32)), mkMat(0xecda98), [-3.0, -1.6, 0.6], 0.8, [-1.5, -0.9, 0]);
    addFloater(new THREE.IcosahedronGeometry(1, 0), mkMat(0xcfdaf5), [-1.9, 2.2, -2.2], 0.42, [-0.6, 1.4, 0]);
    addFloater(new THREE.SphereGeometry(1, seg(48), seg(48)), mkMat(0xa0b5eb), [2.0, 2.4, -2.5], 0.28, [0.6, 1.4, 0]);
    if (!coarse) {
      addFloater(new THREE.TorusKnotGeometry(0.6, 0.2, 160, 24), mkMat(0xff9473, 0.85), [0.2, -2.6, -1.6], 0.42, [0, -1.6, 0]);
      addFloater(new THREE.SphereGeometry(1, 48, 48), mkMat(0xa7fccd), [-4.6, -0.4, -2.4], 0.3, [-1.2, 0, 0]);
    }

    /* ---------------- drifting dust ---------------- */
    const DUST = coarse ? 150 : 340;
    const dustHome = new Float32Array(DUST * 3);
    const dustSeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      dustHome[i * 3] = (Math.random() - 0.5) * 16;
      dustHome[i * 3 + 1] = (Math.random() - 0.5) * 10;
      dustHome[i * 3 + 2] = (Math.random() - 0.5) * 7 - 1.5;
      dustSeed[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustHome.slice(), 3));
    const dustMat = track(
      new THREE.PointsMaterial({
        size: 0.075,
        map: track(makeRadialTexture("rgba(120,138,190,0.9)", "rgba(120,138,190,0)")),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);
    const dustAttr = dustGeo.getAttribute("position") as THREE.BufferAttribute;

    /* ---------------- interaction and sizing ---------------- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let layoutScale = 1;
    let layoutY = -1.15;
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const narrow = w < 720;
      layoutScale = w < 520 ? 0.54 : narrow ? 0.66 : w < 1100 ? 0.82 : 1;
      layoutY = narrow ? -1.8 : -1.25;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0 });
    io.observe(mount);

    let awake = !document.hidden;
    const onVisibility = () => (awake = !document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------------- loop ---------------- */
    const clock = new THREE.Clock();
    let introStart = 0;
    let raf = 0;
    const tmp = new THREE.Vector3();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || !awake) return;

      const t = clock.getElapsedTime();
      if (!introStart && (ready.current || reduced)) introStart = performance.now();
      const intro = reduced ? 1 : introStart ? ease(clamp01((performance.now() - introStart) / 1800)) : 0;
      const p = clamp01(progress.current ?? 0);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      // Three beats: unseal, lift the letter, then let everything drift apart.
      const open = easeInOut(clamp01(p / 0.42));
      const rise = easeInOut(clamp01((p - 0.28) / 0.48));
      const part = easeInOut(clamp01((p - 0.6) / 0.4));

      flapPivot.rotation.x = -open * Math.PI * 1.04;
      flapPivot.position.z = open > 0.5 ? -0.03 : 0.045; // tuck behind once past vertical
      letter.position.y = letterRest + rise * (LH * 0.82);
      letter.position.z = 0.005 + rise * 0.22;
      letter.rotation.x = -rise * 0.14;
      letter.scale.setScalar(1 + rise * 0.06);
      addressMat.opacity = 0.95 * (1 - open * 0.85);
      shadow.scale.setScalar(1 + rise * 0.25);

      root.scale.setScalar(layoutScale * (0.86 + intro * 0.14));
      root.position.y = layoutY - (1 - intro) * 2.4 + rise * 0.28;
      root.position.z = -part * 1.6;
      env.rotation.y = mouse.x * 0.28 + Math.sin(t * 0.4) * 0.05 + (1 - intro) * 0.6;
      env.rotation.x = -0.12 + mouse.y * 0.14 + Math.sin(t * 0.5) * 0.03 - p * 0.15;
      env.rotation.z = Math.sin(t * 0.3) * 0.02;
      env.position.y = Math.sin(t * 0.8) * 0.06;

      for (const f of floaters) {
        tmp.copy(f.base).addScaledVector(f.push, ease(p));
        f.mesh.position.set(
          tmp.x + mouse.x * 0.25 * (1 + f.base.z * -0.2),
          tmp.y + Math.sin(t * 0.9 + f.phase) * f.amp - mouse.y * 0.15,
          tmp.z
        );
        f.mesh.rotation.x += f.spin.x * 0.016;
        f.mesh.rotation.y += f.spin.y * 0.016;
        f.mesh.scale.setScalar(f.scale * intro);
      }

      for (let i = 0; i < DUST; i++) {
        const s = dustSeed[i];
        dustAttr.setX(i, dustHome[i * 3] + Math.cos(t * 0.18 + s) * 0.35 + mouse.x * 0.3);
        dustAttr.setY(i, dustHome[i * 3 + 1] + Math.sin(t * 0.26 + s) * 0.5);
      }
      dustAttr.needsUpdate = true;
      dust.rotation.z = t * 0.008;
      dustMat.opacity = 0.5 * intro * (1 - p * 0.7);

      camera.position.x = mouse.x * 0.3;
      camera.position.y = -mouse.y * 0.2;
      camera.lookAt(0, -0.4, 0);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      io.disconnect();
      disposables.forEach((d) => d.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress, ready]);

  return <div ref={mountRef} className="hero-canvas" aria-hidden="true" />;
}
