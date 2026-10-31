/**
 * FOREST DASH: SPIRIT RUNNER
 * Obstacle Generator & Collision Manager
 * 
 * Dynamically spawns fair, procedurally spaced obstacles:
 * - Mossy forest rocks
 * - Ancient fallen logs
 * - Twisted root snags
 * - Thorny briar bushes
 * - Low hanging ancient branches (slide under)
 * - Floating spirit brambles (run or slide under)
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.ObstacleManager = class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.distanceSinceLast = 0;
        this.nextSpawnDistance = 420;
        this.totalDistanceRun = 0;
        this.groundY = window.ForestDash.Config.PHYSICS.GROUND_Y;
    }

    reset() {
        this.obstacles = [];
        this.distanceSinceLast = 0;
        this.nextSpawnDistance = window.ForestDash.Config.OBSTACLES.SAFE_START_DISTANCE;
        this.totalDistanceRun = 0;
    }

    update(dt, speed) {
        this.totalDistanceRun += speed * dt;
        this.distanceSinceLast += speed * dt;

        // Move existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= speed * dt;

            // Remove offscreen
            if (obs.x + obs.width < -100) {
                this.obstacles.splice(i, 1);
            }
        }

        // Spawn next obstacle when ready
        if (this.distanceSinceLast >= this.nextSpawnDistance) {
            this.spawnObstacle(speed);
            this.distanceSinceLast = 0;
            this.calcNextSpawnDistance(speed);
        }
    }

    calcNextSpawnDistance(speed) {
        const cfg = window.ForestDash.Config.OBSTACLES;
        // As speed increases, distance increases to give player fair reaction window
        const speedScale = (speed / window.ForestDash.Config.PHYSICS.BASE_SPEED);
        const minGap = cfg.MIN_GAP * speedScale;
        const maxGap = cfg.MAX_GAP * speedScale;

        this.nextSpawnDistance = minGap + Math.random() * (maxGap - minGap);
    }

    spawnObstacle(speed) {
        const types = window.ForestDash.Config.OBSTACLES.TYPES;
        const availableKeys = ['ROCK', 'LOG'];

        // Unlock advanced obstacles progressively
        if (this.totalDistanceRun > 800) {
            availableKeys.push('ROOTS');
        }
        if (this.totalDistanceRun > 1500) {
            availableKeys.push('BRIAR');
            availableKeys.push('OVERHANG_BRANCH'); // Slide required!
        }
        if (this.totalDistanceRun > 2500) {
            availableKeys.push('SPIRIT_BRAMBLE');
        }

        const pickedKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
        const def = types[pickedKey];

        const obs = {
            id: pickedKey,
            x: 1020, // Spawn offscreen right
            width: def.width,
            height: def.height,
            type: def.type,
            canSlideUnder: def.canSlideUnder,
            requireJump: def.requireJump,
            color: def.color,
            passed: false,
        };

        if (def.type === 'ground') {
            obs.y = this.groundY - def.height;
        } else if (def.type === 'overhead') {
            // Branch hangs down with clearance for sliding
            obs.y = this.groundY - def.height - def.clearanceY;
        } else if (def.type === 'floating') {
            obs.y = this.groundY + def.floatYOffset - def.height;
        }

        this.obstacles.push(obs);
    }

    /**
     * Check collisions against player
     */
    checkCollision(player) {
        if (player.state === 'DEAD' || player.invincibleTimer > 0) {
            return null;
        }

        const pBox = player.getHitbox();

        for (let obs of this.obstacles) {
            let obsBox = {
                x: obs.x + 4,
                y: obs.y + 4,
                width: obs.width - 8,
                height: obs.height - 8
            };

            // Custom adjustments per obstacle type for fair feel
            if (obs.type === 'overhead') {
                // Low hanging branch: dangerous part is lower portion
                obsBox = {
                    x: obs.x + 8,
                    y: obs.y,
                    width: obs.width - 16,
                    height: obs.height
                };
            }

            if (window.ForestDash.Physics.checkAABB(pBox, obsBox)) {
                return obs;
            }
        }
        return null;
    }

    removeObstacle(obs) {
        const idx = this.obstacles.indexOf(obs);
        if (idx !== -1) {
            this.obstacles.splice(idx, 1);
        }
    }

    /**
     * Clear obstacles close to player (used after revive to guarantee a fair start)
     */
    clearNearPlayer(maxX = 450) {
        this.obstacles = this.obstacles.filter(obs => obs.x > maxX);
    }

    draw(ctx) {
        for (let obs of this.obstacles) {
            // Only draw if on screen
            if (obs.x + obs.width < -20 || obs.x > 1050) continue;

            ctx.save();
            ctx.translate(obs.x, obs.y);

            switch (obs.id) {
                case 'ROCK':
                    this.drawRock(ctx, obs);
                    break;
                case 'LOG':
                    this.drawLog(ctx, obs);
                    break;
                case 'ROOTS':
                    this.drawRoots(ctx, obs);
                    break;
                case 'BRIAR':
                    this.drawBriar(ctx, obs);
                    break;
                case 'OVERHANG_BRANCH':
                    this.drawOverhangBranch(ctx, obs);
                    break;
                case 'SPIRIT_BRAMBLE':
                    this.drawSpiritBramble(ctx, obs);
                    break;
                default:
                    ctx.fillStyle = obs.color;
                    ctx.fillRect(0, 0, obs.width, obs.height);
            }

            ctx.restore();
        }
    }

    drawRock(ctx, obs) {
        // Glowing Amber Runestone / Crystal Rock wrapped with Red Cords (from reference image)
        const time = Date.now() * 0.003;
        const pulse = Math.sin(time) * 4;

        // 1. Dark boulder base
        ctx.fillStyle = '#2c2220';
        ctx.beginPath();
        ctx.moveTo(4, obs.height);
        ctx.lineTo(2, obs.height - 18);
        ctx.lineTo(10, 14);
        ctx.lineTo(obs.width - 8, 12);
        ctx.lineTo(obs.width - 2, obs.height - 10);
        ctx.lineTo(obs.width - 4, obs.height);
        ctx.closePath();
        ctx.fill();

        // 2. Glowing Amber Crystal Spire on top (matching reference image!)
        ctx.save();
        ctx.shadowColor = '#ffb300';
        ctx.shadowBlur = 10 + pulse;

        // Outer amber glow facets
        const amberGrad = ctx.createLinearGradient(0, 0, 0, obs.height * 0.6);
        amberGrad.addColorStop(0, '#fff59d');
        amberGrad.addColorStop(0.35, '#ffca28');
        amberGrad.addColorStop(0.8, '#ff8f00');
        amberGrad.addColorStop(1, '#e65100');

        ctx.fillStyle = amberGrad;
        // Central sharp crystal
        ctx.beginPath();
        ctx.moveTo(14, 16);
        ctx.lineTo(obs.width * 0.42, 2);
        ctx.lineTo(obs.width * 0.65, 14);
        ctx.closePath();
        ctx.fill();

        // Left crystal facet
        ctx.beginPath();
        ctx.moveTo(6, 18);
        ctx.lineTo(16, 6);
        ctx.lineTo(24, 18);
        ctx.closePath();
        ctx.fill();

        // Right crystal facet
        ctx.beginPath();
        ctx.moveTo(obs.width * 0.52, 16);
        ctx.lineTo(obs.width - 6, 8);
        ctx.lineTo(obs.width - 2, 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 3. Red ritual cords tied across the boulder (from reference image!)
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(4, obs.height - 12);
        ctx.lineTo(obs.width - 4, obs.height - 18);
        ctx.moveTo(6, obs.height - 6);
        ctx.lineTo(obs.width - 6, obs.height - 10);
        ctx.stroke();

        // Red knot / tassel tag
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(obs.width * 0.45, obs.height - 16, 6, 8);
    }

    drawLog(ctx, obs) {
        // Ancient fallen log with bark ridges and small fungi
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.roundRect(0, 4, obs.width, obs.height - 4, [6, 12, 4, 4]);
        ctx.fill();

        // Bark cracks
        ctx.strokeStyle = '#271714';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 12); ctx.lineTo(obs.width - 14, 14);
        ctx.moveTo(18, 24); ctx.lineTo(obs.width - 20, 26);
        ctx.stroke();

        // Wood cross-section ring on left
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(8, obs.height * 0.55, 6, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Small forest mushroom caps on log
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(obs.width * 0.65, 4, 5, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(obs.width * 0.65, 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRoots(ctx, obs) {
        // Snarled twisted roots jutting out of ground
        ctx.fillStyle = '#2d1810';
        ctx.beginPath();
        ctx.moveTo(0, obs.height);
        ctx.quadraticCurveTo(15, 8, 26, 0); // main spike
        ctx.quadraticCurveTo(34, 18, 42, obs.height);
        ctx.lineTo(obs.width, obs.height);
        ctx.quadraticCurveTo(obs.width - 8, 14, obs.width - 4, 6); // secondary spike
        ctx.quadraticCurveTo(obs.width - 18, 22, 0, obs.height);
        ctx.closePath();
        ctx.fill();

        // Ancient runic glow in root center
        ctx.fillStyle = '#ff7043';
        ctx.shadowColor = '#ff5722';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(24, 28, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawBriar(ctx, obs) {
        // Wide thorny briar bush with crimson thorns
        ctx.fillStyle = '#26141d';
        ctx.beginPath();
        ctx.arc(18, obs.height - 16, 18, 0, Math.PI * 2);
        ctx.arc(obs.width * 0.5, obs.height - 24, 22, 0, Math.PI * 2);
        ctx.arc(obs.width - 18, obs.height - 16, 18, 0, Math.PI * 2);
        ctx.fill();

        // Red thorny spikes
        ctx.fillStyle = '#d81b60';
        const thorns = [
            [12, 10, 16, 2, 20, 10],
            [36, 6, 40, -4, 44, 6],
            [62, 8, 66, -1, 70, 8]
        ];
        thorns.forEach(([x1, y1, x2, y2, x3, y3]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
        });
    }

    drawOverhangBranch(ctx, obs) {
        // Low ancient tree limb hanging down from top/canopy
        // Player must slide under!
        ctx.fillStyle = '#2e1810';
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.quadraticCurveTo(obs.width * 0.4, obs.height * 0.7, obs.width, obs.height);
        ctx.lineTo(obs.width + 12, obs.height - 16);
        ctx.quadraticCurveTo(obs.width * 0.4, obs.height * 0.5 - 20, 10, -60);
        ctx.closePath();
        ctx.fill();

        // Spikes / hanging stalactite thorn
        ctx.fillStyle = '#5c1d24';
        ctx.beginPath();
        ctx.moveTo(obs.width * 0.5, obs.height * 0.7);
        ctx.lineTo(obs.width * 0.5 + 8, obs.height + 12);
        ctx.lineTo(obs.width * 0.5 + 16, obs.height * 0.75);
        ctx.closePath();
        ctx.fill();

        // Autumn leaves clinging to branch
        ctx.fillStyle = '#e65100';
        ctx.beginPath();
        ctx.arc(obs.width * 0.7, obs.height * 0.8, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpiritBramble(ctx, obs) {
        // Floating mid-air spiked spore with eerie magical glow
        const time = Date.now() * 0.005;
        const bob = Math.sin(time) * 4;

        ctx.save();
        ctx.translate(obs.width / 2, obs.height / 2 + bob);

        // Ambient glow
        ctx.shadowColor = '#e91e63';
        ctx.shadowBlur = 12;

        ctx.fillStyle = '#880e4f';
        ctx.beginPath();
        ctx.arc(0, 0, obs.width * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Radiating thorns
        ctx.fillStyle = '#ff4081';
        for (let i = 0; i < 6; i++) {
            const angle = time * 0.8 + (i * Math.PI * 2) / 6;
            const x1 = Math.cos(angle) * (obs.width * 0.35);
            const y1 = Math.sin(angle) * (obs.width * 0.35);
            const x2 = Math.cos(angle) * (obs.width * 0.58);
            const y2 = Math.sin(angle) * (obs.width * 0.58);

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#f50057';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Core eye/orb
        ctx.fillStyle = '#ff80ab';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};

