class AudioController {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.engineOsc = null;
        this.engineGain = null;
        this.initialized = false;
    }
    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.initialized = true;
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 50;
        this.engineGain.gain.value = 0;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        return this.enabled;
    }
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    playNoise(duration, vol = 0.5) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
    playClick() { this.playTone(800, 'sine', 0.1, 0.1); }
    playHover() { this.playTone(400, 'triangle', 0.05, 0.05); }
    playStart() {
        if (!this.enabled || !this.ctx) return;
        this.playTone(200, 'sawtooth', 0.5, 0.2);
        setTimeout(() => this.playTone(400, 'sawtooth', 0.5, 0.2), 200);
        setTimeout(() => this.playTone(600, 'sawtooth', 1.0, 0.2), 400);
    }
    playBonus(type) {
        if (!this.enabled) return;
        if (type.startsWith('fuel')) {
            this.playTone(880, 'sine', 0.2, 0.1);
            setTimeout(() => this.playTone(1100, 'sine', 0.2, 0.1), 100);
        } else if (type === 'life') {
             this.playTone(500, 'sine', 0.1, 0.2);
             setTimeout(() => this.playTone(800, 'sine', 0.2, 0.2), 100);
        } else {
            this.playTone(1200, 'square', 0.3, 0.05);
            setTimeout(() => this.playTone(1800, 'square', 0.4, 0.05), 100);
        }
    }
    playCrash() {
        if (!this.enabled) return;
        this.playNoise(0.5, 0.5);
        this.playTone(100, 'sawtooth', 0.5, 0.4);
    }
    updateEngine(speed, maxSpeed) {
        if (!this.enabled || !this.ctx || !this.engineOsc) return;
        const minFreq = 60;
        const maxFreq = 200;
        const ratio = Math.min(1, speed / maxSpeed);
        const targetFreq = minFreq + (maxFreq - minFreq) * ratio;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        const targetVol = (speed > 10) ? 0.08 : 0.03;
        this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }
    stopEngine() { if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }
}

const audio = new AudioController();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

const translations = {
    ru: { distance: "Дистанция", fuel: "⛽ Топливо", record: "🏆 Рекорд", subtitle: "Бесконечная гонка", bestResult: "🏆 Лучший результат", start: "▶ СТАРТ", modeTouch: "📱 Управление: Тач", modeWheel: "🕹️ Управление: Руль", sound: "🔊 Звук", noSound: "🔇 Звук", screen: "⛶ Экран", controlsTitle: "Управление", gas: "Газ", brake: "Тормоз", turn: "Повороты", handbrake: "Ручник", pause: "Пауза", pauseTitle: "ПАУЗА", resume: "▶ ПРОДОЛЖИТЬ", restart: "↺ РЕСТАРТ", menu: "☰ МЕНЮ", gameOver: "ИГРА ОКОНЧЕНА", newRecord: "🏆 НОВЫЙ РЕКОРД! 🏆", maxSpeed: "Макс. скорость", collectedFuel: "Собрано топлива", again: "↺ ЕЩЁ РАЗ" },
    en: { distance: "Distance", fuel: "⛽ Fuel", record: "🏆 Record", subtitle: "Endless Racer", bestResult: "🏆 Best Result", start: "▶ START", modeTouch: "📱 Control: Touch", modeWheel: "🕹️ Control: Wheel", sound: "🔊 Sound", noSound: "🔇 Sound", screen: "⛶ Screen", controlsTitle: "Controls", gas: "Gas", brake: "Brake", turn: "Steering", handbrake: "Handbrake", pause: "Pause", pauseTitle: "PAUSE", resume: "▶ RESUME", restart: "↺ RESTART", menu: "☰ MENU", gameOver: "GAME OVER", newRecord: "🏆 NEW RECORD! 🏆", maxSpeed: "Max Speed", fuelCollected: "Fuel Collected", again: "↺ AGAIN" }
};

