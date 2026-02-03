// ============== AUDIO SYSTEM (SYNTHESIZER) ==============
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

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.engineGain) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
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
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
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
    
    stopEngine() {
        if (this.engineGain) {
            this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
        }
    }
}

const audio = new AudioController();

// ============== CANVAS SETUP ==============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// ============== LOCALIZATION ==============
const translations = {
    ru: {
        distance: "Дистанция",
        fuel: "⛽ Топливо",
        record: "🏆 Рекорд",
        subtitle: "Бесконечная гонка",
        bestResult: "🏆 Лучший результат",
        start: "▶ СТАРТ",
        modeTouch: "📱 Управление: Тач",
        modeWheel: "🕹️ Управление: Руль",
        sound: "🔊 Звук",
        noSound: "🔇 Звук",
        screen: "⛶ Экран",
        controlsTitle: "Управление",
        gas: "Газ",
        brake: "Тормоз",
        turn: "Повороты",
        handbrake: "Ручник",
        pause: "Пауза",
        pauseTitle: "ПАУЗА",
        resume: "▶ ПРОДОЛЖИТЬ",
        restart: "↺ РЕСТАРТ",
        menu: "☰ МЕНЮ",
        gameOver: "ИГРА ОКОНЧЕНА",
        newRecord: "🏆 НОВЫЙ РЕКОРД! 🏆",
        maxSpeed: "Макс. скорость",
        collectedFuel: "Собрано топлива",
        again: "↺ ЕЩЁ РАЗ"
    },
    en: {
        distance: "Distance",
        fuel: "⛽ Fuel",
        record: "🏆 Record",
        subtitle: "Endless Racer",
        bestResult: "🏆 Best Result",
        start: "▶ START",
        modeTouch: "📱 Control: Touch",
        modeWheel: "🕹️ Control: Wheel",
        sound: "🔊 Sound",
        noSound: "🔇 Sound",
        screen: "⛶ Screen",
        controlsTitle: "Controls",
        gas: "Gas",
        brake: "Brake",
        turn: "Steering",
        handbrake: "Handbrake",
        pause: "Pause",
        pauseTitle: "PAUSE",
        resume: "▶ RESUME",
        restart: "↺ RESTART",
        menu: "☰ MENU",
        gameOver: "GAME OVER",
        newRecord: "🏆 NEW RECORD! 🏆",
        maxSpeed: "Max Speed",
        collectedFuel: "Fuel Collected",
        again: "↺ AGAIN"
    }
};

let currentLang = 'ru';

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    document.getElementById('langRu').classList.toggle('active', lang === 'ru');
    document.getElementById('langEn').classList.toggle('active', lang === 'en');
    
    updateControlBtnText();
    updateSoundBtnText();
}

document.getElementById('langRu').addEventListener('click', () => { audio.playClick(); setLanguage('ru'); });
document.getElementById('langEn').addEventListener('click', () => { audio.playClick(); setLanguage('en'); });

// ============== GAME STATE ==============
const game = {
    state: 'menu',
    distance: 0,
    maxSpeed: 0,
    fuelCollected: 0,
    difficulty: 1,
    cameraShake: 0,
    cameraOffsetY: 0,
    worldSpeed: 0,
    mobileMode: 'touch'
};

// ============== CAR ==============
const car = {
    x: 0,
    y: 0,
    z: 0,
    width: 60,
    height: 100,
    speed: 0,
    maxSpeed: 220,
    acceleration: 1.2,
    deceleration: 0.3,
    brakeForce: 1.5,
    handbrakeForce: 3.5,
    turnSpeed: 0,
    maxTurnSpeed: 19, 
    turnAccel: 1.3,
    friction: 0.88,
    tilt: 0
};

// ============== FUEL ==============
const fuel = {
    current: 100,
    max: 100,
    consumptionBase: 0.015,
    consumptionSpeed: 0.00008,
    consumptionAccel: 0.02
};

// ============== ROAD ==============
const road = {
    width: 600,
    lanes: 5,
    segments: [],
    segmentLength: 200,
    visibleSegments: 50,
    curve: 0,
    curveTarget: 0,
    markingOffset: 0
};

