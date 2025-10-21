// Rectangle.js
import { Shape } from './Shape.js';

export class Rectangle extends Shape {
    constructor({ x1, y1, x2, y2, ...commonProps }) {
        super(commonProps);
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    }

    drawShape(ctx, isSelected) {
        const x = Math.min(this.x1, this.x2), y = Math.min(this.y1, this.y2);
        const width = Math.abs(this.x1 - this.x2), height = Math.abs(this.y1 - this.y2);
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.beginPath(); ctx.rect(x, y, width, height);
        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        ctx.strokeStyle = strokeStyle; ctx.lineWidth = this.lineWidth; ctx.setLineDash([]); ctx.stroke();

        ctx.beginPath(); ctx.setLineDash([2, 4]); ctx.strokeStyle = '#dc3545'; 
        ctx.lineWidth = 1; ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.stroke();
    }

    isMouseOver(x, y) {
        const xMin = Math.min(this.x1, this.x2), xMax = Math.max(this.x1, this.x2);
        const yMin = Math.min(this.y1, this.y2), yMax = Math.max(this.y1, this.y2);
        return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
    }

    getCenter() { return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 }; }
}