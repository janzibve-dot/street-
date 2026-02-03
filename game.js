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

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

const translations = {
    ru: { distance: "Дистанция", fuel: "⛽ Топливо", record: "🏆 Рекорд", subtitle: "Бесконечная гонка", bestResult: "🏆 Лучший результат", start: "▶ СТАРТ", modeTouch: "📱 Управление: Тач", modeWheel: "🕹️ Управление: Руль", sound: "🔊 Звук", noSound: "🔇 Звук", screen: "⛶ Экран", controlsTitle: "Управление", gas: "Газ", brake: "Тормоз", turn: "Повороты", handbrake: "Ручник", pause: "Пауза", pauseTitle: "ПАУЗА", resume: "▶ ПРОДОЛЖИТЬ", restart: "↺ РЕСТАРТ", menu: "☰ МЕНЮ", gameOver: "ИГРА ОКОНЧЕНА", newRecord: "🏆 НОВЫЙ РЕКОРД! 🏆", maxSpeed: "Макс. скорость", collectedFuel: "Собрано топлива", again: "↺ ЕЩЁ РАЗ" },
    en: { distance: "Distance", fuel: "⛽ Fuel", record: "🏆 Record", subtitle: "Endless Racer", bestResult: "🏆 Best Result", start: "▶ START", modeTouch: "📱 Control: Touch", modeWheel: "🕹️ Control: Wheel", sound: "🔊 Sound", noSound: "🔇 Sound", screen: "⛶ Screen", controlsTitle: "Controls", gas: "Gas", brake: "Brake", turn: "Steering", handbrake: "Handbrake", pause: "Pause", pauseTitle: "PAUSE", resume: "▶ RESUME", restart: "↺ RESTART", menu: "☰ MENU", gameOver: "GAME OVER", newRecord: "🏆 NEW RECORD! 🏆", maxSpeed: "Max Speed", collectedFuel: "Fuel Collected", again: "↺ AGAIN" }
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

const game = { state: 'menu', distance: 0, maxSpeed: 0, fuelCollected: 0, difficulty: 1, cameraShake: 0, cameraOffsetY: 0, worldSpeed: 0, mobileMode: 'touch' };
const car = { x: 0, y: 0, z: 0, width: 60, height: 100, speed: 0, maxSpeed: 220, acceleration: 1.2, deceleration: 0.3, brakeForce: 1.5, handbrakeForce: 3.5, turnSpeed: 0, maxTurnSpeed: 19, turnAccel: 1.3, friction: 0.88, tilt: 0 };
const fuel = { current: 100, max: 100, consumptionBase: 0.015, consumptionSpeed: 0.00008, consumptionAccel: 0.02 };
const road = { width: 600, lanes: 5, segments: [], segmentLength: 200, visibleSegments: 50, curve: 0, curveTarget: 0, markingOffset: 0 };
const keys = { up: false, down: false, left: false, right: false, brake: false };
const wheelInput = { x: 0, y: 0, active: false };

let mobileTilt = { beta: 0, gamma: 0 };
if (isMobile) {
    window.addEventListener('deviceorientation', (e) => {
        mobileTilt.beta = e.beta;
        mobileTilt.gamma = e.gamma;
    });
}

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
    { type: 'double', w: 35, h: 35, d: 40, color: '#ff00aa', duration: 8000, icon: '×2' }
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
    obstacles = [];
    bonuses = [];
    particles = [];
    activeBonuses = [];
    road.curve = 0;
    road.curveTarget = 0;
    updateRecordDisplay();
    setMobileControls(game.mobileMode);
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
        const verticalOffset = i * -350; 
        const availableTypes = obstacleTypes.filter((t, idx) => idx <= 2 + game.difficulty);
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        obstacles.push({ x: roadLeft + lane * laneWidth + laneWidth / 2, y: -300 - Math.random() * 50 + verticalOffset, z: 0, ...type, speedMod: type.moving ? (type.slow ? -0.1 : 0.1 + Math.random() * 0.2) : 0, moveTimer: Math.random() * Math.PI * 2, rotation: 0 });
    }
    if (Math.random() < 0.5) {
        let bonusLane;
        do { bonusLane = Math.floor(Math.random() * road.lanes); } while (usedLanes.includes(bonusLane));
        const type = Math.random() < 0.6 ? bonusTypes.filter(t => t.type.startsWith('fuel'))[Math.floor(Math.random() * 3)] : bonusTypes.filter(t => !t.type.startsWith('fuel'))[Math.floor(Math.random() * 5)];
        bonuses.push({ x: roadLeft + bonusLane * laneWidth + laneWidth / 2, y: -300 - Math.random() * 100, z: 0, ...type, rotation: 0, floatOffset: Math.random() * Math.PI * 2 });
    }
}

