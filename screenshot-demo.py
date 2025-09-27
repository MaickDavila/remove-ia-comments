# -*- coding: utf-8 -*-
"""
Ejemplo de código Python con comentarios
Este archivo demuestra las capacidades de la extensión Remove IA Comments
"""

import os
import sys
from typing import List, Dict, Optional

# Esta es una variable global que almacena la configuración
CONFIG = {
    'debug': True,  # Habilitar modo debug
    'timeout': 30,  # Timeout en segundos
    'retries': 3    # Número de reintentos
}


class DataProcessor:
    """
    Clase para procesar datos de manera eficiente
    Esta clase maneja la lógica de negocio principal
    """

    def __init__(self, name: str):
        self.name = name
        self.data = []  # Lista para almacenar datos
        self.processed = False  # Flag de procesamiento

    def process_data(self, data: List[str]) -> Dict[str, int]:
        """
        Procesa una lista de datos y retorna estadísticas

        Args:
            data: Lista de strings a procesar

        Returns:
            Diccionario con estadísticas del procesamiento
        """
        # Inicializar contadores
        total_items = len(data)
        processed_items = 0
        errors = 0

        # Procesar cada elemento
        for item in data:
            try:
                # Validar el elemento
                if self._validate_item(item):
                    processed_items += 1
                    self.data.append(item)  # Agregar a la lista
                else:
                    errors += 1  # Incrementar contador de errores
            except Exception as e:
                # Log del error (en producción usar logger)
                print(f"Error procesando {item}: {e}")
                errors += 1

        # Marcar como procesado
        self.processed = True

        # Retornar estadísticas
        return {
            'total': total_items,
            'processed': processed_items,
            'errors': errors,
            'success_rate': processed_items / total_items if total_items > 0 else 0
        }

    def _validate_item(self, item: str) -> bool:
        """
        Valida un elemento individual

        Args:
            item: String a validar

        Returns:
            True si es válido, False en caso contrario
        """
        # Verificar que no esté vacío
        if not item or not item.strip():
            return False

        # Verificar longitud mínima
        if len(item) < 3:
            return False

        # Verificar que no contenga caracteres especiales
        special_chars = ['<', '>', '&', '"', "'"]
        for char in special_chars:
            if char in item:
                return False

        return True

    def get_summary(self) -> str:
        """
        Obtiene un resumen del procesamiento

        Returns:
            String con el resumen
        """
        if not self.processed:
            return "Los datos no han sido procesados aún"

        return f"Procesados {len(self.data)} elementos exitosamente"


def main():
    """
    Función principal del programa
    """
    # Crear instancia del procesador
    processor = DataProcessor("Mi Procesador")

    # Datos de ejemplo para procesar
    sample_data = [
        "elemento1",  # Primer elemento
        "elemento2",  # Segundo elemento
        "",           # Elemento vacío (debería fallar)
        "abc",        # Elemento válido
        "elemento con <script>",  # Elemento con caracteres especiales
        "elemento5"   # Último elemento
    ]

    # Procesar los datos
    print("Iniciando procesamiento...")
    results = processor.process_data(sample_data)

    # Mostrar resultados
    print(f"Total de elementos: {results['total']}")
    print(f"Procesados exitosamente: {results['processed']}")
    print(f"Errores encontrados: {results['errors']}")
    print(f"Tasa de éxito: {results['success_rate']:.2%}")

    # Mostrar resumen
    print(processor.get_summary())


if __name__ == "__main__":
    main()
