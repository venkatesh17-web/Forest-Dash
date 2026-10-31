/**
 * FOREST DASH: SPIRIT RUNNER
 * Coin & Collectible System
 * 
 * Manages golden coin trails, jump arcs, 3D rotating sheen animations,
 * magnet pulling physics, and collection particle sparks.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.CoinManager = class CoinManager {
    constructor() {
        this.coins = [];
        this.distanceSinceSpawn = 0;
        this.nextSpawnDistance = 220;
        this.animTime = 0;
        this.groundY = window.ForestDash.Config.PHYSICS.GROUND_Y;
    }

    reset() {
        this.coins = [];
        this.distanceSinceSpawn = 0;
        this.nextSpawnDistance = 200;
        this.animTime = 0;
    }

    update(dt, speed, player) {
        this.animTime += dt;
        this.distanceSinceSpawn += speed * dt;

        const magnetRadius = window.ForestDash.Config.COINS.MAGNET_RADIUS;
        const magnetSpeed = window.ForestDash.Config.COINS.MAGNET_SPEED;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;

        // Update active coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            // Magnet attraction
            if (player.hasMagnet && !coin.collected) {
                const dist = window.ForestDash.Physics.distance(playerCenterX, playerCenterY, coin.x, coin.y);
                if (dist < magnetRadius) {
                    const angle = Math.atan2(playerCenterY - coin.y, playerCenterX - coin.x);
                    coin.x += Math.cos(angle) * magnetSpeed * dt;
                    coin.y += Math.sin(angle) * magnetSpeed * dt;
                } else {
                    coin.x -= speed * dt;
                }
            } else {
                coin.x -= speed * dt;
            }

            // Remove off-screen coins
            if (coin.x < -50 || coin.collected) {
                this.coins.splice(i, 1);
            }
        }

        // Periodic coin group spawning
        if (this.distanceSinceSpawn >= this.nextSpawnDistance) {
            this.spawnCoinGroup();
            this.distanceSinceSpawn = 0;
            this.nextSpawnDistance = 280 + Math.random() * 260;
        }
    }

    spawnCoinGroup() {
        const patterns = ['line', 'arc', 'high_trail'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        const startX = 990;

        if (pattern === 'line') {
            // Horizontal line along ground
            const count = 3 + Math.floor(Math.random() * 3);
            const y = this.groundY - 32;
            for (let i = 0; i < count; i++) {
                this.addCoin(startX + i * 42, y);
            }
        } else if (pattern === 'arc') {
            // Parabolic jump arc guiding jump over obstacles
            const count = 5;
            const apexHeight = 110;
            for (let i = 0; i < count; i++) {
                const t = i / (count - 1); // 0 to 1
                // Parabola: 4 * t * (1 - t) has maximum 1 at t=0.5
                const arcY = this.groundY - 32 - (4 * t * (1 - t) * apexHeight);
                this.addCoin(startX + i * 44, arcY);
            }
        } else if (pattern === 'high_trail') {
            // High aerial line requiring jump or double jump
            const count = 4;
            const y = this.groundY - 110;
            for (let i = 0; i < count; i++) {
                this.addCoin(startX + i * 42, y);
            }
        }
    }

    addCoin(x, y) {
        this.coins.push({
            x,
            y,
            radius: window.ForestDash.Config.COINS.SIZE / 2,
            collected: false,
            animOffset: Math.random() * Math.PI * 2
        });
    }

    /**
     * Check if player collides with any coins
     * Returns total coins collected this frame (accounting for multiplier)
     */
    checkCollection(player) {
        let collectedCount = 0;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const collectRadius = (player.width / 2) + 12;

        for (let coin of this.coins) {
            if (coin.collected) continue;

            const dist = window.ForestDash.Physics.distance(playerCenterX, playerCenterY, coin.x, coin.y);
            if (dist <= collectRadius + coin.radius) {
                // Collect coin!
                coin.collected = true;
                const multiplier = player.hasMultiplier ? 2 : 1;
                collectedCount += (1 * multiplier);

                // Sound & Sparkles
                window.ForestDash.Audio.playCoin();
                window.ForestDash.ParticleSystem.spawnCoinSparkles(coin.x, coin.y, 8, player.hasMultiplier);

                const text = multiplier > 1 ? '+2' : '+1';
                const textColor = multiplier > 1 ? '#e040fb' : '#ffd700';
                window.ForestDash.ParticleSystem.spawnFloatingText(coin.x, coin.y - 12, text, textColor, 16);
            }
        }

        return collectedCount;
    }

    draw(ctx) {
        const time = this.animTime * window.ForestDash.Config.COINS.ROTATION_SPEED;

        for (let coin of this.coins) {
            if (coin.x < -30 || coin.x > 1000) continue;

            ctx.save();
            ctx.translate(coin.x, coin.y);

            // 3D spinning coin scale effect
            const spin = Math.cos(time + coin.animOffset);
            const scaleX = Math.max(0.12, Math.abs(spin));

            ctx.scale(scaleX, 1);

            // Outer Radiant Golden Glow (from reference image)
            ctx.shadowColor = '#ffd600';
            ctx.shadowBlur = 12;

            // Outer Rim
            const rimGrad = ctx.createLinearGradient(-coin.radius, -coin.radius, coin.radius, coin.radius);
            rimGrad.addColorStop(0, '#fff59d');
            rimGrad.addColorStop(0.3, '#ffea00');
            rimGrad.addColorStop(0.7, '#ffb300');
            rimGrad.addColorStop(1, '#ff8f00');
            ctx.fillStyle = rimGrad;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner Raised Coin Face
            const innerGrad = ctx.createLinearGradient(-coin.radius * 0.7, -coin.radius * 0.7, coin.radius * 0.7, coin.radius * 0.7);
            innerGrad.addColorStop(0, '#fffde7');
            innerGrad.addColorStop(0.4, '#ffd600');
            innerGrad.addColorStop(1, '#f57f17');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius * 0.76, 0, Math.PI * 2);
            ctx.fill();

            // Inner Star Motif (matching reference image)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff8f00';
            const s = coin.radius * 0.48;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const aOuter = -Math.PI / 2 + (i * Math.PI * 2) / 5;
                const aInner = aOuter + Math.PI / 5;
                const xO = Math.cos(aOuter) * s;
                const yO = Math.sin(aOuter) * s;
                const xI = Math.cos(aInner) * (s * 0.45);
                const yI = Math.sin(aInner) * (s * 0.45);
                if (i === 0) ctx.moveTo(xO, yO);
                else ctx.lineTo(xO, yO);
                ctx.lineTo(xI, yI);
            }
            ctx.closePath();
            ctx.fill();

            // Bright Sheen Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(-coin.radius * 0.28, -coin.radius * 0.28, coin.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
};