let currentLang = 'ru';
function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) el.textContent = translations[lang][key];
    });
    document.getElementById('langRu').classList.toggle('active', lang === 'ru');
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    updateControlBtnText();
}
document.getElementById('langRu').addEventListener('click', () => { audio.playClick(); setLanguage('ru'); });
document.getElementById('langEn').addEventListener('click', () => { audio.playClick(); setLanguage('en'); });

const game = { state: 'menu', distance: 0, maxSpeed: 0, fuelCollected: 0, difficulty: 1, cameraShake: 0, cameraOffsetY: 0, worldSpeed: 0, mobileMode: 'touch', lives: 3 };
const car = { x: 0, y: 0, z: 0, width: 60, height: 100, speed: 0, maxSpeed: 220, acceleration: 1.2, deceleration: 0.3, brakeForce: 1.5, handbrakeForce: 3.5, turnSpeed: 0, maxTurnSpeed: 22, turnAccel: 1.6, friction: 0.88, tilt: 0 };
const fuel = { current: 100, max: 100, consumptionBase: 0.015, consumptionSpeed: 0.00008, consumptionAccel: 0.02 };
const road = { width: 600, lanes: 5, segments: [], segmentLength: 200, visibleSegments: 50, curve: 0, curveTarget: 0, markingOffset: 0 };
const keys = { up: false, down: false, left: false, right: false, brake: false };
const wheelInput = { x: 0, y: 0, active: false };

let tiltControl = { beta: 0, gamma: 0 };

let obstacles = [];
let bonuses = [];
let particles = [];
let activeBonuses = [];

const obstacleTypes = [
    { type: 'concrete', w: 70, h: 50, d: 40, color: '#666', topColor: '#888', fatal: true },
    { type: 'barrel', w: 40, h: 40, d: 50, color: '#ff6600', topColor: '#ff8833', fatal: true, rolling: true },
    { type: 'car_red', w: 55, h: 90, d: 45, color: '#cc2222', topColor: '#ff4444', fatal: true, moving: true },
    { type: 'car_blue', w: 55, h: 90, d: 45, color: '#2244cc', topColor: '#4466ff', fatal: true, moving: true },
    { type: 'truck', w: 70, h: 140, d: 60, color: '#885500', topColor: '#aa7722', fatal: true, moving: true, slow: true },
    { type: 'cone', w: 30, h: 30, d: 45, color: '#ff8800', topColor: '#ffaa33', fatal: false },
    { type: 'rock_small', w: 35, h: 35, d: 30, color: '#555', topColor: '#777', fatal: false, slowdown: 0.5 },
    { type: 'rock_big', w: 60, h: 55, d: 50, color: '#444', topColor: '#666', fatal: true },
    { type: 'puddle', w: 80, h: 60, d: 5, color: '#334466', topColor: '#445577', fatal: false, slippery: true },
    { type: 'barrier', w: 100, h: 25, d: 60, color: '#cc0000', topColor: '#ff2222', fatal: true }
];

const bonusTypes = [
    { type: 'fuel_small', w: 30, h: 30, d: 40, color: '#00ff00', value: 10, icon: '⛽' },
    { type: 'fuel_medium', w: 35, h: 35, d: 45, color: '#00ff88', value: 25, icon: '⛽' },
    { type: 'fuel_large', w: 40, h: 40, d: 50, color: '#00ffaa', value: 50, icon: '⛽' },
    { type: 'boost', w: 35, h: 35, d: 40, color: '#00ffff', duration: 5000, icon: '⚡' },
    { type: 'slowmo', w: 35, h: 35, d: 40, color: '#ff00ff', duration: 4000, icon: '⏱' },
    { type: 'shield', w: 35, h: 35, d: 40, color: '#ffff00', duration: 6000, icon: '🛡' },
    { type: 'magnet', w: 35, h: 35, d: 40, color: '#ff8800', duration: 5000, icon: '🧲' },
    { type: 'double', w: 35, h: 35, d: 40, color: '#ff00aa', duration: 8000, icon: '×2' },
    { type: 'life', w: 40, h: 40, d: 40, color: '#ff0044', value: 1, icon: '❤️' }
];

