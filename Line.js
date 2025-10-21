// Line.js
import { Shape } from './Shape.js';
import { distToSegment } from './Utils.js';

export class Line extends Shape {
    constructor({ x1, y1, x2, y2, ...commonProps }) {
        super(commonProps);
        this.x1 = x1; this.y1 = y1; this.x2 = x2; this.y2 = y2;
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        
        ctx.beginPath(); ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth; ctx.setLineDash([]); ctx.stroke();
    }

    isMouseOver(x, y) {
        // Colisión sensible (grosor de línea + 10px de margen)
        const margin = this.lineWidth + 10; 
        return distToSegment(x, y, this.x1, this.y1, this.x2, this.y2) < margin;
    }

    getCenter() { return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 }; }
}