// ============== INPUTS ==============
const keys = { up: false, down: false, left: false, right: false, brake: false };
const wheelInput = { x: 0, y: 0, active: false };

// MOBILE MOTION SENSORS
let mobileTilt = { beta: 0, gamma: 0 };
if (isMobile) {
    window.addEventListener('deviceorientation', (e) => {
        mobileTilt.beta = e.beta;
        mobileTilt.gamma = e.gamma;
    });
}

// ============== OBJECTS ==============
let obstacles = [];
let bonuses = [];
let particles = [];
let activeBonuses = [];

// ============== OBSTACLE TYPES ==============
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

// ============== BONUS TYPES ==============
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

// ============== LOCAL STORAGE ==============
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

// ============== INITIALIZE ==============
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

// ============== SPAWN SYSTEM ==============
let spawnTimer = 0;
const spawnInterval = 1000;

function spawnObjects() {
    const roadLeft = (canvas.width - road.width) / 2;
    const laneWidth = road.width / road.lanes;
    
    const numObstacles = (game.difficulty > 2 && Math.random() < 0.3) ? 2 : 1;
    let usedLanes = [];

    for (let i = 0; i < numObstacles; i++) {
        let lane;
        let attempts = 0;
        do {
            lane = Math.floor(Math.random() * road.lanes);
            attempts++;
        } while (usedLanes.includes(lane) && attempts < 10);
        usedLanes.push(lane);

        const verticalOffset = i * -350; 

        const availableTypes = obstacleTypes.filter((t, idx) => idx <= 2 + game.difficulty);
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        let behavior = 'straight';
        const behaviorRoll = Math.random();
        if (behaviorRoll < 0.2) behavior = 'zigzag';
        else if (behaviorRoll < 0.3) behavior = 'diagonal';

        obstacles.push({
            x: roadLeft + lane * laneWidth + laneWidth / 2,
            y: -300 - Math.random() * 50 + verticalOffset,
            z: 0,
            ...type,
            speedMod: type.moving ? (type.slow ? -0.1 : 0.1 + Math.random() * 0.2) : 0,
            moveDir: behavior === 'diagonal' ? (Math.random() < 0.5 ? -1 : 1) : 0,
            behavior: behavior,
            moveTimer: Math.random() * Math.PI * 2,
            rotation: 0
        });
    }
    
    if (Math.random() < 0.5) {
        let bonusLane;
        do {
            bonusLane = Math.floor(Math.random() * road.lanes);
        } while (usedLanes.includes(bonusLane));
        
        let type;
        if (Math.random() < 0.6) {
             const fuelTypes = bonusTypes.filter(t => t.type.startsWith('fuel'));
             type = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
        } else {
             const otherTypes = bonusTypes.filter(t => !t.type.startsWith('fuel'));
             type = otherTypes[Math.floor(Math.random() * otherTypes.length)];
        }
        
        bonuses.push({
            x: roadLeft + bonusLane * laneWidth + laneWidth / 2,
            y: -300 - Math.random() * 100,
            z: 0,
            ...type,
            rotation: 0,
            floatOffset: Math.random() * Math.PI * 2
        });
    }
}