let bestRecord = parseFloat(localStorage.getItem('endlessRacerRecord')) || 0;
function saveRecord(distance) {
    if (distance > bestRecord) {
        bestRecord = distance;
        localStorage.setItem('endlessRacerRecord', bestRecord.toFixed(2));
        return true;
    }
    return false;
}
function updateRecordDisplay() {
    document.getElementById('menuRecord').textContent = bestRecord.toFixed(1) + ' km';
    document.getElementById('recordDisplay').textContent = bestRecord.toFixed(1) + ' km';
}

function init() {
    audio.init(); 
    car.x = canvas.width / 2;
    car.y = canvas.height * 0.82; 
    car.speed = 0;
    car.turnSpeed = 0;
    car.tilt = 0;
    fuel.current = fuel.max;
    game.distance = 0;
    game.maxSpeed = 0;
    game.fuelCollected = 0;
    game.difficulty = 1;
    game.cameraShake = 0;
    game.worldSpeed = 0;
    game.lives = 3;
    obstacles = [];
    bonuses = [];
    particles = [];
    activeBonuses = [];
    road.curve = 0;
    road.curveTarget = 0;
    updateRecordDisplay();
    updateLivesDisplay();
    if (isMobile) {
        setMobileControls(game.mobileMode);
        document.getElementById('controlModeBtn').style.display = 'inline-block';
        window.addEventListener('deviceorientation', handleOrientation);
    } else {
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('mobileWheelControls').style.display = 'none';
        document.getElementById('controlModeBtn').style.display = 'none';
    }
}

function handleOrientation(event) {
    if (game.state !== 'playing') return;
    tiltControl.beta = event.beta; 
    tiltControl.gamma = event.gamma;
}

function updateLivesDisplay() {
    document.getElementById('livesDisplay').textContent = '❤️'.repeat(Math.max(0, game.lives));
}

function spawnObjects() {
    const roadLeft = (canvas.width - road.width) / 2;
    const laneWidth = road.width / road.lanes;
    const numObstacles = (game.difficulty > 2 && Math.random() < 0.3) ? 2 : 1;
    let usedLanes = [];
    for (let i = 0; i < numObstacles; i++) {
        let lane;
        let attempts = 0;
        do { lane = Math.floor(Math.random() * road.lanes); attempts++; } while (usedLanes.includes(lane) && attempts < 10);
        usedLanes.push(lane);
        const type = obstacleTypes[Math.floor(Math.random() * (2 + Math.min(game.difficulty, 7)))];
        obstacles.push({ x: roadLeft + lane * laneWidth + laneWidth / 2, y: -300, z: 0, ...type, speedMod: type.moving ? 0.1 : 0, moveTimer: Math.random() * 6 });
    }
}

