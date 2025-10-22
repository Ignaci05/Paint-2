// Layer.js
export class Layer {
    constructor(name, isVisible = true) {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.isVisible = isVisible;
        this.shapes = []; // Array que contendrá los objetos de figura
    }
}