// Este es un archivo de ejemplo para probar la extensión Remove IA Comments
// Contiene varios tipos de comentarios que la extensión debería detectar

const fs = require("fs");
const path = require("path");

/**
 * Calcula el promedio de una lista de números
 * @param {number[]} numeros - Lista de números
 * @returns {number} El promedio de los números
 */
function calcularPromedio(numeros) {
  // Verificar que la lista no esté vacía
  if (!numeros || numeros.length === 0) {
    return 0;
  }

  // Calcular la suma
  const suma = numeros.reduce((acc, num) => acc + num, 0);

  // Calcular el promedio
  const promedio = suma / numeros.length;

  return promedio;
}

// Comentario de línea simple
// Este comentario debería ser eliminado

class MiClase {
  /**
   * Constructor de la clase
   * @param {string} nombre - Nombre de la instancia
   */
  constructor(nombre) {
    // Inicializar el nombre
    this.nombre = nombre;
    // Comentario adicional
    this.valor = 0;
  }

  /**
   * Método de ejemplo con documentación
   * @param {number} x - Número de entrada
   * @returns {number} El doble del número de entrada
   */
  metodoEjemplo(x) {
    // Comentario que debería ser eliminado
    const resultado = x * 2;
    // Otro comentario
    return resultado;
  }
}

/* 
Este es un comentario de bloque
que debería ser eliminado por la extensión.
Puede contener múltiples líneas.
*/

// Comentario de línea al final del archivo
// Este también debería ser eliminado
