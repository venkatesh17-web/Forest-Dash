/**
 * FOREST DASH: SPIRIT RUNNER
 * Main Game Controller & State Machine
 * 
 * Orchestrates Game Loop, State Transitions, Scoring,
 * Physics, Collisions, LocalStorage Persistence, and Rendering.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.Game = class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Virtual base resolution
        this.baseWidth = window.ForestDash.Config.CANVAS.BASE_WIDTH;
        this.baseHeight = window.ForestDash.Config.CANVAS.BASE_HEIGHT;
        this.scale = 1;

        // Subsystems
        this.player = new window.ForestDash.Player();
        this.world = new window.ForestDash.World();
        this.obstacleManager = new window.ForestDash.ObstacleManager();
        this.coinManager = new window.ForestDash.CoinManager();
        this.powerUpManager = new window.ForestDash.PowerUpManager();

        // Game State: 'LOADING', 'MAIN_MENU', 'READY', 'PLAYING', 'PAUSED', 'GAME_OVER'
        this.state = 'LOADING';

        // Run Metrics
        this.speed = window.ForestDash.Config.PHYSICS.BASE_SPEED;
        this.distance = 0;
        this.score = 0;
        this.runCoins = 0;
        this.savedCoinsInRun = 0;
        this.storedPowerUp = window.ForestDash.Config.POWERUPS.TYPES.SHIELD; // 1 emergency shield charge
        this.bestScore = window.ForestDash.Storage.getHighScore();
        this.isNewRecord = false;
        this.hasNotifiedNewBest = false;
        this.hasUsedRevive = false;

        // Game loop timing
        this.lastTime = 0;
        this.animFrameId = null;

        // Setup resize & input
        this.handleResize = this.handleResize.bind(this);
        this.loop = this.loop.bind(this);
    }

    init() {
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('orientationchange', () => setTimeout(this.handleResize, 150));
        this.handleResize();

        // Initialize UI
        window.ForestDash.UI.init(this);

        // Initialize Platform SDK (CrazyGames) if present
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.init();
        }

        // Keyboard & Canvas Tap Listeners
        this.bindInputs();

        // Start in Main Menu
        this.toMainMenu();

        // Start animation loop
        this.lastTime = performance.now();
        if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    bindInputs() {
        // Desktop keyboard controls
        window.addEventListener('keydown', (e) => {
            // Spacebar, W, ArrowUp, Enter
            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Enter') {
                e.preventDefault();
                if (this.state === 'MAIN_MENU') {
                    this.startDirectPlay();
                } else if (this.state === 'GAME_OVER') {
                    this.startDirectPlay();
                } else {
                    this.handleJumpPress();
                }
            }
            // S, ArrowDown -> Slide
            else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
                e.preventDefault();
                this.handleSlidePress();
            }
            // Escape, P -> Pause
            else if (e.code === 'Escape' || e.code === 'KeyP') {
                e.preventDefault();
                this.togglePause();
            }
            // R -> Restart
            else if (e.code === 'KeyR') {
                if (this.state === 'GAME_OVER') {
                    this.startDirectPlay();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
                this.handleJumpRelease();
            }
        });

        // Touch & Pointer Gesture Detection on Canvas
        let pointerStartY = 0;
        let pointerStartX = 0;
        let isSwiping = false;

        this.canvas.addEventListener('pointerdown', (e) => {
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
            isSwiping = false;

            if (this.state === 'READY') {
                this.startPlaying();
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.state === 'PLAYING' && !isSwiping) {
                const dy = e.clientY - pointerStartY;
                const dx = Math.abs(e.clientX - pointerStartX);
                if (dy > 32 && dy > dx) {
                    // Downward swipe detected -> Slide!
                    isSwiping = true;
                    this.handleSlidePress();
                }
            }
        });

        this.canvas.addEventListener('pointerup', () => {
            if (this.state === 'PLAYING') {
                if (!isSwiping) {
                    // Quick tap -> Jump!
                    this.handleJumpPress();
                    setTimeout(() => this.handleJumpRelease(), 120);
                }
            }
        });

        // Ready overlay click to start
        const readyOverlay = document.getElementById('ready-overlay');
        if (readyOverlay) {
            readyOverlay.addEventListener('click', () => {
                if (this.state === 'READY') {
                    this.startPlaying();
                }
            });
        }

        // Tab focus/blur auto-pause and audio management
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.state === 'PLAYING') {
                    this.pause();
                }
                if (window.ForestDash.Audio && window.ForestDash.Audio.suspend) {
                    window.ForestDash.Audio.suspend();
                }
            } else {
                if (window.ForestDash.Audio && window.ForestDash.Audio.resume) {
                    window.ForestDash.Audio.resume();
                }
            }
        });
    }

    activateEmergencyPowerup() {
        if (this.state !== 'PLAYING') return;

        // Check if player has an available stored power-up
        if (this.storedPowerUp) {
            const powerId = this.storedPowerUp.id;
            this.powerUpManager.activate(powerId, this.player);
            this.storedPowerUp = null; // Consume charge
            window.ForestDash.Audio.playPowerup();
            window.ForestDash.ParticleSystem.spawnFloatingText(this.player.x + 20, this.player.y, 'SHIELD ACTIVATED!', '#00e5ff', 20);
        } else if (!this.player.hasShield && !this.player.hasMagnet && !this.player.hasMultiplier) {
            // No charges available
            window.ForestDash.Audio.playClick();
            window.ForestDash.ParticleSystem.spawnFloatingText(this.player.x + 20, this.player.y, 'NO POWER-UP!', '#e0e0e0', 16);
        }
    }

    handleResize() {
        const container = document.getElementById('game-container');
        const containerWidth = Math.max(320, container.clientWidth || window.innerWidth);
        const containerHeight = Math.max(240, container.clientHeight || window.innerHeight);

        const dpr = Math.min(2.5, window.devicePixelRatio || 1); // Cap DPR at 2.5 for mobile battery efficiency

        // Fit base aspect ratio inside container
        const targetAspect = this.baseWidth / this.baseHeight;
        const windowAspect = containerWidth / containerHeight;

        let renderWidth, renderHeight;
        if (windowAspect > targetAspect) {
            renderHeight = containerHeight;
            renderWidth = containerHeight * targetAspect;
        } else {
            renderWidth = containerWidth;
            renderHeight = containerWidth / targetAspect;
        }

        this.scale = renderWidth / this.baseWidth;

        // Set real canvas dimensions with DPR sharpness
        this.canvas.width = Math.round(this.baseWidth * dpr);
        this.canvas.height = Math.round(this.baseHeight * dpr);

        // Visual display size
        this.canvas.style.width = `${Math.round(renderWidth)}px`;
        this.canvas.style.height = `${Math.round(renderHeight)}px`;

        // Scale canvas context
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // STATE TRANSITIONS

    toMainMenu() {
        this.state = 'MAIN_MENU';
        window.ForestDash.UI.showMainMenu();
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStop();
        }
    }

    startReady() {
        this.resetRun();
        this.state = 'READY';
        window.ForestDash.UI.showReady();
        window.ForestDash.UI.updateHud(this.score, this.bestScore, this.runCoins, []);
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStop();
        }
    }

    startDirectPlay() {
        this.resetRun();
        this.state = 'PLAYING';
        window.ForestDash.UI.showPlaying();
        window.ForestDash.Audio.ensureReady();
        window.ForestDash.ParticleSystem.spawnFloatingText(this.player.x + 30, this.player.y - 20, 'DASH!', '#ffd700', 22);
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStart();
        }
    }

    startPlaying() {
        if (this.state !== 'READY' && this.state !== 'MAIN_MENU') return;
        this.state = 'PLAYING';
        window.ForestDash.UI.showPlaying();
        window.ForestDash.Audio.ensureReady();
        window.ForestDash.ParticleSystem.spawnFloatingText(this.player.x + 30, this.player.y - 20, 'DASH!', '#ffd700', 22);
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStart();
        }
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.pause();
        } else if (this.state === 'PAUSED') {
            this.resume();
        }
    }

    pause() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        window.ForestDash.UI.showPause();
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStop();
        }
    }

    resume() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.lastTime = performance.now(); // Avoid huge delta spike
        window.ForestDash.UI.hidePause();
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStart();
        }
    }

    restart() {
        this.startDirectPlay();
    }

    resetRun() {
        this.speed = window.ForestDash.Config.PHYSICS.BASE_SPEED;
        this.distance = 0;
        this.score = 0;
        this.runCoins = 0;
        this.savedCoinsInRun = 0;
        this.storedPowerUp = window.ForestDash.Config.POWERUPS.TYPES.SHIELD;
        this.isNewRecord = false;
        this.hasNotifiedNewBest = false;
        this.hasUsedRevive = false;

        this.bestScore = window.ForestDash.Storage.getHighScore();
        this.player.reset();
        this.obstacleManager.reset();
        this.coinManager.reset();
        this.powerUpManager.reset();
        window.ForestDash.ParticleSystem.reset();
    }

    useRevive() {
        if (this.hasUsedRevive) return;
        if (window.ForestDash.Storage.useRevive()) {
            this.hasUsedRevive = true;
            this.player.revive();
            // Clear obstacles in player vicinity for a fair restart
            this.obstacleManager.clearNearPlayer(this.player.x + 360);
            this.state = 'PLAYING';
            this.lastTime = performance.now();
            window.ForestDash.UI.showPlaying();
            if (window.ForestDash.CrazyGames) {
                window.ForestDash.CrazyGames.gameplayStart();
            }
        }
    }

    gameOver() {
        this.state = 'GAME_OVER';

        // Notify platform SDK that gameplay stopped
        if (window.ForestDash.CrazyGames) {
            window.ForestDash.CrazyGames.gameplayStop();
        }

        // Persist high score
        const record = window.ForestDash.Storage.saveHighScore(this.score);
        this.isNewRecord = record;

        // Persist newly earned coins only (prevents duplicate awards on revive)
        const newCoins = this.runCoins - this.savedCoinsInRun;
        if (newCoins > 0) {
            window.ForestDash.Storage.addCoins(newCoins);
            this.savedCoinsInRun = this.runCoins;
        }

        const canRevive = !this.hasUsedRevive && window.ForestDash.Storage.getRevives() > 0;
        window.ForestDash.UI.showGameOver(this.score, this.runCoins, this.isNewRecord, canRevive);
    }

    // INPUT ACTIONS

    handleJumpPress() {
        if (this.state === 'MAIN_MENU') {
            this.startDirectPlay();
        } else if (this.state === 'READY') {
            this.startPlaying();
            this.player.jump();
        } else if (this.state === 'PLAYING') {
            this.player.jump();
        }
    }

    handleJumpRelease() {
        if (this.state === 'PLAYING') {
            this.player.releaseJump();
        }
    }

    handleSlidePress() {
        if (this.state === 'READY') {
            this.startPlaying();
        } else if (this.state === 'PLAYING') {
            this.player.slide();
        }
    }

    // MAIN GAME LOOP

    loop(currentTime) {
        // Delta time capped at 0.1s to prevent physics tunneling after pauses/tabs
        let dt = (currentTime - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1;
        this.lastTime = currentTime;

        // Update systems
        this.update(dt);

        // Render everything
        this.render();

        this.animFrameId = requestAnimationFrame(this.loop);
    }

    update(dt) {
        // Main Menu & Ready States: World scrolls gently, player animates
        if (this.state === 'MAIN_MENU') {
            this.world.update(dt, 80);
            window.ForestDash.ParticleSystem.update(dt);
            return;
        }

        if (this.state === 'READY') {
            this.world.update(dt, 120);
            this.player.update(dt);
            window.ForestDash.ParticleSystem.update(dt);
            return;
        }

        if (this.state === 'PAUSED') {
            return; // Completely frozen during pause
        }

        if (this.state === 'GAME_OVER') {
            this.player.update(dt);
            window.ForestDash.ParticleSystem.update(dt);
            return;
        }

        if (this.state === 'PLAYING') {
            // Speed progression
            const phys = window.ForestDash.Config.PHYSICS;
            if (this.speed < phys.MAX_SPEED) {
                this.speed += phys.SPEED_INCREASE_RATE * dt;
            }

            // Distance & Score
            this.distance += this.speed * dt;
            const scoreMultiplier = this.player.hasMultiplier ? 2 : 1;
            this.score += (this.speed * 0.1) * scoreMultiplier * dt;

            // Live high score check
            if (this.score > this.bestScore) {
                if (!this.hasNotifiedNewBest && this.bestScore > 0) {
                    this.hasNotifiedNewBest = true;
                    window.ForestDash.Audio.playPowerup();
                    window.ForestDash.ParticleSystem.spawnFloatingText(this.player.x + 30, this.player.y - 20, 'NEW BEST RECORD!', '#ffd700', 20);
                }
                this.bestScore = Math.floor(this.score);
            }

            // Update entities
            this.world.update(dt, this.speed);
            this.player.update(dt);
            this.obstacleManager.update(dt, this.speed);
            this.coinManager.update(dt, this.speed, this.player);
            this.powerUpManager.update(dt, this.speed, this.player);
            window.ForestDash.ParticleSystem.update(dt);

            // Coin collection
            const collected = this.coinManager.checkCollection(this.player);
            if (collected > 0) {
                this.runCoins += collected;
                this.score += (collected * window.ForestDash.Config.COINS.SCORE_VALUE);
            }

            // Power-up pickup
            this.powerUpManager.checkCollection(this.player);

            // Obstacle collision check
            const hitObstacle = this.obstacleManager.checkCollision(this.player);
            if (hitObstacle) {
                const fatal = this.player.hit(true);
                if (fatal) {
                    this.gameOver();
                } else {
                    // Shield saved player! Destroy obstacle
                    this.obstacleManager.removeObstacle(hitObstacle);
                }
            }

            // Update HUD
            window.ForestDash.UI.updateHud(
                this.score,
                this.bestScore,
                this.runCoins,
                this.powerUpManager.getActivePowerUpsList()
            );
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.baseWidth;
        const h = this.baseHeight;

        ctx.clearRect(0, 0, w, h);

        // Screen Shake offset
        const shake = window.ForestDash.ParticleSystem.getScreenShake();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        // 1. World Scenery (Sky, Mountains, Parallax Trees, Ground)
        this.world.draw(ctx, w, h);

        // 2. Collectibles (Coins & Power-up Orbs)
        this.coinManager.draw(ctx);
        this.powerUpManager.draw(ctx);

        // 3. Obstacles
        this.obstacleManager.draw(ctx);

        // 4. Player Character
        if (this.state !== 'MAIN_MENU') {
            this.player.draw(ctx);
        }

        // 5. Visual Particles & Floating Texts
        window.ForestDash.ParticleSystem.draw(ctx);

        ctx.restore();
    }
};
