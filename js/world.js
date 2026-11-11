// ==========================================================================
// WORLD.JS - DIRECT 3D TRACK MOVEMENT & INTEGRATED ON-ROAD STATIONS
// Three.js Track, Rolling Marble, Camera Follow, & Canvas Signboards
// ==========================================================================

(function () {
  "use strict";

  const canvas = document.getElementById("webgl-canvas");
  if (!canvas) return;

  const isSmall = window.innerWidth < 768;

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5efe6); // warm crema
  scene.fog = new THREE.Fog(0xf5efe6, 18, 95);

  const camera = new THREE.PerspectiveCamera(
    isSmall ? 52 : 40,
    window.innerWidth / window.innerHeight,
    0.1,
    250
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
  const shadowRange = 26;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0006;
  scene.add(sunLight);

  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // --------------------------------------------------------------------------
  // 3D CATMULL-ROM CURVED TRACK (LONG & DYNAMIC ROLLERCOASTER CURVE)
  // --------------------------------------------------------------------------
  const pathPoints = [
    new THREE.Vector3(0, 0, 10),      // 0.00: Start / Card spawn
    new THREE.Vector3(0, -0.6, -4),   // 0.08: Heading onto main track
    new THREE.Vector3(5.5, -2.4, -22),// 0.22: Station 1 - Greeting Arch
    new THREE.Vector3(-4.5, -4.8, -42),// 0.40: Station 2 - 3D Calendar Pavilion
    new THREE.Vector3(6.5, -7.5, -64),// 0.60: Station 3 - Restaurant & Dining Table
    new THREE.Vector3(-5.0, -10.2, -86),// 0.80: Station 4 - Program & Timeline
    new THREE.Vector3(0, -12.4, -108), // 0.94: Station 5 - Final Heart & RSVP Post
    new THREE.Vector3(0, -13.0, -118)  // 1.00: Finish
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

  // Track Materials (Ivory Plank, Golden Rails, Cream Pillars)
  const matCreamTrack = new THREE.MeshStandardMaterial({
    color: 0xeee6d8,
    roughness: 0.45,
    metalness: 0.1
  });
  const matGoldRails = new THREE.MeshStandardMaterial({
    color: 0xc8a87c,
    roughness: 0.25,
    metalness: 0.65
  });
  const matPillars = new THREE.MeshStandardMaterial({
    color: 0xdcd1c2,
    roughness: 0.6
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
      thickness: 0.5,
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

  // --------------------------------------------------------------------------
  // HELPER: CREATE HIGH-RES TEXTURED 3D SIGNBOARDS MOUNTED DIRECTLY BY THE ROAD
  // --------------------------------------------------------------------------
  function drawSafeRoundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }

  function createRoadsideBillboard(width, height, drawCallback) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = Math.round(1024 * (height / width));
    const ctx = canvas.getContext("2d");

    // Rounded rectangle card background
    const r = 36;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(138, 126, 112, 0.25)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;

    drawSafeRoundRect(ctx, 24, 24, canvas.width - 48, canvas.height - 48, r);
    ctx.fill();

    // Inner gold border
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(200, 168, 124, 0.45)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw station content
    drawCallback(ctx, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const boardGeo = new THREE.PlaneGeometry(width, height);
    const boardMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const boardMesh = new THREE.Mesh(boardGeo, boardMat);

    // Physical board frame and stand
    const frameGroup = new THREE.Group();
    boardMesh.position.z = 0.06;
    frameGroup.add(boardMesh);

    // Back backing
    const backGeo = new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.1);
    const backMesh = new THREE.Mesh(backGeo, matCreamTrack);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    frameGroup.add(backMesh);

    // Support legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 3.5, 12);
    [-width * 0.35, width * 0.35].forEach((x) => {
      const leg = new THREE.Mesh(legGeo, matGoldRails);
      leg.position.set(x, -height / 2 - 1.2, 0);
      leg.castShadow = true;
      frameGroup.add(leg);
    });

    return frameGroup;
  }

  // --------------------------------------------------------------------------
  // STATION 1: GREETING & WELCOME SIGNBOARD (t ≈ 0.20)
  // --------------------------------------------------------------------------
  (function buildStation1() {
    const { pos, tan, side } = getFrameAt(0.20);
    const board = createRoadsideBillboard(4.2, 3.0, (ctx, w, h) => {
      ctx.textAlign = "center";
      
      // Badge
      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 32px 'Cormorant Garamond', serif";
      ctx.fillText("✨  ПОЧАТОК СВЯТА  ✨", w / 2, 90);

      // Main Title
      ctx.fillStyle = "#2a2521";
      ctx.font = "bold 64px 'Great Vibes', cursive";
      ctx.fillText("Запрошую Вас на святкування!", w / 2, 180);

      // Golden Line
      ctx.strokeStyle = "#c8a87c";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 120, 215);
      ctx.lineTo(w / 2 + 120, 215);
      ctx.stroke();

      // Quote
      ctx.fillStyle = "#8a7e70";
      ctx.font = "italic 36px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("«Є особливі моменти, які хочеться розділити", w / 2, 290);
      ctx.fillText("з найдорожчими людьми!»", w / 2, 340);

      // Text
      ctx.fillStyle = "#554d45";
      ctx.font = "italic 32px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText("Буду щиро рада бачити Вас серед гостей", w / 2, 420);
      ctx.fillText("на святкуванні мого ювілею 🥂", w / 2, 470);
    });

    // Mount right by the roadside facing incoming ball
    board.position.copy(pos).addScaledVector(side, 3.6).addScaledVector(UP, 2.2);
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().negate().addScaledVector(side, -0.4).normalize());
    worldGroup.add(board);
  })();

  // --------------------------------------------------------------------------
  // STATION 2: 3D CALENDAR & DATE PAVILION (t ≈ 0.40)
  // --------------------------------------------------------------------------
  (function buildStation2() {
    const { pos, tan, side } = getFrameAt(0.40);
    const g = new THREE.Group();

    // Signboard for Calendar
    const board = createRoadsideBillboard(4.4, 3.2, (ctx, w, h) => {
      ctx.textAlign = "center";

      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 30px 'Cormorant Garamond', serif";
      ctx.fillText("📅  ЗБЕРЕЖІТЬ ЦЮ ДАТУ", w / 2, 80);

      ctx.fillStyle = "#2a2521";
      ctx.font = "62px 'Great Vibes', cursive";
      ctx.fillText("17 листопада 2026", w / 2, 160);

      ctx.fillStyle = "#8a7e70";
      ctx.font = "italic 32px 'Cormorant Garamond', serif";
      ctx.fillText("Початок святкування о 16:00", w / 2, 215);

      // Mini Calendar grid representation
      ctx.fillStyle = "#faf7f2";
      ctx.fillRect(80, 250, w - 160, 240);
      ctx.strokeStyle = "rgba(200, 168, 124, 0.4)";
      ctx.strokeRect(80, 250, w - 160, 240);

      ctx.fillStyle = "#9e7d52";
      ctx.font = "bold 26px 'Cormorant Garamond', serif";
      ctx.fillText("ЛИСТОПАД 2026", w / 2, 290);

      // Highlighted 17th with circle
      ctx.fillStyle = "#c8a87c";
      ctx.beginPath();
      ctx.arc(w / 2, 380, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'Playfair Display', serif";
      ctx.fillText("17", w / 2, 396);

      ctx.fillStyle = "#554d45";
      ctx.font = "italic 28px 'Cormorant Garamond', serif";
      ctx.fillText("Вівторок  •  Головний святковий день", w / 2, 460);
    });

    board.position.copy(pos).addScaledVector(side, -3.8).addScaledVector(UP, 2.2);
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().negate().addScaledVector(side, 0.4).normalize());
    g.add(board);

    // Physical Rotunda Pavilion beside board
    const rotunda = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.0, 0.3, 32),
      matCreamTrack
    );
    rotunda.position.copy(pos).addScaledVector(side, -6.5).addScaledVector(UP, 0.2);
    rotunda.castShadow = true;
    rotunda.receiveShadow = true;
    g.add(rotunda);

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 16), matPillars);
      col.position.set(rotunda.position.x + Math.cos(a) * 1.4, rotunda.position.y + 1.1, rotunda.position.z + Math.sin(a) * 1.4);
      col.castShadow = true;
      g.add(col);
    }

    worldGroup.add(g);
  })();

  // --------------------------------------------------------------------------
  // STATION 3: RESTAURANT & MENU STOP (t ≈ 0.60)
  // --------------------------------------------------------------------------
  (function buildStation3() {
    const { pos, tan, side } = getFrameAt(0.60);
    const g = new THREE.Group();

    // Menu & Location Board
    const board = createRoadsideBillboard(4.5, 3.3, (ctx, w, h) => {
      ctx.textAlign = "center";

      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 30px 'Cormorant Garamond', serif";
      ctx.fillText("📍  ЛОКАЦІЯ СВЯТА", w / 2, 80);

      ctx.fillStyle = "#2a2521";
      ctx.font = "bold 58px 'Great Vibes', cursive";
      ctx.fillText("Ресторан «Австрійський двір»", w / 2, 165);

      ctx.fillStyle = "#8a7e70";
      ctx.font = "italic 32px 'Cormorant Garamond', serif";
      ctx.fillText("селище Куликів, вул. Шевченка, 69а", w / 2, 220);

      ctx.strokeStyle = "#c8a87c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 140, 250);
      ctx.lineTo(w / 2 + 140, 250);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#2a2521";
      ctx.font = "bold 28px 'Cormorant Garamond', serif";
      ctx.fillText("СВЯТКОВИЙ СТІЛ:", 100, 305);

      ctx.font = "italic 28px 'Cormorant Garamond', serif";
      ctx.fillStyle = "#554d45";
      ctx.fillText("🥂  Welcome Drink & Вишукані закуски", 100, 350);
      ctx.fillText("🍖  Фірмові гарячі страви та австрійські делікатеси", 100, 395);
      ctx.fillText("🎂  Ювілейний торт та крафтові десерти", 100, 440);
    });

    board.position.copy(pos).addScaledVector(side, 3.8).addScaledVector(UP, 2.2);
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().negate().addScaledVector(side, -0.4).normalize());
    g.add(board);

    // 3D Physical Dining Table beside road
    const tableGroup = new THREE.Group();
    tableGroup.position.copy(pos).addScaledVector(side, 6.4).addScaledVector(UP, 0.2);

    const tableTop = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    tableTop.position.y = 1.0;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.0, 16), matGoldRails);
    tableLeg.position.y = 0.5;
    tableGroup.add(tableLeg);

    [-0.35, 0.35].forEach((gx) => {
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.02, 0.35, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, roughness: 0.1, thickness: 0.2 })
      );
      glass.position.set(gx, 1.25, 0);
      tableGroup.add(glass);
    });

    g.add(tableGroup);
    worldGroup.add(g);
  })();

  // --------------------------------------------------------------------------
  // STATION 4: PROGRAM OF THE DAY (t ≈ 0.80)
  // --------------------------------------------------------------------------
  (function buildStation4() {
    const { pos, tan, side } = getFrameAt(0.80);

    const board = createRoadsideBillboard(4.6, 3.4, (ctx, w, h) => {
      ctx.textAlign = "center";

      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 30px 'Cormorant Garamond', serif";
      ctx.fillText("🕒  ПРОГРАМА СВЯТКУВАННЯ", w / 2, 80);

      ctx.fillStyle = "#2a2521";
      ctx.font = "bold 60px 'Great Vibes', cursive";
      ctx.fillText("Розклад Дня", w / 2, 160);

      ctx.strokeStyle = "#c8a87c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 120, 195);
      ctx.lineTo(w / 2 + 120, 195);
      ctx.stroke();

      ctx.textAlign = "left";
      const schedule = [
        { time: "16:00", desc: "Зустріч гостей, welcome drink та обійми" },
        { time: "16:30", desc: "Святковий банкет, щирі вітання та тости" },
        { time: "18:00", desc: "Жива музика, танці, фотосесія та розваги" },
        { time: "21:00", desc: "Ювілейний торт і тепле душевне спілкування" }
      ];

      schedule.forEach((item, idx) => {
        const y = 260 + idx * 56;
        ctx.fillStyle = "#9e7d52";
        ctx.font = "bold 32px 'Playfair Display', serif";
        ctx.fillText(item.time, 100, y);

        ctx.fillStyle = "#554d45";
        ctx.font = "italic 30px 'Cormorant Garamond', serif";
        ctx.fillText(item.desc, 230, y);
      });
    });

    board.position.copy(pos).addScaledVector(side, -3.8).addScaledVector(UP, 2.2);
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().negate().addScaledVector(side, 0.4).normalize());
    worldGroup.add(board);
  })();

  // --------------------------------------------------------------------------
  // STATION 5: FINAL ARCH & RSVP SIGNPOST (t ≈ 0.94)
  // --------------------------------------------------------------------------
  (function buildStation5() {
    const { pos, tan, side } = getFrameAt(0.94);
    const g = new THREE.Group();

    // Golden Arrival Arch spanning right over the track
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.12, 16, 40, Math.PI),
      matGoldRails
    );
    arch.position.copy(pos).addScaledVector(UP, 0.3);
    arch.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);
    arch.castShadow = true;
    g.add(arch);

    // RSVP Card Billboard right next to track
    const board = createRoadsideBillboard(4.6, 3.4, (ctx, w, h) => {
      ctx.textAlign = "center";

      ctx.fillStyle = "#9e7d52";
      ctx.font = "italic 32px 'Cormorant Garamond', serif";
      ctx.fillText("💌  ЧЕКАЄМО НА ВАС!", w / 2, 90);

      ctx.fillStyle = "#2a2521";
      ctx.font = "bold 64px 'Great Vibes', cursive";
      ctx.fillText("З нетерпінням чекаю зустрічі!", w / 2, 180);

      ctx.fillStyle = "#554d45";
      ctx.font = "italic 34px 'Cormorant Garamond', serif";
      ctx.fillText("Приходьте розділити зі мною радість цього", w / 2, 270);
      ctx.fillText("особливого дня, гарний настрій та незабутні миті!", w / 2, 320);

      ctx.fillStyle = "#c8a87c";
      ctx.font = "46px sans-serif";
      ctx.fillText("❤️", w / 2, 400);

      ctx.fillStyle = "#9e7d52";
      ctx.font = "bold 28px 'Montserrat', sans-serif";
      ctx.fillText("17 ЛИСТОПАДА 2026", w / 2, 460);
    });

    board.position.copy(pos).addScaledVector(side, 3.6).addScaledVector(UP, 2.2);
    board.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan.clone().negate().addScaledVector(side, -0.4).normalize());
    g.add(board);

    worldGroup.add(g);
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

  // Primary driver: native page scroll maps 1:1 to progress
  function syncScrollToProgress() {
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH > 0) {
      targetProgress = Math.min(1, Math.max(0, window.scrollY / scrollH));
    }
  }
  window.addEventListener("scroll", syncScrollToProgress, { passive: true });

  // Fallback wheel driver (in case native scroll isn't enough, e.g. before body is tall enough)
  window.addEventListener("wheel", (e) => {
    if (!window.__isEnvelopeOpened) return;
    // Only use direct wheel if page scroll height is negligible
    const scrollH = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollH < 100) {
      const delta = e.deltaY * 0.00035;
      targetProgress = Math.max(0, Math.min(1, targetProgress + delta));
    }
  }, { passive: true });

  // Touch fallback for same scenario
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

  // Progress rail updates
  const trackFill = document.querySelector(".track-fill");
  const trackBallUI = document.querySelector(".track-ball");
  const stationItems = document.querySelectorAll(".track-station-item");

  function updateTrackRailUI(p) {
    if (trackFill) trackFill.style.height = `${p * 100}%`;
    if (trackBallUI) trackBallUI.style.top = `${p * 100}%`;

    const activeIndex = p < 0.12 ? 0 : p < 0.32 ? 1 : p < 0.52 ? 2 : p < 0.72 ? 3 : p < 0.90 ? 4 : 5;
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

    // Smooth physics lerp
    currentProgress += (targetProgress - currentProgress) * 0.08;
    updateTrackRailUI(currentProgress);

    // Frame on path
    const { pos, tan, side } = getFrameAt(currentProgress);

    // Position Ball directly on road
    const ballPos = pos.clone().addScaledVector(UP, BALL_RADIUS + 0.11);
    ballGroup.position.copy(ballPos);

    // Real rolling spin rotation proportional to movement
    const rollSpeed = Math.abs(targetProgress - currentProgress) * 45;
    innerSpinGroup.rotation.x += (rollSpeed + 0.3) * delta * 5;
    innerSpinGroup.rotation.z += delta * 1.5;

    // Camera follow mechanics (Tinkeroll ride style)
    if (!window.__isEnvelopeOpened) {
      // Prior to opening: wide overview facing card spawn
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
      // Active Ride: Dynamic Follow Camera right behind the marble
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

    // Sun follows the marble
    sunLight.position.copy(ballPos).add(new THREE.Vector3(12, 28, 16));
    sunLight.target.position.copy(ballPos);

    // Subtle responsive tilt
    worldGroup.rotation.z += (-pointer.x * 0.02 - worldGroup.rotation.z) * 0.05;
    worldGroup.rotation.x += (pointer.y * 0.015 - worldGroup.rotation.x) * 0.05;

    // Float orbs
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
