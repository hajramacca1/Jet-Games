import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { 
  Question, 
  GameSettings, 
  GameSessionResult, 
  AnswerRecord, 
  LevelInfo 
} from '../types/game';
import { sound } from '../services/soundEngine';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ShieldAlert, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ThreeFlightGameProps {
  questions: Question[];
  settings: GameSettings;
  levelInfo: LevelInfo;
  onGameOver: (result: GameSessionResult) => void;
  onExit: () => void;
}

const GATE_COLORS = [
  0x2563EB, // A - Royal Blue
  0x10B981, // B - Emerald Green
  0xF59E0B, // C - Amber Gold
  0x8B5CF6, // D - Purple Violet
  0xEC4899, // E - Rose Pink
  0x06B6D4, // F - Cyan
];

const GATE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const ThreeFlightGame: React.FC<ThreeFlightGameProps> = ({
  questions,
  settings,
  levelInfo,
  onGameOver,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game Progress State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [lives, setLives] = useState(settings.gameMode === 'evaluasi' ? 3 : 999);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(settings.isMuted);

  // Answer Feedback State
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    isMissed?: boolean;
    chosenId: string;
    chosenText: string;
    correctId: string;
    correctText: string;
    explanation: string;
    points: number;
  } | null>(null);

  // Exit Confirmation Modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Live Debug Info (if enabled in settings)
  const [debugInfo, setDebugInfo] = useState({
    planeX: 0,
    planeY: 0,
    gateDist: 0,
    activeLane: '-',
    fps: 60,
  });

  // Track session answers for final report
  const answersRecordRef = useRef<AnswerRecord[]>([]);
  const questionStartTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchSteerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasTriggeredCurrentQuestionRef = useRef(false);

  // Three.js References
  const threeStateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    airplaneGroup: THREE.Group;
    airplaneMesh: THREE.Group;
    propellerMesh?: THREE.Mesh;
    thrusterLight1?: THREE.PointLight;
    thrusterLight2?: THREE.PointLight;
    gatesGroup: THREE.Group;
    environmentGroup: THREE.Group;
    clouds: THREE.Mesh[];
    starfield?: THREE.Points;
    speedLines?: THREE.LineSegments;
    gateDistance: number;
    speed: number;
    targetPlaneX: number;
    targetPlaneY: number;
    currentPlaneX: number;
    currentPlaneY: number;
    rollAngle: number;
    pitchAngle: number;
    animationFrameId?: number;
    lastTime: number;
    frameCount: number;
    lastFpsUpdate: number;
  } | null>(null);

  const activeQuestion = questions[currentQuestionIndex] || questions[0];

  // Helper: Get speed based on setting
  const getFlightSpeed = useCallback(() => {
    switch (settings.flightSpeed) {
      case 'santai': return 22;
      case 'cepat': return 38;
      case 'normal':
      default: return 28;
    }
  }, [settings.flightSpeed]);

  // Texture generator for 3D Gate Text Labels
  const createGateLabelTexture = useCallback((letter: string, text: string, colorHex: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Background panel with soft rounded corner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 224, 24);
    ctx.fill();

    // Border with gate color
    ctx.lineWidth = 10;
    ctx.strokeStyle = colorHex;
    ctx.stroke();

    // Circle Badge for Letter (A, B, C, D)
    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.arc(80, 128, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 54px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 80, 128);

    // Answer text
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 36px "Plus Jakarta Sans", "Amiri", sans-serif';
    
    // Truncate or wrap if too long
    const cleanText = text.length > 34 ? text.substring(0, 31) + '...' : text;
    ctx.fillText(cleanText, 150, 128, 310);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  // --- BUILD AIRCRAFT 3D MODEL ---
  const buildAircraftModel = useCallback((): THREE.Group => {
    const plane = new THREE.Group();

    // Materials
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8, // Vibrant Sky Blue
      metalness: 0.35,
      roughness: 0.25,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B, // Aerobatic Golden Amber
      metalness: 0.4,
      roughness: 0.3,
    });

    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1E293B,
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      roughness: 0.5,
    });

    const glowThrusterMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
    });

    // 1. Fuselage (Body)
    const bodyGeo = new THREE.ConeGeometry(1.0, 6.2, 16);
    bodyGeo.rotateX(Math.PI / 2);
    const fuselage = new THREE.Mesh(bodyGeo, fuselageMat);
    fuselage.position.set(0, 0, 0.4);
    plane.add(fuselage);

    // 2. Cockpit Bubble
    const canopyGeo = new THREE.SphereGeometry(0.7, 16, 12);
    canopyGeo.scale(0.7, 0.7, 1.8);
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.45, 0.6);
    plane.add(canopy);

    // 3. Main Swept Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(4.8, -1.4);
    wingShape.lineTo(4.4, -2.4);
    wingShape.lineTo(0, -1.6);
    wingShape.lineTo(-0, 0);

    const extrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const rightWingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    rightWingGeo.rotateX(Math.PI / 2);
    const rightWing = new THREE.Mesh(rightWingGeo, fuselageMat);
    rightWing.position.set(0.4, 0.05, 0.8);
    plane.add(rightWing);

    // Left Wing (Mirror)
    const leftWingGeo = rightWingGeo.clone();
    leftWingGeo.scale(-1, 1, 1);
    const leftWing = new THREE.Mesh(leftWingGeo, fuselageMat);
    leftWing.position.set(-0.4, 0.05, 0.8);
    plane.add(leftWing);

    // Winglet tips (Amber Accents)
    const wingletGeo = new THREE.BoxGeometry(0.12, 0.6, 0.8);
    const rightWinglet = new THREE.Mesh(wingletGeo, accentMat);
    rightWinglet.position.set(5.1, 0.25, -0.9);
    plane.add(rightWinglet);

    const leftWinglet = new THREE.Mesh(wingletGeo, accentMat);
    leftWinglet.position.set(-5.1, 0.25, -0.9);
    plane.add(leftWinglet);

    // 4. Twin Turbofan Jet Engines
    const engineGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.8, 14);
    engineGeo.rotateX(Math.PI / 2);
    const rightEngine = new THREE.Mesh(engineGeo, darkTrimMat);
    rightEngine.position.set(1.4, -0.3, -0.2);
    plane.add(rightEngine);

    const leftEngine = new THREE.Mesh(engineGeo, darkTrimMat);
    leftEngine.position.set(-1.4, -0.3, -0.2);
    plane.add(leftEngine);

    // Glowing Thruster Exhaust Rings
    const thrusterGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12);
    thrusterGeo.rotateX(Math.PI / 2);
    const rightThruster = new THREE.Mesh(thrusterGeo, glowThrusterMat);
    rightThruster.position.set(1.4, -0.3, -1.15);
    plane.add(rightThruster);

    const leftThruster = new THREE.Mesh(thrusterGeo, glowThrusterMat);
    leftThruster.position.set(-1.4, -0.3, -1.15);
    plane.add(leftThruster);

    // 5. Tail Fin (Vertical Stabilizer)
    const tailFinShape = new THREE.Shape();
    tailFinShape.moveTo(0, 0);
    tailFinShape.lineTo(0, 1.8);
    tailFinShape.lineTo(1.2, 0.3);
    tailFinShape.lineTo(0.9, 0);
    tailFinShape.lineTo(0, 0);

    const tailFinGeo = new THREE.ExtrudeGeometry(tailFinShape, { depth: 0.12, bevelEnabled: false });
    tailFinGeo.rotateY(Math.PI / 2);
    const tailFin = new THREE.Mesh(tailFinGeo, accentMat);
    tailFin.position.set(0, 0.2, -2.6);
    plane.add(tailFin);

    // 6. Horizontal Elevators
    const elevatorGeo = new THREE.BoxGeometry(2.6, 0.08, 0.8);
    const elevator = new THREE.Mesh(elevatorGeo, darkTrimMat);
    elevator.position.set(0, 0.25, -2.4);
    plane.add(elevator);

    // 7. Rotating Propeller / Turbine Cone at the front nose
    const spinnerGeo = new THREE.ConeGeometry(0.3, 0.6, 12);
    spinnerGeo.rotateX(Math.PI / 2);
    const spinner = new THREE.Mesh(spinnerGeo, accentMat);
    spinner.position.set(0, 0, 3.4);
    plane.add(spinner);

    plane.scale.set(1.2, 1.2, 1.2);
    return plane;
  }, []);

  // --- SPAWN 3D ANSWER GATES ---
  const spawnGatesForQuestion = useCallback((question: Question) => {
    if (!threeStateRef.current) return;
    const { gatesGroup } = threeStateRef.current;

    // Clear existing gates
    while (gatesGroup.children.length > 0) {
      const child = gatesGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      gatesGroup.remove(child);
    }

    const optionsCount = question.options.length;
    // Spacing between gate lanes
    const laneSpacing = Math.min(18, 54 / Math.max(optionsCount - 1, 1));
    const startX = -((optionsCount - 1) / 2) * laneSpacing;

    question.options.forEach((opt, index) => {
      const gateLaneX = startX + index * laneSpacing;
      const colorHexNumber = GATE_COLORS[index % GATE_COLORS.length];
      const colorCssString = '#' + colorHexNumber.toString(16).padStart(6, '0');

      const singleGateGroup = new THREE.Group();
      singleGateGroup.name = `gate_${opt.id}`;
      singleGateGroup.userData = {
        optionId: opt.id,
        optionText: opt.text,
        laneX: gateLaneX,
        index,
      };

      // 1. Outer Hexagonal / Arch Sci-Fi Portal Ring
      const ringOuterRadius = 4.8;
      const ringInnerRadius = 4.2;
      const ringGeo = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 6);
      const ringMat = new THREE.MeshStandardMaterial({
        color: colorHexNumber,
        emissive: colorHexNumber,
        emissiveIntensity: 0.7,
        side: THREE.DoubleSide,
        metalness: 0.8,
        roughness: 0.2,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      singleGateGroup.add(ringMesh);

      // 2. Thick Outer Rim (Torus / Bevel)
      const torusGeo = new THREE.TorusGeometry(ringOuterRadius, 0.35, 8, 24);
      const torusMat = new THREE.MeshStandardMaterial({
        color: 0x1E293B,
        metalness: 0.9,
        roughness: 0.2,
      });
      const torusMesh = new THREE.Mesh(torusGeo, torusMat);
      singleGateGroup.add(torusMesh);

      // 3. Glowing Translucent Energy Portal Curtain
      const energyGeo = new THREE.CircleGeometry(ringInnerRadius - 0.2, 16);
      const energyMat = new THREE.MeshBasicMaterial({
        color: colorHexNumber,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const energyMesh = new THREE.Mesh(energyGeo, energyMat);
      singleGateGroup.add(energyMesh);

      // 4. Large 3D Billboard Label on Top
      const texture = createGateLabelTexture(GATE_LETTERS[index] || opt.id, opt.text, colorCssString);
      const billboardGeo = new THREE.PlaneGeometry(8.5, 4.2);
      const billboardMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const billboard = new THREE.Mesh(billboardGeo, billboardMat);
      billboard.position.set(0, ringOuterRadius + 2.5, 0);
      singleGateGroup.add(billboard);

      // 5. Vertical Light Beacon Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.2, 10, 8);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.3,
      });
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-ringOuterRadius - 0.4, -ringOuterRadius / 2, 0);
      singleGateGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(ringOuterRadius + 0.4, -ringOuterRadius / 2, 0);
      singleGateGroup.add(rightPillar);

      // Position the gate along X lane
      singleGateGroup.position.set(gateLaneX, 0, 0);
      gatesGroup.add(singleGateGroup);
    });

    // Reset distance of gates
    threeStateRef.current.gateDistance = -160;
    hasTriggeredCurrentQuestionRef.current = false;
    questionStartTimeRef.current = Date.now();
  }, [createGateLabelTexture]);

  // --- INITIALIZE THREE.JS SCENE ---
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene & Atmosphere based on Level
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(levelInfo.skyColor);
    scene.fog = new THREE.FogExp2(levelInfo.fogColor, 0.007);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.5, 600);
    camera.position.set(0, 5.0, 16.0); // Third-person chase cam position

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.2);
    dirLight.position.set(30, 60, 40);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38BDF8, 0.6);
    rimLight.position.set(-30, 20, -50);
    scene.add(rimLight);

    // 5. Groups
    const environmentGroup = new THREE.Group();
    scene.add(environmentGroup);

    const gatesGroup = new THREE.Group();
    scene.add(gatesGroup);

    const airplaneGroup = new THREE.Group();
    scene.add(airplaneGroup);

    // Build Aircraft
    const airplaneMesh = buildAircraftModel();
    airplaneGroup.add(airplaneMesh);
    airplaneGroup.position.set(0, 0, 0);

    // Thruster Point Lights
    const thrusterLight1 = new THREE.PointLight(0x38BDF8, 2, 8);
    thrusterLight1.position.set(1.4, -0.3, -1.8);
    airplaneMesh.add(thrusterLight1);

    const thrusterLight2 = new THREE.PointLight(0x38BDF8, 2, 8);
    thrusterLight2.position.set(-1.4, -0.3, -1.8);
    airplaneMesh.add(thrusterLight2);

    // 6. Environment Objects (Clouds, Terrain, Islands, Stars)
    const clouds: THREE.Mesh[] = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
    });

    for (let i = 0; i < 28; i++) {
      const cloudGeo = new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(3, 7), 1);
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.set(
        THREE.MathUtils.randFloatSpread(180),
        THREE.MathUtils.randFloat(-15, -4),
        THREE.MathUtils.randFloat(-300, 50)
      );
      cloud.scale.set(THREE.MathUtils.randFloat(1, 2.5), THREE.MathUtils.randFloat(0.5, 1.2), THREE.MathUtils.randFloat(1, 2));
      environmentGroup.add(cloud);
      clouds.push(cloud);
    }

    // Ground Ocean / Terrain Mesh
    const groundGeo = new THREE.PlaneGeometry(600, 600, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundColor = levelInfo.theme === 'kosmik_antariksa' 
      ? 0x050816 
      : levelInfo.theme === 'malam_aurora'
      ? 0x0a192f
      : levelInfo.theme === 'lembah_senja'
      ? 0x7c2d12
      : 0x0284C7; // Azure sea

    const groundMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.4,
      metalness: 0.3,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -22, -100);
    environmentGroup.add(ground);

    // Stars for Space / Night theme
    let starfield: THREE.Points | undefined;
    if (levelInfo.theme === 'kosmik_antariksa' || levelInfo.theme === 'malam_aurora') {
      const starCount = 1200;
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = THREE.MathUtils.randFloatSpread(400);
        starPositions[i + 1] = THREE.MathUtils.randFloat(5, 150);
        starPositions[i + 2] = THREE.MathUtils.randFloatSpread(400);
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1.2,
        transparent: true,
        opacity: 0.8,
      });
      starfield = new THREE.Points(starGeo, starMat);
      environmentGroup.add(starfield);
    }

    // Speed Lines Effect
    const speedLineCount = 60;
    const speedLineGeo = new THREE.BufferGeometry();
    const speedLinePositions = new Float32Array(speedLineCount * 6);
    for (let i = 0; i < speedLineCount; i++) {
      const x = THREE.MathUtils.randFloatSpread(70);
      const y = THREE.MathUtils.randFloatSpread(35);
      const z = THREE.MathUtils.randFloat(-150, 20);
      const len = THREE.MathUtils.randFloat(4, 12);
      speedLinePositions[i * 6] = x;
      speedLinePositions[i * 6 + 1] = y;
      speedLinePositions[i * 6 + 2] = z;
      speedLinePositions[i * 6 + 3] = x;
      speedLinePositions[i * 6 + 4] = y;
      speedLinePositions[i * 6 + 5] = z + len;
    }
    speedLineGeo.setAttribute('position', new THREE.BufferAttribute(speedLinePositions, 3));
    const speedLineMat = new THREE.LineBasicMaterial({
      color: 0x93C5FD,
      transparent: true,
      opacity: 0.35,
    });
    const speedLines = new THREE.LineSegments(speedLineGeo, speedLineMat);
    scene.add(speedLines);

    // Save state
    threeStateRef.current = {
      scene,
      camera,
      renderer,
      airplaneGroup,
      airplaneMesh,
      thrusterLight1,
      thrusterLight2,
      gatesGroup,
      environmentGroup,
      clouds,
      starfield,
      speedLines,
      gateDistance: -160,
      speed: getFlightSpeed(),
      targetPlaneX: 0,
      targetPlaneY: 0,
      currentPlaneX: 0,
      currentPlaneY: 0,
      rollAngle: 0,
      pitchAngle: 0,
      lastTime: performance.now(),
      frameCount: 0,
      lastFpsUpdate: performance.now(),
    };

    // Spawn first question gates
    spawnGatesForQuestion(activeQuestion);

    // Start Audio
    sound.startEngine();
    sound.startBGM();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !threeStateRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeStateRef.current.camera.aspect = w / h;
      threeStateRef.current.camera.updateProjectionMatrix();
      threeStateRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeStateRef.current?.animationFrameId) {
        cancelAnimationFrame(threeStateRef.current.animationFrameId);
      }
      sound.stopEngine();
      sound.stopBGM();
      renderer.dispose();
      threeStateRef.current = null;
    };
  }, [levelInfo, buildAircraftModel, spawnGatesForQuestion, getFlightSpeed]);

  // --- KEYBOARD CONTROLS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Space = Pause / Resume
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }

      // Escape = Exit modal
      if (e.code === 'Escape') {
        e.preventDefault();
        setShowExitConfirm(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- ANSWER TRAVERSAL / COLLISION LOGIC ---
  const handleGateCollision = useCallback((chosenOptionId: string, isMissed = false) => {
    if (hasTriggeredCurrentQuestionRef.current) return;
    hasTriggeredCurrentQuestionRef.current = true;

    const timeSpent = Math.max(1, (Date.now() - questionStartTimeRef.current) / 1000);
    const chosenOption = isMissed
      ? { id: 'MELESET', text: 'Pesawat Meleset (Moncong Jet Tidak Melewati Gerbang)' }
      : (activeQuestion.options.find((o) => o.id === chosenOptionId) || activeQuestion.options[0]);

    const isCorrect = !isMissed && chosenOptionId === activeQuestion.correctAnswerId;
    const correctOption = activeQuestion.options.find((o) => o.id === activeQuestion.correctAnswerId) || activeQuestion.options[0];

    // Sound
    sound.playGatePass();
    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    // Confetti particles for correct answer
    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10B981', '#38BDF8', '#F59E0B'],
      });
    }

    // Scoring & Multiplier
    const streakBonus = isCorrect ? streak * 25 : 0;
    const timeBonus = isCorrect && timeSpent < 10 ? Math.round((10 - timeSpent) * 10) : 0;
    const earnedPoints = isCorrect ? activeQuestion.points + streakBonus + timeBonus : 0;

    const newScore = score + earnedPoints;
    const newStreak = isCorrect ? streak + 1 : 0;

    setScore(newScore);
    setStreak(newStreak);
    if (newStreak > maxStreak) setMaxStreak(newStreak);

    if (!isCorrect && settings.gameMode === 'evaluasi') {
      setLives((prev) => Math.max(0, prev - 1));
    }

    // Record answer
    const record: AnswerRecord = {
      questionId: activeQuestion.id,
      question: activeQuestion.question,
      chosenOptionId: chosenOption.id,
      chosenOptionText: chosenOption.text,
      correctOptionId: correctOption.id,
      correctOptionText: correctOption.text,
      isCorrect,
      timeSpentSeconds: Math.round(timeSpent),
      explanation: isMissed 
        ? `Pesawat meleset karena moncong jet tidak melewati lingkaran gerbang manapun. Jawaban yang benar adalah ${correctOption.id}. ${correctOption.text}. ${activeQuestion.explanation}`
        : activeQuestion.explanation,
      subject: activeQuestion.subject,
      topic: activeQuestion.topic,
      pointsEarned: earnedPoints,
    };
    answersRecordRef.current.push(record);

    // Show Feedback Dialog
    setFeedback({
      show: true,
      isCorrect,
      isMissed,
      chosenId: chosenOption.id,
      chosenText: chosenOption.text,
      correctId: correctOption.id,
      correctText: correctOption.text,
      explanation: record.explanation,
      points: earnedPoints,
    });

    // In Evaluation mode, auto-advance after brief notification
    if (settings.gameMode === 'evaluasi') {
      setTimeout(() => {
        advanceToNextQuestion();
      }, 1400);
    }
  }, [activeQuestion, streak, maxStreak, score, settings.gameMode]);

  // Advance Question or Finish
  const advanceToNextQuestion = useCallback(() => {
    setFeedback(null);
    const nextIdx = currentQuestionIndex + 1;

    // Check game over condition
    const isOutOfLives = settings.gameMode === 'evaluasi' && lives <= 0;
    const isCompleted = nextIdx >= questions.length || isOutOfLives;

    if (isCompleted) {
      sound.playLevelClear();
      const totalDuration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      const correctCount = answersRecordRef.current.filter((a) => a.isCorrect).length;
      const wrongCount = answersRecordRef.current.length - correctCount;
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
      const accuracy = answersRecordRef.current.length > 0 
        ? Math.round((correctCount / answersRecordRef.current.length) * 100) 
        : 0;

      const sessionResult: GameSessionResult = {
        playerName: settings.playerName || 'Siswa Penerbang',
        playerClass: settings.playerClass || 'Kelas Siswa',
        subject: settings.selectedSubject,
        levelNumber: levelInfo.levelNumber,
        score,
        maxScore,
        totalQuestions: questions.length,
        correctCount,
        wrongCount,
        accuracy,
        totalDurationSeconds: totalDuration,
        date: new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }),
        gameMode: settings.gameMode,
        answers: answersRecordRef.current,
      };

      onGameOver(sessionResult);
      return;
    }

    setCurrentQuestionIndex(nextIdx);
    const nextQuestion = questions[nextIdx];
    spawnGatesForQuestion(nextQuestion);
  }, [currentQuestionIndex, questions, lives, settings, score, levelInfo, onGameOver, spawnGatesForQuestion]);

  // --- MAIN ANIMATION & PHYSICS LOOP ---
  useEffect(() => {
    if (!threeStateRef.current) return;

    let animId: number;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      if (!threeStateRef.current) return;

      const state = threeStateRef.current;
      const delta = Math.min((time - state.lastTime) / 1000, 0.1);
      state.lastTime = time;

      // Update FPS in debug
      state.frameCount++;
      if (time - state.lastFpsUpdate > 500) {
        const fps = Math.round((state.frameCount * 1000) / (time - state.lastFpsUpdate));
        state.frameCount = 0;
        state.lastFpsUpdate = time;
        if (settings.showDebug) {
          setDebugInfo((prev) => ({
            ...prev,
            fps,
            planeX: Math.round(state.currentPlaneX * 10) / 10,
            planeY: Math.round(state.currentPlaneY * 10) / 10,
            gateDist: Math.round(state.gateDistance),
          }));
        }
      }

      // If paused or feedback dialog is showing in practice mode, pause motion
      if (isPaused || (feedback?.show && settings.gameMode === 'latihan')) {
        state.renderer.render(state.scene, state.camera);
        return;
      }

      // 1. Process Steering Inputs
      const keys = keysRef.current;
      const touch = touchSteerRef.current;

      let steerX = 0;
      let steerY = 0;

      // Keyboard Left/Right (ArrowLeft, ArrowRight, KeyA, KeyD)
      if (keys['ArrowLeft'] || keys['KeyA']) steerX -= 1;
      if (keys['ArrowRight'] || keys['KeyD']) steerX += 1;

      // Keyboard Up/Down (ArrowUp, ArrowDown, KeyW, KeyS)
      if (keys['ArrowUp'] || keys['KeyW']) steerY += 1;
      if (keys['ArrowDown'] || keys['KeyS']) steerY -= 1;

      // Touch / IFP on-screen D-Pad input override
      if (touch.x !== 0) steerX = touch.x;
      if (touch.y !== 0) steerY = touch.y;

      // Calculate max horizontal boundary based on gates span
      const optionsCount = activeQuestion.options.length;
      const laneSpacing = Math.min(18, 54 / Math.max(optionsCount - 1, 1));
      const maxX = ((optionsCount - 1) / 2) * laneSpacing + 8;

      // Adjust Target Position
      const moveSpeed = 34 * delta;
      state.targetPlaneX = Math.max(-maxX, Math.min(maxX, state.targetPlaneX + steerX * moveSpeed));
      state.targetPlaneY = Math.max(-7, Math.min(10, state.targetPlaneY + steerY * (moveSpeed * 0.7)));

      // Smooth Interpolation (Lerp) to target
      state.currentPlaneX += (state.targetPlaneX - state.currentPlaneX) * Math.min(1, 12 * delta);
      state.currentPlaneY += (state.targetPlaneY - state.currentPlaneY) * Math.min(1, 12 * delta);

      // Banking Roll & Pitch
      const targetRoll = -steerX * 0.45;
      const targetPitch = steerY * 0.28;
      state.rollAngle += (targetRoll - state.rollAngle) * Math.min(1, 10 * delta);
      state.pitchAngle += (targetPitch - state.pitchAngle) * Math.min(1, 8 * delta);

      // Apply to Airplane Group
      state.airplaneGroup.position.x = state.currentPlaneX;
      state.airplaneGroup.position.y = state.currentPlaneY;
      state.airplaneMesh.rotation.z = state.rollAngle;
      state.airplaneMesh.rotation.x = state.pitchAngle;

      // Modulate Engine Sound
      sound.updateEnginePitch(state.speed / 28, steerY);

      // Camera Follow with Smooth Damping
      state.camera.position.x += (state.currentPlaneX * 0.7 - state.camera.position.x) * Math.min(1, 6 * delta);
      state.camera.position.y += (state.currentPlaneY * 0.6 + 5.0 - state.camera.position.y) * Math.min(1, 6 * delta);
      state.camera.lookAt(state.currentPlaneX * 0.3, state.currentPlaneY * 0.3 + 1.5, -30);

      // 2. Advance Gates toward player
      state.gateDistance += state.speed * delta;
      state.gatesGroup.position.z = state.gateDistance;

      // 3. Environment Motion (Clouds & Speedlines)
      state.clouds.forEach((cloud) => {
        cloud.position.z += state.speed * delta * 0.8;
        if (cloud.position.z > 30) {
          cloud.position.z = -300;
          cloud.position.x = THREE.MathUtils.randFloatSpread(180);
        }
      });

      if (state.speedLines) {
        const positions = state.speedLines.geometry.attributes.position.array as Float32Array;
        for (let i = 2; i < positions.length; i += 6) {
          positions[i] += state.speed * delta * 1.6;
          positions[i + 3] += state.speed * delta * 1.6;
          if (positions[i] > 20) {
            const newZ = THREE.MathUtils.randFloat(-160, -90);
            positions[i] = newZ;
            positions[i + 3] = newZ + 8;
          }
        }
        state.speedLines.geometry.attributes.position.needsUpdate = true;
      }

      // 4. Collision Detection with Gates (Jet Nose Traversal Rule)
      // Gates plane is at local Z = 0 inside gatesGroup, so its world Z is state.gateDistance.
      // Jet nose is at (currentPlaneX, currentPlaneY, Z = 0).
      // Each gate opening has center (laneX, 0) and inner radius 4.3.
      if (state.gateDistance >= -1.2 && state.gateDistance <= 4.0 && !hasTriggeredCurrentQuestionRef.current) {
        let enteredGate: THREE.Object3D | null = null;
        const GATE_APERTURE_RADIUS = 4.3; // Inner opening radius of gate ring

        state.gatesGroup.children.forEach((child) => {
          const laneX = (child.userData as { laneX: number }).laneX;
          const dx = state.currentPlaneX - laneX;
          const dy = state.currentPlaneY - 0;
          const distFromGateCenter = Math.sqrt(dx * dx + dy * dy);

          // The moncong jet must pass inside the gate ring opening
          if (distFromGateCenter <= GATE_APERTURE_RADIUS) {
            enteredGate = child;
          }
        });

        if (enteredGate) {
          const chosenOptId = (enteredGate as THREE.Object3D).userData.optionId;
          handleGateCollision(chosenOptId, false);
        } else if (state.gateDistance >= 2.0) {
          // Moncong jet tidak melewati lingkaran gerbang manapun -> Jawaban Salah (Meleset)!
          handleGateCollision('MELESET', true);
        }
      }

      // Render
      state.renderer.render(state.scene, state.camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    isPaused, 
    feedback, 
    settings.gameMode, 
    settings.showDebug, 
    activeQuestion.options.length, 
    handleGateCollision
  ]);

  // IFP Direct Gate Touch: Tap on a gate lane to guide plane directly toward it
  const handleDirectLaneTouch = (laneIndex: number) => {
    if (!threeStateRef.current) return;
    const optionsCount = activeQuestion.options.length;
    const laneSpacing = Math.min(18, 54 / Math.max(optionsCount - 1, 1));
    const startX = -((optionsCount - 1) / 2) * laneSpacing;
    const targetX = startX + laneIndex * laneSpacing;

    threeStateRef.current.targetPlaneX = targetX;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Mute toggle
  const toggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen overflow-hidden bg-slate-950 select-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* TOP HUD: QUESTION & STATS BAR */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 md:p-5 pointer-events-none">
        <div className="max-w-5xl mx-auto flex flex-col gap-2.5">
          {/* Top Status Strip */}
          <div className="flex items-center justify-between text-xs md:text-sm text-white/90">
            <div className="flex items-center gap-3">
              <span className="font-semibold px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
                Level {levelInfo.levelNumber}: {levelInfo.title}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-sky-300">
                Soal {currentQuestionIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Score & Streak */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="tabular-nums">{score} Poin</span>
              </div>

              {streak >= 2 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Combo x{streak}</span>
                </div>
              )}

              {/* Lives in Exam Mode */}
              {settings.gameMode === 'evaluasi' && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 backdrop-blur-md border border-rose-400/30 text-rose-300 font-bold">
                  <span>Nyawa:</span>
                  <span className="text-white">{'❤️'.repeat(lives)}</span>
                </div>
              )}

              {/* Functional Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white transition-colors"
                  title={isPaused ? 'Lanjutkan' : 'Jeda'}
                  aria-label="Pause"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white transition-colors"
                  title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
                  aria-label="Sound"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white transition-colors"
                  title="Layar Penuh (IFP)"
                  aria-label="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 backdrop-blur-md border border-rose-500/30 text-rose-200 transition-colors"
                  title="Keluar"
                  aria-label="Exit"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* QUESTION CARD (High contrast for IFP and Classroom Display) */}
          <div className="p-4 md:p-5 rounded-2xl bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>{activeQuestion.topic} · {activeQuestion.classLevel}</span>
              <span className="text-amber-400 font-semibold">Tembus Gerbang Jawaban Benar!</span>
            </div>
            
            <p className={`text-base md:text-xl lg:text-2xl font-bold text-white tracking-wide ${
              activeQuestion.isArabic ? 'font-arabic text-xl md:text-3xl text-right py-1 leading-loose' : ''
            }`}>
              {activeQuestion.question}
            </p>
          </div>

          {/* ACTIVE OPTIONS OVERLAY BANNER (Quick reference for distance viewing) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pointer-events-auto">
            {activeQuestion.options.map((opt, idx) => {
              const colorClass = [
                'border-blue-500/50 hover:border-blue-400 bg-blue-950/40 text-blue-200',
                'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/40 text-emerald-200',
                'border-amber-500/50 hover:border-amber-400 bg-amber-950/40 text-amber-200',
                'border-purple-500/50 hover:border-purple-400 bg-purple-950/40 text-purple-200',
                'border-pink-500/50 hover:border-pink-400 bg-pink-950/40 text-pink-200',
                'border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/40 text-cyan-200',
              ][idx % 6];

              return (
                <button
                  key={opt.id}
                  onClick={() => handleDirectLaneTouch(idx)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-md transition-transform active:scale-95 text-left ${colorClass}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">
                    {GATE_LETTERS[idx] || opt.id}
                  </span>
                  <span className={`text-xs md:text-sm font-semibold truncate ${opt.isArabic ? 'font-arabic text-base' : ''}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* IFP & TOUCH ON-SCREEN STEERING CONTROLS */}
      <footer className="absolute bottom-4 left-0 right-0 z-20 px-4 md:px-8 pointer-events-none flex justify-between items-end">
        {/* Left Side: Horizontal Steering Touch Buttons */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
          <button
            onPointerDown={() => { touchSteerRef.current.x = -1; }}
            onPointerUp={() => { touchSteerRef.current.x = 0; }}
            onPointerLeave={() => { touchSteerRef.current.x = 0; }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 flex items-center justify-center text-white font-bold transition-transform active:scale-90"
            aria-label="Steer Left"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          
          <button
            onClick={() => {
              if (threeStateRef.current) threeStateRef.current.targetPlaneX = 0;
            }}
            className="px-3 py-3 h-14 md:h-16 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex flex-col items-center justify-center"
          >
            <span>TENGAH</span>
          </button>

          <button
            onPointerDown={() => { touchSteerRef.current.x = 1; }}
            onPointerUp={() => { touchSteerRef.current.x = 0; }}
            onPointerLeave={() => { touchSteerRef.current.x = 0; }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 flex items-center justify-center text-white font-bold transition-transform active:scale-90"
            aria-label="Steer Right"
          >
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        {/* Center: Device Help Reminder */}
        <div className="hidden lg:block text-center text-xs text-white/60 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          Gunakan tombol Panah / WASD / Sentuh layar untuk mengarahkan pesawat ke gerbang jawaban
        </div>

        {/* Right Side: Altitude Vertical Steering (Up/Down) */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg">
          <button
            onPointerDown={() => { touchSteerRef.current.y = 1; }}
            onPointerUp={() => { touchSteerRef.current.y = 0; }}
            onPointerLeave={() => { touchSteerRef.current.y = 0; }}
            className="w-14 h-12 md:w-16 md:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 flex items-center justify-center text-white font-bold transition-transform active:scale-90"
            aria-label="Climb Up"
          >
            <ArrowUp className="w-6 h-6" />
          </button>

          <button
            onPointerDown={() => { touchSteerRef.current.y = -1; }}
            onPointerUp={() => { touchSteerRef.current.y = 0; }}
            onPointerLeave={() => { touchSteerRef.current.y = 0; }}
            className="w-14 h-12 md:w-16 md:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600 flex items-center justify-center text-white font-bold transition-transform active:scale-90"
            aria-label="Dive Down"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </footer>

      {/* ANSWER FEEDBACK DIALOG (Practice Mode or Instant feedback) */}
      {feedback && feedback.show && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl text-white animate-in zoom-in-95 duration-200 ${
            feedback.isCorrect 
              ? 'bg-slate-900/95 border-emerald-500/50' 
              : 'bg-slate-900/95 border-rose-500/50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {feedback.isCorrect ? (
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <XCircle className="w-7 h-7" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">
                  {feedback.isMissed 
                    ? 'Pesawat Meleset dari Gerbang!' 
                    : feedback.isCorrect 
                    ? 'Hebat! Jawaban Tepat' 
                    : 'Kurang Tepat'}
                </h3>
                <p className="text-sm text-slate-400">
                  {feedback.isMissed
                    ? 'Moncong jet harus menembus lubang gerbang untuk memilih jawaban.'
                    : feedback.isCorrect 
                    ? `+${feedback.points} Poin berhasil diraih!` 
                    : 'Pelajari pembahasannya di bawah ini'}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex justify-between items-center">
                <span className="text-slate-400">Pilihan Anda:</span>
                <span className={`font-semibold ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {feedback.chosenId}. {feedback.chosenText}
                </span>
              </div>

              {!feedback.isCorrect && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/40 flex justify-between items-center">
                  <span className="text-emerald-300">Kunci Jawaban:</span>
                  <span className="font-semibold text-emerald-200">
                    {feedback.correctId}. {feedback.correctText}
                  </span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <p className="text-xs text-sky-400 font-semibold mb-1">Pembahasan Edukatif:</p>
                <p className="text-slate-200 leading-relaxed text-xs md:text-sm">
                  {feedback.explanation}
                </p>
              </div>
            </div>

            <button
              onClick={advanceToNextQuestion}
              className="w-full py-3.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 font-bold text-white flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <span>Lanjutkan Penerbangan</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MENU MODAL */}
      {isPaused && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl text-center">
            <h3 className="text-2xl font-bold mb-2">Permainan Dijeda</h3>
            <p className="text-sm text-slate-400 mb-6">
              Pesawat sedang berputar di orbit aman. Tekan lanjutkan untuk terbang kembali.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>Lanjutkan Permainan</span>
              </button>

              <button
                onClick={() => {
                  setIsPaused(false);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setStreak(0);
                  spawnGatesForQuestion(questions[0]);
                }}
                className="w-full py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Ulangi dari Soal Pertama</span>
              </button>

              <button
                onClick={() => setShowExitConfirm(true)}
                className="w-full py-3 px-5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h4 className="text-xl font-bold mb-2">Keluar dari Penerbangan?</h4>
            <p className="text-sm text-slate-400 mb-6">
              Progres penerbangan saat ini akan tersimpan dalam riwayat sesi. Anda yakin ingin kembali ke menu utama?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200"
              >
                Batal
              </button>
              <button
                onClick={onExit}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEBUG HUD (If enabled in settings) */}
      {settings.showDebug && (
        <div className="absolute bottom-20 left-4 z-20 p-2.5 rounded-lg bg-black/80 border border-emerald-500/40 text-emerald-400 font-mono text-xs pointer-events-none space-y-0.5">
          <p>FPS: {debugInfo.fps}</p>
          <p>Plane X: {debugInfo.planeX} | Y: {debugInfo.planeY}</p>
          <p>Gate Dist: {debugInfo.gateDist}</p>
          <p>Speed: {settings.flightSpeed}</p>
        </div>
      )}
    </div>
  );
};
