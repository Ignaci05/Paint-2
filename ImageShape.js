// ImageShape.js
import { Shape } from './Shape.js';

export class ImageShape extends Shape {
    constructor({ x, y, width, height, imageElement, rotationAngle = 0, ...commonProps }) {
        super(commonProps);
        this.x = x; // Posición X
        this.y = y; // Posición Y
        this.width = width;
        this.height = height;
        this.imageElement = imageElement; // El objeto Image de JS
    }

    drawShape(ctx, isSelected) {
        // La imagen se dibuja primero, debajo de otras formas.
        // Usamos ctx.drawImage(img, x, y, w, h)
        ctx.drawImage(this.imageElement, this.x, this.y, this.width, this.height);

        if (isSelected) {
            // Dibujar un borde resaltado alrededor de la imagen seleccionada
            ctx.strokeStyle = '#ffc107'; // Amarillo
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.setLineDash([]);
        }
    }

    getCenter() {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    isMouseOver(px, py) {
        // Detección simple basada en el bounding box
        return px >= this.x && px <= this.x + this.width &&
               py >= this.y && py <= this.y + this.height;
    }

    // Método para aplicar la traslación (movimiento)
    translate(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    // Método para aplicar la escala
    scale(scaleFactor, pivot) {
        const newWidth = this.width * scaleFactor;
        const newHeight = this.height * scaleFactor;

        // Asegurar que el punto (x, y) de la imagen se actualice para mantener el pivote
        this.x = pivot.x + (this.x - pivot.x) * scaleFactor;
        this.y = pivot.y + (this.y - pivot.y) * scaleFactor;

        this.width = newWidth;
        this.height = newHeight;
    }

    // Nota: La rotación se maneja automáticamente por la clase base Shape
    // al usar getCenter() y rotationAngle.
}