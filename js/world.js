// ==========================================================================
// WORLD.JS - DIRECT 3D TRACK MOVEMENT & IMMERSIVE 3D WORLD STATIONS
// Three.js Track, Rolling Marble, Follow Camera, & 4 Rich 3D Architectural Stations:
// 1. Celebration Arch & Champagne Set
// 2. Sculptural 3D Calendar "17 Листопада" & 16:00 Clock
// 3. Austrian Manor Restaurant «Австрійський двір» & Banquet Terrace
// 4. Grand Final Rotunda with Sculptural Golden 3D Heart (placed beyond the road)
// ==========================================================================

(function () {
  "use strict";

  const canvas = document.getElementById("webgl-canvas");
  if (!canvas) return;

  const isSmall = window.innerWidth < 768;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5efe6); // warm crema
  scene.fog = new THREE.Fog(0xf5efe6, 22, 115);

  const camera = new THREE.PerspectiveCamera(
    isSmall ? 52 : 40,
    window.innerWidth / window.innerHeight,
    0.1,
    280
  );

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isSmall,
      powerPreference: "high-performance"
    });
  } catch (e) {
    console.error("WebGL failed to initialize", e);
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.4 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xfff9f0, 0xd2c4b4, 1.25);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.3);
  sunLight.position.set(15, 32, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 130;
  const shadowRange = 28;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // --------------------------------------------------------------------------
  // 3D CATMULL-ROM CURVED TRACK (CLEAN FINISH BEFORE FINAL ROTUNDA)
  // --------------------------------------------------------------------------
  const pathPoints = [
    new THREE.Vector3(0, 0, 10),        // 0.00: Start / Card spawn
    new THREE.Vector3(0, -0.6, -2),     // 0.08: Heading onto main track
    new THREE.Vector3(5.5, -2.4, -22),  // 0.25: Station 1 - Greeting Arch
    new THREE.Vector3(-5.5, -5.2, -48), // 0.52: Station 2 - Calendar Pavilion
    new THREE.Vector3(5.5, -8.0, -74),  // 0.76: Station 3 - Restaurant
    new THREE.Vector3(0, -10.5, -96)    // 1.00: Road finish line directly before the Rotunda steps!
  ];

  const trackCurve = new THREE.CatmullRomCurve3(pathPoints, false, "catmullrom", 0.35);
  const trackLen = trackCurve.getLength();
  const UP = new THREE.Vector3(0, 1, 0);

  function getFrameAt(t) {
    const clampedT = Math.max(0, Math.min(1, t));
    const pos = trackCurve.getPointAt(clampedT);
    const tan = trackCurve.getTangentAt(clampedT).normalize();
    const side = new THREE.Vector3().crossVectors(tan, UP).normalize();
    return { pos, tan, side };
  }

  // Shared Materials
  const matCreamTrack = new THREE.MeshStandardMaterial({ color: 0xeee6d8, roughness: 0.45, metalness: 0.1 });
  const matGoldRails = new THREE.MeshStandardMaterial({ color: 0xc8a87c, roughness: 0.25, metalness: 0.75 });
  const matGoldShine = new THREE.MeshStandardMaterial({ color: 0xdfb478, roughness: 0.18, metalness: 0.88 });
  const matPillars = new THREE.MeshStandardMaterial({ color: 0xdcd1c2, roughness: 0.6 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.75 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0x8b4532, roughness: 0.65 });
  const matWindowGlow = new THREE.MeshStandardMaterial({
    color: 0xffe6a8,
    emissive: 0xee9a22,
    emissiveIntensity: 0.9,
    roughness: 0.3
  });
  const matWhiteLinen = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.9,
    roughness: 0.08
  });
  const matBottle = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.25, metalness: 0.3 });
  const matCake = new THREE.MeshStandardMaterial({ color: 0xfffdf7, roughness: 0.5 });
  const matHeart = new THREE.MeshStandardMaterial({
    color: 0xdfb478,
    metalness: 0.85,
    roughness: 0.2,
    emissive: 0x3d2910,
    emissiveIntensity: 0.2
  });

  // Track Tiles & Side Rails Construction
  const tileCount = Math.floor(trackLen / 1.15);
  const tileGeo = new THREE.BoxGeometry(2.4, 0.22, 0.95);
  const railGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.05, 8);
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
    [-1.25, 1.25].forEach((offset) => {
      const rail = new THREE.Mesh(railGeo, matGoldRails);
      rail.position.copy(pos).addScaledVector(side, offset).addScaledVector(UP, 0.24);
      rail.quaternion.copy(plank.quaternion);
      rail.castShadow = true;
      trackGroup.add(rail);
    });

    // Support pillars
    if (i % 3 === 0) {
      const pillarH = Math.max(3, -pos.y + 6);
      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.24, pillarH, 12);
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

  // Outer glossy glass sphere
  const outerBall = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 32, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.88,
      ior: 1.48,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04
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

  const ballGlow = new THREE.PointLight(0xffe2bd, 1.8, 7);
  ballGlow.position.set(0, 0.4, 0);
  ballGroup.add(ballGlow);

  // Store references for dynamic animation
  const animatedObjects = {
    heart: null,
    heartBaseY: 0
  };

  // Helper: Small crisp plaque canvas texture
  function createPlaqueTexture(text, subtext) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = "#c8a87c";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = "#2a2521";
    ctx.textAlign = "center";
    ctx.font = "bold 44px 'Playfair Display', serif";
    ctx.fillText(text, 256, subtext ? 58 : 78);
    if (subtext) {
      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 26px 'Cormorant Garamond', serif";
      ctx.fillText(subtext, 256, 102);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  // --------------------------------------------------------------------------
  // STATION 1: 3D GRAND CELEBRATION ARCH & CHAMPAGNE SET (t ≈ 0.25)
  // --------------------------------------------------------------------------
  (function buildStation1() {
    const { pos, tan, side } = getFrameAt(0.25);
    const stationGroup = new THREE.Group();

    // 1. Grand Arch spanning right across the track
    const archGroup = new THREE.Group();
    archGroup.position.copy(pos);

    [-2.3, 2.3].forEach((offset) => {
      // Pedestal
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.85), matCreamTrack);
      base.position.set(0, 0.22, 0);
      base.castShadow = true;

      // Column shaft
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.4, 16), matPillars);
      col.position.set(0, 2.45, 0);
      col.castShadow = true;

      // Golden Capital
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.75), matGoldShine);
      cap.position.set(0, 4.8, 0);

      // Torus rings on column
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 20), matGoldRails);
      ring1.rotation.x = Math.PI / 2;
      ring1.position.set(0, 0.65, 0);

      const pGroup = new THREE.Group();
      pGroup.add(base, col, cap, ring1);
      pGroup.position.copy(side.clone().multiplyScalar(offset));
      archGroup.add(pGroup);
    });

    // Arch Overhead Vault
    const archCurve = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.18, 16, 32, Math.PI),
      matGoldShine
    );
    archCurve.position.copy(UP.clone().multiplyScalar(4.8));
    archCurve.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);
    archCurve.castShadow = true;
    archGroup.add(archCurve);

    // Golden Medallion Crown at Arch Apex
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24), matGoldShine);
    medallion.position.copy(UP.clone().multiplyScalar(7.1));
    medallion.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    archGroup.add(medallion);

    // Floating celebratory golden orbs around arch
    [-1.6, 0, 1.6].forEach((x, idx) => {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matGoldShine);
      orb.position.copy(side.clone().multiplyScalar(x)).addScaledVector(UP, 6.4 + Math.sin(idx) * 0.5);
      archGroup.add(orb);
    });

    stationGroup.add(archGroup);

    // 2. Celebration Side-Table with Champagne Cooler & Glasses
    const sideTable = new THREE.Group();
    sideTable.position.copy(pos).addScaledVector(side, 4.6).addScaledVector(UP, 0.2);

    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.2, 24), matCreamTrack);
    tBase.position.y = 0.1;
    const tStem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 16), matGoldRails);
    tStem.position.y = 0.8;
    const tTop = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 24), matWhiteLinen);
    tTop.position.y = 1.45;
    tTop.castShadow = true;
    sideTable.add(tBase, tStem, tTop);

    // Silver Champagne Bucket
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.28, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.15 })
    );
    bucket.position.set(0, 1.78, 0);
    bucket.castShadow = true;
    sideTable.add(bucket);

    // Champagne Bottle inside bucket
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.65, 12), matBottle);
    bottle.position.set(-0.06, 2.05, 0.04);
    bottle.rotation.z = 0.25;
    const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12), matGoldShine);
    foil.position.set(-0.09, 2.38, 0.04);
    foil.rotation.z = 0.25;
    sideTable.add(bottle, foil);

    // 2 Crystal Champagne Flutes
    [-0.32, 0.32].forEach((gx) => {
      const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.03, 0.32, 12), matGlass);
      flute.position.set(gx, 1.68, 0.15);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 8), matGoldRails);
      stem.position.set(gx, 1.55, 0.15);
      sideTable.add(flute, stem);
    });

    const welcomeLight = new THREE.PointLight(0xffdfa8, 1.8, 8);
    welcomeLight.position.set(0, 2.5, 0);
    sideTable.add(welcomeLight);

    stationGroup.add(sideTable);
    worldGroup.add(stationGroup);
  })();

  // --------------------------------------------------------------------------
  // STATION 2: 3D SCULPTURAL CALENDAR "17 ЛИСТОПАДА" & CLOCK PAVILION (t ≈ 0.52)
  // --------------------------------------------------------------------------
  (function buildStation2() {
    const { pos, tan, side } = getFrameAt(0.52);
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(pos).addScaledVector(side, -4.8).addScaledVector(UP, 0.2);

    // 1. Classical Multi-Tier Stepped Podium
    const base1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.3, 32), matCreamTrack);
    base1.position.y = 0.15;
    base1.castShadow = true;
    base1.receiveShadow = true;

    const base2 = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 0.25, 32), matCreamTrack);
    base2.position.y = 0.42;
    base2.castShadow = true;
    stationGroup.add(base1, base2);

    // 2. Colonnade with 4 Golden Pillars & Cupola perfectly seated
    const canopyGroup = new THREE.Group();
    const pillarRadius = 2.4;
    const pillarH = 3.6;
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const px = Math.cos(ang) * pillarRadius;
      const pz = Math.sin(ang) * pillarRadius;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, pillarH, 16), matGoldRails);
      col.position.set(px, 0.42 + pillarH / 2, pz);
      col.castShadow = true;
      canopyGroup.add(col);
    }

    // Dome Ring & Roof sitting directly on columns
    const domeTopY = 0.42 + pillarH;
    const domeRing = new THREE.Mesh(new THREE.TorusGeometry(pillarRadius, 0.12, 12, 32), matGoldShine);
    domeRing.rotation.x = Math.PI / 2;
    domeRing.position.y = domeTopY;

    // Dome canopy sitting directly on the ring
    const domeRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, pillarRadius, 0.9, 32),
      matCreamTrack
    );
    domeRoof.position.y = domeTopY + 0.45;

    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), matGoldShine);
    finial.position.y = domeTopY + 1.0;
    canopyGroup.add(domeRing, domeRoof, finial);
    stationGroup.add(canopyGroup);

    // 3. High-Res Calligraphic Calendar Block
    const calGroup = new THREE.Group();
    calGroup.position.set(-0.2, 0.55, 0.2);

    const stand = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 1.6), matWood);
    stand.position.set(0, 0.1, 0);
    calGroup.add(stand);

    const calBlock = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 0.25), matWhiteLinen);
    calBlock.position.set(0, 1.45, 0);
    calBlock.rotation.x = -0.16;
    calBlock.castShadow = true;
    calGroup.add(calBlock);

    // Render a crisp calligraphic calendar front texture
    const calCanvas = document.createElement("canvas");
    calCanvas.width = 512;
    calCanvas.height = 580;
    const ctx = calCanvas.getContext("2d");

    ctx.fillStyle = "#faf7f2";
    ctx.fillRect(0, 0, 512, 580);

    // Top gold month banner
    ctx.fillStyle = "#9e7d52";
    ctx.fillRect(0, 0, 512, 110);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "bold 44px 'Playfair Display', serif";
    ctx.fillText("ЛИСТОПАД 2026", 256, 72);

    // Big Calligraphic "17"
    ctx.fillStyle = "#c8a87c";
    ctx.font = "bold 210px 'Playfair Display', serif";
    ctx.fillText("17", 256, 360);

    // Subtext
    ctx.fillStyle = "#554d45";
    ctx.font = "italic 36px 'Cormorant Garamond', serif";
    ctx.fillText("Вівторок  •  16:00", 256, 440);

    ctx.strokeStyle = "#c8a87c";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 560);

    const calTexture = new THREE.CanvasTexture(calCanvas);
    calTexture.minFilter = THREE.LinearFilter;

    const calFront = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.4),
      new THREE.MeshStandardMaterial({ map: calTexture, roughness: 0.3 })
    );
    calFront.position.set(0, 1.45, 0.14);
    calFront.rotation.x = -0.16;
    calGroup.add(calFront);

    // Golden Spiral Ring Bindings along top
    for (let c = -0.85; c <= 0.85; c += 0.34) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), matGoldShine);
      ring.position.set(c, 2.72, -0.05);
      ring.rotation.y = Math.PI / 2;
      calGroup.add(ring);
    }

    stationGroup.add(calGroup);

    // 4. Antique Standing Clock pointing accurately to 16:00
    const clockGroup = new THREE.Group();
    clockGroup.position.set(1.7, 0.55, 0.3);

    const clockStem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.6, 16), matGoldRails);
    clockStem.position.y = 0.8;
    const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 24), matGoldShine);
    clockBody.position.y = 1.95;
    clockBody.rotation.x = Math.PI / 2;
    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), matWhiteLinen);
    clockFace.position.set(0, 1.95, 0.09);

    // Hands set to 16:00 (Hour hand at 4 o'clock, Minute hand at 12 o'clock)
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.02), matWood);
    hourHand.position.set(0.08, 1.88, 0.11);
    hourHand.rotation.z = -2.1;
    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.02), matWood);
    minuteHand.position.set(0, 2.12, 0.11);

    clockGroup.add(clockStem, clockBody, clockFace, hourHand, minuteHand);
    stationGroup.add(clockGroup);

    const calLight = new THREE.PointLight(0xffdfa8, 1.6, 8);
    calLight.position.set(0, 3.0, 1.2);
    stationGroup.add(calLight);

    worldGroup.add(stationGroup);
  })();

  // --------------------------------------------------------------------------
  // STATION 3: 3D AUSTRIAN MANOR RESTAURANT & DINING TERRACE (t ≈ 0.76)
  // --------------------------------------------------------------------------
  (function buildStation3() {
    const { pos, tan, side } = getFrameAt(0.76);
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(pos).addScaledVector(side, 5.2).addScaledVector(UP, 0.2);

    // 1. Austrian Chalet / Manor House Building
    const houseGroup = new THREE.Group();
    houseGroup.position.set(0, 0, 0);

    const walls = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.4, 3.4), matCreamTrack);
    walls.position.set(0, 1.7, -1.8);
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Fachwerk (Timber framing beams on facade)
    const beamMat = matWood;
    const fBeam1 = new THREE.Mesh(new THREE.BoxGeometry(4.84, 0.12, 0.08), beamMat);
    fBeam1.position.set(0, 1.7, -0.06);
    const fBeam2 = new THREE.Mesh(new THREE.BoxGeometry(4.84, 0.12, 0.08), beamMat);
    fBeam2.position.set(0, 3.35, -0.06);
    houseGroup.add(fBeam1, fBeam2);

    [-2.35, -0.8, 0.8, 2.35].forEach((bx) => {
      const vBeam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.08), beamMat);
      vBeam.position.set(bx, 1.7, -0.06);
      houseGroup.add(vBeam);
    });

    // 4 Warm Glowing Amber Windows
    [-1.5, 1.5].forEach((wx) => {
      [1.0, 2.5].forEach((wy) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.85), matWindowGlow);
        win.position.set(wx, wy, -0.07);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.06), matWood);
        frame.position.set(wx, wy, -0.09);
        houseGroup.add(win, frame);
      });
    });

    // Arched Entrance Doorway
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.7, 0.08), matWood);
    door.position.set(0, 0.85, -0.06);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), matGoldShine);
    handle.position.set(0.38, 0.85, -0.01);
    houseGroup.add(door, handle);

    // Hanging Restaurant Signboard
    const signMat = new THREE.MeshStandardMaterial({
      map: createPlaqueTexture("«Австрійський двір»", "Ресторан"),
      roughness: 0.3
    });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.55), signMat);
    signBoard.position.set(0, 2.15, -0.04);
    houseGroup.add(signBoard);

    // Pitched Alpine Roof
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.16, 3.8), matRoof);
    roofLeft.position.set(-1.25, 4.0, -1.8);
    roofLeft.rotation.z = 0.55;
    roofLeft.castShadow = true;

    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.16, 3.8), matRoof);
    roofRight.position.set(1.25, 4.0, -1.8);
    roofRight.rotation.z = -0.55;
    roofRight.castShadow = true;

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.55), matRoof);
    chimney.position.set(1.4, 4.7, -2.4);
    houseGroup.add(roofLeft, roofRight, chimney);

    stationGroup.add(houseGroup);

    // 2. Outdoor Festive Banquet Terrace
    const terraceGroup = new THREE.Group();
    terraceGroup.position.set(0, 0, 1.5);

    const patio = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.22, 3.2), matCreamTrack);
    patio.position.set(0, 0.11, 0);
    patio.receiveShadow = true;
    terraceGroup.add(patio);

    // Banquet Table with draped white cloth
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.85, 24), matWhiteLinen);
    tableBase.position.set(0, 0.65, 0);
    tableBase.castShadow = true;
    terraceGroup.add(tableBase);

    // 4 Banquet Chairs
    [-1.1, 1.1].forEach((cx) => {
      [-0.8, 0.8].forEach((cz) => {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), matWood);
        chair.position.set(cx, 0.45, cz);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.05), matGoldRails);
        back.position.set(cx, 0.85, cz);
        terraceGroup.add(chair, back);
      });
    });

    // 3-Tier Jubilee Cake Centerpiece
    const cakeGroup = new THREE.Group();
    cakeGroup.position.set(0, 1.08, 0);

    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.2, 24), matCake);
    c1.position.y = 0.1;
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.16, 24), matCake);
    c2.position.y = 0.28;
    const c3 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.12, 24), matCake);
    c3.position.y = 0.42;

    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), matWhiteLinen);
    candle.position.y = 0.54;
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), matWindowGlow);
    flame.position.y = 0.64;

    cakeGroup.add(c1, c2, c3, candle, flame);
    terraceGroup.add(cakeGroup);

    // Golden Candelabra
    const candelabra = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.45, 12), matGoldShine);
    candelabra.position.set(0.65, 1.3, 0.2);
    terraceGroup.add(candelabra);

    // Pergola posts with hanging bistro string lights
    [-2.0, 2.0].forEach((px) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 12), matWood);
      post.position.set(px, 1.4, 1.2);
      terraceGroup.add(post);
    });

    for (let bx = -1.6; bx <= 1.6; bx += 0.8) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), matWindowGlow);
      bulb.position.set(bx, 2.7 - Math.abs(bx) * 0.12, 1.2);
      terraceGroup.add(bulb);
    }

    const terraceLight = new THREE.PointLight(0xffcc77, 2.0, 10);
    terraceLight.position.set(0, 2.5, 0.8);
    terraceGroup.add(terraceLight);

    stationGroup.add(terraceGroup);
    worldGroup.add(stationGroup);
  })();

  // --------------------------------------------------------------------------
  // STATION 4: GRAND FINAL ROTUNDA & 3D SCULPTURAL GOLDEN HEART (BEYOND ROAD END)
  // --------------------------------------------------------------------------
  (function buildStation4() {
    // Placed strictly beyond the end of the road (road ends at z = -96, rotunda is at z = -108)
    const rotundaCenter = new THREE.Vector3(0, -10.8, -108);
    const stationGroup = new THREE.Group();
    stationGroup.position.copy(rotundaCenter);

    // 1. Classical Grand Octagonal Rotunda Pavilion (Steps lead from track end)
    const rotundaGroup = new THREE.Group();

    // Marble steps: lowest step extends toward the road
    const rBase1 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.35, 32), matCreamTrack);
    rBase1.position.y = 0.17;
    rBase1.receiveShadow = true;

    const rBase2 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.3, 32), matCreamTrack);
    rBase2.position.y = 0.48;
    rotundaGroup.add(rBase1, rBase2);

    // 8 Classical Golden Pillars arranged around perimeter (r = 2.9)
    const pillarR = 2.9;
    const colH = 4.2;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI * 2) / 8;
      const px = Math.cos(ang) * pillarR;
      const pz = Math.sin(ang) * pillarR;

      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, colH, 16), matPillars);
      col.position.set(px, 0.48 + colH / 2, pz);
      col.castShadow = true;

      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), matGoldShine);
      cap.position.set(px, 0.48 + colH + 0.12, pz);

      rotundaGroup.add(col, cap);
    }

    // Dome Entablature & Crown
    const domeTopY = 0.48 + colH + 0.24;
    const domeRing = new THREE.Mesh(new THREE.TorusGeometry(pillarR, 0.16, 12, 32), matGoldShine);
    domeRing.rotation.x = Math.PI / 2;
    domeRing.position.y = domeTopY;

    // Dome crown ribs
    const domeCrown = new THREE.Mesh(
      new THREE.SphereGeometry(pillarR * 0.95, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
      matGoldRails
    );
    domeCrown.position.y = domeTopY;

    const topSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.1, 12), matGoldShine);
    topSpire.position.y = domeTopY + 1.5;

    rotundaGroup.add(domeRing, domeCrown, topSpire);
    stationGroup.add(rotundaGroup);

    // 2. TRUE 3D EXTRUDED BEVELED GOLDEN HEART (Smooth, Rounded, Jewelry-Grade)
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.9);
    heartShape.bezierCurveTo(0, 1.4, -0.75, 1.85, -1.45, 1.85);
    heartShape.bezierCurveTo(-2.3, 1.85, -2.3, 0.9, -2.3, 0.9);
    heartShape.bezierCurveTo(-2.3, 0.1, -1.35, -0.85, 0, -2.0);
    heartShape.bezierCurveTo(1.35, -0.85, 2.3, 0.1, 2.3, 0.9);
    heartShape.bezierCurveTo(2.3, 0.9, 2.3, 1.85, 1.45, 1.85);
    heartShape.bezierCurveTo(0.75, 1.85, 0, 1.4, 0, 0.9);

    const extrudeSettings = {
      depth: 0.65,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.25,
      bevelThickness: 0.25
    };

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    const heartMesh = new THREE.Mesh(heartGeo, matHeart);
    heartMesh.scale.set(0.72, 0.72, 0.72);

    // Decorative golden ribbon ring around heart
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.06, 12, 32), matGoldShine);
    ribbon.rotation.x = Math.PI / 2.8;

    const heartContainer = new THREE.Group();
    heartContainer.position.set(0, 2.5, 0);
    heartContainer.add(heartMesh, ribbon);

    stationGroup.add(heartContainer);

    animatedObjects.heart = heartContainer;
    animatedObjects.heartBaseY = 2.5;

    // 3. Wrapped Celebration Gift Boxes at base
    const boxMat1 = new THREE.MeshStandardMaterial({ color: 0xfdfaf6, roughness: 0.3 });
    const boxMat2 = new THREE.MeshStandardMaterial({ color: 0xecd9c2, roughness: 0.3 });

    [
      { x: -1.2, z: 1.1, s: 0.75, mat: boxMat1 },
      { x: 1.1, z: 1.3, s: 0.65, mat: boxMat2 },
      { x: 0.1, z: 1.6, s: 0.85, mat: boxMat1 }
    ].forEach((gb) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(gb.s, gb.s * 0.8, gb.s), gb.mat);
      box.position.set(gb.x, 0.65 + (gb.s * 0.8) / 2, gb.z);
      box.castShadow = true;

      const rib1 = new THREE.Mesh(new THREE.BoxGeometry(gb.s + 0.02, gb.s * 0.82, 0.1), matGoldShine);
      rib1.position.copy(box.position);
      const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, gb.s * 0.82, gb.s + 0.02), matGoldShine);
      rib2.position.copy(box.position);

      stationGroup.add(box, rib1, rib2);
    });

    const heartGlow = new THREE.PointLight(0xffdfa8, 2.5, 14);
    heartGlow.position.set(0, 3.0, 0);
    stationGroup.add(heartGlow);

    worldGroup.add(stationGroup);
  })();

  // --------------------------------------------------------------------------
  // FLOATING PARTICLES & GOLDEN GLOW IN THE AIR
  // --------------------------------------------------------------------------
  const orbCount = 45;
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
  // CONTINUOUS SCROLL-LINKED ROLLERCOASTER PHYSICS & CAMERA
  // --------------------------------------------------------------------------
  let targetProgress = 0;
  let currentProgress = 0;

  function syncScrollToProgress() {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH > 0) {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / scrollH));
    }
  }
  window.addEventListener("scroll", syncScrollToProgress, { passive: true });

  window.addEventListener("wheel", (e) => {
    if (!window.__isEnvelopeOpened) return;
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH < 100) {
      const delta = e.deltaY * 0.00035;
      targetProgress = Math.max(0, Math.min(1, targetProgress + delta));
    }
  }, { passive: true });

  let touchLastY = 0;
  window.addEventListener("touchstart", (e) => {
    touchLastY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!window.__isEnvelopeOpened) return;
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH < 100) {
      const deltaY = touchLastY - e.touches[0].clientY;
      touchLastY = e.touches[0].clientY;
      targetProgress = Math.max(0, Math.min(1, targetProgress + deltaY * 0.0008));
    }
  }, { passive: true });

  // Mouse tilt pointer
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Progress rail updates (4 stations: 0: Start, 1: Greeting, 2: Calendar, 3: Restaurant, 4: Meeting)
  const trackFill = document.querySelector(".track-fill");
  const trackBallUI = document.querySelector(".track-ball");
  const stationItems = document.querySelectorAll(".track-station-item");

  function updateTrackRailUI(p) {
    if (trackFill) trackFill.style.height = `${p * 100}%`;
    if (trackBallUI) trackBallUI.style.top = `${p * 100}%`;

    const activeIndex = p < 0.15 ? 0 : p < 0.38 ? 1 : p < 0.65 ? 2 : p < 0.88 ? 3 : 4;
    stationItems.forEach((el, idx) => {
      el.classList.toggle("active", idx === activeIndex);
    });
  }

  // Camera state tracking
  const currentCamPos = new THREE.Vector3();
  const currentCamLook = new THREE.Vector3();
  let isFirstFrame = true;

  const clock = new THREE.Clock();

  window.__isEnvelopeOpened = false;

  window.notifyEnvelopeOpened = function () {
    window.__isEnvelopeOpened = true;
  };

  // --------------------------------------------------------------------------
  // MAIN RENDER LOOP
  // --------------------------------------------------------------------------
  function renderLoop() {
    requestAnimationFrame(renderLoop);

    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.getElapsedTime();

    currentProgress += (targetProgress - currentProgress) * 0.08;
    updateTrackRailUI(currentProgress);

    const { pos, tan, side } = getFrameAt(currentProgress);

    // Position Ball directly on road
    const ballPos = pos.clone().addScaledVector(UP, BALL_RADIUS + 0.11);
    ballGroup.position.copy(ballPos);

    // Ball rolling rotation
    const rollSpeed = Math.abs(targetProgress - currentProgress) * 45;
    innerSpinGroup.rotation.x += (rollSpeed + 0.3) * delta * 5;
    innerSpinGroup.rotation.z += delta * 1.5;

    // Pulsing & spinning 3D Golden Heart
    if (animatedObjects.heart) {
      animatedObjects.heart.rotation.y += delta * 0.7;
      animatedObjects.heart.position.y = animatedObjects.heartBaseY + Math.sin(elapsed * 2.5) * 0.12;
      const pulse = 1.0 + Math.sin(elapsed * 3.5) * 0.035;
      animatedObjects.heart.scale.set(pulse, pulse, pulse);
    }

    // Camera follow mechanics
    if (!window.__isEnvelopeOpened) {
      const introCamPos = new THREE.Vector3(0, 3.5, 12);
      const introCamLook = new THREE.Vector3(0, 0, 5);
      if (isFirstFrame) {
        currentCamPos.copy(introCamPos);
        currentCamLook.copy(introCamLook);
        isFirstFrame = false;
      } else {
        currentCamPos.lerp(introCamPos, 0.08);
        currentCamLook.lerp(introCamLook, 0.08);
      }
    } else {
      const camBack = isSmall ? 5.2 : 4.4;
      const camUp = isSmall ? 3.2 : 2.5;
      const sideSwing = Math.sin(currentProgress * 6) * 0.8;

      const targetCamPos = ballPos.clone()
        .addScaledVector(tan, -camBack)
        .addScaledVector(UP, camUp)
        .addScaledVector(side, sideSwing);

      const targetLookAt = ballPos.clone()
        .addScaledVector(tan, 4.5)
        .addScaledVector(UP, 0.2);

      currentCamPos.lerp(targetCamPos, 0.08);
      currentCamLook.lerp(targetLookAt, 0.1);
    }

    camera.position.copy(currentCamPos);
    camera.lookAt(currentCamLook);

    sunLight.position.copy(ballPos).add(new THREE.Vector3(12, 28, 16));
    sunLight.target.position.copy(ballPos);

    worldGroup.rotation.z += (-pointer.x * 0.02 - worldGroup.rotation.z) * 0.05;
    worldGroup.rotation.x += (pointer.y * 0.015 - worldGroup.rotation.x) * 0.05;

    orbs.forEach((item, idx) => {
      item.mesh.position.y = item.basePos.y + Math.sin(elapsed * item.speed + idx) * 0.25;
    });

    renderer.render(scene, camera);
  }

  renderLoop();

  // Resize handler
  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = w < 768 ? 52 : 40;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Jump to Station
  window.jumpToStation = function (percent) {
    targetProgress = percent;
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH > 0) {
      window.scrollTo({
        top: scrollH * percent,
        behavior: "smooth"
      });
    }
  };

})();
