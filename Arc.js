import { Shape } from './Shape.js';
import { calcularDistancia } from './Utils.js'; 

export class Arc extends Shape {
    constructor({ x, y, radius, startAngle = 0, endAngle = Math.PI, radiusPointX = null, radiusPointY = null, ...commonProps }) {
        super(commonProps);
        this.x = x; this.y = y; this.radius = radius;
        this.startAngle = startAngle; this.endAngle = endAngle;
        this.radiusPointX = radiusPointX; this.radiusPointY = radiusPointY;
        this.endX = radiusPointX; this.endY = radiusPointY;
    }

    getCenter() { 
        return { x: this.x, y: this.y }; 
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.save();
        
        if (this.rotationAngle) {
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-this.x, -this.y);
        }

        if (fillStyle && this.fill !== 'transparent' && this.fill !== 'none' && this.fill !== null) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y); 
            ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle);
            ctx.closePath();
            ctx.fillStyle = fillStyle; 
            ctx.fill(); 
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, this.startAngle, this.endAngle);
        
        ctx.strokeStyle = strokeStyle; 
        ctx.lineWidth = this.lineWidth; 
        ctx.setLineDash([]); 
        ctx.stroke();

        if (this.radiusPointX !== null && this.radiusPointY !== null) {
            ctx.beginPath(); 
            ctx.setLineDash([2,4]); 
            ctx.strokeStyle = '#dc3545'; 
            ctx.lineWidth = 1;
            ctx.moveTo(this.x, this.y); 
            ctx.lineTo(this.radiusPointX, this.radiusPointY); 
            ctx.stroke();
        }
        
        ctx.restore(); 
    }

    isMouseOver(px, py) {
        const d = calcularDistancia(px, py, this.x, this.y);
        return Math.abs(d - this.radius) <= (this.lineWidth + 6);
    }
}