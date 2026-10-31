/**
 * FOREST DASH: SPIRIT RUNNER
 * Parallax World & Environment Renderer
 * 
 * Recreates the rich atmospheric reddish-brown forest from the reference image:
 * - Monochromatic reddish-brown atmospheric sky & diagonal volumetric god rays
 * - Layered vertical tree trunks with characteristic horizontal trident branchlets
 * - Autumn foliage bushes with red & orange leaves
 * - Ground platform featuring dark slate cobblestone / pebble layer
 * - Lush reddish-orange grass tufts & black silhouette grass spikes
 * - Ambient floating leaves & glowing forest fireflies
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.World = class World {
    constructor() {
        const env = window.ForestDash.Config.ENVIRONMENT;
        const phys = window.ForestDash.Config.PHYSICS;

        this.groundY = phys.GROUND_Y;
        this.scrollX = 0;
        this.animTime = 0;

        // Floating wind-blown leaves
        this.leaves = [];
        for (let i = 0; i < (env.LEAF_PARTICLE_COUNT || 20); i++) {
            this.leaves.push({
                x: Math.random() * 1200,
                y: Math.random() * (this.groundY - 50),
                speedX: 50 + Math.random() * 70,
                speedY: 15 + Math.random() * 25,
                size: 3.5 + Math.random() * 4,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 3,
                color: ['#d85834', '#b73824', '#ff7043', '#8a272a', '#e64a19'][Math.floor(Math.random() * 5)]
            });
        }

        // Ambient glowing fireflies
        this.fireflies = [];
        for (let i = 0; i < (env.FIREFLY_COUNT || 14); i++) {
            this.fireflies.push({
                x: Math.random() * 1200,
                y: 100 + Math.random() * (this.groundY - 140),
                baseY: 100 + Math.random() * (this.groundY - 140),
                speedX: 12 + Math.random() * 20,
                frequency: 1 + Math.random() * 2,
                amplitude: 15 + Math.random() * 20,
                pulseOffset: Math.random() * Math.PI * 2,
                radius: 1.5 + Math.random() * 1.5,
                color: Math.random() > 0.3 ? 'rgba(255, 235, 59, ' : 'rgba(255, 179, 0, '
            });
        }

        this.initLayerFeatures();
    }

    initLayerFeatures() {
        // Far background tree trunks (thin, tall vertical reddish silhouettes)
        this.farTrees = [];
        for (let i = 0; i < 30; i++) {
            this.farTrees.push({
                x: i * 85 + (Math.sin(i * 1.7) * 20),
                width: 22 + (i % 4) * 8,
                hasBranchLeft: i % 2 === 0,
                hasBranchRight: i % 3 === 0,
                branchY: 140 + ((i * 37) % 180),
                foliageColor: (i % 2 === 0) ? '#681d22' : '#521519'
            });
        }

        // Midground forest trees (matching reference image vertical trunks & trident twigs)
        this.midTrees = [];
        for (let i = 0; i < 20; i++) {
            this.midTrees.push({
                x: i * 160 + (Math.sin(i * 2.3) * 30),
                width: 38 + (i % 3) * 14,
                branchY1: 180 + ((i * 41) % 120),
                branchY2: 260 + ((i * 29) % 100),
                hasBush: i % 2 === 0,
                bushRadius: 40 + (i % 3) * 12
            });
        }

        // Foreground cobblestone pebbles in the ground platform
        this.cobblestones = [];
        for (let i = 0; i < 80; i++) {
            this.cobblestones.push({
                x: i * 28 + (Math.sin(i * 3) * 6),
                yOffset: 8 + ((i * 13) % 24),
                radiusX: 7 + (i % 4) * 3,
                radiusY: 4 + (i % 3) * 2.5,
                color: ['#353940', '#2a2d33', '#1e2025', '#40454e'][i % 4]
            });
        }

        // Ground grass fringe tufts (reddish-orange & black silhouette blades)
        this.grassTufts = [];
        for (let i = 0; i < 60; i++) {
            this.grassTufts.push({
                x: i * 32,
                height: 12 + ((i * 17) % 16),
                type: (i % 3 === 0) ? 'dark' : 'orange',
                bladeCount: 3 + (i % 3)
            });
        }
    }

    update(dt, speed) {
        this.animTime += dt;
        this.scrollX += speed * dt;

        // Update wind leaves
        for (let leaf of this.leaves) {
            leaf.x -= (speed * 0.75 + leaf.speedX) * dt;
            leaf.y += leaf.speedY * dt;
            leaf.angle += leaf.rotSpeed * dt;

            if (leaf.x < -20) {
                leaf.x = 980 + Math.random() * 200;
                leaf.y = Math.random() * (this.groundY - 50);
            }
            if (leaf.y > this.groundY - 5) {
                leaf.y = -10;
                leaf.x = Math.random() * 1000;
            }
        }

        // Update fireflies
        for (let ff of this.fireflies) {
            ff.x -= (speed * 0.3 + ff.speedX) * dt;
            ff.y = ff.baseY + Math.sin(this.animTime * ff.frequency) * ff.amplitude;

            if (ff.x < -20) {
                ff.x = 980 + Math.random() * 150;
                ff.baseY = 100 + Math.random() * (this.groundY - 140);
            }
        }
    }

    draw(ctx, width, height) {
        const speeds = window.ForestDash.Config.ENVIRONMENT.PARALLAX_SPEEDS;

        // 1. SKY & ATMOSPHERIC REDDISH-BROWN GRADIENT
        this.drawAtmosphericSky(ctx, width, height);

        // 2. VOLUMETRIC SUN RAYS / GOD RAYS (from reference image)
        this.drawGodRays(ctx, width, height);

        // 3. LAYER 1: DEEP DISTANT FOREST SILHOUETTES
        this.drawFarForest(ctx, width, height, speeds.FAR_TREES);

        // 4. LAYER 2: MIDGROUND TALL TREES & TRIDENT BRANCHLETS
        this.drawMidForest(ctx, width, height, speeds.MID_TREES);

        // 5. LAYER 3: AMBIENT FIREFLIES & FALLING AUTUMN LEAVES
        this.drawAmbientAtmosphere(ctx);

        // 6. LAYER 4: DETAILED RUNNING PLATFORM (COBBLESTONE SLATE & REDDISH GRASS)
        this.drawGroundPlatform(ctx, width, height, speeds.GROUND);
    }

    drawAtmosphericSky(ctx, width, height) {
        // Rich warm reddish-brown atmospheric forest gradient (matching reference image)
        const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        grad.addColorStop(0, '#361115');
        grad.addColorStop(0.35, '#4f1a20');
        grad.addColorStop(0.7, '#6b242b');
        grad.addColorStop(1, '#822d34');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }

    drawGodRays(ctx, width, height) {
        // Luminous diagonal volumetric god rays streaming through trees (from reference image)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const rayGrad = ctx.createLinearGradient(width * 0.25, 0, width * 0.8, this.groundY);
        rayGrad.addColorStop(0, 'rgba(255, 210, 190, 0.16)');
        rayGrad.addColorStop(0.45, 'rgba(240, 140, 130, 0.08)');
        rayGrad.addColorStop(1, 'rgba(200, 80, 70, 0.0)');

        ctx.fillStyle = rayGrad;

        // Diagonal light shafts
        const shafts = [
            [width * 0.12, 0, width * 0.42, this.groundY, 80],
            [width * 0.44, 0, width * 0.74, this.groundY, 130],
            [width * 0.76, 0, width * 1.06, this.groundY, 95],
        ];

        for (const [x1, y1, x2, y2, w] of shafts) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + w * 0.65, y1);
            ctx.lineTo(x2 + w, y2);
            ctx.lineTo(x2, y2);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    drawFarForest(ctx, width, height, speedFactor) {
        const loopWidth = 2550;
        const offset = (this.scrollX * speedFactor) % loopWidth;
        const count = this.farTrees.length;

        ctx.save();
        ctx.fillStyle = '#42161b';

        for (let i = -2; i < 35; i++) {
            const treeIdx = ((i % count) + count) % count;
            const tree = this.farTrees[treeIdx];
            const x = (i * 85) - offset;
            if (x < -60 || x > width + 60) continue;

            // Straight vertical trunk
            ctx.fillRect(x, 0, tree.width, this.groundY);

            // Stylized 'Y' branchlets
            if (tree.hasBranchLeft) {
                this.drawTridentBranch(ctx, x, tree.branchY, -1, 0.7);
            }
            if (tree.hasBranchRight) {
                this.drawTridentBranch(ctx, x + tree.width, tree.branchY + 30, 1, 0.7);
            }
        }

        // Soft warm reddish haze overlay
        const haze = ctx.createLinearGradient(0, this.groundY - 180, 0, this.groundY);
        haze.addColorStop(0, 'rgba(110, 36, 43, 0.0)');
        haze.addColorStop(1, 'rgba(110, 36, 43, 0.45)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, this.groundY - 180, width, 180);

        ctx.restore();
    }

    drawMidForest(ctx, width, height, speedFactor) {
        const loopWidth = 3200;
        const offset = (this.scrollX * speedFactor) % loopWidth;
        const count = this.midTrees.length;

        ctx.save();

        for (let i = -2; i < 24; i++) {
            const treeIdx = ((i % count) + count) % count;
            const tree = this.midTrees[treeIdx];
            const x = (i * 160) - offset;
            if (x < -100 || x > width + 100) continue;

            // Deep reddish-brown trunk with subtle highlight
            ctx.fillStyle = '#4c191f';
            ctx.fillRect(x, 0, tree.width, this.groundY);

            // Shaded trunk side for 3D depth
            ctx.fillStyle = '#341015';
            ctx.fillRect(x + tree.width * 0.65, 0, tree.width * 0.35, this.groundY);

            // Distinctive horizontal trident branches (from reference image)
            this.drawTridentBranch(ctx, x, tree.branchY1, -1, 1.0);
            this.drawTridentBranch(ctx, x + tree.width, tree.branchY2, 1, 1.0);

            // Autumn foliage bush near ground (from reference image)
            if (tree.hasBush) {
                this.drawAutumnBush(ctx, x - 15, this.groundY - 25, tree.bushRadius);
            }
        }

        ctx.restore();
    }

    drawTridentBranch(ctx, startX, startY, direction, scale = 1.0) {
        ctx.save();
        ctx.strokeStyle = '#341015';
        ctx.lineWidth = 3.5 * scale;
        ctx.lineCap = 'round';

        const len = 34 * scale * direction;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + len, startY - 6 * scale);

        // Branch forks upwards ('Y' shape)
        ctx.moveTo(startX + len * 0.6, startY - 4 * scale);
        ctx.lineTo(startX + len * 0.8, startY - 22 * scale);

        ctx.moveTo(startX + len, startY - 6 * scale);
        ctx.lineTo(startX + len * 1.3, startY - 18 * scale);
        ctx.stroke();

        ctx.restore();
    }

    drawAutumnBush(ctx, cx, cy, radius) {
        ctx.save();
        ctx.fillStyle = '#942b32';
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2);
        ctx.arc(cx + radius * 0.5, cy - radius * 0.2, radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b83b33';
        ctx.beginPath();
        ctx.arc(cx + radius * 0.2, cy + radius * 0.1, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawAmbientAtmosphere(ctx) {
        // Fireflies
        for (let ff of this.fireflies) {
            const alpha = 0.35 + Math.sin(this.animTime * 3 + ff.pulseOffset) * 0.3;
            ctx.save();
            ctx.fillStyle = ff.color + alpha + ')';
            ctx.shadowColor = '#ffd54f';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(ff.x, ff.y, ff.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Drifting leaves
        for (let leaf of this.leaves) {
            ctx.save();
            ctx.translate(leaf.x, leaf.y);
            ctx.rotate(leaf.angle);
            ctx.fillStyle = leaf.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawGroundPlatform(ctx, width, height, speedFactor) {
        const loopWidth = 2240;
        const offset = (this.scrollX * speedFactor) % loopWidth;
        const gy = this.groundY;

        ctx.save();

        // 1. BASE PLATFORM STRATA (Dark cliff earth)
        const cliffGrad = ctx.createLinearGradient(0, gy, 0, height);
        cliffGrad.addColorStop(0, '#1c1e22');
        cliffGrad.addColorStop(0.35, '#141618');
        cliffGrad.addColorStop(1, '#0b0c0d');
        ctx.fillStyle = cliffGrad;
        ctx.fillRect(0, gy, width, height - gy);

        // 2. COBBLESTONE / SLATE PEBBLE BAND (from reference image)
        ctx.fillStyle = '#262930';
        ctx.fillRect(0, gy, width, 32);

        // Stone border line
        ctx.strokeStyle = '#181a1e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, gy + 32);
        ctx.lineTo(width, gy + 32);
        ctx.stroke();

        // Draw individual cobblestones/pebbles
        const stoneCount = this.cobblestones.length;
        for (let i = -2; i < stoneCount + 4; i++) {
            const stoneIdx = ((i % stoneCount) + stoneCount) % stoneCount;
            const stone = this.cobblestones[stoneIdx];
            const sx = (i * 28) - offset;
            if (sx < -30 || sx > width + 30) continue;

            // Varied slate stone colors
            const stonePalette = ['#454a55', '#353942', '#2b2e36', '#525866'];
            ctx.fillStyle = stonePalette[stoneIdx % stonePalette.length];
            ctx.beginPath();
            ctx.ellipse(sx, gy + stone.yOffset, stone.radiusX, stone.radiusY, 0, 0, Math.PI * 2);
            ctx.fill();

            // Subtle pebble top highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.beginPath();
            ctx.ellipse(sx - 1, gy + stone.yOffset - 1, stone.radiusX * 0.6, stone.radiusY * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. DENSE REDDISH-ORANGE GRASS FRINGE & BLACK SILHOUETTE BLADES (from reference image)
        const grassCount = this.grassTufts.length;
        for (let i = -2; i < grassCount + 4; i++) {
            const grassIdx = ((i % grassCount) + grassCount) % grassCount;
            const tuft = this.grassTufts[grassIdx];
            const gx = (i * 32) - offset;
            if (gx < -40 || gx > width + 40) continue;

            const isDark = tuft.type === 'dark';
            ctx.fillStyle = isDark ? '#1c070a' : (i % 2 === 0 ? '#f45b32' : '#d84725');

            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 3, gy - tuft.height);
            ctx.lineTo(gx + 6, gy);

            ctx.moveTo(gx + 4, gy);
            ctx.lineTo(gx + 9, gy - tuft.height * 0.85);
            ctx.lineTo(gx + 12, gy);

            ctx.moveTo(gx + 9, gy);
            ctx.lineTo(gx + 13, gy - tuft.height * 0.65);
            ctx.lineTo(gx + 16, gy);
            ctx.fill();
        }

        ctx.restore();
    }
};
