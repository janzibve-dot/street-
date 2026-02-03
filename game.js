// ============== AUDIO SYSTEM ==============
class AudioController {
    constructor() { this.ctx = null; this.enabled = true; this.engineOsc = null; this.engineGain = null; this.initialized = false; }
    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext(); this.initialized = true;
        this.engineOsc = this.ctx.createOscillator(); this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 50;
        this.engineGain.gain.value = 0; this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination); this.engineOsc.start();
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    toggle() { this.enabled = !this.enabled; return this.enabled; }
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled || !this.ctx) return; this.resume();
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    }
    playClick() { this.playTone(800, 'sine', 0.1, 0.1); }
    playHover() { this.playTone(400, 'triangle', 0.05, 0.05); }
    playStart() { this.playTone(200, 'sawtooth', 0.5, 0.2); }
    playBonus(type) { this.playTone(1000, 'sine', 0.2, 0.1); }
    playCrash() { this.playTone(100, 'sawtooth', 0.5, 0.4); }
    updateEngine(speed, maxSpeed) {
        if (!this.enabled || !this.ctx || !this.engineOsc) return;
        const ratio = Math.min(1, speed / maxSpeed);
        this.engineOsc.frequency.setTargetAtTime(60 + 140 * ratio, this.ctx.currentTime, 0.1);
        this.engineGain.gain.setTargetAtTime(speed > 10 ? 0.08 : 0.03, this.ctx.currentTime, 0.1);
    }
    stopEngine() { if (this.engineGain) this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); }
}

const audio = new AudioController();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas(); window.addEventListener('resize', resizeCanvas);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// ============== GYRO SENSOR ==============
let tilt = { beta: 0, gamma: 0 };
if (isMobile) {
    window.addEventListener('deviceorientation', (e) => {
        tilt.beta = e.beta; // Наклон вперед/назад
        tilt.gamma = e.gamma; // Наклон влево/вправо
    });
}

const translations = { ru: { distance: "Дистанция", fuel: "⛽ Топливо", record: "🏆 Рекорд", start: "▶ СТАРТ", modeTouch: "📱 Управление: Тач" }, en: { distance: "Distance", fuel: "⛽ Fuel", record: "🏆 Record", start: "▶ START", modeTouch: "📱 Control: Touch" } };
let currentLang = 'ru';

const game = { state: 'menu', distance: 0, maxSpeed: 0, fuelCollected: 0, difficulty: 1, worldSpeed: 0, lives: 3 };
const car = { x: 0, y: 0, width: 60, height: 100, speed: 0, maxSpeed: 220, acceleration: 1.2, deceleration: 0.3, brakeForce: 1.5, turnSpeed: 0, maxTurnSpeed: 22, turnAccel: 1.6, friction: 0.88, tilt: 0 };
const fuel = { current: 100, max: 100 };
const road = { width: 600, lanes: 5, markingOffset: 0 };
const keys = { up: false, down: false, left: false, right: false, brake: false };

let obstacles = []; let bonuses = []; let spawnTimer = 0;

function init() {
    audio.init(); car.x = canvas.width / 2; car.y = canvas.height * 0.82; car.speed = 0;
    fuel.current = 100; game.distance = 0; game.lives = 3; obstacles = []; bonuses = [];
}

