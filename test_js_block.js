// Este es un comentario de línea simple
const data = {
  document: "12345678", // Comentario al final de línea
  car_status_interested: "new",
  car_of_interest: "Test Car",
};

/* 
Este es un comentario de bloque
que debería ser eliminado por la extensión.
Puede contener múltiples líneas.
*/

function calcularPromedio(numeros) {
  // Comentario dentro de función
  if (!numeros || numeros.length === 0) {
    return 0;
  }

  /* Comentario de bloque de una línea */
  const suma = numeros.reduce((acc, num) => acc + num, 0);

  // Calcular el promedio
  const promedio = suma / numeros.length;

  return promedio;
}

/**
 * Este es un JSDoc comment que debería preservarse
 * @param {number} x - Número de entrada
 * @returns {number} El doble del número de entrada
 */
function duplicar(x) {
  return x * 2; // Comentario al final
}
