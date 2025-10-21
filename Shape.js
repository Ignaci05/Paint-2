// Shape.js

// La clase base solo necesita exportar su estructura
export class Shape {
    constructor({ color, fill, lineWidth, rotationAngle = 0 }) {
        this.color = color;
        this.fill = fill;
        this.lineWidth = lineWidth;
        this.rotationAngle = rotationAngle;
    }

    draw(ctx, isSelected = false) {
        const pivot = this.getCenter();
        
        ctx.save();
        
        // Aplicar Rotación
        if (this.rotationAngle !== 0) {
            ctx.translate(pivot.x, pivot.y);
            ctx.rotate(this.rotationAngle);
            ctx.translate(-pivot.x, -pivot.y);
        }

        this.drawShape(ctx, isSelected); 

        ctx.restore();
    }

    // Métodos abstractos (deben ser implementados en subclases)
    drawShape(ctx, isSelected) { throw new Error("Método 'drawShape' no implementado."); }
    isMouseOver(x, y) { throw new Error("Método 'isMouseOver' no implementado."); }
    getCenter() { throw new Error("Método 'getCenter' no implementado."); }
}