function update(dt) {
    if (game.state !== 'playing') return;
    audio.updateEngine(car.speed, car.maxSpeed);
    const deltaTime = Math.min(dt, 50);

    let gas = keys.up; let brake = keys.down || keys.brake;
    let turnLeft = keys.left; let turnRight = keys.right;

    if (isMobile) {
        // GYRO CONTROLS
        if (tilt.gamma < -10) turnLeft = true;
        if (tilt.gamma > 10) turnRight = true;
        if (tilt.beta < 40) gas = true; // Наклон от себя - ГАЗ
        if (tilt.beta > 70) brake = true; // Наклон на себя - ТОРМОЗ
    }

    if (gas) car.speed = Math.min(car.speed + car.acceleration, car.maxSpeed);
    if (brake) car.speed = Math.max(car.speed - car.brakeForce, 0);
    if (!gas && !brake) car.speed = Math.max(car.speed - car.deceleration, 30);

    if (turnLeft) car.turnSpeed = Math.max(car.turnSpeed - car.turnAccel, -car.maxTurnSpeed);
    else if (turnRight) car.turnSpeed = Math.min(car.turnSpeed + car.turnAccel, car.maxTurnSpeed);
    else car.turnSpeed *= car.friction;

    car.x += car.turnSpeed;
    const roadLeft = (canvas.width - road.width) / 2 + car.width / 2;
    car.x = Math.max(roadLeft, Math.min(canvas.width - roadLeft, car.x));
    
    game.worldSpeed = car.speed * 0.1;
    game.distance += car.speed * 0.0001 * deltaTime;
    fuel.current -= 0.01 * deltaTime;
    if (fuel.current <= 0) gameOver();

    spawnTimer += deltaTime;
    if (spawnTimer > 1000) {
        spawnTimer = 0;
        obstacles.push({ x: (canvas.width - road.width)/2 + Math.random() * road.width, y: -100, w: 50, h: 50 });
    }

    obstacles.forEach((obs, i) => {
        obs.y += 5 + game.worldSpeed;
        if (obs.y > canvas.height) obstacles.splice(i, 1);
        if (Math.abs(car.x - obs.x) < 40 && Math.abs(car.y - obs.y) < 60) gameOver();
    });

    updateHUD();
}

function updateHUD() {
    document.getElementById('distance').textContent = game.distance.toFixed(1) + ' km';
    document.getElementById('speedValue').textContent = Math.floor(car.speed);
    document.getElementById('fuelFill').style.width = fuel.current + '%';
    document.getElementById('speedNeedle').style.transform = `translateX(-50%) rotate(${-90 + (car.speed/car.maxSpeed)*180}deg)`;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a3a'; ctx.fillRect((canvas.width - road.width)/2, 0, road.width, canvas.height);
    ctx.fillStyle = 'red'; obstacles.forEach(obs => ctx.fillRect(obs.x - 25, obs.y - 25, 50, 50));
    ctx.fillStyle = '#1155dd'; ctx.fillRect(car.x - 30, car.y - 50, 60, 100);
}

function gameLoop(t) { update(t - lastT); lastT = t; draw(); requestAnimationFrame(gameLoop); }
let lastT = 0;
function startGame() { init(); audio.playStart(); game.state = 'playing'; hideAllScreens(); }
function gameOver() { game.state = 'gameOver'; audio.playCrash(); document.getElementById('gameOverScreen').classList.add('active'); }
function hideAllScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); }

document.addEventListener('keydown', e => { if(e.code==='KeyW')keys.up=true; if(e.code==='KeyS')keys.down=true; if(e.code==='KeyA')keys.left=true; if(e.code==='KeyD')keys.right=true; });
document.addEventListener('keyup', e => { if(e.code==='KeyW')keys.up=false; if(e.code==='KeyS')keys.down=false; if(e.code==='KeyA')keys.left=false; if(e.code==='KeyD')keys.right=false; });

document.getElementById('touchLeft').ontouchstart = e => { e.preventDefault(); keys.left = true; };
document.getElementById('touchLeft').ontouchend = () => keys.left = false;
document.getElementById('touchRight').ontouchstart = e => { e.preventDefault(); keys.right = true; };
document.getElementById('touchRight').ontouchend = () => keys.right = false;
document.getElementById('touchBrake').ontouchstart = e => { e.preventDefault(); keys.brake = true; };
document.getElementById('touchBrake').ontouchend = () => keys.brake = false;

document.getElementById('startBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;

requestAnimationFrame(gameLoop);
