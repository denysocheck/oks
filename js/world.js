// ==========================================================================
// WORLD.JS - 3D TINKEROLL-STYLE INTERACTIVE TRACK & BALL
// Built with Three.js & GSAP
// ==========================================================================

(function () {
  "use strict";

  const canvas = document.getElementById("webgl-canvas");
  if (!canvas) return;

  const isSmall = window.innerWidth < 768;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5efe6); // warm cream
  scene.fog = new THREE.FogExp2(0xf5efe6, 0.015);

  const camera = new THREE.PerspectiveCamera(
    isSmall ? 55 : 42,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isSmall,
      powerPreference: "high-performance"
    });
  } catch (e) {
    console.error("WebGL initialization error", e);
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Lights
  const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xd0c2b2, 1.2);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff0db, 2.2);
  sunLight.position.set(15, 30, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 120;
  const shadowRange = 25;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Group that tilts subtly with mouse pointer (like Tinkeroll)
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // --------------------------------------------------------------------------
  // 3D CATMULL-ROM CURVED TRACK
  // --------------------------------------------------------------------------
  const pathPoints = [
    new THREE.Vector3(0, 0, 10),
    new THREE.Vector3(0, -0.5, 0),
    new THREE.Vector3(6, -2.5, -18),
    new THREE.Vector3(-5, -5.0, -36),
    new THREE.Vector3(7, -8.0, -56),
    new THREE.Vector3(-4, -11.0, -76),
    new THREE.Vector3(0, -13.0, -96)
  ];

  const trackCurve = new THREE.CatmullRomCurve3(pathPoints, false, "catmullrom", 0.35);
  const trackLen = trackCurve.getLength();
  const UP = new THREE.Vector3(0, 1, 0);

  function getFrameAt(t) {
    const pos = trackCurve.getPointAt(t);
    const tan = trackCurve.getTangentAt(t).normalize();
    const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
    return { pos, tan, side };
  }

  // Materials in Wedding / Jubilee Palette
  const matCreamTrack = new THREE.MeshStandardMaterial({
    color: 0xede4d5,
    roughness: 0.45,
    metalness: 0.1
  });
  const matGoldRails = new THREE.MeshStandardMaterial({
    color: 0xc8a87c,
    roughness: 0.25,
    metalness: 0.65
  });
  const matPillars = new THREE.MeshStandardMaterial({
    color: 0xd9cebe,
    roughness: 0.6
  });

  // Build Track Rails & Tiles
  const tileCount = Math.floor(trackLen / 1.1);
  const tileGeo = new THREE.BoxGeometry(2.2, 0.2, 0.9);
  const railGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8);
  railGeo.rotateX(Math.PI / 2);

  const trackGroup = new THREE.Group();
  worldGroup.add(trackGroup);

  for (let i = 0; i < tileCount; i++) {
    const t = i / (tileCount - 1);
    const { pos, tan, side } = getFrameAt(t);

    // Plank
    const plank = new THREE.Mesh(tileGeo, matCreamTrack);
    plank.position.copy(pos);
    plank.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), tan);
    plank.castShadow = true;
    plank.receiveShadow = true;
    trackGroup.add(plank);

    // Side Golden Railings
    [-1.15, 1.15].forEach((offset) => {
      const rail = new THREE.Mesh(railGeo, matGoldRails);
      rail.position.copy(pos).addScaledVector(side, offset).addScaledVector(UP, 0.22);
      rail.quaternion.copy(plank.quaternion);
      rail.castShadow = true;
      trackGroup.add(rail);
    });

    // Support pillars every 4th plank
    if (i % 4 === 0) {
      const pillarH = Math.max(2, -pos.y + 4);
      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.22, pillarH, 12);
      const pillar = new THREE.Mesh(pillarGeo, matPillars);
      pillar.position.copy(pos).addScaledVector(UP, -pillarH / 2);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      trackGroup.add(pillar);
    }
  }

  // --------------------------------------------------------------------------
  // 3D BALL (MARBLE)
  // --------------------------------------------------------------------------
  const BALL_RADIUS = 0.45;
  const ballGroup = new THREE.Group();
  worldGroup.add(ballGroup);

  // Outer glossy clear shell
  const outerBall = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 32, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0xfffcf7,
      roughness: 0.06,
      metalness: 0.15,
      transmission: 0.85,
      thickness: 0.5,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    })
  );
  outerBall.castShadow = true;
  ballGroup.add(outerBall);

  // Inner Golden Rose Core
  const innerSpinGroup = new THREE.Group();
  const innerCore = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS * 0.58, 24, 18),
    new THREE.MeshStandardMaterial({
      color: 0xc8a87c,
      metalness: 0.8,
      roughness: 0.2
    })
  );
  const goldenBand = new THREE.Mesh(
    new THREE.TorusGeometry(BALL_RADIUS * 0.65, 0.05, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xe6cca8,
      metalness: 0.9,
      roughness: 0.15
    })
  );
  goldenBand.rotation.x = Math.PI / 2;
  innerSpinGroup.add(innerCore, goldenBand);
  ballGroup.add(innerSpinGroup);

  // Gentle light attached to ball
  const ballGlow = new THREE.PointLight(0xffe2bd, 1.5, 6);
  ballGlow.position.set(0, 0.5, 0);
  ballGroup.add(ballGlow);

  // --------------------------------------------------------------------------
  // FLOATING PARTICLES & GOLDEN ORBS IN THE AIR
  // --------------------------------------------------------------------------
  const orbCount = 50;
  const orbGeo = new THREE.SphereGeometry(0.12, 16, 12);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xd9b88c,
    roughness: 0.2,
    metalness: 0.6,
    emissive: 0x6e5232,
    emissiveIntensity: 0.2
  });

  const orbs = [];
  for (let i = 0; i < orbCount; i++) {
    const orb = new THREE.Mesh(orbGeo, orbMat);
    const t = Math.random();
    const { pos, side } = getFrameAt(t);
    const s = (Math.random() - 0.5) * 16;
    const yOff = (Math.random() - 0.2) * 8;
    orb.position.copy(pos).addScaledVector(side, s).addScaledVector(UP, yOff);
    orb.scale.setScalar(0.5 + Math.random() * 1.2);
    worldGroup.add(orb);
    orbs.push({ mesh: orb, basePos: orb.position.clone(), speed: 0.8 + Math.random() * 1.5 });
  }

  // --------------------------------------------------------------------------
  // THEMED 3D STATIONS ALONG THE TRACK
  // --------------------------------------------------------------------------
  // Station 1: Calendar 3D Pavilion (t ≈ 0.25)
  (function buildCalendarStation() {
    const { pos, side } = getFrameAt(0.25);
    const g = new THREE.Group();
    g.position.copy(pos).addScaledVector(side, 3.8).addScaledVector(UP, 0.4);

    // Base podium
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.3, 32),
      new THREE.MeshStandardMaterial({ color: 0xeee7db, roughness: 0.4 })
    );
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    // Marble pillars
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 2.2, 16),
        matPillars
      );
      pillar.position.set(Math.cos(a) * 1.8, 1.1, Math.sin(a) * 1.8);
      pillar.castShadow = true;
      g.add(pillar);
    }

    // Top Ring
    const topRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.1, 12, 32),
      matGoldRails
    );
    topRing.rotation.x = Math.PI / 2;
    topRing.position.y = 2.2;
    g.add(topRing);

    // Center Golden Heart
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0);
    heartShape.bezierCurveTo(0, 0.3, -0.6, 0.6, -0.6, 0.9);
    heartShape.bezierCurveTo(-0.6, 1.2, 0, 1.5, 0, 1.1);
    heartShape.bezierCurveTo(0, 1.5, 0.6, 1.2, 0.6, 0.9);
    heartShape.bezierCurveTo(0.6, 0.6, 0, 0.3, 0, 0);

    const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const heartMesh = new THREE.Mesh(
      heartGeo,
      new THREE.MeshStandardMaterial({ color: 0xc8a87c, roughness: 0.2, metalness: 0.7 })
    );
    heartMesh.scale.set(0.6, 0.6, 0.6);
    heartMesh.position.set(0, 1.1, 0);
    g.add(heartMesh);

    worldGroup.add(g);
  })();

  // Station 2: Restaurant & Table 3D Pavilion (t ≈ 0.50)
  (function buildRestaurantStation() {
    const { pos, side } = getFrameAt(0.50);
    const g = new THREE.Group();
    g.position.copy(pos).addScaledVector(side, -4.2).addScaledVector(UP, 0.4);

    // Round Dining Table
    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 1.8, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    tableTop.position.y = 1.0;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    g.add(tableTop);

    const tableLeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.28, 1.0, 16),
      matGoldRails
    );
    tableLeg.position.y = 0.5;
    g.add(tableLeg);

    // Champagne Glasses on table
    [-0.4, 0.4].forEach((x) => {
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.02, 0.35, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.1, thickness: 0.2 })
      );
      glass.position.set(x, 1.2, 0);
      g.add(glass);
    });

    worldGroup.add(g);
  })();

  // Station 3: Music & Stage Pavilion (t ≈ 0.75)
  (function buildMusicStation() {
    const { pos, side } = getFrameAt(0.75);
    const g = new THREE.Group();
    g.position.copy(pos).addScaledVector(side, 4.0).addScaledVector(UP, 0.4);

    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.3, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xe8dfd1, roughness: 0.5 })
    );
    stage.castShadow = true;
    stage.receiveShadow = true;
    g.add(stage);

    // Archway
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.1, 12, 32, Math.PI),
      matGoldRails
    );
    arch.position.set(0, 1.6, 0);
    arch.castShadow = true;
    g.add(arch);

    worldGroup.add(g);
  })();

  // --------------------------------------------------------------------------
  // SCROLL PROGRESS INTERPOLATION
  // --------------------------------------------------------------------------
  let targetProgress = 0;
  let currentProgress = 0;

  // Mouse tilt pointer
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Update scroll progress from window scroll
  function updateScroll() {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH > 0) {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / scrollH));
    }
  }
  window.addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  // Update track rail UI
  const trackFill = document.querySelector(".track-fill");
  const trackBallUI = document.querySelector(".track-ball");
  const stationItems = document.querySelectorAll(".track-station-item");

  function updateTrackRailUI(p) {
    if (trackFill) trackFill.style.height = `${p * 100}%`;
    if (trackBallUI) trackBallUI.style.top = `${p * 100}%`;

    const activeIndex = p < 0.15 ? 0 : p < 0.38 ? 1 : p < 0.62 ? 2 : p < 0.85 ? 3 : 4;
    stationItems.forEach((el, idx) => {
      el.classList.toggle("active", idx === activeIndex);
    });
  }

  // Camera positions
  const currentCamPos = new THREE.Vector3();
  const currentCamLook = new THREE.Vector3();
  let isFirstFrame = true;

  // Clock
  const clock = new THREE.Clock();

  // --------------------------------------------------------------------------
  // RENDER LOOP
  // --------------------------------------------------------------------------
  function renderLoop() {
    requestAnimationFrame(renderLoop);

    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    // Lerp progress for ultra-smooth physical motion
    currentProgress += (targetProgress - currentProgress) * 0.08;
    updateTrackRailUI(currentProgress);

    // Frame on path
    const { pos, tan, side } = getFrameAt(currentProgress);

    // Position the 3D ball on the track
    const ballPos = pos.clone().addScaledVector(UP, BALL_RADIUS + 0.1);
    ballGroup.position.copy(ballPos);

    // Spin the ball proportional to forward movement
    innerSpinGroup.rotation.x += delta * 4 * (1 + targetProgress * 2);
    innerSpinGroup.rotation.z += delta * 2;

    // Follow Camera (like Tinkeroll)
    const introBlend = Math.max(0, 1 - currentProgress * 8); // Wider camera at the beginning
    const camBack = (isSmall ? 6.5 : 5.8) + introBlend * 3;
    const camUp = (isSmall ? 4.2 : 3.4) + introBlend * 2;
    const sideSwing = Math.sin(currentProgress * 7) * 1.5;

    const targetCamPos = ballPos.clone()
      .addScaledVector(tan, -camBack)
      .addScaledVector(UP, camUp)
      .addScaledVector(side, sideSwing);

    const targetLookAt = ballPos.clone()
      .addScaledVector(tan, 3.0)
      .addScaledVector(UP, 0.2);

    if (isFirstFrame) {
      currentCamPos.copy(targetCamPos);
      currentCamLook.copy(targetLookAt);
      isFirstFrame = false;
    } else {
      currentCamPos.lerp(targetCamPos, 0.08);
      currentCamLook.lerp(targetLookAt, 0.1);
    }

    camera.position.copy(currentCamPos);
    camera.lookAt(currentCamLook);

    // Sun follows the ball
    sunLight.position.copy(ballPos).add(new THREE.Vector3(12, 25, 15));
    sunLight.target.position.copy(ballPos);

    // Mouse tilt on world
    worldGroup.rotation.z += (-pointer.x * 0.025 - worldGroup.rotation.z) * 0.05;
    worldGroup.rotation.x += (pointer.y * 0.02 - worldGroup.rotation.x) * 0.05;

    // Float orbs
    orbs.forEach((item, idx) => {
      item.mesh.position.y = item.basePos.y + Math.sin(elapsed * item.speed + idx) * 0.35;
    });

    renderer.render(scene, camera);
  }

  renderLoop();

  // Resize handler
  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = w < 768 ? 55 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Expose station click jump
  window.jumpToStation = function (percent) {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: scrollH * percent,
      behavior: "smooth"
    });
  };

})();