// ============== UPDATE ==============
function update(dt) {
    if (game.state !== 'playing') return;
    
    audio.updateEngine(car.speed, car.maxSpeed);
    
    const deltaTime = Math.min(dt, 50);
    
    let timeScale = 1;
    if (hasActiveBonus('slowmo')) {
        timeScale = 0.5;
    }
    
    let speedMultiplier = 1;
    if (hasActiveBonus('boost')) {
        speedMultiplier = 1.5;
    }
    
    let gas = keys.up;
    let brakeAction = keys.down || keys.brake;
    let turnLeft = keys.left;
    let turnRight = keys.right;
    
    if (isMobile) {
        // TILT FOR STEERING
        if (mobileTilt.gamma < -12) turnLeft = true;
        if (mobileTilt.gamma > 12) turnRight = true;

        // TILT FOR SPEED
        // Наклон вперед (экран ложится горизонтально) - ГАЗ
        if (mobileTilt.beta < 45) gas = true;
        // Наклон назад (экран вертикально) - ТОРМОЗ
        if (mobileTilt.beta > 75) brakeAction = true;

        if (game.mobileMode === 'wheel') {
            if (wheelInput.active) {
                if (wheelInput.x < -10) turnLeft = true;
                if (wheelInput.x > 10) turnRight = true;
                const normalizedTurn = Math.max(-1, Math.min(1, wheelInput.x / 40));
                car.turnSpeed += normalizedTurn * car.turnAccel; 
            }
        }
    }

    if (gas) {
        car.speed = Math.min(car.speed + car.acceleration * speedMultiplier, car.maxSpeed * speedMultiplier);
    }
    if (brakeAction) {
        car.speed = Math.max(car.speed - car.brakeForce, 0);
    }
    if (!gas && !brakeAction) {
        car.speed = Math.max(car.speed - car.deceleration, 30);
    }
    
    const turnMultiplier = hasActiveBonus('slippery') ? 0.3 : 1;
    
    if (game.mobileMode !== 'wheel' || !wheelInput.active) {
        if (turnLeft) {
            car.turnSpeed = Math.max(car.turnSpeed - car.turnAccel * turnMultiplier, -car.maxTurnSpeed);
        } else if (turnRight) {
            car.turnSpeed = Math.min(car.turnSpeed + car.turnAccel * turnMultiplier, car.maxTurnSpeed);
        } else {
            car.turnSpeed *= car.friction; 
        }
    } else {
        if (!wheelInput.active) car.turnSpeed *= car.friction;
    }
    
    const turnAmount = car.turnSpeed * (0.4 + car.speed / car.maxSpeed * 0.6) * timeScale;
    const roadLeft = (canvas.width - road.width) / 2 + car.width / 2;
    const roadRight = (canvas.width + road.width) / 2 - car.width / 2;
    
    car.x += turnAmount;
    car.x = Math.max(roadLeft, Math.min(roadRight, car.x));
    
    car.tilt = car.turnSpeed * 0.04;
    
    game.worldSpeed = car.speed * 0.1 * timeScale;
    
    const distanceGain = car.speed * 0.0001 * deltaTime * timeScale;
    game.distance += distanceGain * (hasActiveBonus('double') ? 2 : 1);
    game.maxSpeed = Math.max(game.maxSpeed, Math.floor(car.speed));
    
    let fuelConsumption = fuel.consumptionBase + car.speed * fuel.consumptionSpeed;
    if (gas) fuelConsumption += fuel.consumptionAccel;
    fuel.current -= fuelConsumption * deltaTime * timeScale * 0.1;
    
    if (fuel.current <= 0) {
        fuel.current = 0;
        gameOver('fuel');
        return;
    }
    
    game.difficulty = 1 + game.distance * 0.4;
    
    spawnTimer += deltaTime * timeScale;
    const adjustedInterval = Math.max(500, spawnInterval - game.difficulty * 40);
    if (spawnTimer >= adjustedInterval) {
        spawnTimer = 0;
        spawnObjects();
    }
    
    if (Math.random() < 0.01) {
        road.curveTarget = (Math.random() - 0.5) * 0.3;
    }
    road.curve += (road.curveTarget - road.curve) * 0.02;
    
    road.markingOffset += game.worldSpeed * 2;
    if (road.markingOffset > 80) road.markingOffset -= 80;
    
    game.cameraShake *= 0.9;
    game.cameraOffsetY = Math.sin(Date.now() * 0.003) * 2 + game.cameraShake * (Math.random() - 0.5) * 10;
    
    const magnetActive = hasActiveBonus('magnet');
    
    const baseSpeed = 1.5 + game.difficulty * 0.8;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        
        let moveSpeed = (baseSpeed + game.worldSpeed * (1 + obs.speedMod)) * timeScale;
        obs.y += moveSpeed;
        obs.moveTimer += 0.03 * timeScale;
        
        if (obs.behavior === 'zigzag') {
            obs.x += Math.sin(obs.moveTimer * 3) * 2;
        } else if (obs.behavior === 'diagonal') {
             obs.x += obs.moveDir * 1.5;
        } else if (obs.moveDir !== 0) {
            obs.x += Math.sin(obs.moveTimer) * obs.moveDir * 0.5;
        }
        
        if (obs.rolling) {
            obs.rotation += game.worldSpeed * 0.1 * timeScale;
            obs.x += Math.sin(obs.moveTimer * 2) * 1.5;
        }
        
        const border = 50;
        obs.x = Math.max(roadLeft - border, Math.min(roadRight + border, obs.x));
        
        if (obs.y > canvas.height + 200) {
            obstacles.splice(i, 1);
            continue;
        }
        
        if (checkCollision(car, obs)) {
            if (hasActiveBonus('shield')) {
                obstacles.splice(i, 1);
                spawnParticles(obs.x, obs.y, '#ffff00', 20);
                game.cameraShake = 5;
                audio.playCrash();
                continue;
            }
            
            if (obs.fatal) {
                spawnExplosion(car.x, car.y);
                gameOver('crash');
                return;
            } else if (obs.slowdown) {
                car.speed *= obs.slowdown;
                game.cameraShake = 3;
                obstacles.splice(i, 1);
                audio.playCrash();
            } else if (obs.slippery) {
                addBonus({ type: 'slippery', duration: 2000 });
                obstacles.splice(i, 1);
            } else {
                game.cameraShake = 2;
                audio.playCrash();
            }
        }
    }
    
    for (let i = bonuses.length - 1; i >= 0; i--) {
        const bonus = bonuses[i];
        
        bonus.y += (baseSpeed * 0.8 + game.worldSpeed) * timeScale;
        bonus.rotation += 0.05 * timeScale;
        bonus.floatOffset += 0.1 * timeScale;
        bonus.z = Math.sin(bonus.floatOffset) * 5;
        
        if (magnetActive) {
            const dx = car.x - bonus.x;
            const dy = car.y - bonus.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 300 && dist > 0) {
                bonus.x += (dx / dist) * 5;
                bonus.y += (dy / dist) * 3;
            }
        }
        
        if (bonus.y > canvas.height + 100) {
            bonuses.splice(i, 1);
            continue;
        }
        
        if (checkCollision(car, bonus)) {
            collectBonus(bonus);
            bonuses.splice(i, 1);
        }
    }
    
    for (let i = activeBonuses.length - 1; i >= 0; i--) {
        activeBonuses[i].remaining -= deltaTime;
        if (activeBonuses[i].remaining <= 0) {
            activeBonuses.splice(i, 1);
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * timeScale;
        p.y += (p.vy + game.worldSpeed) * timeScale;
        p.life -= deltaTime;
        p.size *= 0.98;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    updateHUD();
}

// ============== COLLISION ==============
function checkCollision(a, b) {
    const shrink = 0.65;
    const aW = a.width * shrink;
    const aH = a.height * shrink;
    const bW = (b.w || b.width) * shrink;
    const bH = (b.h || b.height) * shrink;
    
    return Math.abs(a.x - b.x) < (aW + bW) / 2 &&
           Math.abs(a.y - b.y) < (aH + bH) / 2;
}

// ============== BONUS SYSTEM ==============
function collectBonus(bonus) {
    spawnParticles(bonus.x, bonus.y, bonus.color, 15);
    audio.playBonus(bonus.type);
    
    if (bonus.type.startsWith('fuel')) {
        fuel.current = Math.min(fuel.current + bonus.value, fuel.max);
        game.fuelCollected++;
    } else if (bonus.duration) {
        addBonus(bonus);
    }
}

function addBonus(bonus) {
    const existing = activeBonuses.find(b => b.type === bonus.type);
    if (existing) {
        existing.remaining = bonus.duration;
    } else {
        activeBonuses.push({
            type: bonus.type,
            duration: bonus.duration,
            remaining: bonus.duration,
            icon: bonus.icon || '?'
        });
    }
}

function hasActiveBonus(type) {
    return activeBonuses.some(b => b.type === type);
}

// ============== PARTICLES ==============
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            color,
            size: 3 + Math.random() * 6,
            life: 400 + Math.random() * 300
        });
    }
}

