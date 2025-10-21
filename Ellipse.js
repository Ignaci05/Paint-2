// Ellipse.js

import { Shape } from './Shape.js';

export class Ellipse extends Shape {
    constructor({ x, y, radiusX, radiusY, rotation = 0, ...commonProps }) {
        super(commonProps);
        this.x = x; 
        this.y = y; 
        this.radiusX = radiusX; // Radio horizontal
        this.radiusY = radiusY; // Radio vertical
        this.rotation = rotation;
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.save();
        
        // Aplicar rotación
        if (this.rotationAngle) {
            const center = this.getCenter();
            ctx.translate(center.x, center.y);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-center.x, -center.y);
        }

        ctx.beginPath();
        // ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        // La rotación ya se maneja con ctx.rotate, así que pasamos 0 para el argumento de rotación interna.
        ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);

        if (fillStyle && this.fill !== null) { 
            ctx.fillStyle = fillStyle; 
            ctx.fill(); 
        }

        ctx.strokeStyle = strokeStyle; 
        ctx.lineWidth = this.lineWidth; 
        ctx.setLineDash([]); 
        ctx.stroke();

        ctx.restore();
    }

    isMouseOver(px, py) {
        // Implementación simplificada para elipse (chequea si el punto está dentro del bounding box)
        // La detección precisa de elipse es compleja y lenta. Usaremos una aproximación del bounding box.
        
        const minX = this.x - this.radiusX;
        const maxX = this.x + this.radiusX;
        const minY = this.y - this.radiusY;
        const maxY = this.y + this.radiusY;
        const tolerance = this.lineWidth + 5;

        // Comprobación de caja de límites expandida
        return px >= minX - tolerance && 
               px <= maxX + tolerance && 
               py >= minY - tolerance && 
               py <= maxY + tolerance;
    }

    getCenter() { 
        return { x: this.x, y: this.y }; 
    }
}