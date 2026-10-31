/**
 * FOREST DASH: SPIRIT RUNNER
 * Game Configuration & Tuning Parameters
 * 
 * All gameplay, physics, visual, and difficulty balance settings
 * are centralized here for easy tuning.
 */

window.ForestDash = window.ForestDash || {};

window.ForestDash.Config = {
    // Canvas & Screen Dimensions (Virtual resolution)
    CANVAS: {
        BASE_WIDTH: 960,
        BASE_HEIGHT: 540,
        MIN_ASPECT: 4 / 3,
        MAX_ASPECT: 21 / 9,
        TARGET_FPS: 60,
    },

    // Physics & Movement
    PHYSICS: {
        GRAVITY: 1850,              // Gravity acceleration (px/s^2)
        BASE_SPEED: 340,            // Initial forward run speed (px/s)
        MAX_SPEED: 640,             // Maximum run speed cap (px/s)
        SPEED_INCREASE_RATE: 2.8,   // Speed increase per second (px/s^2)
        GROUND_Y: 440,              // Baseline ground surface Y coordinate
        JUMP_FORCE: -620,           // Initial jump velocity (px/s)
        JUMP_HOLD_ACCEL: -750,      // Additional upward boost while holding jump
        MAX_JUMP_HOLD_TIME: 0.16,   // Maximum duration jump hold boost applies (seconds)
        DOUBLE_JUMP_FORCE: -540,    // Double jump velocity
        SLIDE_DURATION: 0.55,       // Slide duration (seconds)
        SLIDE_HITBOX_SCALE_Y: 0.5,  // Hitbox height factor when sliding
    },

    // Player Appearance & Dimensions
    PLAYER: {
        WIDTH: 48,
        HEIGHT: 68,
        SLIDE_HEIGHT: 34,
        DEFAULT_X: 180,             // Centered comfortably on screen
        INVINCIBILITY_DURATION: 1.5,// Invulnerability time after shield break or revive (seconds)
        MAX_HEALTH: 1,
    },

    // Obstacle Generator & Balancing
    OBSTACLES: {
        MIN_GAP: 380,               // Minimum distance between obstacles
        MAX_GAP: 700,               // Maximum distance between obstacles
        GAP_SPEED_FACTOR: 0.7,      // Additional gap scaling per unit of speed
        SAFE_START_DISTANCE: 400,   // Distance before first obstacle spawns
        TYPES: {
            ROCK: {
                name: 'Rock',
                width: 44,
                height: 36,
                type: 'ground',
                color: '#4a3b32',
                canSlideUnder: false,
                requireJump: true,
            },
            LOG: {
                name: 'Fallen Log',
                width: 72,
                height: 44,
                type: 'ground',
                color: '#3d2516',
                canSlideUnder: false,
                requireJump: true,
            },
            ROOTS: {
                name: 'Twisted Roots',
                width: 56,
                height: 52,
                type: 'ground',
                color: '#2a1a10',
                canSlideUnder: false,
                requireJump: true,
            },
            BRIAR: {
                name: 'Thorny Briar',
                width: 80,
                height: 48,
                type: 'ground',
                color: '#3a1f2d',
                canSlideUnder: false,
                requireJump: true,
            },
            OVERHANG_BRANCH: {
                name: 'Low Ancient Branch',
                width: 90,
                height: 120,
                type: 'overhead',    // Player must slide under or avoid!
                clearanceY: 48,      // Clearance from ground (player slide height = 34px)
                color: '#2d1b13',
                canSlideUnder: true,
                requireJump: false,
            },
            SPIRIT_BRAMBLE: {
                name: 'Spirit Bramble',
                width: 42,
                height: 42,
                type: 'floating',    // Mid-air obstacle
                floatYOffset: -75,   // Height above ground
                color: '#4e1e35',
                canSlideUnder: true,
                requireJump: false,
            }
        }
    },

    // Coins & Patterns
    COINS: {
        SIZE: 22,                   // Radius of coin
        ROTATION_SPEED: 4.5,        // Spin animation speed
        MAGNET_RADIUS: 260,         // Attraction range when magnet is active
        MAGNET_SPEED: 720,          // Coin pull speed
        VALUE: 1,                   // Default coin count per pickup
        SCORE_VALUE: 50,            // Score points per coin
        SPAWN_CHANCE: 0.65,         // Chance of coin group between obstacles
    },

    // Power-Ups
    POWERUPS: {
        SIZE: 34,
        SPAWN_INTERVAL_MIN: 14,     // Seconds between power-up spawn opportunities
        SPAWN_INTERVAL_MAX: 26,
        TYPES: {
            SHIELD: {
                id: 'shield',
                name: 'Spirit Shield',
                duration: 0,        // 0 = lasts until consumed by 1 hit
                charges: 1,
                color: '#00e5ff',
                auraColor: 'rgba(0, 229, 255, 0.4)',
                icon: '🛡️',
            },
            MAGNET: {
                id: 'magnet',
                name: 'Coin Magnet',
                duration: 9.0,      // Seconds
                color: '#ffc107',
                auraColor: 'rgba(255, 193, 7, 0.4)',
                icon: '🧲',
            },
            MULTIPLIER: {
                id: 'multiplier',
                name: '2X Score & Coins',
                duration: 10.0,     // Seconds
                multiplier: 2,
                color: '#b388ff',
                auraColor: 'rgba(179, 136, 255, 0.4)',
                icon: '✨',
            }
        }
    },

    // Environment & Visual Layers (Reddish-brown mysterious autumn forest matching reference image)
    ENVIRONMENT: {
        FOG_COLOR: '#361116',
        SKY_GRADIENT: ['#20090d', '#330e13', '#4a151b', '#661f24', '#7e2a2f'],
        CANOPY_COLOR: '#240a0e',
        TREE_TRUNK_FAR: '#2e0d12',
        TREE_TRUNK_MID: '#3e1217',
        TREE_TRUNK_NEAR: '#4d161d',
        FOLIAGE_RED: '#8a272a',
        FOLIAGE_ORANGE: '#ad3b2c',
        GROUND_STONE_COLOR: '#23252a',
        GROUND_STONE_BORDER: '#16181c',
        GROUND_DIRT_COLOR: '#121316',
        GRASS_ORANGE: '#d85834',
        GRASS_RED: '#b73824',
        GRASS_DARK: '#1e090b',
        PARALLAX_SPEEDS: {
            SKY: 0.0,
            DISTANT_HILLS: 0.06,
            FAR_TREES: 0.18,
            MID_TREES: 0.45,
            NEAR_TREES: 0.80,
            GROUND: 1.0,
            FOREGROUND_VIGNETTE: 1.2,
        },
        LEAF_PARTICLE_COUNT: 20,
        FIREFLY_COUNT: 14,
    },

    // Particle Limits
    PARTICLES: {
        MAX_PARTICLES: 180,
    },

    // Audio Settings
    AUDIO: {
        MASTER_VOLUME: 0.7,
        SFX_VOLUME: 0.8,
        MUSIC_VOLUME: 0.45,
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        HIGH_SCORE: 'forest_dash_spirit_runner_highscore',
        TOTAL_COINS: 'forest_dash_spirit_runner_total_coins',
        REVIVES: 'forest_dash_spirit_runner_revives',
        EQUIPPED_SKIN: 'forest_dash_spirit_runner_skin',
        OWNED_SKINS: 'forest_dash_spirit_runner_owned_skins',
        SETTINGS: 'forest_dash_spirit_runner_settings',
    },

    // Character Skins / Customization (Faithful to Reference Art Style)
    SKINS: [
        {
            id: 'wanderer',
            name: 'Spirit Runner',
            cost: 0,
            skinTone: '#f4ba98',
            headbandColor: '#e53935', // Vibrant Crimson
            tasselColor: '#fdd835',   // Golden Tassel
            sashColor: '#e53935',     // Red Waistwrap
            wristbandColor: '#e53935',
            hairColor: '#1a181b',     // Jet Black
            facePaintColor: '#d32f2f' // Red Cheek Markings
        },
        {
            id: 'spirit_walker',
            name: 'Spirit Shaman',
            cost: 80,
            skinTone: '#f4ba98',
            headbandColor: '#00e5ff', // Cyan Neon
            tasselColor: '#80d8ff',
            sashColor: '#0288d1',
            wristbandColor: '#00e5ff',
            hairColor: '#eceff1',     // Silver White
            facePaintColor: '#00b0ff'
        },
        {
            id: 'autumn_blade',
            name: 'Autumn Warrior',
            cost: 150,
            skinTone: '#f4ba98',
            headbandColor: '#ff9800', // Amber Gold
            tasselColor: '#ffeb3b',
            sashColor: '#e65100',
            wristbandColor: '#ff9800',
            hairColor: '#bf360c',     // Rust Auburn
            facePaintColor: '#f57c00'
        },
        {
            id: 'shadow_ninja',
            name: 'Night Phantom',
            cost: 250,
            skinTone: '#e0b59b',
            headbandColor: '#7c4dff', // Purple Neon
            tasselColor: '#b388ff',
            sashColor: '#212121',     // Charcoal
            wristbandColor: '#7c4dff',
            hairColor: '#303030',
            facePaintColor: '#9c27b0'
        }
    ]
};

