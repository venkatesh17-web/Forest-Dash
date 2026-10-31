/**
 * FOREST DASH: SPIRIT RUNNER
 * CrazyGames SDK Integration Adapter (v3 Compatible)
 * 
 * Safely handles platform lifecycle events (gameplayStart / gameplayStop)
 * and prepares the architecture for Full Launch ad monetization without
 * breaking Basic Launch or running fake/external advertisements.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.CrazyGames = (function() {
    let sdkInstance = null;
    let isInitialized = false;

    async function init() {
        // Detect if CrazyGames v3 SDK script is loaded in the window
        if (typeof window.CrazyGames !== 'undefined' && window.CrazyGames.SDK) {
            try {
                // Wait for the SDK to finish initializing BEFORE assigning sdkInstance
                await window.CrazyGames.SDK.init();
                sdkInstance = window.CrazyGames.SDK;
                isInitialized = true;
                console.log('[CrazyGames SDK] Successfully initialized.');
            } catch (err) {
                // Expected on local file:/// origin or when running outside crazygames.com domain
                console.warn('[CrazyGames SDK] Initialization bypassed or unavailable in current environment:', err.message);
                sdkInstance = null;
                isInitialized = false;
            }
        } else {
            // Normal behavior during local testing, itch.io, or Basic Launch before SDK script tag
            sdkInstance = null;
            isInitialized = false;
        }
    }

    function gameplayStart() {
        // Never call gameplayStart unless init() resolved successfully
        if (!isInitialized || !sdkInstance) return;
        try {
            if (sdkInstance.game && typeof sdkInstance.game.gameplayStart === 'function') {
                sdkInstance.game.gameplayStart();
            }
        } catch (e) {
            console.warn('[CrazyGames SDK] gameplayStart bypassed:', e.message);
        }
    }

    function gameplayStop() {
        // Never call gameplayStop unless init() resolved successfully
        if (!isInitialized || !sdkInstance) return;
        try {
            if (sdkInstance.game && typeof sdkInstance.game.gameplayStop === 'function') {
                sdkInstance.game.gameplayStop();
            }
        } catch (e) {
            console.warn('[CrazyGames SDK] gameplayStop bypassed:', e.message);
        }
    }

    /**
     * Request a Midgame Interstitial Ad (Used for Full Launch transition)
     * For Basic Launch or when SDK is absent, seamlessly continues without interrupting player.
     */
    function requestMidgameAd(callbacks = {}) {
        if (isInitialized && sdkInstance && sdkInstance.ad && typeof sdkInstance.ad.requestAd === 'function') {
            try {
                sdkInstance.ad.requestAd('midgame', {
                    adStarted: () => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.suspend();
                        if (callbacks.adStarted) callbacks.adStarted();
                    },
                    adFinished: () => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.resume();
                        if (callbacks.adFinished) callbacks.adFinished();
                    },
                    adError: (error) => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.resume();
                        if (callbacks.adError) callbacks.adError(error);
                    }
                });
            } catch (err) {
                if (callbacks.adFinished) callbacks.adFinished();
            }
        } else {
            // Graceful fallback for Basic Launch
            if (callbacks.adFinished) callbacks.adFinished();
        }
    }

    /**
     * Request a Rewarded Ad (Used for Full Launch revives/rewards)
     * For Basic Launch or when SDK is absent, provides safe fallback.
     */
    function requestRewardedAd(callbacks = {}) {
        if (isInitialized && sdkInstance && sdkInstance.ad && typeof sdkInstance.ad.requestAd === 'function') {
            try {
                sdkInstance.ad.requestAd('rewarded', {
                    adStarted: () => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.suspend();
                        if (callbacks.adStarted) callbacks.adStarted();
                    },
                    adFinished: () => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.resume();
                        if (callbacks.adFinished) callbacks.adFinished();
                    },
                    adError: (error) => {
                        if (window.ForestDash.Audio) window.ForestDash.Audio.resume();
                        if (callbacks.adError) callbacks.adError(error);
                    }
                });
            } catch (err) {
                if (callbacks.adError) callbacks.adError(err.message);
            }
        } else {
            // Graceful fallback: do not trigger rewards without active verified ad
            if (callbacks.adError) callbacks.adError('SDK unavailable');
        }
    }

    return {
        init,
        gameplayStart,
        gameplayStop,
        requestMidgameAd,
        requestRewardedAd,
        isAvailable() {
            return !!(sdkInstance && isInitialized);
        }
    };
})();
