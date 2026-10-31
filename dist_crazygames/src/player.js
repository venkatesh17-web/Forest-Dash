/**
 * FOREST DASH: SPIRIT RUNNER
 * Player Character Controller & Renderer
 * 
 * Features dynamic procedural cartoon animation:
 * - Running limb cycles & torso bob
 * - Jump leap & tuck
 * - Glide fall
 * - Slide / crouch
 * - Squash & stretch landing
 * - Death & stumble animation
 * - Spirit Shield, Magnet, and Multiplier visual auras
 * - Customizable skin palettes
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.Player = class Player {
    constructor() {
        const cfg = window.ForestDash.Config.PLAYER;
        const phys = window.ForestDash.Config.PHYSICS;

        this.baseWidth = cfg.WIDTH;
        this.baseHeight = cfg.HEIGHT;
        this.width = cfg.WIDTH;
        this.height = cfg.HEIGHT;

        this.x = cfg.DEFAULT_X;
        this.y = phys.GROUND_Y - this.height;
        this.groundY = phys.GROUND_Y;

        this.vx = 0;
        this.vy = 0;

        // States: 'RUNNING', 'JUMPING', 'FALLING', 'SLIDING', 'DEAD'
        this.state = 'RUNNING';
        this.isOnGround = true;
        this.canDoubleJump = true;
        this.isJumpHeld = false;
        this.jumpHoldTimer = 0;

        // Slide state
        this.slideTimer = 0;
        this.slideDuration = phys.SLIDE_DURATION;

        // Animation timers & params
        this.animTime = 0;
        this.squashX = 1;
        this.squashY = 1;
        this.stumbleTime = 0;

        // Power-up & Invincibility states
        this.invincibleTimer = 0;
        this.hasShield = false;
        this.hasMagnet = false;
        this.hasMultiplier = false;

        // Equipped skin
        this.skin = this.loadSkin();

        // Footstep dust accumulator
        this.dustTimer = 0;

        // Jump trail arc history (matching reference image white swoosh)
        this.trailPoints = [];
    }

    loadSkin() {
        const equippedId = window.ForestDash.Storage.getEquippedSkin();
        const found = window.ForestDash.Config.SKINS.find(s => s.id === equippedId);
        return found || window.ForestDash.Config.SKINS[0];
    }

    updateSkin() {
        this.skin = this.loadSkin();
    }

    reset() {
        const cfg = window.ForestDash.Config.PLAYER;
        const phys = window.ForestDash.Config.PHYSICS;

        this.width = cfg.WIDTH;
        this.height = cfg.HEIGHT;
        this.x = cfg.DEFAULT_X;
        this.y = phys.GROUND_Y - this.height;
        this.vx = 0;
        this.vy = 0;

        this.state = 'RUNNING';
        this.isOnGround = true;
        this.canDoubleJump = true;
        this.isJumpHeld = false;
        this.jumpHoldTimer = 0;
        this.slideTimer = 0;
        this.animTime = 0;
        this.squashX = 1;
        this.squashY = 1;
        this.stumbleTime = 0;
        this.invincibleTimer = 0;
        this.hasShield = false;
        this.hasMagnet = false;
        this.hasMultiplier = false;
        this.trailPoints = [];

        this.updateSkin();
    }

    jump() {
        if (this.state === 'DEAD') return false;

        const phys = window.ForestDash.Config.PHYSICS;

        if (this.isOnGround) {
            // First jump
            this.vy = phys.JUMP_FORCE;
            this.isOnGround = false;
            this.canDoubleJump = true;
            this.isJumpHeld = true;
            this.jumpHoldTimer = phys.MAX_JUMP_HOLD_TIME;
            this.state = 'JUMPING';

            // Cancel slide if jumping and ensure correct ground clearance
            this.slideTimer = 0;
            this.height = this.baseHeight;
            this.y = this.groundY - this.height;

            // Audio & Particles
            window.ForestDash.Audio.playJump(false);
            window.ForestDash.ParticleSystem.spawnDust(this.x + this.width / 2, this.groundY, 4);

            // Stretch upward
            this.squashX = 0.8;
            this.squashY = 1.25;
            return true;
        } else if (this.canDoubleJump) {
            // Double jump!
            this.vy = phys.DOUBLE_JUMP_FORCE;
            this.canDoubleJump = false;
            this.isJumpHeld = true;
            this.jumpHoldTimer = phys.MAX_JUMP_HOLD_TIME * 0.7;
            this.state = 'JUMPING';

            window.ForestDash.Audio.playJump(true);
            window.ForestDash.ParticleSystem.spawnCoinSparkles(this.x + this.width / 2, this.y + this.height, 6, true);

            this.squashX = 0.85;
            this.squashY = 1.2;
            return true;
        }

        return false;
    }

    releaseJump() {
        this.isJumpHeld = false;
        this.jumpHoldTimer = 0;
    }

    slide() {
        if (this.state === 'DEAD') return false;

        const phys = window.ForestDash.Config.PHYSICS;

        if (this.isOnGround && this.slideTimer <= 0) {
            this.slideTimer = this.slideDuration;
            this.state = 'SLIDING';
            this.height = this.baseHeight * phys.SLIDE_HITBOX_SCALE_Y;
            this.y = this.groundY - this.height;

            window.ForestDash.Audio.playSlide();
            window.ForestDash.ParticleSystem.spawnDust(this.x + this.width / 2, this.groundY, 5);
            return true;
        } else if (!this.isOnGround) {
            // Fast fall downward if sliding mid-air
            this.vy = Math.max(this.vy, 450);
            return true;
        }

        return false;
    }

    hit(isFatal = true) {
        if (this.invincibleTimer > 0) return false;

        if (this.hasShield) {
            // Shield absorbs blow
            this.hasShield = false;
            this.invincibleTimer = window.ForestDash.Config.PLAYER.INVINCIBILITY_DURATION;
            window.ForestDash.Audio.playShieldBreak();
            window.ForestDash.ParticleSystem.spawnShieldBreak(this.x + this.width / 2, this.y + this.height / 2);
            window.ForestDash.ParticleSystem.spawnFloatingText(this.x + this.width / 2, this.y, 'SHIELD SAVED!', '#00e5ff', 20);
            return false; // Did not die
        }

        if (isFatal) {
            this.state = 'DEAD';
            this.vy = -380;
            this.isOnGround = false;
            window.ForestDash.Audio.playHit();
            window.ForestDash.Audio.playGameOver();
            window.ForestDash.ParticleSystem.spawnHitSparks(this.x + this.width / 2, this.y + this.height / 2);
            return true; // Fatal!
        }

        return false;
    }

    revive() {
        const phys = window.ForestDash.Config.PHYSICS;
        const cfg = window.ForestDash.Config.PLAYER;

        this.state = 'RUNNING';
        this.height = cfg.HEIGHT;
        this.y = phys.GROUND_Y - this.height;
        this.vy = 0;
        this.isOnGround = true;
        this.canDoubleJump = true;
        this.slideTimer = 0;
        this.invincibleTimer = 3.0; // 3 seconds grace period on revive

        window.ForestDash.ParticleSystem.spawnCoinSparkles(this.x + this.width / 2, this.y + this.height / 2, 25, true);
        window.ForestDash.ParticleSystem.spawnFloatingText(this.x + this.width / 2, this.y, 'REVIVED!', '#76ff03', 24);
    }

    update(dt) {
        const phys = window.ForestDash.Config.PHYSICS;
        this.animTime += dt;

        // Squash & stretch recovery
        this.squashX = window.ForestDash.Physics.lerp(this.squashX, 1, dt * 10);
        this.squashY = window.ForestDash.Physics.lerp(this.squashY, 1, dt * 10);

        // Invincibility countdown
        if (this.invincibleTimer > 0) {
            this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
        }

        // Dead State
        if (this.state === 'DEAD') {
            this.stumbleTime += dt;
            this.vy += phys.GRAVITY * dt;
            this.y += this.vy * dt;
            if (this.y > this.groundY - this.height) {
                this.y = this.groundY - this.height;
                this.vy = 0;
            }
            return;
        }

        // Variable Jump Boost
        if (this.isJumpHeld && this.jumpHoldTimer > 0) {
            this.vy += phys.JUMP_HOLD_ACCEL * dt;
            this.jumpHoldTimer -= dt;
        }

        // Apply Gravity
        this.vy += phys.GRAVITY * dt;
        this.y += this.vy * dt;

        // Ground Collision
        if (this.y >= this.groundY - this.height) {
            this.y = this.groundY - this.height;

            if (!this.isOnGround) {
                // Landed!
                this.isOnGround = true;
                this.canDoubleJump = true;
                this.squashX = 1.25;
                this.squashY = 0.8;
                window.ForestDash.ParticleSystem.spawnLandingImpact(this.x + this.width / 2, this.groundY);

                if (this.slideTimer > 0) {
                    this.state = 'SLIDING';
                } else {
                    this.state = 'RUNNING';
                }
            }
            this.vy = 0;
        } else {
            this.isOnGround = false;
            if (this.vy < 0) {
                this.state = 'JUMPING';
            } else {
                this.state = 'FALLING';
            }
        }

        // Jump Motion Trail update (matching reference image white swoosh)
        const scrollSpeed = window.ForestDash.instance ? window.ForestDash.instance.speed : 340;
        if (!this.isOnGround && this.state !== 'DEAD') {
            const currentPos = {
                x: this.x + 6,
                y: this.y + this.height * 0.58,
                alpha: 0.95
            };
            if (this.trailPoints.length === 0) {
                this.trailPoints.unshift(currentPos);
            } else {
                const head = this.trailPoints[0];
                const d = Math.hypot(head.x - currentPos.x, head.y - currentPos.y);
                if (d >= 8) {
                    this.trailPoints.unshift(currentPos);
                }
            }
        }
        // Age and move trail points backwards with world
        for (let i = this.trailPoints.length - 1; i >= 0; i--) {
            const pt = this.trailPoints[i];
            pt.x -= scrollSpeed * dt * 0.9;
            pt.alpha -= dt * 2.4;
            if (pt.alpha <= 0 || this.trailPoints.length > 20) {
                this.trailPoints.splice(i, 1);
            }
        }

        // Slide State Management
        if (this.slideTimer > 0) {
            this.slideTimer -= dt;
            this.state = 'SLIDING';
            this.height = this.baseHeight * phys.SLIDE_HITBOX_SCALE_Y;

            // Slide dust
            this.dustTimer += dt;
            if (this.dustTimer > 0.08) {
                this.dustTimer = 0;
                window.ForestDash.ParticleSystem.spawnDust(this.x + 8, this.groundY, 2);
            }

            if (this.slideTimer <= 0) {
                // End slide
                this.height = this.baseHeight;
                this.y = this.groundY - this.height;
                if (this.isOnGround) {
                    this.state = 'RUNNING';
                }
            }
        } else if (this.isOnGround) {
            // Running footstep dust
            this.dustTimer += dt;
            if (this.dustTimer > 0.16) {
                this.dustTimer = 0;
                window.ForestDash.ParticleSystem.spawnDust(this.x + 6, this.groundY, 1);
            }
        }
    }

    /**
     * Hitbox for obstacle collision check (padded to be forgiving)
     */
    getHitbox() {
        return {
            x: this.x + 8,
            y: this.y + 4,
            width: this.width - 16,
            height: this.height - 8
        };
    }

    /**
     * Magnet Collection Box (larger range for grabbing coins)
     */
    getMagnetBounds() {
        const r = window.ForestDash.Config.COINS.MAGNET_RADIUS;
        return {
            x: this.x + this.width / 2 - r,
            y: this.y + this.height / 2 - r,
            radius: r
        };
    }

    draw(ctx) {
        // 1. Draw Jump Motion Trail Swoosh (faithful to reference image white arc)
        this.drawJumpTrail(ctx);

        // Flash during invincibility
        if (this.invincibleTimer > 0) {
            const flash = Math.floor(this.invincibleTimer * 14) % 2 === 0;
            if (!flash) return;
        }

        ctx.save();

        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        ctx.translate(centerX, bottomY);
        ctx.scale(this.squashX, this.squashY);

        // Draw Player Power-up Auras
        this.drawAuras(ctx);

        // Draw Player Character Sprite
        if (this.state === 'DEAD') {
            this.drawDeadCharacter(ctx);
        } else if (this.state === 'SLIDING') {
            this.drawSlidingCharacter(ctx);
        } else if (this.state === 'JUMPING' || this.state === 'FALLING') {
            this.drawAirborneCharacter(ctx);
        } else {
            this.drawRunningCharacter(ctx);
        }

        ctx.restore();
    }

    drawJumpTrail(ctx) {
        if (this.trailPoints.length < 3) return;

        ctx.save();
        // Render tapering smooth aerodynamic motion ribbon (from reference image)
        for (let i = 0; i < this.trailPoints.length - 1; i++) {
            const p1 = this.trailPoints[i];
            const p2 = this.trailPoints[i + 1];
            const t = 1 - (i / this.trailPoints.length); // 1 at head, 0 at tail

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, p1.alpha * 0.85 * t)})`;
            ctx.lineWidth = 1 + (t * 3.5);
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        ctx.restore();
    }

    drawAuras(ctx) {
        const time = this.animTime;

        // Spirit Shield Bubble (matches circular glowing shield in reference image)
        if (this.hasShield) {
            ctx.save();
            ctx.translate(0, -this.height * 0.52);

            const radius = 38 + Math.sin(time * 6) * 2;
            const grad = ctx.createRadialGradient(0, 0, radius * 0.4, 0, 0, radius);
            grad.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
            grad.addColorStop(0.7, 'rgba(0, 229, 255, 0.25)');
            grad.addColorStop(1, 'rgba(0, 229, 255, 0.85)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            // Metallic blue rim
            ctx.strokeStyle = '#80d8ff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Rotating magical rune shards
            for (let i = 0; i < 3; i++) {
                const angle = time * 3 + (i * Math.PI * 2) / 3;
                const rx = Math.cos(angle) * (radius - 2);
                const ry = Math.sin(angle) * (radius - 2);
                ctx.beginPath();
                ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
            ctx.restore();
        }

        // Magnet Golden Aura
        if (this.hasMagnet) {
            ctx.save();
            ctx.translate(0, -this.height * 0.5);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.lineDashOffset = -time * 40;
            ctx.beginPath();
            ctx.arc(0, 0, 34 + Math.cos(time * 8) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Multiplier Shimmer
        if (this.hasMultiplier) {
            ctx.save();
            ctx.translate(0, -this.height * 0.5);
            ctx.strokeStyle = 'rgba(179, 136, 255, 0.75)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 36 + Math.sin(time * 7) * 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawRunningCharacter(ctx) {
        const skin = this.skin;
        const cycle = (this.animTime * 12) % (Math.PI * 2);
        const bobY = Math.abs(Math.sin(cycle)) * 4;

        ctx.translate(0, -bobY);

        const legAngle1 = Math.sin(cycle) * 0.75;
        const legAngle2 = -Math.sin(cycle) * 0.75;

        // Back Leg
        ctx.save();
        ctx.translate(-4, -20);
        ctx.rotate(legAngle2);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 20);
        // Red ankle band
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3, 14, 6, 3);
        // Foot
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 17, 8, 4);
        ctx.restore();

        // Torso (Lean athletic runner)
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.roundRect(-8, -42, 16, 22, [4, 4, 2, 2]);
        ctx.fill();

        // Red Waistwrap / Sash (from reference image)
        ctx.fillStyle = skin.sashColor || '#e53935';
        ctx.fillRect(-9, -23, 18, 7);
        // Hanging sash ribbon
        ctx.fillRect(-3, -16, 6, 8);

        // Front Leg
        ctx.save();
        ctx.translate(4, -20);
        ctx.rotate(legAngle1);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 20);
        // Red ankle band
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3, 14, 6, 3);
        // Foot
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 17, 8, 4);
        ctx.restore();

        // Head
        this.drawHead(ctx, -48, 0.05);

        // Pumping Arms with Red Wristband (from reference image)
        const armAngle = -Math.sin(cycle) * 0.8;
        ctx.save();
        ctx.translate(2, -36);
        ctx.rotate(armAngle);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 16);
        // Red wristband
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3.5, 10, 7, 3.5);
        // Hand
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.arc(0, 16, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawAirborneCharacter(ctx) {
        // Matches exact jump pose in reference image:
        // Arched forward, legs split in athletic jump stride, arms bent, hair flowing
        const skin = this.skin;
        const isUp = this.vy < 0;

        ctx.save();
        ctx.rotate(0.12); // Forward dynamic angle

        // Back Leg (Stretching back)
        ctx.save();
        ctx.translate(-6, -20);
        ctx.rotate(-0.65);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 20);
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3, 14, 6, 3);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 17, 8, 4);
        ctx.restore();

        // Torso
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.roundRect(-8, -42, 16, 22, [4, 4, 2, 2]);
        ctx.fill();

        // Red Waistwrap
        ctx.fillStyle = skin.sashColor || '#e53935';
        ctx.fillRect(-9, -23, 18, 7);
        // Trailing sash knot
        ctx.fillRect(-6, -18, 5, 10);

        // Front Leg (Bent forward in stride)
        ctx.save();
        ctx.translate(5, -20);
        ctx.rotate(0.7);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 18);
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3, 12, 6, 3);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 15, 8, 4);
        ctx.restore();

        // Head
        this.drawHead(ctx, -48, isUp ? -0.1 : 0.05);

        // Arms (Forward athletic leap pose with red wristbands)
        ctx.save();
        ctx.translate(4, -36);
        ctx.rotate(0.5);
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-3, 0, 6, 16);
        // Red wristband
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(-3.5, 10, 7, 3.5);
        // Hand
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.arc(0, 16, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    drawSlidingCharacter(ctx) {
        const skin = this.skin;

        ctx.save();
        ctx.rotate(-0.15); // Leaning forward low

        // Legs extended
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-14, -12, 34, 9);
        // Red ankle band
        ctx.fillStyle = skin.wristbandColor || '#e53935';
        ctx.fillRect(14, -13, 5, 11);

        // Torso low to ground
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.roundRect(-18, -26, 26, 16, 4);
        ctx.fill();

        // Red sash
        ctx.fillStyle = skin.sashColor || '#e53935';
        ctx.fillRect(-14, -20, 10, 6);

        // Head lowered forward
        this.drawHead(ctx, -26, 0.25, 12);

        ctx.restore();
    }

    drawDeadCharacter(ctx) {
        const skin = this.skin;

        ctx.save();
        ctx.rotate(1.1); // Fallen back

        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-10, -28, 20, 18);
        ctx.fillStyle = skin.sashColor || '#e53935';
        ctx.fillRect(-10, -14, 20, 5);

        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.fillRect(-8, -9, 6, 18);
        ctx.fillRect(2, -9, 6, 18);

        this.drawHead(ctx, -38, 0, 0, true);

        ctx.restore();
    }

    drawHead(ctx, yPos, tilt = 0, xOffset = 0, isDead = false) {
        const skin = this.skin;

        ctx.save();
        ctx.translate(xOffset, yPos);
        ctx.rotate(tilt);

        // 1. Back Hair (Curved sleek silhouette)
        ctx.fillStyle = skin.hairColor || '#1a181b';
        ctx.beginPath();
        ctx.arc(-2, -3, 14, Math.PI * 0.65, Math.PI * 1.95);
        ctx.fill();

        // 2. Face (Cute stylized cartoon profile)
        ctx.fillStyle = skin.skinTone || '#f4ba98';
        ctx.beginPath();
        ctx.arc(2, 0, 13, 0, Math.PI * 2);
        ctx.fill();

        // Cute nose bump
        ctx.beginPath();
        ctx.arc(14, 1, 2.5, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // 3. Red War-paint Stripe on Cheek (from reference image!)
        ctx.fillStyle = skin.facePaintColor || '#d32f2f';
        ctx.fillRect(6, 4, 7, 2.2);

        // 4. Red Headband (thick bold crimson band)
        ctx.fillStyle = skin.headbandColor || '#e53935';
        ctx.fillRect(-11, -7, 24, 6);

        // 5. Golden Tassel dangling beside ear (faithfully matching reference image!)
        ctx.fillStyle = skin.tasselColor || '#fdd835';
        ctx.fillRect(8, -1, 3.5, 9);
        ctx.beginPath();
        ctx.arc(9.75, 8.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 6. Hair Front Bangs / Fringe over headband
        ctx.fillStyle = skin.hairColor || '#1a181b';
        ctx.beginPath();
        ctx.moveTo(-11, -7);
        ctx.lineTo(-4, -1);
        ctx.lineTo(2, -7);
        ctx.lineTo(8, -2);
        ctx.lineTo(13, -7);
        ctx.lineTo(10, -13);
        ctx.lineTo(-10, -13);
        ctx.closePath();
        ctx.fill();

        // 7. Eyes
        if (isDead) {
            // X dazed eyes
            ctx.strokeStyle = '#212121';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(3, 0); ctx.lineTo(8, 4);
            ctx.moveTo(8, 0); ctx.lineTo(3, 4);
            ctx.stroke();
        } else {
            // Expressive eyes / determined focus line (matching reference cartoon style)
            ctx.fillStyle = '#1a181b';
            ctx.beginPath();
            ctx.ellipse(8, 0.5, 2.8, 3.8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bright eye shine highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(9, -0.5, 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Tiny eyebrow
            ctx.strokeStyle = '#1a181b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(5, -4);
            ctx.lineTo(11, -3);
            ctx.stroke();
        }

        ctx.restore();
    }
};

