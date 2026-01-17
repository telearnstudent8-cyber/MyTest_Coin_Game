/**
 * game.js - 核心遊戲流程
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const rm = new ResourceManager();
const manifest = [
    { name: 'player', path: 'assets/player.png' },
    { name: 'player2', path: 'assets/player2.png' },
    { name: 'player_jump', path: 'assets/player_jump.png' },
    { name: 'player2_jump', path: 'assets/player2_jump.png' },
    { name: 'flag', path: 'assets/flag.jpg' },
    { name: 'flag2', path: 'assets/flag2.png' },
    { name: 'flag3', path: 'assets/flag3.png' }
];

// 遊戲狀態
let gameState = 'loading'; // loading, selector, playing, gameover

// 背景星空生成
function createStars() {
    const container = document.querySelector('.stars-container');
    const count = 150;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = 2 + Math.random() * 4;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.setProperty('--duration', `${duration}s`);
        container.appendChild(star);
    }
}
createStars();

let score = 0;
let isPenaltyMode = false;
let hasClearedPenalty = false;
let penaltyTimer = 0;
const PENALTY_DURATION = 300;
let isDead = false;
let deathTimer = 0;

let player = null;
let coins = [];
let bullets = [];
let laserCannons = [new LaserCannon(2000), new LaserCannon(4000)];
let groundSpikes = new GroundSpikes();
let aerialEnemy = new AerialEnemy(rm);
let coinCounter = 0;

// 商店資料
let shopData = {
    isOpen: false,
    shieldCount: 0,
    hasBlockSkill: false
};

// 玩家類別
class Player {
    constructor(baseName) {
        this.baseName = baseName;
        this.speed = 7;
        this.jumpStrength = -15;
        this.gravity = 0.8;
        this.vy = 0;
        this.isJumping = false;
        this.level = 1;
        this.size = 200;
        this.x = 400 - this.size/2;
        this.y = 600 - this.size - 10;
        this.groundY = 600 - 10;
        
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldDuration = 300;
        this.shieldWidth = 500;
        this.shieldHeight = 40;
        
        this.isBlocking = false;
    }

    update(keys) {
        if (isDead) return;

        this.isBlocking = (keys['f'] || keys['F']) && shopData.hasBlockSkill;
        let moveSpeed = this.isBlocking ? 2 : this.speed;

        if (keys['ArrowLeft']) this.x -= moveSpeed;
        if (keys['ArrowRight']) this.x += moveSpeed;

        this.vy += this.gravity;
        this.y += this.vy;

        if (this.y + this.size >= this.groundY) {
            this.y = this.groundY - this.size;
            this.vy = 0;
            this.isJumping = false;
        }

        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shieldActive = false;
        }

        // 邊界限制
        const hit = this.getHitbox();
        if (hit.x < 0) this.x -= hit.x;
        if (hit.x + hit.width > 800) this.x -= (hit.x + hit.width - 800);
    }

    jump() {
        if (!this.isJumping && !this.isBlocking) {
            this.vy = this.jumpStrength;
            this.isJumping = true;
        }
    }

    activateShield() {
        if (shopData.shieldCount > 0 && !this.shieldActive) {
            shopData.shieldCount--;
            this.shieldActive = true;
            this.shieldTimer = this.shieldDuration;
            updateHUD();
        }
    }

    getHitbox() {
        // 跟 Python 版一致，內縮判定
        return {
            x: this.x + this.size * 0.375,
            y: this.y + this.size * 0.2,
            width: this.size * 0.25,
            height: this.size * 0.6
        };
    }

    getShieldRect() {
        return {
            x: this.x + this.size/2 - this.shieldWidth/2,
            y: this.y - 20,
            width: this.shieldWidth,
            height: this.shieldHeight
        };
    }

    draw(ctx) {
        let suffix = "";
        if (isPenaltyMode || this.level >= 2) suffix = "2";
        let state = this.isJumping ? "_jump" : "";
        let imgName = this.baseName + suffix + state;
        let img = rm.get(imgName) || rm.get(this.baseName + state) || rm.get(this.baseName);

        if (img) {
            ctx.drawImage(img, this.x, this.y, this.size, this.size);
        } else {
            ctx.fillStyle = this.level === 1 ? "white" : "#10b981";
            ctx.fillRect(this.x + 20, this.y + 20, this.size - 40, this.size - 40);
        }

        if (this.shieldActive) {
            const s = this.getShieldRect();
            ctx.fillStyle = "rgba(100, 200, 255, 0.7)";
            ctx.strokeStyle = "white";
            roundRect(ctx, s.x, s.y, s.width, s.height, 15, true, true);
        }

        if (this.isBlocking) {
            ctx.beginPath();
            ctx.arc(this.x + this.size/2, this.y + this.size/2, 100, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }

    checkEvolution(currentScore) {
        if (currentScore < 0 && !isDead) {
            triggerDeath();
            return;
        }

        if (currentScore >= 1500 && !isPenaltyMode && !hasClearedPenalty) {
            isPenaltyMode = true;
            penaltyTimer = PENALTY_DURATION;
        }

        if (isPenaltyMode) {
            penaltyTimer--;
            if (penaltyTimer <= 0) {
                isPenaltyMode = false;
                hasClearedPenalty = true;
                this.level = 1;
            }
        }

        if (!isPenaltyMode && !isDead) {
            if (this.level === 1 && currentScore >= 100) {
                this.level = 2;
            }
        }
    }
}

// 輔助函式
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function triggerDeath() {
    if (!isDead) {
        isDead = true;
        deathTimer = 120;
        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('final-score-val').innerText = score;
    }
}

function resetGame() {
    score = 0;
    isPenaltyMode = false;
    hasClearedPenalty = false;
    penaltyTimer = 0;
    isDead = false;
    coins = [];
    bullets = [];
    laserCannons.forEach(lc => lc.reset());
    groundSpikes.reset();
    shopData = { isOpen: false, shieldCount: 0, hasBlockSkill: false };
    
    player = new Player(selectedChar);
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('shop-screen').classList.add('hidden');
    updateHUD();
}

// 事件監聽
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (gameState === 'playing' && !isDead) {
        if (e.key === ' ') player.jump();
        if (e.key === 'x' || e.key === 'X') player.activateShield();
        if (e.key === 's' || e.key === 'S') toggleShop();
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);

// UI 邏輯
let selectedChar = 'player';
document.querySelectorAll('.char-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.char-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedChar = opt.dataset.char;
    });
});

document.getElementById('start-btn').addEventListener('click', () => {
    gameState = 'playing';
    player = new Player(selectedChar);
    document.getElementById('selector-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
});

function toggleShop() {
    shopData.isOpen = !shopData.isOpen;
    if (shopData.isOpen) {
        document.getElementById('shop-screen').classList.remove('hidden');
    } else {
        document.getElementById('shop-screen').classList.add('hidden');
    }
    updateShopButtons();
}

document.getElementById('close-shop').addEventListener('click', toggleShop);

function updateHUD() {
    document.getElementById('score-display').innerText = score;
    document.getElementById('shield-count').innerText = shopData.shieldCount;
    document.getElementById('block-status').innerText = shopData.hasBlockSkill ? "已就緒" : "未解鎖";
    
    if (isPenaltyMode) {
        document.getElementById('penalty-timer-container').classList.remove('hidden');
        document.getElementById('penalty-timer').innerText = Math.ceil(penaltyTimer / 60) + "s";
    } else {
        document.getElementById('penalty-timer-container').classList.add('hidden');
    }
}

function updateShopButtons() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        const type = btn.parentElement.dataset.type;
        if (score < cost || (type === 'block_skill' && shopData.hasBlockSkill)) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
}

document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const cost = parseInt(btn.dataset.cost);
        const type = btn.parentElement.dataset.type;
        if (score >= cost) {
            score -= cost;
            applyItem(type);
            updateHUD();
            updateShopButtons();
        }
    });
});

function applyItem(type) {
    if (type === 'speed') player.speed += 2;
    if (type === 'jump') player.jumpStrength -= 3;
    if (type === 'shield') shopData.shieldCount++;
    if (type === 'block_skill') shopData.hasBlockSkill = true;
}

// 主遊戲迴圈
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        if (!shopData.isOpen && !isDead) {
            player.checkEvolution(score);
            player.update(keys);
            
            laserCannons.forEach(lc => {
                lc.update(score);
                if (lc.checkCollision(player.getHitbox(), player.shieldActive, player.getShieldRect())) {
                    triggerDeath();
                }
            });

            groundSpikes.update(score);
            if (groundSpikes.checkCollision(player.getHitbox())) {
                triggerDeath();
            }

            aerialEnemy.update(player.getHitbox(), score, bullets);
            
            bullets.forEach((b, i) => {
                b.update();
                if (player.shieldActive && rectsOverlap(b.getRect(), player.getShieldRect())) {
                    b.active = false;
                } else if (player.isBlocking && rectsOverlap(b.getRect(), player.getHitbox())) {
                    b.active = false;
                } else if (rectsOverlap(b.getRect(), player.getHitbox())) {
                    triggerDeath();
                }
                if (!b.active) bullets.splice(i, 1);
            });

            coinCounter++;
            let freq = isPenaltyMode ? 1 : 45;
            if (coinCounter % freq === 0) {
                coins.push(new Coin(score, isPenaltyMode, hasClearedPenalty, rm));
            }

            coins.forEach((c, i) => {
                c.update();
                const hit = c.getHitbox();
                if (c.y > 600) {
                    if (!isPenaltyMode && c.type === "normal") score -= 5;
                    c.active = false;
                } else if (player.shieldActive && rectsOverlap(hit, player.getShieldRect())) {
                    c.active = false;
                } else if (player.isBlocking && rectsOverlap(hit, player.getHitbox())) {
                    c.active = false;
                } else if (rectsOverlap(hit, player.getHitbox())) {
                    score += c.type === "penalty" ? -100 : 100;
                    c.active = false;
                }
                if (!c.active) coins.splice(i, 1);
            });

            updateHUD();
        }

        player.draw(ctx);
        coins.forEach(c => c.draw(ctx));
        bullets.forEach(b => b.draw(ctx));
        laserCannons.forEach(lc => lc.draw(ctx));
        groundSpikes.draw(ctx);
        aerialEnemy.draw(ctx);

        if (isDead) {
            deathTimer--;
            if (deathTimer <= 0) resetGame();
        }
    }

    requestAnimationFrame(gameLoop);
}

// 啟動載入
rm.onProgress = progress => {
    document.getElementById('progress-fill').style.width = (progress * 100) + "%";
};
rm.onComplete = () => {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('selector-screen').classList.remove('hidden');
        gameState = 'selector';
    }, 500);
};

rm.load(manifest);
gameLoop();
