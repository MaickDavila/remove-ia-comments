#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Este es un archivo de ejemplo para probar la extensión Remove IA Comments.
Contiene varios tipos de comentarios que la extensión debería detectar.
"""

import os
import sys
from typing import List, Dict, Optional

# Esta es una función de ejemplo
def calcular_promedio(numeros: List[float]) -> float:
    """
    Calcula el promedio de una lista de números.
    
    Args:
        numeros: Lista de números flotantes
        
    Returns:
        El promedio de los números
    """
    # Verificar que la lista no esté vacía
    if not numeros:
        return 0.0
    
    # Calcular la suma
    suma = sum(numeros)
    
    # Calcular el promedio
    promedio = suma / len(numeros)
    
    return promedio

# Comentario de línea simple
# Este comentario debería ser eliminado

class MiClase:
    """
    Esta es una clase de ejemplo.
    
    Esta clase demuestra cómo se preservan los docstrings
    de las clases y métodos.
    """
    
    def __init__(self, nombre: str):
        # Inicializar el nombre
        self.nombre = nombre
        # Comentario adicional
        self.valor = 0
    
    def metodo_ejemplo(self, x: int) -> int:
        """
        Método de ejemplo con documentación.
        
        Args:
            x: Número entero de entrada
            
        Returns:
            El doble del número de entrada
        """
        # Comentario que debería ser eliminado
        resultado = x * 2
        # Otro comentario
        return resultado

# Comentario multilínea usando triple comillas
"""
Este es un comentario multilínea
que debería ser eliminado por la extensión.
Puede contener múltiples líneas.
"""

# Comentario de línea al final del archivo
# Este también debería ser eliminado
