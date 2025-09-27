const data = {
  document: "12345678",
  car_status_interested: "new",
  car_of_interest: "Test Car",
};

function calcularPromedio(numeros) {
  if (!numeros || numeros.length === 0) {
    return 0;
  }

  const suma = numeros.reduce((acc, num) => acc + num, 0);

  const promedio = suma / numeros.length;

  return promedio;
}

/**
 * Este es un JSDoc comment que debería preservarse
 * @param {number} x - Número de entrada
 * @returns {number} El doble del número de entrada
 */
function duplicar(x) {
  return x * 2;
}
