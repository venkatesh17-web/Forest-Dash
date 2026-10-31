/**
 * FOREST DASH: SPIRIT RUNNER
 * Physics & Collision Engine
 * 
 * Provides AABB collision detection with forgiving hitboxes,
 * ray/ground clamping, vector math helpers, and canvas compatibility polyfills.
 */

window.ForestDash = window.ForestDash || {};

// Universal polyfill for roundRect across older browsers and mobile webviews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        if (!radii) radii = 0;
        let r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
        r = Math.min(Math.max(0, r), Math.abs(w) / 2, Math.abs(h) / 2);
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

window.ForestDash.Physics = (function() {
    /**
     * Check Axis-Aligned Bounding Box (AABB) intersection
     * with optional inner margin/padding to make collisions feel fair and forgiving
     */
    function checkAABB(rectA, rectB, paddingA = 0, paddingB = 0) {
        const leftA = rectA.x + paddingA;
        const rightA = rectA.x + rectA.width - paddingA;
        const topA = rectA.y + paddingA;
        const bottomA = rectA.y + rectA.height - paddingA;

        const leftB = rectB.x + paddingB;
        const rightB = rectB.x + rectB.width - paddingB;
        const topB = rectB.y + paddingB;
        const bottomB = rectB.y + rectB.height - paddingB;

        return !(
            rightA <= leftB ||
            leftA >= rightB ||
            bottomA <= topB ||
            topA >= bottomB
        );
    }

    /**
     * Check circle-to-circle or circle-to-point distance
     */
    function distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if a circle intersects an AABB
     */
    function checkCircleAABB(circle, rect) {
        // Find closest point on rect to circle center
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

        const dist = distance(circle.x, circle.y, closestX, closestY);
        return dist <= circle.radius;
    }

    return {
        checkAABB,
        distance,
        checkCircleAABB,

        // Clamp number between min and max
        clamp(val, min, max) {
            return Math.max(min, Math.min(max, val));
        },

        // Linear interpolation
        lerp(start, end, t) {
            return start + (end - start) * t;
        }
    };
})();
