/**
 * FOREST DASH: SPIRIT RUNNER
 * Application Entry Point
 */

window.ForestDash = window.ForestDash || {};

window.addEventListener('DOMContentLoaded', () => {
    console.log('%c🌲 FOREST DASH: SPIRIT RUNNER 🌲', 'color: #ff9800; font-size: 16px; font-weight: bold;');
    console.log('Game initialized successfully. Ready to run!');

    try {
        const game = new window.ForestDash.Game();
        window.ForestDash.instance = game;
        game.init();
    } catch (err) {
        console.error('Fatal initialization error:', err);
        const errorBanner = document.createElement('div');
        errorBanner.style.position = 'fixed';
        errorBanner.style.top = '20px';
        errorBanner.style.left = '50%';
        errorBanner.style.transform = 'translateX(-50%)';
        errorBanner.style.background = '#d32f2f';
        errorBanner.style.color = '#fff';
        errorBanner.style.padding = '16px 24px';
        errorBanner.style.borderRadius = '8px';
        errorBanner.style.fontFamily = 'sans-serif';
        errorBanner.style.zIndex = '9999';
        errorBanner.textContent = 'Failed to start game: ' + err.message;
        document.body.appendChild(errorBanner);
    }
});

