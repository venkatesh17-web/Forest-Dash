/**
 * FOREST DASH: SPIRIT RUNNER
 * Storage Manager
 * 
 * Safely persists and retrieves high scores, coins, settings, and unlocked skins
 * using LocalStorage with in-memory fallbacks when storage is blocked.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.Storage = (function() {
    const KEYS = window.ForestDash.Config.STORAGE_KEYS;
    const memoryFallback = {};
    let isStorageAvailable = true;

    try {
        const testKey = '__forest_dash_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
    } catch (e) {
        console.warn('LocalStorage unavailable. Using in-memory fallback.', e);
        isStorageAvailable = false;
    }

    function getItem(key, defaultValue) {
        try {
            if (isStorageAvailable) {
                const val = window.localStorage.getItem(key);
                if (val !== null && val !== undefined) {
                    return JSON.parse(val);
                }
            } else if (memoryFallback[key] !== undefined) {
                return memoryFallback[key];
            }
        } catch (e) {
            console.error(`Error reading key "${key}" from storage:`, e);
        }
        return defaultValue;
    }

    function setItem(key, value) {
        try {
            if (isStorageAvailable) {
                window.localStorage.setItem(key, JSON.stringify(value));
            } else {
                memoryFallback[key] = value;
            }
        } catch (e) {
            console.error(`Error saving key "${key}" to storage:`, e);
            memoryFallback[key] = value;
        }
    }

    return {
        // High Score
        getHighScore() {
            const score = getItem(KEYS.HIGH_SCORE, 0);
            const num = Number(score);
            return !isNaN(num) && num >= 0 ? Math.floor(num) : 0;
        },

        saveHighScore(newScore) {
            const current = this.getHighScore();
            const num = Number(newScore);
            if (!isNaN(num) && num > current) {
                setItem(KEYS.HIGH_SCORE, Math.floor(num));
                return true; // New record!
            }
            return false;
        },

        // Total Coins
        getTotalCoins() {
            const coins = getItem(KEYS.TOTAL_COINS, 0);
            const num = Number(coins);
            return !isNaN(num) && num >= 0 ? Math.floor(num) : 0;
        },

        addCoins(amount) {
            const num = Number(amount);
            if (!isNaN(num) && num > 0) {
                const updated = this.getTotalCoins() + Math.floor(num);
                setItem(KEYS.TOTAL_COINS, updated);
                return updated;
            }
            return this.getTotalCoins();
        },

        spendCoins(amount) {
            const current = this.getTotalCoins();
            if (typeof amount === 'number' && amount > 0 && current >= amount) {
                const updated = current - Math.floor(amount);
                setItem(KEYS.TOTAL_COINS, updated);
                return true;
            }
            return false;
        },

        // Saved Revives
        getRevives() {
            const revives = getItem(KEYS.REVIVES, 1); // 1 free revive for new players
            return typeof revives === 'number' && revives >= 0 ? revives : 0;
        },

        useRevive() {
            const revives = this.getRevives();
            if (revives > 0) {
                setItem(KEYS.REVIVES, revives - 1);
                return true;
            }
            return false;
        },

        addRevives(amount) {
            if (amount > 0) {
                setItem(KEYS.REVIVES, this.getRevives() + amount);
            }
        },

        // Skins / Customization
        getOwnedSkins() {
            const owned = getItem(KEYS.OWNED_SKINS, ['wanderer']);
            return Array.isArray(owned) && owned.length > 0 ? owned : ['wanderer'];
        },

        isSkinOwned(skinId) {
            return this.getOwnedSkins().includes(skinId);
        },

        unlockSkin(skinId) {
            const owned = this.getOwnedSkins();
            if (!owned.includes(skinId)) {
                owned.push(skinId);
                setItem(KEYS.OWNED_SKINS, owned);
                return true;
            }
            return false;
        },

        getEquippedSkin() {
            const skinId = getItem(KEYS.EQUIPPED_SKIN, 'wanderer');
            const skins = window.ForestDash.Config.SKINS;
            const exists = skins.some(s => s.id === skinId);
            return exists ? skinId : 'wanderer';
        },

        setEquippedSkin(skinId) {
            if (this.isSkinOwned(skinId)) {
                setItem(KEYS.EQUIPPED_SKIN, skinId);
                return true;
            }
            return false;
        },

        // Settings
        getSettings() {
            const defaults = {
                soundEnabled: true,
                musicEnabled: true,
                particles: 'high', // 'high' or 'low'
            };
            const saved = getItem(KEYS.SETTINGS, defaults);
            return Object.assign({}, defaults, saved);
        },

        saveSettings(settings) {
            const current = this.getSettings();
            const updated = Object.assign({}, current, settings);
            setItem(KEYS.SETTINGS, updated);
            return updated;
        },

        // Reset all (for debugging or user request)
        resetAll() {
            try {
                if (isStorageAvailable) {
                    Object.values(KEYS).forEach(k => window.localStorage.removeItem(k));
                }
                for (const k in memoryFallback) {
                    delete memoryFallback[k];
                }
            } catch (e) {
                console.error('Failed to reset storage:', e);
            }
        }
    };
})();