function update(dt) {
    if (game.state !== 'playing') return;
    audio.updateEngine(car.speed, car.maxSpeed);
    const deltaTime = Math.min(dt, 50);
    let timeScale = hasActiveBonus('slowmo') ? 0.5 : 1;
    let speedMultiplier = hasActiveBonus('boost') ? 1.5 : 1;

    let gas = keys.up;
    let brakeAction = keys.down || keys.brake;
    let turnLeft = keys.left;
    let turnRight = keys.right;

    if (isMobile) {
        if (mobileTilt.gamma < -12) turnLeft = true;
        if (mobileTilt.gamma > 12) turnRight = true;
        if (mobileTilt.beta < 45) gas = true;
        if (mobileTilt.beta > 75) brakeAction = true;
    }

    if (gas) car.speed = Math.min(car.speed + car.acceleration * speedMultiplier, car.maxSpeed * speedMultiplier);
    if (brakeAction) car.speed = Math.max(car.speed - car.brakeForce, 0);
    if (!gas && !brakeAction) car.speed = Math.max(car.speed - car.deceleration, 30);

    const turnMultiplier = hasActiveBonus('slippery') ? 0.3 : 1;
    if (turnLeft) car.turnSpeed = Math.max(car.turnSpeed - car.turnAccel * turnMultiplier, -car.maxTurnSpeed);
    else if (turnRight) car.turnSpeed = Math.min(car.turnSpeed + car.turnAccel * turnMultiplier, car.maxTurnSpeed);
    else car.turnSpeed *= car.friction;

    car.x += car.turnSpeed * (0.4 + car.speed / car.maxSpeed * 0.6) * timeScale;
    const roadLimit = (canvas.width - road.width) / 2 + car.width / 2;
    car.x = Math.max(roadLimit, Math.min(canvas.width - roadLimit, car.x));
    car.tilt = car.turnSpeed * 0.04;
    game.worldSpeed = car.speed * 0.1 * timeScale;
    game.distance += car.speed * 0.0001 * deltaTime * timeScale * (hasActiveBonus('double') ? 2 : 1);
    fuel.current -= (fuel.consumptionBase + car.speed * fuel.consumptionSpeed + (gas ? fuel.consumptionAccel : 0)) * deltaTime * timeScale * 0.1;
    if (fuel.current <= 0) { fuel.current = 0; gameOver('fuel'); return; }
    game.difficulty = 1 + game.distance * 0.4;
    let spawnT = (spawnTimer += deltaTime * timeScale);
    if (spawnT >= Math.max(500, 1000 - game.difficulty * 40)) { spawnTimer = 0; spawnObjects(); }
    road.markingOffset = (road.markingOffset + game.worldSpeed * 2) % 80;

    obstacles.forEach((obs, i) => {
        obs.y += (1.5 + game.difficulty * 0.8 + game.worldSpeed * (1 + obs.speedMod)) * timeScale;
        if (checkCollision(car, obs)) {
            if (hasActiveBonus('shield')) { obstacles.splice(i, 1); audio.playCrash(); return; }
            if (obs.fatal) { gameOver('crash'); } else { car.speed *= (obs.slowdown || 1); obstacles.splice(i, 1); audio.playCrash(); }
        }
        if (obs.y > canvas.height + 200) obstacles.splice(i, 1);
    });
    bonuses.forEach((b, i) => {
        b.y += (1.5 + game.difficulty * 0.8 * 0.8 + game.worldSpeed) * timeScale;
        if (checkCollision(car, b)) { collectBonus(b); bonuses.splice(i, 1); }
        if (b.y > canvas.height + 100) bonuses.splice(i, 1);
    });
    activeBonuses.forEach((b, i) => { if ((b.remaining -= deltaTime) <= 0) activeBonuses.splice(i, 1); });
    updateHUD();
}

function checkCollision(a, b) { return Math.abs(a.x - b.x) < (a.width + (b.w || b.width)) * 0.32 && Math.abs(a.y - b.y) < (a.height + (b.h || b.height)) * 0.32; }
function collectBonus(bonus) { audio.playBonus(bonus.type); if (bonus.type.startsWith('fuel')) { fuel.current = Math.min(fuel.current + bonus.value, fuel.max); game.fuelCollected++; } else { addBonus(bonus); } }
function addBonus(bonus) { const ex = activeBonuses.find(b => b.type === bonus.type); if (ex) ex.remaining = bonus.duration; else activeBonuses.push({ ...bonus, remaining: bonus.duration }); }
function hasActiveBonus(type) { return activeBonuses.some(b => b.type === type); }

