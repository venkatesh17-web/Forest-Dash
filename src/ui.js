/**
 * FOREST DASH: SPIRIT RUNNER
 * User Interface & Screen Manager
 * 
 * Manages HUD, Main Menu, Pause Menu, Game Over Screen, Shop,
 * sound toggles, and mobile touch button bindings.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.UI = (function() {
    // DOM Elements Cache
    let elMainMenu = null;
    let elReadyOverlay = null;
    let elHud = null;
    let elPauseMenu = null;
    let elGameOverMenu = null;
    let elShopMenu = null;
    let elMobileControls = null;

    // HUD values
    let elScoreVal = null;
    let elBestVal = null;
    let elCoinVal = null;
    let elPowerUpTray = null;

    // Shop Elements
    let elShopCoins = null;
    let elShopGrid = null;

    // Game Over Elements
    let elFinalScore = null;
    let elFinalBest = null;
    let elFinalCoins = null;
    let elNewRecordBadge = null;
    let elReviveBtn = null;

    // Menu stats
    let elMenuBest = null;
    let elMenuCoins = null;

    let gameRef = null;

    function init(game) {
        gameRef = game;

        // Query elements
        elMainMenu = document.getElementById('main-menu');
        elReadyOverlay = document.getElementById('ready-overlay');
        elHud = document.getElementById('hud');
        elPauseMenu = document.getElementById('pause-menu');
        elGameOverMenu = document.getElementById('game-over-menu');
        elShopMenu = document.getElementById('shop-menu');
        elMobileControls = document.getElementById('mobile-controls');

        elScoreVal = document.getElementById('hud-score');
        elBestVal = document.getElementById('hud-best');
        elCoinVal = document.getElementById('hud-coins');
        elPowerUpTray = document.getElementById('hud-powerups');

        elMenuBest = document.getElementById('menu-best-score');
        elMenuCoins = document.getElementById('menu-total-coins');

        elShopCoins = document.getElementById('shop-total-coins');
        elShopGrid = document.getElementById('shop-items-grid');

        elFinalScore = document.getElementById('game-over-score');
        elFinalBest = document.getElementById('game-over-best');
        elFinalCoins = document.getElementById('game-over-coins');
        elNewRecordBadge = document.getElementById('new-record-badge');
        elReviveBtn = document.getElementById('btn-revive');

        bindEvents();
        updateMenuStats();
    }

    function bindEvents() {
        // Main Menu Buttons
        const btnPlay = document.getElementById('btn-play');
        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.startDirectPlay();
            });
        }

        const btnShop = document.getElementById('btn-shop');
        if (btnShop) {
            btnShop.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                showShop();
            });
        }

        // Sound & Music Toggles
        const btnSoundToggle = document.getElementById('btn-toggle-sound');
        if (btnSoundToggle) {
            btnSoundToggle.addEventListener('click', () => {
                const state = window.ForestDash.Audio.toggleSound();
                window.ForestDash.Audio.playClick();
                updateSoundButtons();
            });
        }

        const btnMusicToggle = document.getElementById('btn-toggle-music');
        if (btnMusicToggle) {
            btnMusicToggle.addEventListener('click', () => {
                const state = window.ForestDash.Audio.toggleMusic();
                window.ForestDash.Audio.playClick();
                updateSoundButtons();
            });
        }

        // HUD Pause Button
        const btnHudPause = document.getElementById('hud-btn-pause');
        if (btnHudPause) {
            const handlePause = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.ForestDash.Audio.playClick();
                gameRef.togglePause();
            };
            btnHudPause.addEventListener('click', handlePause);
            btnHudPause.addEventListener('touchstart', handlePause, { passive: false });
        }

        // HUD Power-Up Button
        const btnHudPowerUp = document.getElementById('hud-btn-powerup');
        if (btnHudPowerUp) {
            const handlePowerUp = (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.activateEmergencyPowerup();
            };
            btnHudPowerUp.addEventListener('click', handlePowerUp);
            btnHudPowerUp.addEventListener('touchstart', handlePowerUp, { passive: false });
        }

        // Pause Menu Buttons
        const btnResume = document.getElementById('btn-resume');
        if (btnResume) {
            btnResume.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.resume();
            });
        }

        const btnPauseRestart = document.getElementById('btn-pause-restart');
        if (btnPauseRestart) {
            btnPauseRestart.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.restart();
            });
        }

        const btnPauseMenu = document.getElementById('btn-pause-main-menu');
        if (btnPauseMenu) {
            btnPauseMenu.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.toMainMenu();
            });
        }

        // Game Over Buttons
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) {
            btnRestart.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.restart();
            });
        }

        const btnGameOverMenu = document.getElementById('btn-gameover-main-menu');
        if (btnGameOverMenu) {
            btnGameOverMenu.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.toMainMenu();
            });
        }

        if (elReviveBtn) {
            elReviveBtn.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                gameRef.useRevive();
            });
        }

        // Shop Close Button
        const btnShopClose = document.getElementById('btn-shop-close');
        if (btnShopClose) {
            btnShopClose.addEventListener('click', () => {
                window.ForestDash.Audio.playClick();
                closeShop();
            });
        }

        // Mobile Controls (Jump & Slide buttons)
        const btnMobileJump = document.getElementById('mobile-btn-jump');
        if (btnMobileJump) {
            btnMobileJump.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleJumpPress();
            }, { passive: false });

            btnMobileJump.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleJumpRelease();
            }, { passive: false });

            btnMobileJump.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleJumpPress();
            });

            btnMobileJump.addEventListener('mouseup', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleJumpRelease();
            });
        }

        const btnMobileSlide = document.getElementById('mobile-btn-slide');
        if (btnMobileSlide) {
            btnMobileSlide.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleSlidePress();
            }, { passive: false });

            btnMobileSlide.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                gameRef.handleSlidePress();
            });
        }

        updateSoundButtons();
    }

    function updateSoundButtons() {
        const soundOn = window.ForestDash.Audio.isSoundEnabled();
        const musicOn = window.ForestDash.Audio.isMusicEnabled();

        const sBtn = document.getElementById('btn-toggle-sound');
        if (sBtn) {
            sBtn.textContent = soundOn ? '🔊 Sound: ON' : '🔇 Sound: OFF';
            sBtn.classList.toggle('active', soundOn);
        }

        const mBtn = document.getElementById('btn-toggle-music');
        if (mBtn) {
            mBtn.textContent = musicOn ? '🎵 Music: ON' : '🎵 Music: OFF';
            mBtn.classList.toggle('active', musicOn);
        }
    }

    function updateMenuStats() {
        const best = window.ForestDash.Storage.getHighScore();
        const coins = window.ForestDash.Storage.getTotalCoins();

        if (elMenuBest) elMenuBest.textContent = Math.floor(best).toLocaleString();
        if (elMenuCoins) elMenuCoins.textContent = coins.toLocaleString();
    }

    function showMainMenu() {
        hideAll();
        updateMenuStats();
        if (elMainMenu) elMainMenu.classList.remove('hidden');
    }

    function showReady() {
        hideAll();
        if (elHud) elHud.classList.remove('hidden');
        if (elReadyOverlay) elReadyOverlay.classList.remove('hidden');
        if (elMobileControls) elMobileControls.classList.remove('hidden');
    }

    function showPlaying() {
        hideAll();
        if (elHud) elHud.classList.remove('hidden');
        if (elMobileControls) elMobileControls.classList.remove('hidden');
    }

    function showPause() {
        if (elPauseMenu) elPauseMenu.classList.remove('hidden');
    }

    function hidePause() {
        if (elPauseMenu) elPauseMenu.classList.add('hidden');
    }

    function showGameOver(score, coins, isNewRecord, canRevive) {
        if (elGameOverMenu) elGameOverMenu.classList.remove('hidden');
        if (elFinalScore) elFinalScore.textContent = Math.floor(score).toLocaleString();
        if (elFinalCoins) elFinalCoins.textContent = coins.toLocaleString();
        if (elFinalBest) elFinalBest.textContent = Math.floor(window.ForestDash.Storage.getHighScore()).toLocaleString();

        if (elNewRecordBadge) {
            elNewRecordBadge.classList.toggle('hidden', !isNewRecord);
        }

        if (elReviveBtn) {
            const revivesLeft = window.ForestDash.Storage.getRevives();
            if (canRevive && revivesLeft > 0) {
                elReviveBtn.classList.remove('hidden');
                elReviveBtn.textContent = `💚 Spirit Revive (${revivesLeft} left)`;
            } else {
                elReviveBtn.classList.add('hidden');
            }
        }
    }

    function showShop() {
        if (elShopMenu) elShopMenu.classList.remove('hidden');
        renderShopItems();
    }

    function closeShop() {
        if (elShopMenu) elShopMenu.classList.add('hidden');
        updateMenuStats();
        if (gameRef && gameRef.player) {
            gameRef.player.updateSkin();
        }
    }

    function renderShopItems() {
        const skins = window.ForestDash.Config.SKINS;
        const totalCoins = window.ForestDash.Storage.getTotalCoins();
        const equippedId = window.ForestDash.Storage.getEquippedSkin();

        if (elShopCoins) elShopCoins.textContent = totalCoins.toLocaleString();
        if (!elShopGrid) return;

        elShopGrid.innerHTML = '';

        skins.forEach(skin => {
            const isOwned = window.ForestDash.Storage.isSkinOwned(skin.id);
            const isEquipped = (skin.id === equippedId);

            const card = document.createElement('div');
            card.className = `shop-card ${isEquipped ? 'equipped' : ''} ${isOwned ? 'owned' : ''}`;

            // Palette swatch preview
            const swatchHtml = `
                <div class="skin-preview-swatch">
                    <span style="background: ${skin.headbandColor};" title="Headband"></span>
                    <span style="background: ${skin.tunicColor};" title="Tunic"></span>
                    <span style="background: ${skin.scarfColor};" title="Scarf"></span>
                </div>
            `;

            let actionBtnHtml = '';
            if (isEquipped) {
                actionBtnHtml = `<button class="btn-skin-action active" disabled>Equipped</button>`;
            } else if (isOwned) {
                actionBtnHtml = `<button class="btn-skin-action btn-equip" data-id="${skin.id}">Equip</button>`;
            } else {
                const canAfford = totalCoins >= skin.cost;
                actionBtnHtml = `<button class="btn-skin-action btn-buy ${canAfford ? '' : 'disabled'}" data-id="${skin.id}" data-cost="${skin.cost}">
                    🪙 ${skin.cost}
                </button>`;
            }

            card.innerHTML = `
                ${swatchHtml}
                <div class="shop-card-info">
                    <h4>${skin.name}</h4>
                </div>
                ${actionBtnHtml}
            `;

            elShopGrid.appendChild(card);
        });

        // Add event listeners to equip and buy buttons
        elShopGrid.querySelectorAll('.btn-equip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                window.ForestDash.Storage.setEquippedSkin(id);
                window.ForestDash.Audio.playClick();
                renderShopItems();
            });
        });

        elShopGrid.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const cost = parseInt(e.target.getAttribute('data-cost'), 10);
                if (window.ForestDash.Storage.spendCoins(cost)) {
                    window.ForestDash.Storage.unlockSkin(id);
                    window.ForestDash.Storage.setEquippedSkin(id);
                    window.ForestDash.Audio.playPowerup();
                    renderShopItems();
                } else {
                    window.ForestDash.Audio.playHit();
                }
            });
        });
    }

    function updateHud(score, bestScore, runCoins, activePowerUps) {
        if (elScoreVal) elScoreVal.textContent = Math.floor(score);
        if (elBestVal) elBestVal.textContent = Math.floor(bestScore);
        if (elCoinVal) elCoinVal.textContent = runCoins;

        // Render active powerups icons & durations
        if (elPowerUpTray) {
            elPowerUpTray.innerHTML = '';
            activePowerUps.forEach(p => {
                const tag = document.createElement('div');
                tag.className = 'powerup-badge';
                tag.style.borderColor = p.color;
                const secText = p.duration > 0 ? `${Math.ceil(p.remaining)}s` : '1x';
                tag.innerHTML = `<span>${p.icon}</span> <small>${secText}</small>`;
                elPowerUpTray.appendChild(tag);
            });
        }

        // Update bottom-right Power-Up button state (Metallic shield badge from reference image)
        const btnHudPowerUp = document.getElementById('hud-btn-powerup');
        const elPowerUpCount = document.getElementById('hud-powerup-count');
        if (btnHudPowerUp) {
            const hasStored = gameRef && gameRef.storedPowerUp;
            const iconEl = btnHudPowerUp.querySelector('.powerup-inner-icon') || btnHudPowerUp;

            if (activePowerUps.length > 0 || hasStored) {
                const primary = (activePowerUps.length > 0) ? activePowerUps[0] : gameRef.storedPowerUp;
                iconEl.textContent = primary.icon;
                if (elPowerUpCount) elPowerUpCount.textContent = hasStored ? '1' : (activePowerUps[0].charges || '1');
                btnHudPowerUp.style.boxShadow = `0 0 20px ${primary.color}, 0 6px 16px rgba(0, 0, 0, 0.8)`;
                btnHudPowerUp.style.opacity = '1';
                btnHudPowerUp.classList.remove('disabled');
            } else {
                iconEl.textContent = '🛡️';
                if (elPowerUpCount) elPowerUpCount.textContent = '0';
                btnHudPowerUp.style.boxShadow = 'none';
                btnHudPowerUp.style.opacity = '0.45';
                btnHudPowerUp.classList.add('disabled');
            }
        }
    }

    function hideAll() {
        if (elMainMenu) elMainMenu.classList.add('hidden');
        if (elReadyOverlay) elReadyOverlay.classList.add('hidden');
        if (elHud) elHud.classList.add('hidden');
        if (elPauseMenu) elPauseMenu.classList.add('hidden');
        if (elGameOverMenu) elGameOverMenu.classList.add('hidden');
        if (elShopMenu) elShopMenu.classList.add('hidden');
        if (elMobileControls) elMobileControls.classList.add('hidden');
    }

    return {
        init,
        showMainMenu,
        showReady,
        showPlaying,
        showPause,
        hidePause,
        showGameOver,
        showShop,
        closeShop,
        updateHud,
        updateMenuStats,
    };
})();