function update(dt) {
    if (game.state !== 'playing') return;
    audio.updateEngine(car.speed, car.maxSpeed);
    const deltaTime = Math.min(dt, 50);
    let timeScale = hasActiveBonus('slowmo') ? 0.5 : 1;
    let speedMultiplier = hasActiveBonus('boost') ? 1.5 : 1;

    let gas = keys.up;
    let brake = keys.down || keys.brake;
    let turnLeft = keys.left;
    let turnRight = keys.right;

    if (isMobile) {
        gas = true; 
        if (tiltControl.gamma < -10) turnLeft = true;
        if (tiltControl.gamma > 10) turnRight = true;
        if (tiltControl.beta > 60) gas = false, brake = true; 
        if (tiltControl.beta < 30) car.speed += 0.5; 
    }

    if (gas) car.speed = Math.min(car.speed + car.acceleration * speedMultiplier, car.maxSpeed * speedMultiplier);
    if (brake) car.speed = Math.max(car.speed - car.brakeForce, 0);
    if (!gas && !brake) car.speed = Math.max(car.speed - car.deceleration, 30);

    if (turnLeft) car.turnSpeed = Math.max(car.turnSpeed - car.turnAccel, -car.maxTurnSpeed);
    else if (turnRight) car.turnSpeed = Math.min(car.turnSpeed + car.turnAccel, car.maxTurnSpeed);
    else car.turnSpeed *= car.friction;

    car.x += car.turnSpeed * timeScale;
    const roadLeft = (canvas.width - road.width) / 2 + car.width / 2;
    const roadRight = (canvas.width + road.width) / 2 - car.width / 2;
    car.x = Math.max(roadLeft, Math.min(roadRight, car.x));
    car.tilt = car.turnSpeed * 0.04;
    
    game.worldSpeed = car.speed * 0.1 * timeScale;
    game.distance += car.speed * 0.0001 * deltaTime * timeScale;
    fuel.current -= (fuel.consumptionBase + car.speed * fuel.consumptionSpeed) * deltaTime * 0.1;
    
    if (fuel.current <= 0) gameOver();

    obstacles.forEach((obs, i) => {
        obs.y += (1.2 + game.worldSpeed) * timeScale;
        if (checkCollision(car, obs)) {
            if (obs.fatal) {
                game.lives--;
                updateLivesDisplay();
                obstacles.splice(i, 1);
                if (game.lives <= 0) gameOver();
            }
        }
    });

    bonuses.forEach((b, i) => {
        b.y += game.worldSpeed;
        if (checkCollision(car, b)) { collectBonus(b); bonuses.splice(i, 1); }
    });

    updateHUD();
}

function checkCollision(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.w) / 3 && Math.abs(a.y - b.y) < (a.height + b.h) / 3;
}

function collectBonus(bonus) {
    audio.playBonus(bonus.type);
    if (bonus.type.startsWith('fuel')) fuel.current = Math.min(fuel.current + bonus.value, fuel.max);
    else if (bonus.type === 'life') { game.lives = Math.min(game.lives + 1, 3); updateLivesDisplay(); }
}

function updateHUD() {
    document.getElementById('distance').textContent = game.distance.toFixed(1) + ' km';
    document.getElementById('speedValue').textContent = Math.floor(car.speed);
    document.getElementById('fuelFill').style.width = (fuel.current / fuel.max * 100) + '%';
    document.getElementById('speedNeedle').style.transform = `translateX(-50%) rotate(${-90 + (car.speed / car.maxSpeed) * 180}deg)`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    obstacles.forEach(drawObstacle3D);
    bonuses.forEach(drawBonus3D);
    drawCar3D();
}

function drawRoad() {
    const roadLeft = (canvas.width - road.width) / 2;
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(roadLeft, 0, road.width, canvas.height);
}

function drawObstacle3D(obs) {
    ctx.fillStyle = obs.color;
    ctx.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
}

function drawBonus3D(bonus) {
    ctx.fillStyle = bonus.color;
    ctx.beginPath();
    ctx.arc(bonus.x, bonus.y, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawCar3D() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.tilt);
    ctx.fillStyle = '#1155dd';
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    ctx.restore();
}

function gameLoop(timestamp) {
    let dt = timestamp - (game.lastTime || timestamp);
    game.lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() { init(); game.state = 'playing'; hideAllScreens(); }
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); }
function gameOver() { game.state = 'gameOver'; document.getElementById('gameOverScreen').classList.add('active'); }

function setMobileControls(mode) {
    game.mobileMode = mode;
    if (isMobile) {
        document.getElementById('mobileControls').style.display = 'flex';
        document.getElementById('mobileWheelControls').style.display = 'none';
    }
}

document.addEventListener('keydown', e => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
});
document.addEventListener('keyup', e => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
});

document.getElementById('touchLeft').addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
document.getElementById('touchLeft').addEventListener('touchend', () => keys.left = false);
document.getElementById('touchRight').addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
document.getElementById('touchRight').addEventListener('touchend', () => keys.right = false);

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        this.beginPath(); this.moveTo(x + r, y); this.lineTo(x + w - r, y); this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r); this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h); this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r); this.quadraticCurveTo(x, y, x + r, y); this.closePath(); return this;
    };
}

setLanguage('ru');
requestAnimationFrame(gameLoop);
