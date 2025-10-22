// Ellipse.js (CORREGIDO)

import { Shape } from './Shape.js';

export class Ellipse extends Shape {
    constructor({ x, y, radiusX, radiusY, rotation = 0, ...commonProps }) {
        super(commonProps);
        this.x = x; 
        this.y = y; 
        this.radiusX = radiusX; // Radio horizontal
        this.radiusY = radiusY; // Radio vertical
        this.rotation = rotation; // Esta propiedad no se usa, la rotación se maneja en rotationAngle
    }

    drawShape(ctx, isSelected) {
        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        // *** ELIMINAMOS ctx.save() / ctx.translate / ctx.rotate / ctx.restore ***
        // *** ESTO YA LO HACE LA CLASE BASE (Shape) ***

        ctx.beginPath();
        // Mantenemos 0 para la rotación interna, ya que la rotación se maneja a nivel del contexto.
        ctx.ellipse(this.x, this.y, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);

        if (fillStyle && this.fill !== null) { 
            ctx.fillStyle = fillStyle; 
            ctx.fill(); 
        }

        ctx.strokeStyle = strokeStyle; 
        ctx.lineWidth = this.lineWidth; 
        ctx.setLineDash([]); 
        ctx.stroke();
    }

    isMouseOver(px, py) {
        // La detección precisa es compleja. La aproximación por Bounding Box es aceptable por ahora.
        // Pero el cálculo de colisión debe ser más estricto para evitar borrar accidentalmente.
        // Se puede usar la fórmula de la elipse, o la caja de límites (bounding box).
        
        const minX = this.x - this.radiusX;
        const maxX = this.x + this.radiusX;
        const minY = this.y - this.radiusY;
        const maxY = this.y + this.radiusY;
        const tolerance = this.lineWidth + 5; // Mantener tolerancia para clic

        return px >= minX - tolerance && px <= maxX + tolerance && 
               py >= minY - tolerance && py <= maxY + tolerance;
    }

    getCenter() { 
        return { x: this.x, y: this.y }; 
    }
}