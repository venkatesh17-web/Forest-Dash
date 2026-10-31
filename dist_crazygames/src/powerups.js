/**
 * FOREST DASH: SPIRIT RUNNER
 * Power-Up System
 * 
 * Spawns floating magical orbs in the world and manages active durations:
 * - Spirit Shield (absorbs 1 collision)
 * - Coin Magnet (9-second coin attractor)
 * - 2X Multiplier (10-second doubled coin and score rewards)
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.PowerUpManager = class PowerUpManager {
    constructor() {
        this.items = [];
        this.activePowerUps = {};
        this.spawnTimer = 0;
        this.nextSpawnTime = 16;
        this.groundY = window.ForestDash.Config.PHYSICS.GROUND_Y;
        this.animTime = 0;
    }

    reset() {
        this.items = [];
        this.activePowerUps = {};
        this.spawnTimer = 0;
        this.nextSpawnTime = 14 + Math.random() * 8;
        this.animTime = 0;
    }

    update(dt, speed, player) {
        this.animTime += dt;
        this.spawnTimer += dt;

        // Move floating power-up orbs
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.x -= speed * dt;

            // Remove off-screen items
            if (item.x < -60 || item.collected) {
                this.items.splice(i, 1);
            }
        }

        // Spawn timer
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawnPowerUp();
            this.spawnTimer = 0;
            const minTime = window.ForestDash.Config.POWERUPS.SPAWN_INTERVAL_MIN;
            const maxTime = window.ForestDash.Config.POWERUPS.SPAWN_INTERVAL_MAX;
            this.nextSpawnTime = minTime + Math.random() * (maxTime - minTime);
        }

        // Update active power-ups countdowns
        for (const id in this.activePowerUps) {
            const p = this.activePowerUps[id];
            if (p.duration > 0) {
                p.remaining -= dt;
                if (p.remaining <= 0) {
                    this.deactivate(id, player);
                }
            }
        }

        // Keep player aura states synced
        player.hasShield = !!this.activePowerUps.shield;
        player.hasMagnet = !!this.activePowerUps.magnet;
        player.hasMultiplier = !!this.activePowerUps.multiplier;
    }

    spawnPowerUp() {
        const types = window.ForestDash.Config.POWERUPS.TYPES;
        const keys = Object.keys(types);
        const pickedKey = keys[Math.floor(Math.random() * keys.length)];
        const def = types[pickedKey];

        this.items.push({
            id: def.id,
            name: def.name,
            icon: def.icon,
            color: def.color,
            auraColor: def.auraColor,
            x: 1040,
            y: this.groundY - 110, // Floats comfortably in jump range
            radius: window.ForestDash.Config.POWERUPS.SIZE / 2,
            collected: false,
            animOffset: Math.random() * Math.PI * 2
        });
    }

    checkCollection(player) {
        const pCenterX = player.x + player.width / 2;
        const pCenterY = player.y + player.height / 2;
        const collectRadius = (player.width / 2) + 16;

        for (let item of this.items) {
            if (item.collected) continue;

            const dist = window.ForestDash.Physics.distance(pCenterX, pCenterY, item.x, item.y);
            if (dist <= collectRadius + item.radius) {
                item.collected = true;
                this.activate(item.id, player);
                window.ForestDash.Audio.playPowerup();
                window.ForestDash.ParticleSystem.spawnCoinSparkles(item.x, item.y, 20, true);
                window.ForestDash.ParticleSystem.spawnFloatingText(item.x, item.y - 15, item.name + '!', item.color, 18);
                return item;
            }
        }
        return null;
    }

    activate(id, player) {
        const def = window.ForestDash.Config.POWERUPS.TYPES[id.toUpperCase()];
        if (!def) return;

        this.activePowerUps[id] = {
            id: def.id,
            name: def.name,
            icon: def.icon,
            color: def.color,
            duration: def.duration,
            remaining: def.duration,
            charges: def.charges || 1
        };

        if (id === 'shield') player.hasShield = true;
        if (id === 'magnet') player.hasMagnet = true;
        if (id === 'multiplier') player.hasMultiplier = true;
    }

    deactivate(id, player) {
        delete this.activePowerUps[id];
        if (id === 'shield') player.hasShield = false;
        if (id === 'magnet') player.hasMagnet = false;
        if (id === 'multiplier') player.hasMultiplier = false;
    }

    getActivePowerUpsList() {
        return Object.values(this.activePowerUps);
    }

    draw(ctx) {
        const time = this.animTime;

        for (let item of this.items) {
            if (item.x < -40 || item.x > 1050) continue;

            ctx.save();
            const bobY = Math.sin(time * 4 + item.animOffset) * 6;
            ctx.translate(item.x, item.y + bobY);

            // Shimmering outer glow
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 14;

            // Orb Background Sphere
            const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, item.radius);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, item.color);
            grad.addColorStop(1, '#1a0033');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
            ctx.fill();

            // Rotating ethereal orbit ring
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.8;
            ctx.save();
            ctx.rotate(time * 3);
            ctx.beginPath();
            ctx.ellipse(0, 0, item.radius * 1.3, item.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Emoji / Icon
            ctx.font = '16px "Segoe UI Emoji", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.icon, 0, 1);

            ctx.restore();
        }
    }
};

