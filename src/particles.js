/**
 * FOREST DASH: SPIRIT RUNNER
 * Visual FX & Particle System
 * 
 * Manages run dust, jump trails, coin sparkles, floating autumn leaves,
 * glowing fireflies, floating score texts, and screen shake.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.ParticleSystem = (function() {
    const particles = [];
    const floatingTexts = [];
    let screenShakeAmount = 0;
    let screenShakeX = 0;
    let screenShakeY = 0;

    class Particle {
        constructor() {
            this.active = false;
        }

        init(x, y, vx, vy, size, color, life, type = 'circle', alphaDecay = true) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.initialSize = size;
            this.color = color;
            this.life = life;
            this.maxLife = life;
            this.type = type;
            this.alphaDecay = alphaDecay;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 6;
            this.active = true;
        }

        update(dt) {
            if (!this.active) return;
            this.life -= dt;
            if (this.life <= 0) {
                this.active = false;
                return;
            }

            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.rotation += this.rotSpeed * dt;

            // Gravity on dust & leaves
            if (this.type === 'dust') {
                this.vy += 80 * dt;
                this.size = Math.max(1, this.size - dt * 4);
            } else if (this.type === 'leaf') {
                this.vx += Math.sin(this.life * 4) * 20 * dt;
                this.vy = 40 + Math.cos(this.life * 3) * 15;
            } else if (this.type === 'spark') {
                this.vy += 120 * dt;
            }
        }

        draw(ctx) {
            if (!this.active) return;
            const progress = this.life / this.maxLife;
            const alpha = this.alphaDecay ? Math.max(0, Math.min(1, progress)) : 1;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.type === 'leaf') {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size, this.size * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'sparkle') {
                ctx.fillStyle = this.color;
                // 4-pointed star
                ctx.beginPath();
                const s = this.size;
                ctx.moveTo(0, -s);
                ctx.quadraticCurveTo(0, 0, s, 0);
                ctx.quadraticCurveTo(0, 0, 0, s);
                ctx.quadraticCurveTo(0, 0, -s, 0);
                ctx.quadraticCurveTo(0, 0, 0, -s);
                ctx.fill();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    class FloatingText {
        constructor() {
            this.active = false;
        }

        init(x, y, text, color, size = 18, duration = 0.8) {
            this.x = x;
            this.y = y;
            this.text = text;
            this.color = color;
            this.size = size;
            this.life = duration;
            this.maxLife = duration;
            this.active = true;
        }

        update(dt) {
            if (!this.active) return;
            this.life -= dt;
            if (this.life <= 0) {
                this.active = false;
                return;
            }
            this.y -= 45 * dt; // Float upward
        }

        draw(ctx) {
            if (!this.active) return;
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${this.size}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000000';
            ctx.fillText(this.text, this.x + 1, this.y + 1);
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    // Pre-allocate pools
    const MAX_P = window.ForestDash.Config.PARTICLES.MAX_PARTICLES;
    for (let i = 0; i < MAX_P; i++) {
        particles.push(new Particle());
    }

    const MAX_TEXTS = 20;
    for (let i = 0; i < MAX_TEXTS; i++) {
        floatingTexts.push(new FloatingText());
    }

    function getFreeParticle() {
        for (let i = 0; i < particles.length; i++) {
            if (!particles[i].active) return particles[i];
        }
        return particles[0]; // Recycle oldest
    }

    function getFreeFloatingText() {
        for (let i = 0; i < floatingTexts.length; i++) {
            if (!floatingTexts[i].active) return floatingTexts[i];
        }
        return floatingTexts[0];
    }

    return {
        // Screen Shake
        triggerShake(intensity = 8) {
            screenShakeAmount = Math.max(screenShakeAmount, intensity);
        },

        getScreenShake() {
            return { x: screenShakeX, y: screenShakeY };
        },

        // Spawn Effects
        spawnDust(x, y, count = 3) {
            for (let i = 0; i < count; i++) {
                const p = getFreeParticle();
                const vx = -40 - Math.random() * 50;
                const vy = -15 - Math.random() * 25;
                const size = 3 + Math.random() * 4;
                const colors = ['#8d6e63', '#a1887f', '#6d4c41'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                p.init(x, y, vx, vy, size, color, 0.35 + Math.random() * 0.2, 'dust');
            }
        },

        spawnLandingImpact(x, y) {
            for (let i = 0; i < 8; i++) {
                const p = getFreeParticle();
                const dir = (i % 2 === 0 ? 1 : -1);
                const vx = dir * (30 + Math.random() * 60);
                const vy = -10 - Math.random() * 35;
                const size = 3 + Math.random() * 4;
                p.init(x + (Math.random() - 0.5) * 16, y, vx, vy, size, '#8d6e63', 0.4, 'dust');
            }
        },

        spawnCoinSparkles(x, y, count = 10, bonus = false) {
            const colors = bonus ? ['#b388ff', '#ffeb3b', '#ffffff'] : ['#ffca28', '#ffd54f', '#ffffff', '#ff9800'];
            for (let i = 0; i < count; i++) {
                const p = getFreeParticle();
                const angle = Math.random() * Math.PI * 2;
                const speed = 60 + Math.random() * 120;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const size = 4 + Math.random() * 5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                p.init(x, y, vx, vy, size, color, 0.45 + Math.random() * 0.3, 'sparkle');
            }
        },

        spawnShieldBreak(x, y) {
            this.triggerShake(10);
            for (let i = 0; i < 20; i++) {
                const p = getFreeParticle();
                const angle = Math.random() * Math.PI * 2;
                const speed = 80 + Math.random() * 180;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const size = 3 + Math.random() * 6;
                const color = Math.random() > 0.5 ? '#00e5ff' : '#80d8ff';
                p.init(x, y, vx, vy, size, color, 0.5 + Math.random() * 0.3, 'spark');
            }
        },

        spawnHitSparks(x, y) {
            this.triggerShake(12);
            for (let i = 0; i < 16; i++) {
                const p = getFreeParticle();
                const angle = Math.random() * Math.PI * 2;
                const speed = 70 + Math.random() * 150;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const size = 3 + Math.random() * 4;
                p.init(x, y, vx, vy, size, '#ff5252', 0.4 + Math.random() * 0.25, 'spark');
            }
        },

        spawnFloatingText(x, y, text, color = '#ffeb3b', size = 18) {
            const ft = getFreeFloatingText();
            ft.init(x, y, text, color, size, 0.75);
        },

        update(dt) {
            // Decay Screen Shake
            if (screenShakeAmount > 0.1) {
                screenShakeX = (Math.random() * 2 - 1) * screenShakeAmount;
                screenShakeY = (Math.random() * 2 - 1) * screenShakeAmount;
                screenShakeAmount *= Math.max(0, 1 - dt * 8);
            } else {
                screenShakeAmount = 0;
                screenShakeX = 0;
                screenShakeY = 0;
            }

            // Update particles
            for (let i = 0; i < particles.length; i++) {
                if (particles[i].active) {
                    particles[i].update(dt);
                }
            }

            // Update floating texts
            for (let i = 0; i < floatingTexts.length; i++) {
                if (floatingTexts[i].active) {
                    floatingTexts[i].update(dt);
                }
            }
        },

        draw(ctx) {
            for (let i = 0; i < particles.length; i++) {
                if (particles[i].active) {
                    particles[i].draw(ctx);
                }
            }
            for (let i = 0; i < floatingTexts.length; i++) {
                if (floatingTexts[i].active) {
                    floatingTexts[i].draw(ctx);
                }
            }
        },

        reset() {
            particles.forEach(p => p.active = false);
            floatingTexts.forEach(ft => ft.active = false);
            screenShakeAmount = 0;
            screenShakeX = 0;
            screenShakeY = 0;
        }
    };
})();

