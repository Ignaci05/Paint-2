// FreehandPath.js (CORREGIDO Y FUNCIONAL)

import { Shape } from './Shape.js';
import { distToSegment } from './Utils.js';

export class FreehandPath extends Shape {
    constructor({ points = [], ...commonProps }) {
        super(commonProps);
        this.points = points || []; 
        // Mantener una copia 'original' para poder escalar/rotar de forma coherente
        this.originalPoints = JSON.parse(JSON.stringify(this.points || []));
    }

    drawShape(ctx, isSelected) {
        if (this.points.length === 0) return;

        const strokeStyle = isSelected ? '#ffc107' : this.color;
        
        // *** IMPORTANTE: ELIMINAMOS la rotación interna, ya la maneja Shape.draw ***
        // ctx.save(); // Eliminado
        // if (this.rotationAngle) { ... } // Eliminado

        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = this.lineWidth;
        ctx.lineCap = 'round'; // Para trazos más suaves
        ctx.lineJoin = 'round'; // Para uniones más suaves
        ctx.setLineDash([]);
        ctx.stroke();

        // ctx.restore(); // Eliminado
    }

    // Calcular el centro del bounding box para traslación/rotación
    getCenter() {
        if (this.points.length === 0) return { x: 0, y: 0 };
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });
        return { x: minX + (maxX - minX) / 2, y: minY + (maxY - minY) / 2 };
    }

    // *** CORRECCIÓN CRÍTICA EN COLISIÓN ***
    isMouseOver(px, py) {
        if (this.points.length === 0) return false;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const tolerance = this.lineWidth + 8; // Aumentamos la sensibilidad
        
        // 1. Comprobación rápida de Bounding Box expandido
        if (px >= minX - tolerance && px <= maxX + tolerance &&
            py >= minY - tolerance && py <= maxY + tolerance) {
            
            // 2. Comprobación precisa de Segmento (más costosa)
            for (let i = 0; i < this.points.length - 1; i++) {
                const p1 = this.points[i];
                const p2 = this.points[i + 1];
                
                // Usar la función distToSegment importada de Utils.js
                if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) <= tolerance) {
                    return true;
                }
            }
        }
        return false;
    }

    // Método para trasladar el camino completo
    translate(dx, dy) {
        this.points = this.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        this.originalPoints = this.originalPoints.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }

    // Método para escalar el camino completo
    scale(scaleFactor, pivot) {
        if (!this.originalPoints || this.originalPoints.length === 0) return;
        
        // El escalado debe realizarse sobre los puntos actuales para que se vea inmediato
        // y luego actualizar el originalPoints.
        this.points = this.points.map(p => ({
            x: pivot.x + (p.x - pivot.x) * scaleFactor,
            y: pivot.y + (p.y - pivot.y) * scaleFactor,
        }));
        
        // Actualizar originalPoints para que posteriores transformaciones sean relativas a la nueva forma
        this.originalPoints = JSON.parse(JSON.stringify(this.points));
    }

    // Método para rotar el camino completo
    rotate(angle, pivot) {
        if (!this.points || this.points.length === 0) return;
        this.points = this.points.map(p => {
            const translatedX = p.x - pivot.x;
            const translatedY = p.y - pivot.y;
            
            return {
                x: pivot.x + translatedX * Math.cos(angle) - translatedY * Math.sin(angle),
                y: pivot.y + translatedX * Math.sin(angle) + translatedY * Math.cos(angle),
            };
        });
        // Mantener originalPoints sincronizado
        this.originalPoints = JSON.parse(JSON.stringify(this.points));
    }
}