function spawnExplosion(x, y) {
    const colors = ['#ff4400', '#ff8800', '#ffff00', '#ff0000'];
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 5 + Math.random() * 15;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 5 + Math.random() * 15,
            life: 500 + Math.random() * 500
        });
    }
}

// ============== HUD UPDATE ==============
function updateHUD() {
    document.getElementById('distance').textContent = game.distance.toFixed(1) + ' km';
    
    const speedVal = Math.floor(car.speed);
    document.getElementById('speedValue').textContent = speedVal;
    
    const needleAngle = -90 + (car.speed / car.maxSpeed) * 180;
    document.getElementById('speedNeedle').style.transform = 
        `translateX(-50%) rotate(${needleAngle}deg)`;
    
    const speedo = document.getElementById('speedometer');
    speedo.classList.remove('warning', 'danger');
    if (car.speed > car.maxSpeed * 0.9) {
        speedo.classList.add('danger');
    } else if (car.speed > car.maxSpeed * 0.7) {
        speedo.classList.add('warning');
    }
    
    const fuelPercent = (fuel.current / fuel.max) * 100;
    document.getElementById('fuelFill').style.width = fuelPercent + '%';
    document.getElementById('fuelText').textContent = Math.floor(fuelPercent) + '%';
    
    const fuelGauge = document.getElementById('fuelGauge');
    fuelGauge.classList.remove('warning', 'danger');
    if (fuelPercent < 15) {
        fuelGauge.classList.add('danger');
    } else if (fuelPercent < 30) {
        fuelGauge.classList.add('warning');
    }
    
    const bonusContainer = document.getElementById('activeBonuses');
    bonusContainer.innerHTML = activeBonuses.map(b => `
        <div class="bonus-indicator" style="background: ${getBonusColor(b.type)}40; border: 2px solid ${getBonusColor(b.type)};">
            ${b.icon}
            <div class="timer"><div class="timer-fill" style="width: ${(b.remaining / b.duration) * 100}%"></div></div>
        </div>
    `).join('');
}

