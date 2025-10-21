// Circle.js
import { Shape } from './Shape.js';
import { calcularDistancia } from './Utils.js';

export class Circle extends Shape {
    constructor({ x, y, radius, endX, endY, ...commonProps }) {
        super(commonProps);
        this.x = x; this.y = y; this.radius = radius;
        this.endX = endX; this.endY = endY;
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI); 
        if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
        ctx.strokeStyle = strokeStyle; ctx.lineWidth = this.lineWidth; ctx.setLineDash([]); ctx.stroke();

        ctx.beginPath(); ctx.setLineDash([2, 4]); ctx.strokeStyle = '#dc3545'; 
        ctx.lineWidth = 1; ctx.moveTo(this.x, this.y); ctx.lineTo(this.endX, this.endY); ctx.stroke();
    }

    isMouseOver(x, y) { return calcularDistancia(x, y, this.x, this.y) <= this.radius; }
    getCenter() { return { x: this.x, y: this.y }; }
}