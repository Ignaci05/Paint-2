// FreehandPath.js
import { Shape } from './Shape.js';
import { distToSegment } from './Utils.js';

export class FreehandPath extends Shape {
    constructor({ points = [], ...commonProps }) {
        super(commonProps);
        this.points = points || []; // Array de {x, y}
        // Mantener una copia 'original' para poder escalar/rotar de forma coherente
        this.originalPoints = JSON.parse(JSON.stringify(this.points || []));
    }

    drawShape(ctx, isSelected) {
        if (this.points.length === 0) return;

        const strokeStyle = isSelected ? '#ffc107' : this.color;
        
        ctx.save();
        
        // Aplicar rotación (sobre el centro del bounding box)
        if (this.rotationAngle) {
            const center = this.getCenter();
            ctx.translate(center.x, center.y);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-center.x, -center.y);
        }

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

        ctx.restore();
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

    // Para detección de click/mouseover (aproximación del bounding box)
    isMouseOver(px, py) {
        if (this.points.length === 0) return false;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const tolerance = this.lineWidth + 5; // Un poco más grande para facilitar la selección

        // Comprueba si el punto está dentro del "bounding box" expandido
        if (px >= minX - tolerance && px <= maxX + tolerance &&
            py >= minY - tolerance && py <= maxY + tolerance) {
            
                // Para una detección más precisa, comprobar la distancia a cada segmento de línea
                // Esto es más costoso, así que solo lo hacemos si ya estamos en el bounding box
                for (let i = 0; i < this.points.length - 1; i++) {
                    const p1 = this.points[i];
                    const p2 = this.points[i + 1];
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
        // Mantener coherencia para futuras transformaciones
        this.originalPoints = this.originalPoints.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }

    // Método para escalar el camino completo
    scale(scaleFactor, pivot) {
        if (!this.originalPoints || this.originalPoints.length === 0) return;
        // Escalar sobre originalPoints para evitar acumulación de error
        this.points = this.originalPoints.map(p => ({
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
        // Actualizar originalPoints tras rotación
        this.originalPoints = JSON.parse(JSON.stringify(this.points));
    }
}