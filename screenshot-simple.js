// Ejemplo simple para capturas de pantalla
const APP_CONFIG = {
  name: "Mi Aplicación",
  version: "1.0.0",
  debug: true, // Habilitar logs de debug
  timeout: 5000, // Timeout en milisegundos
  maxRetries: 3, // Número máximo de reintentos
};

/**
 * Clase principal para manejar operaciones de datos
 * @class DataManager
 */
class DataManager {
  constructor(name) {
    this.name = name;
    this.data = []; // Array para almacenar datos
    this.isProcessing = false; // Flag de estado
    this.stats = {
      total: 0,
      processed: 0,
      errors: 0,
    };
  }

  /**
   * Procesa un array de datos y retorna estadísticas
   * @param {Array<string>} dataArray - Array de strings a procesar
   * @returns {Object} Objeto con estadísticas del procesamiento
   */
  async processData(dataArray) {
    console.log("Iniciando procesamiento de datos...");

    // Validar entrada
    if (!Array.isArray(dataArray)) {
      throw new Error("El parámetro debe ser un array");
    }

    this.isProcessing = true;
    this.stats.total = dataArray.length;
    this.stats.processed = 0;
    this.stats.errors = 0;

    // Procesar cada elemento
    for (let i = 0; i < dataArray.length; i++) {
      const item = dataArray[i];

      try {
        // Validar el elemento
        if (this.validateItem(item)) {
          this.data.push(item); // Agregar a la lista
          this.stats.processed++;
        } else {
          this.stats.errors++;
          console.warn(`Elemento inválido en posición ${i}: ${item}`);
        }
      } catch (error) {
        this.stats.errors++;
        console.error(`Error procesando elemento ${i}:`, error);
      }
    }

    this.isProcessing = false;
    return this.getStats();
  }

  /**
   * Valida un elemento individual
   * @param {string} item - String a validar
   * @returns {boolean} True si es válido
   */
  validateItem(item) {
    // Verificar que no esté vacío
    if (!item || typeof item !== "string") {
      return false;
    }

    // Verificar longitud mínima
    if (item.trim().length < 2) {
      return false;
    }

    // Verificar que no contenga caracteres peligrosos
    const dangerousChars = ["<", ">", "&", '"', "'", "`"];
    for (const char of dangerousChars) {
      if (item.includes(char)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtiene estadísticas del procesamiento
   * @returns {Object} Estadísticas actuales
   */
  getStats() {
    return {
      ...this.stats,
      successRate:
        this.stats.total > 0 ? this.stats.processed / this.stats.total : 0,
    };
  }
}

/**
 * Función principal del programa
 */
async function main() {
  try {
    // Crear instancia del manager
    const dataManager = new DataManager("Mi Data Manager");

    // Datos de ejemplo para procesar
    const sampleData = [
      "elemento1", // Primer elemento
      "elemento2", // Segundo elemento
      "", // Elemento vacío (debería fallar)
      "ab", // Elemento válido
      "elemento con <script>", // Elemento con caracteres especiales
      "elemento5", // Último elemento
    ];

    // Procesar los datos
    const results = await dataManager.processData(sampleData);

    // Mostrar resultados
    console.log("=== RESULTADOS DEL PROCESAMIENTO ===");
    console.log(`Total de elementos: ${results.total}`);
    console.log(`Procesados exitosamente: ${results.processed}`);
    console.log(`Errores encontrados: ${results.errors}`);
    console.log(`Tasa de éxito: ${(results.successRate * 100).toFixed(2)}%`);
  } catch (error) {
    console.error("Error en la función principal:", error);
    process.exit(1);
  }
}

// Ejecutar solo si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { DataManager };
