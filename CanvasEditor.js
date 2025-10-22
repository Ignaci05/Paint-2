// CanvasEditor.js (CON LÓGICA DE CARGA Y DESERIALIZACIÓN COMPLETA)

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
import { Polygon } from './Polygon.js';
import { ImageShape } from './ImageShape.js';
import { Layer } from './Layer.js';


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
        this.imageLoader = document.getElementById('imageLoader');

        // Referencias del Modal/Capas
        this.textModal = document.getElementById('textModal');
        this.textInput = document.getElementById('textInput');
        this.modalSaveBtn = document.getElementById('modalSaveBtn');
        this.modalCancelBtn = document.getElementById('modalCancelBtn');
        this.activeLayerSelector = document.getElementById('activeLayerSelector');
        this.btnAddLayer = document.getElementById('btnAddLayer');
        this.layersList = document.getElementById('layersList');
        this.layerOpacityInput = document.getElementById('layerOpacityInput');

        // Mapeo de Clases para Cargar/Guardar
        this.shapeClasses = {
            'Circle': Circle, 'Rectangle': Rectangle, 'Line': Line,
            'Triangle': Triangle, 'Arc': Arc, 'TextShape': TextShape,
            'Ellipse': Ellipse, 'FreehandPath': FreehandPath,
            'Polygon': Polygon, 'ImageShape': ImageShape
        };

        // --- GESTIÓN DE CAPAS ---
        this.layers = [];
        this.activeLayer = null;
        this.initializeLayers();
        // ------------------------
        
        // Estado
        this.isDrawing = false; this.isMoving = false; this.movingShape = null;
        this.offsetX = 0; this.offsetY = 0; this.startX = 0; this.startY = 0;
        this.currentShapeType = this.shapeSelector.value;
        this.currentStrokeColor = this.strokeColorPicker.value;
        this.currentFillColor = this.fillColorPicker.value;
        this.currentLineWidth = parseInt(this.lineWidthInput.value);
        this.trianglePoints = []; this.polygonPoints = [];
        this.isScaling = false; this.isRotating = false;
        this.lastMousePos = { x: 0, y: 0 }; this.freehandPoints = [];
        this.textCreationPos = null;

        this.bindEvents();
        this.setupLayerUI();
        this.redraw();
    }
    
    initializeLayers() {
        if (this.layers.length === 0) {
            // Asegúrate de que la capa inicial tiene opacidad 1.0
            const defaultLayer = new Layer("Capa 1", true, 1.0); 
            this.layers.push(defaultLayer);
            this.activeLayer = defaultLayer;
        }
    }

    // --- LÓGICA DE CAPAS UI ---

    updateOpacityControl() {
        if (this.activeLayer) {
            this.layerOpacityInput.value = this.activeLayer.opacity;
            this.layerOpacityInput.disabled = !this.activeLayer.isVisible;
        } else {
            this.layerOpacityInput.value = 1.0;
            this.layerOpacityInput.disabled = true;
        }
    }


    setupLayerUI() {
        // Inicializar listeners del panel de capas
        this.btnAddLayer.addEventListener('click', () => {
            const newLayer = new Layer(`Capa ${this.layers.length + 1}`, true, 1.0);
            this.layers.push(newLayer);
            this.activeLayer = newLayer;
            this.renderLayerList();
            this.redraw();
        });
        
        this.activeLayerSelector.addEventListener('change', (e) => {
            const layerId = parseFloat(e.target.value);
            this.setActiveLayer(layerId);
        });
        
        // Listener para el input de Opacidad
        this.layerOpacityInput.addEventListener('input', (e) => {
            const newOpacity = parseFloat(e.target.value);
            if (this.activeLayer) {
                this.activeLayer.opacity = newOpacity;
                this.redraw();
                this.renderLayerList();
            }
        });

        // Manejar clics dinámicos en la lista de capas (borrar, visibilidad)
        this.layersList.addEventListener('click', (e) => {
            const target = e.target;
            const row = target.closest('.layer-row');
            if (!row) return;

            const layerId = parseFloat(row.dataset.layerId);
            const layerIndex = this.layers.findIndex(l => l.id === layerId);
            if (layerIndex === -1) return;

            if (target.dataset.action === 'delete') {
                if (this.layers.length <= 1) {
                    alert("No puedes eliminar la última capa.");
                    return;
                }
                if (confirm(`¿Estás seguro de eliminar la capa ${this.layers[layerIndex].name} y todo su contenido?`)) {
                    this.layers.splice(layerIndex, 1);
                    if (this.activeLayer.id === layerId) {
                        this.activeLayer = this.layers[0];
                    }
                    this.renderLayerList();
                    this.updateOpacityControl();
                    this.redraw();
                }
            } else if (target.dataset.action === 'toggle-visibility') {
                this.layers[layerIndex].isVisible = !this.layers[layerIndex].isVisible;
                this.renderLayerList();
                this.updateOpacityControl();
                this.redraw();
            } else {
                 this.setActiveLayer(layerId);
            }
        });
        
        this.renderLayerList();
        this.updateOpacityControl();
    }

    renderLayerList() {
        this.activeLayerSelector.innerHTML = '';
        this.layersList.innerHTML = '';
        
        this.layers.slice().reverse().forEach(layer => { 
            const isActive = layer === this.activeLayer;

            // 1. Renderizar el selector activo
            const option = document.createElement('option');
            option.value = layer.id;
            option.textContent = `${layer.name} (${layer.shapes.length})`;
            if (isActive) option.selected = true;
            this.activeLayerSelector.appendChild(option);
            
            // 2. Renderizar la lista de control
            const opacityPercent = Math.round(layer.opacity * 100);
            const row = document.createElement('div');
            row.className = `layer-row ${isActive ? 'active' : ''}`;
            row.dataset.layerId = layer.id;
            row.innerHTML = `
                <span>${layer.name} (${layer.shapes.length}) [${opacityPercent}%]</span>
                <div class="layer-actions">
                    <span class="layer-visibility ${layer.isVisible ? '' : 'hidden'}" data-action="toggle-visibility">
                        ${layer.isVisible ? '👁️' : '🔒'}
                    </span>
                    <button data-action="delete" title="Eliminar Capa" ${this.layers.length <= 1 ? 'disabled' : ''}>🗑️</button>
                </div>
            `;
            this.layersList.appendChild(row);
        });
    }
    
    setActiveLayer(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            this.activeLayer = layer;
            this.renderLayerList();
            this.movingShape = null;
            this.updateOpacityControl();
        }
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
        
        this.layers.forEach(layer => {
            if (layer.isVisible) {
                this.ctx.globalAlpha = layer.opacity;
                
                layer.shapes.forEach(shape => {
                    shape.draw(this.ctx, shape === this.movingShape);
                });

                this.ctx.globalAlpha = 1.0;
            }
        });

        // Lógica de previsualización de Triángulo/Polígono (Guías)
        if (this.currentShapeType === 'triangle' && this.trianglePoints.length >= 1 && this.isDrawing && this.lastMousePos.x !== 0) {
             this.drawGuide(this.trianglePoints[0].x, this.trianglePoints[0].y, this.trianglePoints.length > 1 ? this.trianglePoints[1].x : this.lastMousePos.x, this.trianglePoints.length > 1 ? this.trianglePoints[1].y : this.lastMousePos.y, 'rgba(0,0,0,0.5)', [5, 5]);
            if (this.trianglePoints.length === 2) {
                this.drawGuide(this.trianglePoints[1].x, this.trianglePoints[1].y, this.lastMousePos.x, this.lastMousePos.y, 'rgba(0,0,0,0.5)', [5, 5]);
                this.drawGuide(this.lastMousePos.x, this.lastMousePos.y, this.trianglePoints[0].x, this.trianglePoints[0].y, 'rgba(0,0,0,0.5)', [5, 5]);
            }
        }
        if (this.currentShapeType === 'polygon' && this.polygonPoints.length >= 1 && this.isDrawing && this.lastMousePos.x !== 0) {
            const points = this.polygonPoints;
            const lastPoint = points[points.length - 1];
            
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.stroke();

            this.drawGuide(lastPoint.x, lastPoint.y, this.lastMousePos.x, this.lastMousePos.y, 'rgba(0,0,0,0.5)', [5, 5]);
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

            if (this.movingShape instanceof Circle ||
                this.movingShape instanceof Rectangle ||
                this.movingShape instanceof Triangle ||
                this.movingShape instanceof Ellipse ||
                this.movingShape instanceof Polygon) {

                this.movingShape.fill = props.fill;

            }
            else if (this.movingShape instanceof TextShape) {
                this.movingShape.font = `${props.lineWidth * 5}px Arial`; 
            }

            this.movingShape = null;
            this.redraw();
            this.renderLayerList();
        } else {
            alert('Selecciona o mueve una figura primero para aplicarle el color.');
        }
    }

    handleModalSave() {
        const textContent = this.textInput.value.trim();

        if (textContent && this.textCreationPos) {
            const pos = this.textCreationPos;

            const newText = new TextShape({
                x: pos.x, y: pos.y, text: textContent,
                font: `${this.currentLineWidth * 5}px Arial`,
                type: 'TextShape',
                ...this.getCurrentProps(false)
            });
            this.activeLayer.shapes.push(newText);
            this.redraw();
            this.renderLayerList();
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

    saveDrawing() {
        const serializableLayers = this.layers.map(layer => {
            const serializableShapes = layer.shapes.map(shape => {
                const baseData = Object.assign({}, shape, { type: shape.constructor.name });
                if (shape instanceof ImageShape) {
                    baseData.imageSrc = shape.imageElement.src;
                    baseData.imageElement = undefined;
                }
                return baseData;
            });
            return { id: layer.id, name: layer.name, isVisible: layer.isVisible, opacity: layer.opacity, shapes: serializableShapes };
        });

        const jsonOutput = JSON.stringify(serializableLayers, null, 2);
        
        const blob = new Blob([jsonOutput], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url; a.download = 'lienzo_dibujo.json';
        document.body.appendChild(a); a.click();
        
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // *** NUEVO MÉTODO PARA RECONSTRUIR OBJETOS DE FIGURA ***
    rebuildShapeObject(shapeData) {
        const ShapeClass = this.shapeClasses[shapeData.type];
        
        if (!ShapeClass) {
            console.error(`Tipo de forma desconocido: ${shapeData.type}.`);
            return null;
        }

        if (shapeData.type === 'ImageShape' && shapeData.imageSrc) {
            // Reconstrucción especial para ImageShape
            const img = new Image();
            img.src = shapeData.imageSrc;
            shapeData.imageElement = img; // Adjuntar el objeto Image reconstruido
        }
        
        return new ShapeClass(shapeData);
    }

    loadDrawing(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const loadedLayersData = JSON.parse(e.target.result);
                
                // 1. Reconstruir la estructura de capas
                const newLayers = [];
                let newActiveLayer = null;

                loadedLayersData.forEach(layerData => {
                    const newLayer = new Layer(layerData.name, layerData.isVisible, layerData.opacity);
                    newLayer.id = layerData.id; // Mantener el ID
                    
                    // 2. Reconstruir las figuras dentro de la capa
                    const rebuiltShapes = layerData.shapes
                        .map(shapeData => this.rebuildShapeObject(shapeData))
                        .filter(shape => shape !== null);
                    
                    newLayer.shapes = rebuiltShapes;
                    newLayers.push(newLayer);
                });
                
                // 3. Establecer el nuevo estado
                this.layers = newLayers;
                this.activeLayer = newLayers[0] || this.initializeLayers(); // Usar la primera capa como activa
                this.movingShape = null;
                
                this.redraw();
                this.renderLayerList();
                this.updateOpacityControl();
                alert(`Lienzo cargado exitosamente. ${newLayers.length} capas recuperadas.`);

            } catch (error) {
                alert('Error al cargar el archivo JSON. Asegúrate de que el formato es correcto.');
                console.error('Error de carga/parseo:', error);
            }
        };

        reader.readAsText(file);
    }

    handleImageLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const props = this.getCurrentProps(false);
                
                const maxDim = Math.max(this.canvas.width, this.canvas.height) * 0.8;
                let scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
                
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (this.canvas.width - width) / 2;
                const y = (this.canvas.height - height) / 2;
                
                const newImage = new ImageShape({
                    x: x, y: y, width: width, height: height, 
                    imageElement: img, type: 'ImageShape', ...props
                });
                
                this.activeLayer.shapes.push(newImage); 
                this.redraw();
                this.renderLayerList();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }


    // --- MANEJO DE EVENTOS ---

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseOut.bind(this));

        this.btnApplyColor.addEventListener('click', this.applyColorToShape.bind(this));
        this.btnClear.addEventListener('click', this.clearCanvas.bind(this));
        this.modalSaveBtn.addEventListener('click', this.handleModalSave.bind(this));
        this.modalCancelBtn.addEventListener('click', this.handleModalCancel.bind(this));

        this.btnSave.addEventListener('click', this.saveDrawing.bind(this));
        this.fileLoader.addEventListener('change', this.loadDrawing.bind(this));
        this.imageLoader.addEventListener('change', this.handleImageLoad.bind(this));

        this.shapeSelector.addEventListener('change', this.handleToolChange.bind(this));
        this.activeLayerSelector.addEventListener('change', (e) => this.setActiveLayer(parseFloat(e.target.value)));

        this.strokeColorPicker.addEventListener('input', (e) => { this.currentStrokeColor = e.target.value; });
        this.fillColorPicker.addEventListener('input', (e) => { this.currentFillColor = e.target.value; });
        this.lineWidthInput.addEventListener('change', (e) => { this.currentLineWidth = parseInt(e.target.value); });
        
        // Listener para Opacidad
        this.layerOpacityInput.addEventListener('input', (e) => {
            const newOpacity = parseFloat(e.target.value);
            if (this.activeLayer) {
                this.activeLayer.opacity = newOpacity;
                this.redraw();
                this.renderLayerList(); 
            }
        });

        document.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') this.isScaling = false;
            if (e.key === 'Control') this.isRotating = false;
        });
    }

    handleKeydown(event) {
        // Lógica de finalización para el Polígono
        if (event.key === 'Enter' || event.key === 'Escape') {
            if (this.currentShapeType === 'polygon' && this.polygonPoints.length >= 3) {
                
                const newShape = new Polygon({ 
                    points: this.polygonPoints, type: 'Polygon', ...this.getCurrentProps() 
                });
                this.activeLayer.shapes.push(newShape);
                
                this.polygonPoints = [];
                this.isDrawing = false;
                this.redraw();
                this.renderLayerList();
                this.canvas.style.cursor = 'default';
                event.preventDefault(); 
                
            } else if (this.currentShapeType === 'polygon' && this.polygonPoints.length > 0) {
                this.polygonPoints = [];
                this.isDrawing = false;
                this.redraw();
                this.canvas.style.cursor = 'crosshair'; 
            }
        }
        
        // Mantener la lógica de escalado y rotación activada por teclas
        if (event.key === 'Shift') this.isScaling = true;
        if (event.key === 'Control') this.isRotating = true;
    }


    handleToolChange(e) {
        this.currentShapeType = e.target.value;
        this.trianglePoints = [];
        this.polygonPoints = [];
        this.isDrawing = false; this.isMoving = false; this.movingShape = null;
        this.redraw();
        this.renderLayerList();

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

        // Lógica del Borrador (Busca en todas las capas)
        if (this.currentShapeType === 'eraser') {
            for (let i = this.layers.length - 1; i >= 0; i--) { 
                const layer = this.layers[i];
                if (!layer.isVisible) continue;

                for (let j = layer.shapes.length - 1; j >= 0; j--) {
                    if (layer.shapes[j].isMouseOver(pos.x, pos.y)) {
                        layer.shapes.splice(j, 1); 
                        this.redraw();
                        this.renderLayerList();
                        return;
                    }
                }
            }
            return;
        }

        // Lógica de Texto
        if (this.currentShapeType === 'text') {
            this.textCreationPos = pos;
            this.textModal.style.display = 'flex';
            this.textInput.focus();
            return;
        }

        // Lógica de Polígono (Clic para añadir punto)
        if (this.currentShapeType === 'polygon') {
            this.polygonPoints.push(pos);
            this.isDrawing = true;
            this.canvas.style.cursor = 'crosshair';
            this.redraw(); 
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
                this.activeLayer.shapes.push(newShape);
                this.trianglePoints = [];
                this.isDrawing = false;
                this.redraw();
                this.renderLayerList();
                this.canvas.style.cursor = 'default';
            }
            return;
        }

        // Lógica del Lápiz (Pencil)
        if (this.currentShapeType === 'pencil') {
            this.isDrawing = true;
            this.freehandPoints = [{ x: pos.x, y: pos.y }]; // Empezar nuevo trazo
            this.canvas.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"24\\" height=\\"24\\" style=\\"fill:black;\\"><path d=\\"M17.4 6.6l-2.8-2.8C14.3 3.4 13.9 3.2 13.5 3.2c-.4 0-.8.2-1.1.5L2 13.8V21h7.2L20.4 9.4c.6-.6.6-1.5 0-2.1l-2.8-2.8zM7.2 19H5v-2.2l7.7-7.7 2.2 2.2L7.2 19z\\"/></svg>") 12 12, auto';
            this.redraw();
            return;
        }

        // Lógica para MOVIMIENTO/TRANSFORMACIÓN (Selección de figura)
        if (this.currentShapeType === 'none' || this.movingShape !== null) { 
            for (let i = this.layers.length - 1; i >= 0; i--) {
                const layer = this.layers[i];
                if (!layer.isVisible) continue;
                
                for (let j = layer.shapes.length - 1; j >= 0; j--) {
                    const shape = layer.shapes[j];
                    if (shape.isMouseOver(pos.x, pos.y)) {
                        this.isMoving = true;
                        this.movingShape = shape;

                        const pivot = shape.getCenter();
                        this.offsetX = pos.x - pivot.x; this.offsetY = pos.y - pivot.y;
                        this.lastMousePos = pos; this.canvas.style.cursor = 'move';
                        this.redraw();
                        return;
                    }
                }
            }
        }

        // Si no se seleccionó ninguna figura:
        if (this.currentShapeType === 'none') {
            this.movingShape = null;
            this.redraw();
        }

        // Lógica para DIBUJO de Formas por arrastre
        if (this.currentShapeType !== 'none' && this.currentShapeType !== 'text' && this.currentShapeType !== 'triangle' && this.currentShapeType !== 'eraser' && this.currentShapeType !== 'pencil' && this.currentShapeType !== 'polygon') {
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

        if (!this.isMoving && (this.currentShapeType === 'triangle' || this.currentShapeType === 'polygon')) { this.lastMousePos = pos; }
        this.redraw();

        // LÓGICA DE MOVIMIENTO/TRANSFORMACIÓN
        if (this.isMoving && this.movingShape) {
            const shape = this.movingShape;
            const pivot = shape.getCenter();
            const moveX = pos.x - this.lastMousePos.x;
            const moveY = pos.y - this.lastMousePos.y;

            // 1. ROTACIÓN
            if (this.isRotating) {
                const prevAngle = Math.atan2(this.lastMousePos.y - pivot.y, this.lastMousePos.x - pivot.x);
                const currentAngle = Math.atan2(pos.y - pivot.y, pos.x - pivot.x);
                const deltaAngle = currentAngle - prevAngle;

                if (shape.rotationAngle === undefined) shape.rotationAngle = 0;
                shape.rotationAngle += deltaAngle;

                if (shape instanceof FreehandPath) { shape.rotate(deltaAngle, pivot); }
                if (shape instanceof Polygon) { shape.rotate(deltaAngle, pivot); }
            }

            // 2. ESCALADO
            else if (this.isScaling) {
                const prevDist = calcularDistancia(this.lastMousePos.x, this.lastMousePos.y, pivot.x, pivot.y);
                const currDist = calcularDistancia(pos.x, pos.y, pivot.x, pivot.y);
                const scaleFactor = currDist / prevDist;

                if (scaleFactor > 0.1 && scaleFactor < 10) {
                    if (shape instanceof Circle || shape instanceof Arc) {
                        shape.radius *= scaleFactor;
                        shape.endX = pivot.x + (shape.endX - pivot.x) * scaleFactor;
                        shape.endY = pivot.y + (shape.endY - pivot.y) * scaleFactor;
                        if (shape instanceof Arc) { shape.radiusPointX = shape.endX; shape.radiusPointY = shape.endY; }
                    } else if (shape instanceof Ellipse) {
                        shape.radiusX = Math.abs(shape.radiusX * scaleFactor);
                        shape.radiusY = Math.abs(shape.radiusY * scaleFactor);
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
                    } else if (shape instanceof Polygon) {
                        shape.scale(scaleFactor, pivot);
                    } else if (shape instanceof TextShape) {
                        shape.lineWidth *= scaleFactor;
                        shape.font = `${shape.lineWidth * 5}px Arial`;
                    } else if (shape instanceof FreehandPath) {
                        shape.scale(scaleFactor, pivot);
                    } else if (shape instanceof ImageShape) {
                         shape.scale(scaleFactor, pivot);
                    }
                }
            }

            // 3. TRASLACIÓN (Movimiento normal)
            else {
                // Aplicar movimiento incremental (moveX/Y) a todas las coordenadas
                if (shape instanceof Circle || shape instanceof Arc || shape instanceof Ellipse || shape instanceof ImageShape) {
                    shape.x += moveX; shape.y += moveY;
                    if (shape instanceof Circle || shape instanceof Arc) {
                         shape.endX += moveX; shape.endY += moveY;
                         if (shape instanceof Arc) { shape.radiusPointX += moveX; shape.radiusPointY += moveY; }
                    }
                } else if (shape instanceof Rectangle || shape instanceof Line) {
                    shape.x1 += moveX; shape.y1 += moveY;
                    shape.x2 += moveX; shape.y2 += moveY;
                } else if (shape instanceof Triangle) {
                    shape.p1x += moveX; shape.p1y += moveY;
                    shape.p2x += moveX; shape.p2y += moveY;
                    shape.p3x += moveX; shape.p3y += moveY;
                } else if (shape instanceof Polygon) {
                    shape.translate(moveX, moveY);
                } else if (shape instanceof TextShape) {
                    shape.x += moveX; shape.y += moveY;
                } else if (shape instanceof FreehandPath) {
                    shape.translate(moveX, moveY);
                }
            }

            this.lastMousePos = pos;
            this.redraw();
            return;
        }


        // LÓGICA DE DIBUJO DE PREVISUALIZACIÓN (se mantiene)
        if (this.isDrawing && this.currentShapeType !== 'triangle' && this.currentShapeType !== 'polygon') {
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
                new Arc({ x: this.startX, y: this.startY, radius: radius, startAngle: angle - Math.PI / 2, endAngle: angle + Math.PI / 2, radiusPointX: pos.x, radiusPointY: pos.y, color: props.color, lineWidth: props.lineWidth, fill: props.fill }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'ellipse') {
                const rx = Math.abs(pos.x - this.startX);
                const ry = Math.abs(pos.y - this.startY);
                new Ellipse({ x: this.startX, y: this.startY, radiusX: rx, radiusY: ry, color: props.color, lineWidth: props.lineWidth, fill: props.fill }).drawShape(this.ctx);
                this.drawGuide(this.startX, this.startY, pos.x, pos.y, '#dc3545', [5, 5]);
            } else if (this.currentShapeType === 'pencil') {
                this.freehandPoints.push(pos);
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

        if (this.isDrawing && this.currentShapeType !== 'triangle' && this.currentShapeType !== 'text' && this.currentShapeType !== 'polygon') {
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
                    newShape = new Arc({ x: this.startX, y: this.startY, radius: radius, startAngle: angle - Math.PI / 2, endAngle: angle + Math.PI / 2, radiusPointX: pos.x, radiusPointY: pos.y, type: 'Arc', ...props });
                }
            } else if (this.currentShapeType === 'ellipse') {
                const finalRadiusX = Math.abs(this.startX - pos.x);
                const finalRadiusY = Math.abs(this.startY - pos.y);
                if (finalRadiusX > minSizeThreshold || finalRadiusY > minSizeThreshold) {
                    newShape = new Ellipse({ x: this.startX, y: this.startY, radiusX: finalRadiusX, radiusY: finalRadiusY, type: 'Ellipse', ...props });
                }
            } else if (this.currentShapeType === 'pencil') {
                if (this.freehandPoints.length > 1) {
                    newShape = new FreehandPath({ points: this.freehandPoints, type: 'FreehandPath', ...props });
                }
                this.freehandPoints = []; // Resetear los puntos para el siguiente trazo
            }

            if (newShape) { this.activeLayer.shapes.push(newShape); }
            this.redraw();
            this.renderLayerList();
        }
    }

    handleMouseOut() {
        if (this.isDrawing || this.isMoving) {
            this.isDrawing = false; this.isMoving = false;
            this.movingShape = null;
            this.isScaling = false;
            this.isRotating = false;
            this.trianglePoints = [];
            this.polygonPoints = [];
            this.freehandPoints = [];
            this.canvas.style.cursor = 'default';
            this.redraw();
        }
    }

    clearCanvas() {
        this.layers = [];
        this.initializeLayers();
        this.trianglePoints = [];
        this.polygonPoints = [];
        this.movingShape = null;
        this.redraw();
        this.renderLayerList();
    }
}
