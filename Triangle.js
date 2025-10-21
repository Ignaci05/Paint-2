// Triangle.js
import { Shape } from './Shape.js';

export class Triangle extends Shape {
    constructor({ p1x, p1y, p2x, p2y, p3x, p3y, ...commonProps }) {
        super(commonProps);
        this.p1x = p1x; this.p1y = p1y; this.p2x = p2x; this.p2y = p2y; this.p3x = p3x; this.p3y = p3y;
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.beginPath(); ctx.moveTo(this.p1x, this.p1y); ctx.lineTo(this.p2x, this.p2y); ctx.lineTo(this.p3x, this.p3y);
        ctx.closePath(); if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); } ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth; ctx.setLineDash([]); ctx.stroke();
    }

    isMouseOver(x, y) {
        const minX = Math.min(this.p1x, this.p2x, this.p3x), maxX = Math.max(this.p1x, this.p2x, this.p3x);
        const minY = Math.min(this.p1y, this.p2y, this.p3y), maxY = Math.max(this.p1y, this.p2y, this.p3y);
        return x >= minX && x <= maxX && y >= minY && y <= maxY; 
    }

    getCenter() { return { x: (this.p1x + this.p2x + this.p3x) / 3, y: (this.p1y + this.p2y + this.p3y) / 3 }; }
}