# 🥐 Sistema de Gestión de Panificados  
**Aplicación Web para Control de Stock, Ventas y Estadísticas – Proyecto POO**

Este proyecto es un **sistema completo de gestión de inventario y ventas**, desarrollado como trabajo académico para la materia *Programación Orientada a Objetos*.  
Está pensado para el uso personal en la venta diaria de panificados, pero es totalmente **adaptable a cualquier rubro** que maneje productos físicos, compras, ventas y control de stock.

---

## 📌 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Objetivos del Proyecto](#objetivos-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Características Principales](#características-principales)
- [Flujo de Uso](#flujo-de-uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Lógica de Registro y Estadísticas](#lógica-de-registro-y-estadísticas)
- [Modo Oscuro](#modo-oscuro)
- [Adaptabilidad a Otros Rubros](#adaptabilidad-a-otros-rubros)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Capturas (opcional)](#capturas-opcional)
- [Autor](#autor)

---

## 📝 **Descripción General**

El sistema permite **registrar productos, controlar su stock, registrar ventas, realizar cierres diarios y visualizar estadísticas completas** como:

- Ventas por día  
- Ganancias por día  
- Acumulado mensual  
- Detalle por producto  
- Ingresos reales  
- Costos  
- Comparación entre turnos (mañana / tarde)

Los datos se guardan localmente mediante `localStorage`, por lo que pueden persistir incluso cerrando sesión o la página.

---

## 🎯 **Objetivos del Proyecto**

- Aplicar **Programación Orientada a Objetos (POO)** en un caso real.
- Implementar manejo estructurado de productos, ventas y registros.
- Crear un sistema **escalable**, **modular** y **de fácil mantenimiento**.
- Construir estadísticas automáticas diarias y mensuales.
- Diseñar una interfaz intuitiva, adaptable a dispositivos móviles.
- Implementar un **modo oscuro** y controles visuales profesionales.

---

## 🛠 **Tecnologías Utilizadas**

| Tecnología | Uso |
|-----------|-----|
| **HTML5** | Maquetación del sistema |
| **CSS3** | Estilos, modo oscuro, tarjetas, tablas, alertas |
| **JavaScript (POO)** | Lógica completa, clases, flujo del sistema |
| **Chart.js** | Gráficos estadísticos |
| **localStorage** | Persistencia de datos |
| **jsPDF** | Exportación de reportes a PDF |

---

## ⭐ **Características Principales**

### 🧮 Gestión Completa de Productos
- Crear, editar y eliminar productos  
- Control de precios (costo / venta)  
- Control de stock inicial, restante y vendido  
- Alertas por stock bajo

### 🛒 Registro de Ventas
- Registrar ventas por producto  
- Control automático del stock  
- Cálculo de ganancia y margen real  

### 📆 Cierre del Día
El cierre del día:
- Guarda un registro inalterable del día  
- Limpia el resumen diario  
- Mantiene el stock real para continuar al día siguiente  
- No borra los productos no vendidos

Permite cerrar más de una vez por día, útil para:
- Compras imprevistas  
- Ventas por etapas  
- Doble turno

### 📊 Estadísticas Avanzadas
Incluye:
- Resumen rápido del día  
- Gráfico de ventas por categoría  
- Tabla de productos vendidos del día  
- Tabla de días del mes con sus totales  
- Acumulados mensuales de ingreso, ganancia y costo  
- Detalle por producto del mes

Todo se genera automáticamente leyendo registros diarios guardados.

### 🌓 Modo Oscuro
Conserva:
- Botones  
- Tablas  
- Alertas  
- Tarjetas  
- Gráficos  

Pensado para trabajar de noche sin fatiga visual.

---

## 🔁 **Flujo de Uso**

1. **Cargar productos** al iniciar el día  
2. Registrar ventas durante la jornada  
3. El sistema muestra:
   - Totales del día  
   - Ganancia real  
   - Stock actualizado  
4. Realizar el **Cierre del Día**  
5. Ver estadísticas del mes y del día  
6. Continuar con el nuevo día manteniendo los productos restantes

---

## 📂 **Estructura del Proyecto**

/ventaPanificadosPOO
│ index.html
│ estadisticas.html
│ styles.css
│ login.html
│ login.js
│ app-poo.js
│ README.md
│
├── /poo
│ ├── modelos.js # Clases base (Producto, Registro, SistemaMensual, etc)
│ ├── sistema.js # Lógica del index, ventas y cierre del día
│ └── estadisticas.js # Generación de tablas, gráficos y reportes
│
├── /img # Imágenes del proyecto (proximamenete)
└── /pdf # Reportes generados (próximamente)
---

## 📘 **Lógica de Registro y Estadísticas**

Los datos se guardan en `localStorage` en estructuras como:

- `productos_admin`
- `registro_diario_admin_YYYY-MM-DD`
- `registro_admin_YYYY-MM-DD_HHMMSS`
- `ultima_fecha_cierre_admin`

Ventajas:
- No se pierden datos al cerrar la página  
- Permite historial detallado  
- Separa diariamente y por turnos  
- Cálculo matemático preciso para cada cierre  

---

## 🌙 **Modo Oscuro**

El modo oscuro afecta:
- Fondo  
- Tarjetas  
- Tablas  
- Botones  
- Gráficos  
- Alertas dinámicas por stock  

Se activa con un botón y se guarda en `localStorage`.

---

## 🔧 **Adaptabilidad a Otros Rubros**

El sistema está diseñado para panificados, pero puede adaptarse fácilmente a:

- Verdulerías  
- Minimercados  
- Repuestos  
- Productos caseros  
- Cualquier emprendimiento que maneje stock y ventas  

Solo requiere adaptar:
- Categorías  
- Nombres de productos  
- Precios  

---

## 📋 **Requisitos Previos**

No requiere servidor ni instalación.

Solo se necesita:
- Navegador moderno (Chrome recomendado)
- Permitir uso de `localStorage`

---

## 🚀 **Instalación y Ejecución**

1. Descargar el proyecto  
2. Abrir `index.html` en el navegador  
3. (Opcional) Abrir `estadisticas.html` para ver reportes  
4. ¡Listo! El sistema funciona al instante  

---

## 🖼 **Capturas (opcional)**

Agregar en la presentación:

- Pantalla del index  
- Alertas de stock  
- Cierre del día  
- Estadísticas mensuales  
- Gráficos cotidianos  

---

## 👨‍💻 **Autor**

Desarrollado por **Cristian Altamiranda**,  
como proyecto para la carrera **Técnico Universitario en Tecnologías de Programación**.

---
