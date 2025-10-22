// Polygon.js
import { Shape } from './Shape.js';

export class Polygon extends Shape {
    constructor({ points = [], ...commonProps }) {
        super(commonProps);
        this.points = points; // Array de {x, y}
    }

    drawShape(ctx, isSelected) {
        if (this.points.length < 2) return;

        const strokeStyle = isSelected ? '#ffc107' : this.color;
        const fillStyle = isSelected ? 'rgba(255, 193, 7, 0.3)' : this.fill;

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.closePath(); // Cierra el polígono

        if (fillStyle && this.fill !== null) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash([]);
        ctx.stroke();
    }

    getCenter() {
        if (this.points.length === 0) return { x: 0, y: 0 };
        
        // Calcula el centroide (promedio simple de todos los puntos)
        let totalX = 0, totalY = 0;
        this.points.forEach(p => {
            totalX += p.x;
            totalY += p.y;
        });
        return { x: totalX / this.points.length, y: totalY / this.points.length };
    }

    isMouseOver(px, py) {
        // Para simplificar y mejorar el rendimiento, usaremos la caja delimitadora (Bounding Box) expandida.
        // La detección precisa de punto-en-polígono es muy costosa.
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const tolerance = this.lineWidth + 8; // Margen de selección
        return px >= minX - tolerance && 
               px <= maxX + tolerance && 
               py >= minY - tolerance && 
               py <= maxY + tolerance;
    }
    
    // Método para aplicar la traslación (movimiento)
    translate(dx, dy) {
        this.points = this.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }

    // Método para aplicar la escala
    scale(scaleFactor, pivot) {
        this.points = this.points.map(p => ({
            x: pivot.x + (p.x - pivot.x) * scaleFactor,
            y: pivot.y + (p.y - pivot.y) * scaleFactor,
        }));
    }

    // Método para aplicar la rotación
    rotate(angle, pivot) {
        this.points = this.points.map(p => {
            const translatedX = p.x - pivot.x;
            const translatedY = p.y - pivot.y;
            return {
                x: pivot.x + translatedX * Math.cos(angle) - translatedY * Math.sin(angle),
                y: pivot.y + translatedX * Math.sin(angle) + translatedY * Math.cos(angle),
            };
        });
    }
}