// TextShape.js
import { Shape } from './Shape.js';

export class TextShape extends Shape {
    constructor({ x, y, text, font, ...commonProps }) {
        super(commonProps);
        this.x = x; this.y = y; this.text = text; this.font = font;
        this.lineWidth = commonProps.lineWidth;
        this.baseFontSize = parseInt(font.match(/\d+/)) || 25; 
    }

    drawShape(ctx, isSelected) {
        const fillStyle = isSelected ? '#ffc107' : this.color;
        
        // Aplicar Rotación del Contexto
        ctx.save();
        if (this.rotationAngle) {
            const center = this.getCenter();
            ctx.translate(center.x, center.y);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-center.x, -center.y);
        }

        ctx.font = this.font; 
        ctx.fillStyle = fillStyle;
        ctx.setLineDash([]); 
        
        ctx.fillText(this.text, this.x, this.y); 

        // Opcional: Trazo alrededor del texto (simulando line-width)
        if (this.lineWidth > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.lineWidth / 2;
            ctx.strokeText(this.text, this.x, this.y);
        }

        ctx.restore();
    }

    isMouseOver(x, y) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = this.font;
        const metrics = tempCtx.measureText(this.text);
        
        const textWidth = metrics.width;
        const fontSize = parseInt(this.font.match(/\d+/)) || 25; 
        const textHeight = fontSize * 1.2;

        const boundsX = this.x;
        const boundsY = this.y - fontSize;
        
        const tolerance = 5;

        // Comprobación de colisión de caja (Bounding Box)
        return x >= boundsX - tolerance 
            && x <= boundsX + textWidth + tolerance 
            && y >= boundsY - tolerance 
            && y <= boundsY + textHeight + tolerance;
    }

    // El centro de pivote para rotación y escalado
    getCenter() { 
        const fontSize = parseInt(this.font.match(/\d+/)) || 25; 
        const tempCtx = document.createElement('canvas').getContext('2d');
        tempCtx.font = this.font;
        const metrics = tempCtx.measureText(this.text);
        const textWidth = metrics.width;
        
        return { 
            x: this.x + textWidth / 2, 
            y: this.y - fontSize / 2 
        }; 
    }
}