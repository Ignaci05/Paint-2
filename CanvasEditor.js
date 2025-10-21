// CanvasEditor.js

import { calcularDistancia, distToSegment } from './Utils.js';
import { Shape } from './Shape.js';
import { Circle } from './Circle.js';
import { Rectangle } from './Rectangle.js';
import { Line } from './Line.js';
import { Triangle } from './Triangle.js';
import { Arc } from './Arc.js';
import { TextShape } from './TextShape.js';
import { Ellipse } from './Ellipse.js';
import { FreehandPath } from './FreehandPath.js';


export class CanvasEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.drawnShapes = [];
        
        // Elementos de UI
        this.coordXSpan = document.getElementById('coord-x');
        this.coordYSpan = document.getElementById('coord-y');
        this.shapeSelector = document.getElementById('shapeSelector');
        this.strokeColorPicker = document.getElementById('strokeColorPicker');
        this.fillColorPicker = document.getElementById('fillColorPicker');
        this.lineWidthInput = document.getElementById('lineWidthInput');
        this.btnClear = document.getElementById('btnClear');
        this.btnApplyColor = document.getElementById('btnApplyColor');
        this.btnSave = document.getElementById('btnSave'); 
        this.fileLoader = document.getElementById('fileLoader');

        // Referencias del Modal
        this.textModal = document.getElementById('textModal');
        this.textInput = document.getElementById('textInput');
        this.modalSaveBtn = document.getElementById('modalSaveBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');
        this.textCreationPos = null; 

        // CRÍTICO para Cargar/Guardar: Mapeo de Clases
        this.shapeClasses = {
            'Circle': Circle,
            'Rectangle': Rectangle,
            'Line': Line,
            'Triangle': Triangle,
            'Arc': Arc,
            'TextShape': TextShape,
            'Ellipse': Ellipse,
            'FreehandPath': FreehandPath
        };

        // Estado
        this.isDrawing = false; 
        this.isMoving = false; 
        this.movingShape = null;
        this.offsetX = 0; this.offsetY = 0; this.startX = 0; this.startY = 0;
        this.currentShapeType = this.shapeSelector.value;
        
        this.currentStrokeColor = this.strokeColorPicker.value;
        this.currentFillColor = this.fillColorPicker.value;
        
        this.currentLineWidth = parseInt(this.lineWidthInput.value);
        this.trianglePoints = [];
        this.isScaling = false; this.isRotating = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.freehandPoints = [];
        
        this.bindEvents();
        this.redraw();
    }

    getMousePos(event) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    getCurrentProps(fillRequired = true) {
        return {
            color: this.currentStrokeColor, 
            fill: fillRequired ? this.currentFillColor : null,
            lineWidth: this.currentLineWidth,
            rotationAngle: 0
        };
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawnShapes.forEach(shape => {
            shape.draw(this.ctx, shape === this.movingShape);
        });
        
        // Lógica de previsualización de Triángulo (Guías)
        if (this.currentShapeType === 'triangle' && this.trianglePoints.length >= 1 && this.isDrawing && this.lastMousePos.x !== 0) {
             this.drawGuide(this.trianglePoints[0].x, this.trianglePoints[0].y, this.trianglePoints.length > 1 ? this.trianglePoints[1].x : this.lastMousePos.x, this.trianglePoints.length > 1 ? this.trianglePoints[1].y : this.lastMousePos.y, 'rgba(0,0,0,0.5)', [5,5]);
            if (this.trianglePoints.length === 2) {
                this.drawGuide(this.trianglePoints[1].x, this.trianglePoints[1].y, this.lastMousePos.x, this.lastMousePos.y, 'rgba(0,0,0,0.5)', [5,5]);
                this.drawGuide(this.lastMousePos.x, this.lastMousePos.y, this.trianglePoints[0].x, this.trianglePoints[0].y, 'rgba(0,0,0,0.5)', [5,5]);
            }
        }
    }
    
    drawGuide(x1, y1, x2, y2, color, dashPattern = [5, 5]) {
        this.ctx.beginPath(); this.ctx.setLineDash(dashPattern); this.ctx.strokeStyle = color; this.ctx.lineWidth = 1; 
        this.ctx.moveTo(x1, y1); this.ctx.lineTo(x2, y2); this.ctx.stroke(); this.ctx.setLineDash([]);
    }

    applyColorToShape() {
        if (this.movingShape) {
            const props = this.getCurrentProps(true);
            
            this.movingShape.color = props.color; 
            this.movingShape.lineWidth = props.lineWidth;
            
            if (this.movingShape instanceof Line || this.movingShape instanceof FreehandPath) {
            } else if (this.movingShape instanceof TextShape) {
                this.movingShape.color = props.color;
            } else {
                this.movingShape.fill = props.fill;
            }
            
            this.redraw();
        } else {
            alert('Selecciona o mueve una figura primero para aplicarle el color.');
        }
    }

    handleModalSave() {
        const textContent = this.textInput.value.trim();
        
        if (textContent && this.textCreationPos) {
            const pos = this.textCreationPos;
            
            const newText = new TextShape({ 
                x: pos.x, 
                y: pos.y, 
                text: textContent, 
                font: `${this.currentLineWidth * 5}px Arial`, 
                type: 'TextShape', // << AÑADIDO TYPE
                ...this.getCurrentProps(false) 
            });
            this.drawnShapes.push(newText);
            this.redraw();
        }
        
        this.textModal.style.display = 'none';
        this.textInput.value = '';
        this.textCreationPos = null;
    }

    handleModalCancel() {
        this.textModal.style.display = 'none';
        this.textInput.value = '';
        this.textCreationPos = null;
    }

    /**
     * Guarda el lienzo serializando las formas a un archivo JSON.
     */
    saveDrawing() {
        // Asegúrate de que todas las formas tengan la propiedad 'type' para la deserialización.
        const serializableShapes = this.drawnShapes.map(shape => {
            return Object.assign({}, shape, { type: shape.constructor.name });
        });

        const jsonOutput = JSON.stringify(serializableShapes, null, 2);
        
        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lienzo_dibujo.json';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Carga las formas desde un archivo JSON y las deserializa.
     */
    loadDrawing(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                const loadedShapes = data.map(shapeData => {
                    const ShapeClass = this.shapeClasses[shapeData.type];
                    
                    if (ShapeClass) {
                        return new ShapeClass(shapeData);
                    } else {
                        console.error(`Tipo de forma desconocido: ${shapeData.type}. Saltando forma.`);
                        return null;
                    }
                }).filter(shape => shape !== null);
                
                this.drawnShapes = loadedShapes;
                this.movingShape = null; 
                this.redraw();
                alert(`Lienzo cargado exitosamente. ${loadedShapes.length} formas recuperadas.`);

            } catch (error) {
                alert('Error al cargar el archivo JSON. Asegúrate de que el formato es correcto.');
                console.error('Error de carga/parseo:', error);
            }
        };
        
        reader.readAsText(file);
    }

    // --- MANEJO DE EVENTOS ---

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));
        
        // Eventos de botones y modal
        this.btnApplyColor.addEventListener('click', this.applyColorToShape.bind(this)); 
        this.btnClear.addEventListener('click', this.clearCanvas.bind(this));
        this.modalSaveBtn.addEventListener('click', this.handleModalSave.bind(this));
        this.modalCancelBtn.addEventListener('click', this.handleModalCancel.bind(this));
        
        // Eventos de Guardar y Cargar
        this.btnSave.addEventListener('click', this.saveDrawing.bind(this));
        this.fileLoader.addEventListener('change', this.loadDrawing.bind(this)); 
        
        this.shapeSelector.addEventListener('change', this.handleToolChange.bind(this));
        
        // Eventos de color y grosor
        this.strokeColorPicker.addEventListener('input', (e) => { this.currentStrokeColor = e.target.value; });
        this.fillColorPicker.addEventListener('input', (e) => { this.currentFillColor = e.target.value; });
        this.lineWidthInput.addEventListener('change', (e) => { this.currentLineWidth = parseInt(e.target.value); });

        // Eventos de teclado para transformación
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') this.isScaling = true;
            if (e.key === 'Control') this.isRotating = true;
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.isScaling = false;
            if (e.key === 'Control') this.isRotating = false;
        });
    }

    handleToolChange(e) {
        this.currentShapeType = e.target.value;
        this.trianglePoints = [];
        this.isDrawing = false; this.isMoving = false; this.movingShape = null;
        this.redraw();

        if (this.currentShapeType === 'eraser') {
            this.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" style=\\"fill:black;\\"><path d=\\"M16.2 3.8L19.5 7.1 9 17.6H5v-4.6L16.2 3.8zm2.9-1.3l-1.4-1.4c-.6-.6-1.5-.6-2.1 0L13 2.9 16.9 6.8 18.9 4.8c.6-.6.6-1.5 0-2.1z\\"/></svg>") 12 12, auto';
        } else if (this.currentShapeType === 'pencil') {
            this.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" style=\\"fill:black;\\"><path d=\\"M17.4 6.6l-2.8-2.8C14.3 3.4 13.9 3.2 13.5 3.2c-.4 0-.8.2-1.1.5L2 13.8V21h7.2L20.4 9.4c.6-.6.6-1.5 0-2.1l-2.8-2.8zM7.2 19H5v-2.2l7.7-7.7 2.2 2.2L7.2 19z\\"/></svg>") 12 12, auto';
        } else {
            this.canvas.style.cursor = (this.currentShapeType === 'none' || this.currentShapeType === 'text') ? 'default' : 'crosshair';
        }
    }

    handleMouseDown(event) {
        const pos = this.getMousePos(event);
        this.isDrawing = false; this.isMoving = false; this.movingShape = null;

        // Lógica del Borrador
        if (this.currentShapeType === 'eraser') {
            for (let i = this.drawnShapes.length - 1; i >= 0; i--) {
                if (this.drawnShapes[i].isMouseOver(pos.x, pos.y)) {
                    this.drawnShapes.splice(i, 1);
                    this.redraw();
                    return;
                }
            }
            return;
        }

        // Lógica de Texto (Modal)
        if (this.currentShapeType === 'text') {
            this.textCreationPos = pos;
            this.textModal.style.display = 'flex';
            this.textInput.focus();
            return;
        }

        // Lógica de Triángulo
        if (this.currentShapeType === 'triangle') {
            this.trianglePoints.push(pos);
            if (this.trianglePoints.length === 1 || this.trianglePoints.length === 2) {
                this.isDrawing = true;
            } else if (this.trianglePoints.length === 3) {
                const [p1, p2, p3] = this.trianglePoints;
                const newShape = new Triangle({ p1x: p1.x, p1y: p1.y, p2x: p2.x, p2y: p2.y, p3x: p3.x, p3y: p3.y, type: 'Triangle', ...this.getCurrentProps() });
                this.drawnShapes.push(newShape);
                this.trianglePoints = [];
                this.isDrawing = false;
                this.redraw();
                this.canvas.style.cursor = 'default';
            }
            return;
        }

        // Lógica del Lápiz (Pencil)
        if (this.currentShapeType === 'pencil') {
            this.isDrawing = true;
            this.freehandPoints = [{ x: pos.x, y: pos.y }]; // Empezar un nuevo trazo
            this.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" style=\\"fill:black;\\"><path d=\\"M17.4 6.6l-2.8-2.8C14.3 3.4 13.9 3.2 13.5 3.2c-.4 0-.8.2-1.1.5L2 13.8V21h7.2L20.4 9.4c.6-.6.6-1.5 0-2.1l-2.8-2.8zM7.2 19H5v-2.2l7.7-7.7 2.2 2.2L7.2 19z\\"/></svg>") 12 12, auto';
            this.redraw();
            return;
        }

        // Lógica para MOVIMIENTO/TRANSFORMACIÓN (Selección de figura)
        for (let i = this.drawnShapes.length - 1; i >= 0; i--) {
            const shape = this.drawnShapes[i];
            if (shape.isMouseOver(pos.x, pos.y)) {
                this.isMoving = true;
                this.movingShape = shape;

                // Usar el centro (pivot) de la forma como referencia universal para movimientos/transformaciones
                const pivot = (typeof shape.getCenter === 'function') ? shape.getCenter() : { x: (shape.x || shape.x1 || 0), y: (shape.y || shape.y1 || 0) };
                const refX = pivot.x; const refY = pivot.y;

                this.offsetX = pos.x - refX; this.offsetY = pos.y - refY;
                this.lastMousePos = pos; this.canvas.style.cursor = 'move';
                this.redraw();
                return;
            }
        }

        // Si no se seleccionó ninguna figura y estamos en modo 'none', deseleccionar.
        if (this.currentShapeType === 'none') {
            this.movingShape = null;
            this.redraw();
        }

        // Lógica para DIBUJO de Formas por arrastre
        if (this.currentShapeType !== 'none' && this.currentShapeType !== 'text' && this.currentShapeType !== 'triangle' && this.currentShapeType !== 'eraser' && this.currentShapeType !== 'pencil') {
            this.isDrawing = true;
            this.startX = pos.x; this.startY = pos.y;
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }

    handleMouseMove(event) {
        const pos = this.getMousePos(event);
        this.coordXSpan.textContent = Math.round(pos.x);
        this.coordYSpan.textContent = Math.round(pos.y);

        if (!this.isMoving && this.currentShapeType === 'triangle') { this.lastMousePos = pos; }
        this.redraw();

        // LÓGICA DE MOVIMIENTO/TRANSFORMACIÓN
        if (this.isMoving && this.movingShape) {
            const shape = this.movingShape;
            const pivot = shape.getCenter();

            // 1. Cálculo de Referencias de Movimiento
            let refX, refY;
            if (shape instanceof Circle || shape instanceof Arc || shape instanceof TextShape) { refX = shape.x; refY = shape.y; }
            else { refX = shape.x1 || shape.p1x; refY = shape.y1 || shape.p1y; }

            // 2. ROTACIÓN (Corregido para Arco y Lápiz)
            if (this.isRotating) {
                const prevAngle = Math.atan2(this.lastMousePos.y - pivot.y, this.lastMousePos.x - pivot.x);
                const currentAngle = Math.atan2(pos.y - pivot.y, pos.x - pivot.x);
                const deltaAngle = currentAngle - prevAngle;

                if (shape.rotationAngle === undefined) shape.rotationAngle = 0;
                shape.rotationAngle += deltaAngle;

                if (shape instanceof Arc && shape.radiusPointX !== null) {
                    const ptx = shape.radiusPointX - pivot.x;
                    const pty = shape.radiusPointY - pivot.y;

                    // Rotar los puntos de referencia
                    shape.radiusPointX = pivot.x + ptx * Math.cos(deltaAngle) - pty * Math.sin(deltaAngle);
                    shape.radiusPointY = pivot.y + ptx * Math.sin(deltaAngle) + pty * Math.cos(deltaAngle);

                    shape.endX = shape.radiusPointX;
                    shape.endY = shape.radiusPointY;
                }
                if (shape instanceof FreehandPath) {
                    shape.rotate(deltaAngle, pivot);
                }
            }

            // 3. ESCALADO (Corregido para Arco y Lápiz)
            else if (this.isScaling) {
                const prevDist = calcularDistancia(this.lastMousePos.x, this.lastMousePos.y, pivot.x, pivot.y);
                const currDist = calcularDistancia(pos.x, pos.y, pivot.x, pivot.y);
                const scaleFactor = currDist / prevDist;

                if (scaleFactor > 0.1 && scaleFactor < 10) {
                    if (shape instanceof Circle || shape instanceof Arc) {
                        shape.radius *= scaleFactor;

                        // Escalar puntos de referencia
                        shape.endX = pivot.x + (shape.endX - pivot.x) * scaleFactor;
                        shape.endY = pivot.y + (shape.endY - pivot.y) * scaleFactor;
                        if (shape instanceof Arc) {
                            shape.radiusPointX = shape.endX;
                            shape.radiusPointY = shape.endY;
                        }
                    } else if (shape instanceof Rectangle || shape instanceof Line) {
                        shape.x1 = pivot.x + (shape.x1 - pivot.x) * scaleFactor;
                        shape.y1 = pivot.y + (shape.y1 - pivot.y) * scaleFactor;
                        shape.x2 = pivot.x + (shape.x2 - pivot.x) * scaleFactor;
                        shape.y2 = pivot.y + (shape.y2 - pivot.y) * scaleFactor;
                    } else if (shape instanceof Triangle) {
                        shape.p1x = pivot.x + (shape.p1x - pivot.x) * scaleFactor;
                        shape.p1y = pivot.y + (shape.p1y - pivot.y) * scaleFactor;
                        shape.p2x = pivot.x + (shape.p2x - pivot.x) * scaleFactor;
                        shape.p2y = pivot.y + (shape.p2y - pivot.y) * scaleFactor;
                        shape.p3x = pivot.x + (shape.p3x - pivot.x) * scaleFactor;
                        shape.p3y = pivot.y + (shape.p3y - pivot.y) * scaleFactor;
                    } else if (shape instanceof TextShape) {
                        shape.lineWidth *= scaleFactor;
                        shape.font = `${shape.lineWidth * 5}px Arial`;
                    } else if (shape instanceof FreehandPath) {
                        shape.scale(scaleFactor, pivot);
                    }
                }
            }

            // 4. TRASLACIÓN (Movimiento normal)
            else {
                const deltaX = pos.x - refX - this.offsetX;
                const deltaY = pos.y - refY - this.offsetY;

                if (shape instanceof Circle || shape instanceof Arc || shape instanceof Ellipse) {
                    shape.x += deltaX; shape.y += deltaY;
                    shape.endX += deltaX; shape.endY += deltaY;
                    if (shape instanceof Arc) { shape.radiusPointX += deltaX; shape.radiusPointY += deltaY; }
                } else if (shape instanceof Rectangle || shape instanceof Line) {
                    shape.x1 += deltaX; shape.y1 += deltaY;
                    shape.x2 += deltaX; shape.y2 += deltaY;
                } else if (shape instanceof Triangle) {
                    shape.p1x += deltaX; shape.p1y += deltaY;
                    shape.p2x += deltaX; shape.p2y += deltaY;
                    shape.p3x += deltaX; shape.p3y += deltaY;
                } else if (shape instanceof TextShape) {
                    shape.x += deltaX; shape.y += deltaY;
                } else if (shape instanceof FreehandPath) {
                    shape.translate(deltaX, deltaY);
                }
            }

            this.lastMousePos = pos;
            this.redraw();
            return;
        }
        // FIN LÓGICA DE MOVIMIENTO/TRANSFORMACIÓN


        // LÓGICA DE DIBUJO DE PREVISUALIZACIÓN
        if (this.isDrawing && this.currentShapeType !== 'triangle') {
            const props = this.getCurrentProps(true);

            if (this.currentShapeType === 'circle') {
                const radius = calcularDistancia(this.startX, this.startY, pos.x, pos.y);
                new Circle({ x: this.startX, y: this.startY, radius: radius, color: props.color, lineWidth: props.lineWidth, fill: props.fill }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'rectangle') {
                new Rectangle({ x1: this.startX, y1: this.startY, x2: pos.x, y2: pos.y, color: props.color, lineWidth: props.lineWidth, fill: props.fill }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'line') {
                new Line({ x1: this.startX, y1: this.startY, x2: pos.x, y2: pos.y, color: props.color, lineWidth: props.lineWidth }).drawShape(this.ctx);
            } else if (this.currentShapeType === 'arc') {
                const radius = calcularDistancia(this.startX, this.startY, pos.x, pos.y);
                const angle = Math.atan2(pos.y - this.startY, pos.x - this.startY);
                new Arc({
                    x: this.startX, y: this.startY, radius: radius,
                    startAngle: angle - Math.PI / 2, endAngle: angle + Math.PI / 2,
                    radiusPointX: pos.x, radiusPointY: pos.y, color: props.color, lineWidth: props.lineWidth, fill: props.fill
                }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'ellipse') {
                const rx = Math.abs(pos.x - this.startX);
                const ry = Math.abs(pos.y - this.startY);
                new Ellipse({
                    x: this.startX, y: this.startY, radiusX: rx, radiusY: ry,
                    color: props.color, lineWidth: props.lineWidth, fill: props.fill
                }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'pencil') {
                this.freehandPoints.push(pos);
                // Dibujar el trazo temporalmente (para feedback visual)
                const tempPath = new FreehandPath({ points: this.freehandPoints, color: props.color, lineWidth: props.lineWidth });
                tempPath.drawShape(this.ctx);
            }
        }
    }

    handleMouseUp(event) {
        const pos = this.getMousePos(event);
        this.canvas.style.cursor = 'default';

        if (this.isMoving) {
            this.isMoving = false;
            this.isScaling = false; this.isRotating = false;
            this.redraw(); return;
        }

        if (this.isDrawing && this.currentShapeType !== 'triangle' && this.currentShapeType !== 'text') {
            this.isDrawing = false;
            const props = this.getCurrentProps(true);
            let newShape = null;
            const minSizeThreshold = 3;

            if (this.currentShapeType === 'circle') {
                const finalRadius = calcularDistancia(this.startX, this.startY, pos.x, pos.y);
                if (finalRadius > minSizeThreshold) {
                    newShape = new Circle({ x: this.startX, y: this.startY, radius: finalRadius, endX: pos.x, endY: pos.y, type: 'Circle', ...props });
                }
            } else if (this.currentShapeType === 'rectangle') {
                const width = Math.abs(this.startX - pos.x); const height = Math.abs(this.startY - pos.y);
                if (width > minSizeThreshold && height > minSizeThreshold) {
                    newShape = new Rectangle({ x1: this.startX, y1: this.startY, x2: pos.x, y2: pos.y, type: 'Rectangle', ...props });
                }
            } else if (this.currentShapeType === 'line') {
                const length = calcularDistancia(this.startX, this.startY, pos.x, pos.y);
                if (length > minSizeThreshold) {
                    newShape = new Line({ x1: this.startX, y1: this.startY, x2: pos.x, y2: pos.y, type: 'Line', ...props });
                }
            } else if (this.currentShapeType === 'arc') {
                const radius = calcularDistancia(this.startX, this.startY, pos.x, pos.y);
                if (radius > minSizeThreshold) {
                    const angle = Math.atan2(pos.y - this.startY, pos.x - this.startX);
                    newShape = new Arc({
                        x: this.startX, y: this.startY, radius: radius,
                        startAngle: angle - Math.PI / 2, endAngle: angle + Math.PI / 2,
                        radiusPointX: pos.x, radiusPointY: pos.y, type: 'Arc', ...props
                    });
                }
            } else if (this.currentShapeType === 'ellipse') {
                const finalRadiusX = Math.abs(this.startX - pos.x);
                const finalRadiusY = Math.abs(this.startY - pos.y);
                if (finalRadiusX > minSizeThreshold || finalRadiusY > minSizeThreshold) {
                    newShape = new Ellipse({ x: this.startX, y: this.startY, radiusX: finalRadiusX, radiusY: finalRadiusY, type: 'Ellipse', ...props });
                }
            } else if (this.currentShapeType === 'pencil') {
                if (this.freehandPoints.length > 1) { // Necesitamos al menos 2 puntos para un trazo
                    newShape = new FreehandPath({ points: this.freehandPoints, type: 'FreehandPath', ...props });
                }
                this.freehandPoints = []; // Resetear los puntos para el siguiente trazo
            }

            if (newShape) { this.drawnShapes.push(newShape); }
            this.redraw();
        }
    }

    handleMouseOut() {
        if (this.isDrawing || this.isMoving) {
            this.isDrawing = false; this.isMoving = false;
            this.isScaling = false;
            this.isRotating = false;
            this.trianglePoints = [];
            this.freehandPoints = [];
            this.canvas.style.cursor = 'default';
            this.redraw();
        }
    }

    clearCanvas() {
        this.drawnShapes = [];
        this.trianglePoints = [];
        this.movingShape = null;
        this.redraw();
    }
}

// --- 3. INICIALIZACIÓN ---
window.onload = () => {
    new CanvasEditor('miCanvas');
};