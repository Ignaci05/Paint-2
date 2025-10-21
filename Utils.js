// Utils.js

/**
 * Calcula la distancia euclidiana entre dos puntos.
 */
export function calcularDistancia(x1, y1, x2, y2) { 
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); 
}

/**
 * Calcula la distancia más corta de un punto (px, py) a un segmento de línea (x1,y1 a x2,y2).
 * Utilizada para la detección de colisión de líneas.
 */
export function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = calcularDistancia(x1, y1, x2, y2);
    if (l2 === 0) return calcularDistancia(px, py, x1, y1);
    
    // Proyección del punto en el segmento
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (l2 * l2);
    t = Math.max(0, Math.min(1, t)); // Asegurar que la proyección caiga en el segmento

    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    
    return calcularDistancia(px, py, closestX, closestY);
}