function getBonusColor(type) {
    const bonus = bonusTypes.find(b => b.type === type);
    return bonus ? bonus.color : '#fff';
}

// ============== DRAW ==============
function draw() {
    const shakeX = game.cameraShake * (Math.random() - 0.5) * 2;
    const shakeY = game.cameraOffsetY;
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.5);
    skyGrad.addColorStop(0, '#0a0a20');
    skyGrad.addColorStop(1, '#1a1a40');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.5);
    
    ctx.fillStyle = '#0f0f25';
    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
    
    drawRoad();
    
    const allObjects = [...obstacles, ...bonuses].sort((a, b) => a.y - b.y);
    allObjects.forEach(obj => {
        if (obj.icon !== undefined) {
            drawBonus3D(obj);
        } else {
            drawObstacle3D(obj);
        }
    });
    
    drawCar3D();
    
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 700;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    ctx.restore();
}

function drawRoad() {
    const roadCenter = canvas.width / 2;
    const roadLeft = roadCenter - road.width / 2;
    
    const roadGrad = ctx.createLinearGradient(roadLeft, 0, roadLeft + road.width, 0);
    roadGrad.addColorStop(0, '#1a1a3a');
    roadGrad.addColorStop(0.2, '#252555');
    roadGrad.addColorStop(0.5, '#2a2a60');
    roadGrad.addColorStop(0.8, '#252555');
    roadGrad.addColorStop(1, '#1a1a3a');
    
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadLeft, 0, road.width, canvas.height);
    
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 5;
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00f5ff';
    
    ctx.beginPath();
    ctx.moveTo(roadLeft, 0);
    ctx.lineTo(roadLeft, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(roadLeft + road.width, 0);
    ctx.lineTo(roadLeft + road.width, canvas.height);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    const laneWidth = road.width / road.lanes;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([50, 30]);
    ctx.lineDashOffset = -road.markingOffset;
    
    for (let i = 1; i < road.lanes; i++) {
        const x = roadLeft + i * laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawObstacle3D(obs) {
    const scale = getScale(obs.y);
    const screenX = obs.x;
    const screenY = obs.y;
    
    if (screenY < -100 || screenY > canvas.height + 100) return;
    
    const w = obs.w * scale;
    const h = obs.h * scale;
    const d = obs.d * scale;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    
    if (obs.rolling) {
        ctx.rotate(obs.rotation);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(5, h/2 + 5, w/2, d/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = obs.color;
    ctx.fillRect(-w/2, -h/2, w, h);
    
    ctx.fillStyle = obs.topColor;
    ctx.beginPath();
    ctx.moveTo(-w/2, -h/2);
    ctx.lineTo(-w/2 + d/3, -h/2 - d/2);
    ctx.lineTo(w/2 + d/3, -h/2 - d/2);
    ctx.lineTo(w/2, -h/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = shadeColor(obs.color, -20);
    ctx.beginPath();
    ctx.moveTo(w/2, -h/2);
    ctx.lineTo(w/2 + d/3, -h/2 - d/2);
    ctx.lineTo(w/2 + d/3, h/2 - d/2);
    ctx.lineTo(w/2, h/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w/2, -h/2, w, h);
    
    if (obs.type.startsWith('car') || obs.type === 'truck') {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
        ctx.fillRect(-w/2 + 6, -h/2 + 8, w - 12, h * 0.25);
        
        ctx.fillStyle = '#ffff88';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffff88';
        ctx.fillRect(-w/2 + 5, h/2 - 12, 10, 6);
        ctx.fillRect(w/2 - 15, h/2 - 12, 10, 6);
        ctx.shadowBlur = 0;
    }
    
    if (obs.type === 'cone') {
        ctx.fillStyle = 'white';
        ctx.fillRect(-w/2, -h/4, w, 8);
    }
    
    if (obs.type === 'barrel') {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w/2, -h/3);
        ctx.lineTo(w/2, -h/3);
        ctx.moveTo(-w/2, h/3);
        ctx.lineTo(w/2, h/3);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawBonus3D(bonus) {
    const scale = getScale(bonus.y);
    const screenX = bonus.x;
    const screenY = bonus.y + bonus.z;
    
    if (screenY < -100 || screenY > canvas.height + 100) return;
    
    const w = bonus.w * scale;
    const h = bonus.h * scale;
    const d = bonus.d * scale;
    
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(bonus.rotation);
    
    ctx.shadowBlur = 30;
    ctx.shadowColor = bonus.color;
    
    ctx.fillStyle = bonus.color;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 8 * scale);
    ctx.fill();
    
    ctx.fillStyle = lightenColor(bonus.color, 40);
    ctx.beginPath();
    ctx.roundRect(-w/2 + 4, -h/2 + 4, w - 8, h/3, 4 * scale);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#000';
    ctx.font = `bold ${Math.floor(18 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bonus.icon, 0, 2);
    
    ctx.restore();
}

function drawCar3D() {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.tilt);
    
    const w = car.width;
    const h = car.height;
    const d = 35;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(8, h/2 + 10, w/1.8, d/3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const bodyGrad = ctx.createLinearGradient(-w/2, 0, w/2, 0);
    bodyGrad.addColorStop(0, '#1155dd');
    bodyGrad.addColorStop(0.3, '#2277ff');
    bodyGrad.addColorStop(0.5, '#3388ff');
    bodyGrad.addColorStop(0.7, '#2277ff');
    bodyGrad.addColorStop(1, '#1155dd');
    
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 8);
    ctx.fill();
    
    ctx.fillStyle = '#4499ff';
    ctx.beginPath();
    ctx.moveTo(-w/2 + 5, -h/2);
    ctx.lineTo(-w/2 + 10, -h/2 - d/2);
    ctx.lineTo(w/2 - 10, -h/2 - d/2);
    ctx.lineTo(w/2 - 5, -h/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#1144aa';
    ctx.beginPath();
    ctx.moveTo(w/2, -h/2 + 10);
    ctx.lineTo(w/2 + d/4, -h/2 - d/3);
    ctx.lineTo(w/2 + d/4, h/2 - d/3 - 10);
    ctx.lineTo(w/2, h/2 - 10);
    ctx.closePath();
    ctx.fill();
    
    const windGrad = ctx.createLinearGradient(0, -h/2, 0, -h/2 + h*0.35);
    windGrad.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
    windGrad.addColorStop(1, 'rgba(50, 150, 200, 0.5)');
    ctx.fillStyle = windGrad;
    ctx.beginPath();
    ctx.roundRect(-w/2 + 8, -h/2 + 12, w - 16, h * 0.32, 4);
    ctx.fill();
    
    ctx.fillStyle = '#0a0a30';
    ctx.beginPath();
    ctx.roundRect(-w/2 + 10, -h/2 + h*0.35, w - 20, h * 0.3, 3);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(80, 180, 255, 0.6)';
    ctx.fillRect(-w/2 + 3, -h/2 + 20, 5, h * 0.35);
    ctx.fillRect(w/2 - 8, -h/2 + 20, 5, h * 0.35);
    
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-w/2 + 6, -h/2 + 5, 14, 10, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w/2 - 20, -h/2 + 5, 14, 10, 3);
    ctx.fill();
    
    ctx.fillStyle = '#ff0044';
    ctx.shadowColor = '#ff0044';
    ctx.beginPath();
    ctx.roundRect(-w/2 + 6, h/2 - 15, 12, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(w/2 - 18, h/2 - 15, 12, 8, 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    if (car.speed > 100) {
        const intensity = (car.speed - 100) / 100;
        ctx.fillStyle = `rgba(255, 100, 50, ${intensity * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(-12, h/2);
        ctx.lineTo(12, h/2);
        ctx.lineTo(8, h/2 + 25 + Math.random() * 15);
        ctx.lineTo(-8, h/2 + 25 + Math.random() * 15);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 200, 50, ${intensity * 0.6})`;
        ctx.beginPath();
        ctx.moveTo(-6, h/2);
        ctx.lineTo(6, h/2);
        ctx.lineTo(4, h/2 + 35 + Math.random() * 20);
        ctx.lineTo(-4, h/2 + 35 + Math.random() * 20);
        ctx.closePath();
        ctx.fill();
    }
    
    if (hasActiveBonus('shield')) {
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.ellipse(0, 0, w/1.5, h/1.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f5ff';
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

function getScale(y) {
    return 0.6 + (y / canvas.height) * 0.6;
}

function shadeColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function lightenColor(color, percent) {
    return shadeColor(color, percent);
}

let lastTime = 0;
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    
    update(dt);
    draw();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    init();
    audio.playStart();
    game.state = 'playing';
    hideAllScreens();
}

function pauseGame() {
    if (game.state === 'playing') {
        game.state = 'paused';
        audio.stopEngine();
        showScreen('pauseScreen');
    }
}

function resumeGame() {
    if (game.state === 'paused') {
        game.state = 'playing';
        hideAllScreens();
    }
}

function gameOver(reason) {
    game.state = 'gameOver';
    audio.playCrash(); 
    audio.stopEngine();
    
    const isNewRecord = saveRecord(game.distance);
    updateRecordDisplay();
    
    document.getElementById('finalDistance').textContent = game.distance.toFixed(1) + ' km';
    document.getElementById('finalSpeed').textContent = game.maxSpeed + ' km/h';
    document.getElementById('finalFuel').textContent = game.fuelCollected;
    document.getElementById('newRecordText').style.display = isNewRecord ? 'block' : 'none';
    
    setTimeout(() => showScreen('gameOverScreen'), 300);
}

function showScreen(id) {
    document.getElementById(id).classList.add('active');
}

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
}

function goToMenu() {
    game.state = 'menu';
    audio.stopEngine();
    hideAllScreens();
    showScreen('startScreen');
    updateRecordDisplay();
}

function updateControlBtnText() {
    const btn = document.getElementById('controlModeBtn');
    if (game.mobileMode === 'touch') {
        btn.textContent = translations[currentLang].modeTouch;
    } else {
        btn.textContent = translations[currentLang].modeWheel;
    }
}

function updateSoundBtnText() {
    const btn = document.getElementById('soundBtn');
    btn.textContent = game.soundEnabled ? translations[currentLang].sound : translations[currentLang].noSound;
}

document.addEventListener('keydown', e => {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': keys.up = true; break;
        case 'KeyS': case 'ArrowDown': keys.down = true; break;
        case 'KeyA': case 'ArrowLeft': keys.left = true; break;
        case 'KeyD': case 'ArrowRight': keys.right = true; break;
        case 'Space': e.preventDefault(); keys.brake = true; break;
        case 'Escape':
            if (game.state === 'playing') pauseGame();
            else if (game.state === 'paused') resumeGame();
            break;
        case 'KeyR':
            if (game.state !== 'menu') startGame();
            break;
    }
});

document.addEventListener('keyup', e => {
    switch(e.code) {
        case 'KeyW': case 'ArrowUp': keys.up = false; break;
        case 'KeyS': case 'ArrowDown': keys.down = false; break;
        case 'KeyA': case 'ArrowLeft': keys.left = false; break;
        case 'KeyD': case 'ArrowRight': keys.right = false; break;
        case 'Space': keys.brake = false; break;
    }
});

function setMobileControls(mode) {
    game.mobileMode = mode;
    document.getElementById('mobileControls').style.display = mode === 'touch' ? 'block' : 'none';
    document.getElementById('mobileWheelControls').style.display = mode === 'wheel' ? 'block' : 'none';
    updateControlBtnText();
}

document.getElementById('controlModeBtn').addEventListener('click', function() {
    audio.playClick();
    if (game.mobileMode === 'touch') {
        setMobileControls('wheel');
    } else {
        setMobileControls('touch');
    }
});

const touchLeft = document.getElementById('touchLeft');
const touchRight = document.getElementById('touchRight');
const touchBrake = document.getElementById('touchBrake');

touchLeft.addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; });
touchLeft.addEventListener('touchend', () => keys.left = false);
touchRight.addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; });
touchRight.addEventListener('touchend', () => keys.right = false);
touchBrake.addEventListener('touchstart', e => { e.preventDefault(); keys.brake = true; });
touchBrake.addEventListener('touchend', () => keys.brake = false);

const wheelBase = document.getElementById('virtualWheelBase');
const wheelStick = document.getElementById('virtualWheel');
const wheelBrake = document.getElementById('wheelBrake');

wheelBase.addEventListener('touchstart', handleWheelStart);
wheelBase.addEventListener('touchmove', handleWheelMove);
wheelBase.addEventListener('touchend', handleWheelEnd);
wheelBrake.addEventListener('touchstart', e => { e.preventDefault(); keys.brake = true; });
wheelBrake.addEventListener('touchend', () => keys.brake = false);

let wheelCenter = { x: 0, y: 0 };

function handleWheelStart(e) {
    e.preventDefault();
    const rect = wheelBase.getBoundingClientRect();
    wheelCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    wheelInput.active = true;
    handleWheelMove(e);
}

function handleWheelMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - wheelCenter.x;
    const maxDist = 40;
    const clampedX = Math.max(-maxDist, Math.min(maxDist, dx));
    
    wheelStick.style.transform = `translate(-50%, -50%) translateX(${clampedX}px)`;
    wheelInput.x = clampedX;
}

function handleWheelEnd(e) {
    e.preventDefault();
    wheelInput.active = false;
    wheelInput.x = 0;
    wheelStick.style.transform = `translate(-50%, -50%)`;
}

function setupBtn(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('mouseenter', () => audio.playHover());
    btn.addEventListener('click', () => {
        audio.playClick();
        action();
    });
}

setupBtn('startBtn', startGame);
setupBtn('resumeBtn', resumeGame);
setupBtn('restartBtn', startGame);
setupBtn('restartPause', startGame);
setupBtn('menuBtn', goToMenu);
setupBtn('menuBtn2', goToMenu);

setupBtn('soundBtn', function() {
    const enabled = audio.toggle();
    document.getElementById('soundBtn').textContent = enabled ? translations[currentLang].sound : translations[currentLang].noSound;
});

setupBtn('fullscreenBtn', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());

if (!ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
    };
}

updateRecordDisplay();
setLanguage('ru');
requestAnimationFrame(gameLoop);
