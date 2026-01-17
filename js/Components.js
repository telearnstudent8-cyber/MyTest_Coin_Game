/**
 * Components.js - 遊戲物件類別
 */

class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.size = 24;
        this.speed = 6;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -50 || this.x > 850 || this.y < -50 || this.y > 650) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#f43f5e";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.restore();
    }

    getRect() {
        return { x: this.x - 12, y: this.y - 12, width: 24, height: 24 };
    }
}

class AerialEnemy {
    constructor(resourceManager) {
        this.rm = resourceManager;
        this.size = 200;
        this.x = -this.size;
        this.y = 20;
        this.speed = 4;
        this.direction = 1;
        this.shootCooldown = 120;
        this.timer = 0;
        this.active = false;
    }

    update(playerHitbox, score, bullets) {
        if (score < 3000) {
            this.active = false;
            return;
        }
        this.active = true;
        this.x += this.speed * this.direction;

        if (this.x + this.size >= 800) this.direction = -1;
        else if (this.x <= 0) this.direction = 1;

        this.timer++;
        if (this.timer >= this.shootCooldown) {
            this.timer = 0;
            bullets.push(new Bullet(this.x + this.size / 2, this.y + this.size / 2, playerHitbox.x + playerHitbox.width / 2, playerHitbox.y + playerHitbox.height / 2));
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const img = this.rm.get('player_jump');
        if (img) {
            ctx.drawImage(img, this.x, this.y, this.size, this.size);
        } else {
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }
}

class LaserCannon {
    constructor(unlockScore) {
        this.unlockScore = unlockScore;
        this.active = false;
        this.cooldown = 300;
        this.timer = Math.floor(Math.random() * 100);
        this.warningDuration = 120;
        this.fireDuration = 30;
        this.width = 160;
        this.x = 0;
        this.isFiring = false;
        this.isWarning = false;
    }

    update(score) {
        if (score < this.unlockScore) {
            this.active = false;
            this.reset();
            return;
        }
        this.active = true;
        this.timer++;
        const cycle = this.timer % this.cooldown;

        if (cycle === 1) {
            this.x = Math.random() * (800 - this.width);
            this.isWarning = true;
            this.isFiring = false;
        } else if (cycle === this.warningDuration) {
            this.isWarning = false;
            this.isFiring = true;
        } else if (cycle === this.warningDuration + this.fireDuration) {
            this.isFiring = false;
        }
    }

    reset() {
        this.timer = Math.floor(Math.random() * 100);
        this.isFiring = false;
        this.isWarning = false;
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.fillStyle = "#475569";
        ctx.fillRect(this.x, 0, this.width, 25);
        ctx.strokeStyle = "white";
        ctx.strokeRect(this.x, 0, this.width, 25);

        if (this.isWarning) {
            ctx.fillStyle = "rgba(244, 63, 94, 0.3)";
            ctx.fillRect(this.x, 0, this.width, 600);
            if (Math.floor(this.timer / 10) % 2 === 0) {
                ctx.strokeStyle = "#f43f5e";
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, 0, this.width, 600);
            }
        }

        if (this.isFiring) {
            ctx.fillStyle = "rgba(244, 63, 94, 0.8)";
            ctx.fillRect(this.x, 0, this.width, 600);
            ctx.fillStyle = "white";
            ctx.fillRect(this.x + this.width / 2 - 15, 0, 30, 600);
        }
    }

    checkCollision(targetHitbox, shieldActive, shieldRect) {
        if (!this.isFiring) return false;
        const rect = { x: this.x, y: 0, width: this.width, height: 600 };
        if (shieldActive && rectsOverlap(rect, shieldRect)) return false;
        return rectsOverlap(rect, targetHitbox);
    }
}

class GroundSpikes {
    constructor() {
        this.active = false;
        this.cooldown = 180;
        this.timer = 0;
        this.warningDuration = 60;
        this.attackDuration = 40;
        this.width = 300;
        this.height = 120;
        this.x = 0;
        this.isAttacking = false;
        this.isWarning = false;
    }

    update(score) {
        if (score < 2500) {
            this.active = false;
            this.reset();
            return;
        }
        this.active = true;
        this.timer++;
        const cycle = this.timer % this.cooldown;

        if (cycle === 1) {
            this.x = Math.random() * (800 - this.width);
            this.isWarning = true;
            this.isAttacking = false;
        } else if (cycle === this.warningDuration) {
            this.isWarning = false;
            this.isAttacking = true;
        } else if (cycle === this.warningDuration + this.attackDuration) {
            this.isAttacking = false;
        }
    }

    reset() {
        this.timer = 0;
        this.isAttacking = false;
        this.isWarning = false;
    }

    draw(ctx) {
        if (!this.active) return;
        if (this.isWarning) {
            ctx.fillStyle = "#f43f5e";
            ctx.fillRect(this.x, 590, this.width, 10);
        }
        if (this.isAttacking) {
            const numSpikes = 6;
            const spikeW = this.width / numSpikes;
            ctx.fillStyle = "#94a3b8";
            ctx.strokeStyle = "white";
            for (let i = 0; i < numSpikes; i++) {
                const bx = this.x + i * spikeW;
                ctx.beginPath();
                ctx.moveTo(bx, 600);
                ctx.lineTo(bx + spikeW / 2, 600 - this.height);
                ctx.lineTo(bx + spikeW, 600);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    checkCollision(targetHitbox) {
        if (!this.isAttacking) return false;
        const rect = { x: this.x, y: 600 - this.height, width: this.width, height: this.height };
        return rectsOverlap(rect, targetHitbox);
    }
}

class Coin {
    constructor(score, isPenalty, hasClearedPenalty, resourceManager) {
        this.type = "normal";
        let size, hit, asset;
        
        if (isPenalty) {
            size = 180; hit = 100; asset = 'flag3'; this.type = "penalty";
        } else if (hasClearedPenalty) {
            size = 80; hit = 70; asset = 'flag';
        } else if (score >= 500) {
            size = 120; hit = 100; asset = 'player_jump';
        } else if (score >= 100) {
            size = 90; hit = 80; asset = 'flag2';
        } else {
            size = 70; hit = 60; asset = 'flag';
        }

        this.size = size;
        this.hitSize = hit;
        this.x = Math.random() * (800 - size);
        this.y = -size;
        this.speed = 5;
        this.img = resourceManager.get(asset);
        this.active = true;
    }

    update() {
        this.y += this.speed;
        if (this.y > 600) this.active = false;
    }

    draw(ctx) {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
        } else {
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = this.type === "penalty" ? "#f43f5e" : "#fbbf24";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    getHitbox() {
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;
        return {
            x: cx - this.hitSize / 2,
            y: cy - this.hitSize / 2,
            width: this.hitSize,
            height: this.hitSize
        };
    }
}

function rectsOverlap(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}