function updateHUD() {
    document.getElementById('distance').textContent = game.distance.toFixed(1) + ' km';
    document.getElementById('speedValue').textContent = Math.floor(car.speed);
    document.getElementById('speedNeedle').style.transform = `translateX(-50%) rotate(${-90 + (car.speed / car.maxSpeed) * 180}deg)`;
    document.getElementById('fuelFill').style.width = (fuel.current / fuel.max * 100) + '%';
    document.getElementById('fuelText').textContent = Math.floor(fuel.current / fuel.max * 100) + '%';
    document.getElementById('activeBonuses').innerHTML = activeBonuses.map(b => `<div class="bonus-indicator">${b.icon}<div class="timer"><div class="timer-fill" style="width: ${b.remaining / b.duration * 100}%"></div></div></div>`).join('');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a20'; ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    ctx.fillStyle = '#0f0f25'; ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
    drawRoad();
    [...obstacles, ...bonuses].sort((a,b)=>a.y-b.y).forEach(obj => obj.icon ? drawBonus3D(obj) : drawObstacle3D(obj));
    drawCar3D();
}

function drawRoad() {
    const roadLeft = (canvas.width - road.width) / 2;
    ctx.fillStyle = '#2a2a60'; ctx.fillRect(roadLeft, 0, road.width, canvas.height);
    ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 5; ctx.strokeRect(roadLeft, 0, road.width, canvas.height);
}
function drawObstacle3D(obs) { ctx.fillStyle = obs.color; ctx.fillRect(obs.x - obs.w*0.5, obs.y - obs.h*0.5, obs.w, obs.h); }
function drawBonus3D(b) { ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, 15, 0, 7); ctx.fill(); }
function drawCar3D() { ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.tilt); ctx.fillStyle = '#1155dd'; ctx.fillRect(-car.width*0.5, -car.height*0.5, car.width, car.height); ctx.restore(); }

function gameLoop(t) { update(t - lastTime); lastTime = t; draw(); requestAnimationFrame(gameLoop); }
let lastTime = 0;

function startGame() { init(); audio.playStart(); game.state = 'playing'; hideAllScreens(); }
function pauseGame() { if (game.state === 'playing') { game.state = 'paused'; audio.stopEngine(); showScreen('pauseScreen'); } }
function resumeGame() { if (game.state === 'paused') { game.state = 'playing'; hideAllScreens(); } }
function gameOver() { game.state = 'gameOver'; audio.stopEngine(); saveRecord(game.distance); updateRecordDisplay(); document.getElementById('finalDistance').textContent = game.distance.toFixed(1) + ' km'; showScreen('gameOverScreen'); }
function showScreen(id) { document.getElementById(id).classList.add('active'); }
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); }
function goToMenu() { game.state = 'menu'; hideAllScreens(); showScreen('startScreen'); }

document.addEventListener('keydown', e => { if(e.code==='KeyW'||e.code==='ArrowUp')keys.up=true; if(e.code==='KeyS'||e.code==='ArrowDown')keys.down=true; if(e.code==='KeyA'||e.code==='ArrowLeft')keys.left=true; if(e.code==='KeyD'||e.code==='ArrowRight')keys.right=true; });
document.addEventListener('keyup', e => { if(e.code==='KeyW'||e.code==='ArrowUp')keys.up=false; if(e.code==='KeyS'||e.code==='ArrowDown')keys.down=false; if(e.code==='KeyA'||e.code==='ArrowLeft')keys.left=false; if(e.code==='KeyD'||e.code==='ArrowRight')keys.right=false; });

function setMobileControls(mode) { game.mobileMode = mode; document.getElementById('mobileControls').style.display = isMobile ? 'block' : 'none'; }
function updateControlBtnText() { document.getElementById('controlModeBtn').textContent = translations[currentLang].modeTouch; }
function updateSoundBtnText() { document.getElementById('soundBtn').textContent = translations[currentLang].sound; }

document.getElementById('touchLeft').addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; });
document.getElementById('touchLeft').addEventListener('touchend', () => keys.left = false);
document.getElementById('touchRight').addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; });
document.getElementById('touchRight').addEventListener('touchend', () => keys.right = false);
document.getElementById('touchBrake').addEventListener('touchstart', e => { e.preventDefault(); keys.brake = true; });
document.getElementById('touchBrake').addEventListener('touchend', () => keys.brake = false);

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', goToMenu);

setLanguage('ru');
requestAnimationFrame(gameLoop);
