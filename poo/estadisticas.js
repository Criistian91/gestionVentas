// poo/estadisticas.js
// Inventario: Maneja los productos y su stock
// EstadModel: Maneja los registros y cálculos estadísticos
// UsuarioSesion: Controla si el usuario está logueado
// Producto: Constructor para instanciar productos de forma segura
import { Inventario, Estadisticas as EstadModel, UsuarioSesion, Producto } from './modelos.js';

// Clase que controla toda la vista de estadísticas
class VistaEstadisticas {
    constructor(usuario = null) {
        // Verificación de sesión activa
        this.sesion = new UsuarioSesion();
        if (!this.sesion.estaLogueado()) {
            alert('Debes iniciar sesión.');
            location.href = 'login.html';
            return;
        }

        this.usuario = usuario || this.sesion.usuarioActivo || 'admin';
        // Instancias de inventario y estadísticas vinculadas al usuario
        this.inventario = new Inventario(this.usuario);
        this.estadisticasModel = new EstadModel(this.usuario);

        // Elementos del DOM donde se mostrarán los datos
        this.resumenTotales = document.getElementById('resumenTotales');
        this.tablaBody = document.querySelector('#tablaProductos tbody');
        this.tablaDiasBody = document.querySelector('#tablaDias tbody');

        // Instancias de gráficos de Chart
        this.chartTopProductos = null;
        this.chartCategorias = null;
        this.chartIngresos = null;
        this.chartPromedios = null;
        this.chartDia = null;
        this.chartVentasPorDia = null;
        this.chartGananciasPorDia = null;
        
        // cONTENEDOR GLOBAL DE CHARTS
        window.allCharts = window.allCharts || [];

        this.init();
    }

    // Inicializa eventos, botones, cierres automáticos y renderizado de estadísticas
    init() {
        // botones y eventos
        const volver = document.getElementById('volverBtn');
        if (volver) volver.addEventListener('click', () => location.href = 'index.html');
        // botón exportar CSV
        const expBtn = document.getElementById('exportarCSVBtn');
        if (expBtn) expBtn.addEventListener('click', () => this.exportarCSV());
        // botón exportar PDF día
        const pdfDiaBtn = document.getElementById('exportarPDFDiaBtn');
        if (pdfDiaBtn) pdfDiaBtn.addEventListener('click', () => this.exportarPDFDelDia());
        // botón exportar PDF mes
        const pdfMesBtn = document.getElementById('exportarPDFMesBtn');
        if (pdfMesBtn) pdfMesBtn.addEventListener('click', () => this.exportarPDFDelMes());
        // botón resetear estadísticas
        const resetBtn = document.getElementById('resetEstadisticasBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!confirm("¿Seguro que querés resetear TODAS las estadísticas?")) return;
                const prefDiario = `registro_diario_${this.usuario}_`;
                const prefHist = `registro_${this.usuario}_`;
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith(prefDiario) || k.startsWith(prefHist)) localStorage.removeItem(k);
                });
                alert("Estadísticas reiniciadas.");
                this.renderizarTodo();
            });
        }
        // configurar cierre automático diario a las 23:59
        try {
            this.estadisticasModel.verificarCierreAutomatico(23,59);
            this.estadisticasModel.programarCierreDiario(23,59);
        } catch(e) {}

        document.addEventListener('ventasActualizadas', () => {
            this.inventario = new Inventario(this.usuario);
            this.renderizarTodo();
        });

        this.renderizarTodo();
    }
    // Obtiene los datos completos necesarios para las estadísticas
    obtenerDatosCompletos() {
        const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
        const registros = this.estadisticasModel.obtenerRegistros();
        return { productos, registros };
    }
    // Normaliza y agrupa los registros históricos por fecha
    _historicosAgrupadosPorFecha(registrosHistoricos) {

        // Filtro de claves válidas AAAA-MM-DD
        registrosHistoricos = registrosHistoricos.filter(r => {
            if (!r || !r.clave) return false;

            const partes = r.clave.split('_');
            const fecha = partes[2];

            return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
        });

        const porFecha = {};
        // Agrupación por fecha
        registrosHistoricos.forEach(r => {

            const partes = r.clave.split('_');
            const fecha = partes[2];
            // Si aún no está creada la fecha, la inicializamos
            if (!porFecha[fecha]) {
                porFecha[fecha] = {
                    fecha,
                    datos: Array.isArray(r.datos) ? [...r.datos] : []
                };
            } else {
                // Junta los datos sin sobreescritura
                const nuevos = Array.isArray(r.datos) ? r.datos : [];
                porFecha[fecha].datos.push(...nuevos);
            }
        });

        // Map final limpio y ordenado
        return Object.keys(porFecha).sort().map(fecha => {

            const mapProd = {};

            porFecha[fecha].datos.forEach(p => {
                const id = String(p.id);

                if (!mapProd[id]) {
                    mapProd[id] = {
                        id: p.id,
                        nombre: p.nombre,
                        categoria: p.categoria,
                        precioVenta: Number(p.precioVenta),
                        precioCosto: Number(p.precioCosto),
                        vendido: 0,
                        ingreso: 0,
                        gananciaDia: 0
                    };
                }

                mapProd[id].vendido += Number(p.vendido || 0);
                mapProd[id].ingreso += Number(p.ingreso || 0);
                mapProd[id].gananciaDia += Number(p.gananciaDia || 0);
            });

            return {
                fecha,
                datos: Object.values(mapProd)
            };
        });
    }

    // Renderiza tablas, totales y todos los gráficos
    renderizarTodo() {
        try {
            const { productos, registros } = this.obtenerDatosCompletos();
            const registroHoy = this.estadisticasModel.obtenerRegistroDiario();
            const totalesDia = this.estadisticasModel.calcularTotalesDelDia() || {};

            const ventaEsperadaHoy = this._calcularVentaEsperadaHoy(productos, registroHoy);

            const historicos = this._historicosAgrupadosPorFecha(registros);

            const mesActual = new Date().toISOString().slice(0,7);
            const historicosMes = historicos.filter(h => h.fecha.startsWith(mesActual));

            const totalesMes = this._calcularTotalesMesReal(historicosMes);

            if (this.resumenTotales) {
                this.resumenTotales.innerHTML = `
                    <p><strong>Costo total (hoy):</strong> $${totalesDia.costoVendido || 0}</p>
                    <p><strong>Venta esperada (hoy):</strong> $${ventaEsperadaHoy}</p>
                    <p><strong>Ingreso real (hoy):</strong> $${totalesDia.ingresoReal || 0}</p>
                    <p><strong>Ganancia real (hoy):</strong> $${totalesDia.gananciaReal || 0}</p>
                    <hr>
                    <p><strong>Ingreso acumulado (mes):</strong> $${totalesMes.ingreso}</p>
                    <p><strong>Ganancia acumulada (mes):</strong> $${totalesMes.ganancia}</p>
                    <p><strong>Costo vendido (mes):</strong> $${totalesMes.costoVendido}</p>
                `;
            }
            // Cálculos para gráficos
            const acumulado = this._acumuladoPorProducto(historicos, registroHoy);
            const categorias = this._ventasPorCategoria(historicos, registroHoy);

            // Orden y creación de charts
            this._dibujarGraficoBarras('chartTopProductos', Object.keys(acumulado), Object.values(acumulado), 'Unidades vendidas');
            this._dibujarGraficoDona('chartCategorias', Object.keys(categorias), Object.values(categorias));
            this._dibujarGraficoBarras('chartPromedios', Object.keys(this.estadisticasModel.calcularPromedios()), Object.values(this.estadisticasModel.calcularPromedios()), 'Promedios');
            this._dibujarGraficoBarras('chartVentasPorDia', historicosMes.map(h => h.fecha), historicosMes.map(h => h.datos.reduce((s,p)=> s + Number(p.ingreso || (p.vendido * Number(p.precioVenta || 0))),0)), 'Ingreso por día');
            this._dibujarGraficoBarras('chartGananciasPorDia', historicosMes.map(h => h.fecha), historicosMes.map(h => h.datos.reduce((s,p)=> s + Number(p.gananciaDia || (p.vendido * (Number(p.precioVenta||0)-Number(p.precioCosto||0)))),0)), 'Ganancias por día');

            // también dibujar ingreso vs venta esperada (usa chartIngresos canvas)
            this._dibujarGraficoDona('chartIngresos', ['Ingreso real (hoy)','Venta esperada (hoy)'], [totalesDia.ingresoReal || 0, ventaEsperadaHoy || 0]);

            if (registroHoy) {
                const labels = ['Mañana','Tarde'];
                const values = [
                    registroHoy.turnos.mañana.ganancia || 0,
                    registroHoy.turnos.tarde.ganancia || 0
                ];
                this._dibujarGraficoBarras('chartDia', labels, values, 'Ganancia por turno');
            }

            this._llenarTabla(productos, acumulado);
            this._llenarTablaDias(historicosMes);

        } catch (e) {
            console.error("Error renderizando:", e);
        }
    }

    // Calcula la venta esperada hoy según el stock actual
    _calcularVentaEsperadaHoy(productos, registroHoy) {
        let total = 0;
        productos.forEach(p => {
            total += Number(p.stock || 0) * Number(p.precioVenta || 0);
        });
        return total;
    }
    
    // Calcula los totales reales del mes según los registros
    _calcularTotalesMesReal(registrosMes) {
        const totales = { ingreso: 0, ganancia: 0, costoVendido: 0 };
        registrosMes.forEach(r => {
            r.datos.forEach(p => {
                const v = Number(p.vendido || 0);
                totales.ingreso += v * Number(p.precioVenta || 0);
                totales.costoVendido += v * Number(p.precioCosto || 0);
                totales.ganancia += Number(p.gananciaDia || (v * (Number(p.precioVenta)-Number(p.precioCosto))));
            });
        });
        return totales;
    }
    
    // Calcula el acumulado de ventas por producto
    _acumuladoPorProducto(historicos, registroHoy) {
        const map = {};
        historicos.forEach(d => {
            d.datos.forEach(p => {
                map[p.nombre] = (map[p.nombre] || 0) + Number(p.vendido || 0);
            });
        });

        if (registroHoy && registroHoy.productos) {
            Object.values(registroHoy.productos).forEach(p => {
                map[p.nombre] = (map[p.nombre] || 0) + Number(p.vendidosHoy || 0);
            });
        }

        return map;
    }
    
    // Calcula las ventas totales por categoría
    _ventasPorCategoria(historicos, registroHoy) {
        const map = {};
        historicos.forEach(d => {
            d.datos.forEach(p => {
                const cat = p.categoria || '(sin categoría)';
                map[cat] = (map[cat] || 0) + Number(p.vendido || 0);
            });
        });

        if (registroHoy && registroHoy.productos) {
            Object.values(registroHoy.productos).forEach(p => {
                const cat = p.categoria || '(sin categoría)';
                map[cat] = (map[cat] || 0) + Number(p.vendidosHoy || 0);
            });
        }

        return map;
    }
    
    // Llena la tabla de productos con los datos acumulados
    _llenarTabla(productos, acumulado) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';
        productsLoop: for (const p of productos) {
            const vendidos = acumulado[p.nombre] || 0;
            const ganancia = vendidos * (Number(p.precioVenta) - Number(p.precioCosto));
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nombre}</td>
                <td>${p.categoria || '(sin categoría)'}</td>
                <td>${p.stock}</td>
                <td>${vendidos}</td>
                <td>$${p.precioVenta}</td>
                <td>$${ganancia}</td>
            `;
            this.tablaBody.appendChild(tr);
        }
    }
    
    // Llena la tabla de días con los totales diarios
    _llenarTablaDias(registrosMes) {
        if (!this.tablaDiasBody) return;
        this.tablaDiasBody.innerHTML = '';

        registrosMes.forEach(r => {
            let ingreso = 0, ganancia = 0, costo = 0;
            r.datos.forEach(p => {
                const v = Number(p.vendido || 0);
                ingreso += v * Number(p.precioVenta);
                costo += v * Number(p.precioCosto);
                ganancia += Number(p.gananciaDia || (v * (Number(p.precioVenta)-Number(p.precioCosto))));
            });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.fecha}</td>
                <td>$${ingreso}</td>
                <td>$${ganancia}</td>
                <td>$${costo}</td>
            `;
            this.tablaDiasBody.appendChild(tr);
        });
    }

    // Dibuja los gráficos de ventas y ganancias por día
    _dibujarVentasGananciasDia(registrosMes) {
        const dias = [];
        const ventas = [];
        const ganancias = [];

        registrosMes.forEach(r => {
            let ingreso = 0, gan = 0;
            r.datos.forEach(p => {
                ingreso += Number(p.ingreso || (p.vendido * Number(p.precioVenta)));
                gan += Number(p.gananciaDia || (p.vendido * (Number(p.precioVenta)-Number(p.precioCosto))));
            });
            dias.push(r.fecha);
            ventas.push(ingreso);
            ganancias.push(gan);
        });

        this._dibujarGraficoBarras('chartVentasPorDia', dias, ventas, 'Ingreso por día');
        this._dibujarGraficoBarras('chartGananciasPorDia', dias, ganancias, 'Ganancias por día');
    }

    // ---------- GRÁFICOS CON CHART.JS ----------
    _dibujarGraficoBarras(id, labels, data, labelDataset='') {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (this[id]) { try { this[id].destroy(); } catch {} }

        try {
            const chart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: labelDataset, data }] },
                options: { responsive: true }
            });
            this[id] = chart;
            // guardar en propiedades nombradas también para exportar fácilmente
            switch (id) {
                case 'chartTopProductos': this.chartTopProductos = chart; break;
                case 'chartCategorias': this.chartCategorias = chart; break;
                case 'chartIngresos': this.chartIngresos = chart; break;
                case 'chartPromedios': this.chartPromedios = chart; break;
                case 'chartDia': this.chartDia = chart; break;
                case 'chartVentasPorDia': this.chartVentasPorDia = chart; break;
                case 'chartGananciasPorDia': this.chartGananciasPorDia = chart; break;
            }
            window.allCharts = window.allCharts || [];
            window.allCharts.push(chart);
        } catch (e) {
            console.warn("Error creando chart barras:", e);
        }
    }
    
    _dibujarGraficoDona(id, labels, data) {
        const canvas = document.getElementById(id);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (this[id]) { try { this[id].destroy(); } catch {} }

        try {
            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: { labels, datasets: [{ data }] },
                options: { responsive: true }
            });
            this[id] = chart;
            if (id === 'chartCategorias') this.chartCategorias = chart;
            if (id === 'chartIngresos') this.chartIngresos = chart;
            window.allCharts = window.allCharts || [];
            window.allCharts.push(chart);
        } catch (e) {
            console.warn("Error creando chart dona:", e);
        }
    }

    // ---------- EXPORTAR CSV ----------
    exportarCSV() {
        try {
            const productos = this.inventario.obtenerTodos();
            let csv = 'Nombre,Categoría,Stock,Vendidos,PrecioVenta,GananciaTotal\n';
            productos.forEach(p => {
                const gan = (p.vendido || 0) * ((p.precioVenta || 0) - (p.precioCosto || 0));
                csv += `"${p.nombre}","${(p.categoria||'')}",${p.stock || 0},${p.vendido || 0},${p.precioVenta || 0},${gan}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estadisticas_productos_${this.usuario}_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("No se pudo exportar CSV.");
        }
    }

    // ---------- helpers para export PDF ----------
    _chartToImage(chartObj) {
        try {
            if (!chartObj) return null;
            if (typeof chartObj.toBase64Image === 'function') return chartObj.toBase64Image();
            if (chartObj.canvas && typeof chartObj.canvas.toDataURL === 'function') return chartObj.canvas.toDataURL();
            return null;
        } catch (e) {
            console.warn("Error convirtiendo chart a imagen:", e);
            return null;
        }
    }

    // ======================================================
    // Cálculo combinado para PDF del Día:
    // - Venta esperada según stock actual
    // - Ingreso real del día
    // - Ganancias por turno
    // ======================================================
    _calcularVentaEsperadaHoyCombinada() {
        const hoy = this.estadisticasModel._fechaHoyStr();
        const registro = this.estadisticasModel.obtenerRegistroDiario(hoy);
        const inventario = this.inventario.obtenerTodos();

        let ventaEsperada = 0;
        let ingresoReal = 0;
        let gananciaReal = 0;

        let gananciaManiana = 0;
        let gananciaTarde = 0;

        // === Venta esperada según stock actual ===
        inventario.forEach(p => {
            ventaEsperada += (Number(p.stock || 0) * Number(p.precioVenta || 0));
        });

        // === Ingresos y ganancias reales del día ===
        if (registro && registro.productos) {
            Object.values(registro.productos).forEach(p => {
                const vendidos = Number(p.vendidosHoy || 0);
                const pv = Number(p.precioVenta || 0);
                const pc = Number(p.precioCosto || 0);

                ingresoReal += vendidos * pv;
                gananciaReal += (vendidos * (pv - pc));

                if (p.turno === "mañana") gananciaManiana += (vendidos * (pv - pc));
                if (p.turno === "tarde")  gananciaTarde += (vendidos * (pv - pc));
            });
        }

        return {
            ventaEsperada,
            ingresoReal,
            gananciaReal,
            gananciaManiana,
            gananciaTarde
        };
    }

    // Cargar una imagen y devolverla en DataURL (para PDF)
    async _loadImageDataURL(url) {
        try {
            // intenta cargar como Image + canvas a dataURL (evita CORS si la imagen es local)
            return await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const c = document.createElement('canvas');
                        c.width = img.width;
                        c.height = img.height;
                        const ctx = c.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(c.toDataURL('image/png'));
                    } catch(e) { resolve(null); }
                };
                img.onerror = () => resolve(null);
                // importante: para archivos locales en la misma raíz esto funciona
                img.src = url + '?_=' + (Date.now());
            });
        } catch (e) {
            return null;
        }
    }

    // Cargar una imagen y devolverla en Base64 (para PDF)
    _cargarImagenBase64(ruta) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/png"));
                    } catch (e) {
                        console.warn("No se pudo convertir imagen:", e);
                        resolve(null);
                    }
                };
                img.onerror = () => resolve(null);
                img.src = ruta;
            } catch (e) {
                console.warn("Error cargando imagen:", e);
                resolve(null);
            }
        });
    }

    // ---------- EXPORTAR PDF DEL DÍA ----------
    async exportarPDFDelDia() {
        try {
            if (!(window.jspdf && window.jspdf.jsPDF)) {
                alert("jsPDF no está disponible. Verificá que cargaste la librería en la página.");
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p','pt','a4');
            const margen = 40;
            let y = 40;

            // --- LOGO ---
            const logoData = await this._cargarImagenBase64('logo.webp');
            if (logoData) {
                try { doc.addImage(logoData, 'WEBP', margen, y, 48, 48); }
                catch(e) { try { doc.addImage(logoData, 'PNG', margen, y, 48, 48); } catch{} }
            }

            doc.setFontSize(16);
            doc.text(`Estadísticas - ${this.usuario}`, margen + (logoData ? 56 : 0), y + 14);
            y += 64;

            // --- DATOS DEL DÍA ---
            const totales = this.estadisticasModel.calcularTotalesDelDia() || {};
            const registroHoy = this.estadisticasModel.obtenerRegistroDiario() 
                                || { turnos: { mañana: {ganancia:0}, tarde: {ganancia:0} } };

            // --- NUEVO RESUMEN REAL corregido ---
            const resumen = this._calcularVentaEsperadaHoyCombinada();

            // SIEMPRE aseguramos valores numéricos
            const ingresoReal = Number(resumen.ingresoReal || 0);
            const ventaEsperada = Number(resumen.ventaEsperada || 0);
            const gananciaReal = Number(resumen.gananciaReal || 0);
            const costoVendido = Number(ingresoReal - gananciaReal);
            const gM = Number(resumen.gananciaManiana || 0);
            const gT = Number(resumen.gananciaTarde || 0);

            const fechaPDF = new Date().toLocaleDateString("es-AR");

            doc.setFontSize(11);
            doc.text(`Fecha: ${fechaPDF}`, margen, y); y += 16;

            doc.text(`Ingreso real (hoy): $${ingresoReal}`, margen, y); y += 14;
            doc.text(`Venta esperada (hoy): $${ventaEsperada}`, margen, y); y += 14;
            doc.text(`Ganancia real (hoy): $${gananciaReal}`, margen, y); y += 14;
            doc.text(`Costo vendido (hoy): $${costoVendido}`, margen, y); y += 18;

            // --- GANANCIAS POR TURNO ---
            doc.setFontSize(12);
            doc.text("Ganancias por turno:", margen, y); 
            y += 14;

            doc.setFontSize(11);
            doc.text(`- Mañana: $${gM}`, margen, y); y += 12;
            doc.text(`- Tarde:   $${gT}`, margen, y); y += 18;

            // --- GRÁFICO INGRESOS ---
            const imgIngresos = this._chartToImage(this.chartIngresos);
            if (imgIngresos) {
                if (y + 140 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                doc.text("Ingresos reales vs Venta esperada", margen, y); y += 8;
                doc.addImage(imgIngresos, 'PNG', margen, y, 260, 120);
                y += 132;
            }

            // --- GRÁFICO TURNO ---
            const imgTurno = this._chartToImage(this.chartDia);
            if (imgTurno) {
                if (y + 140 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                doc.text("Ganancias por turno", margen, y); y += 8;
                doc.addImage(imgTurno, 'PNG', margen, y, 260, 120);
                y += 132;
            }

            // --- GRÁFICO TOP ---
            const imgTop = this._chartToImage(this.chartTopProductos);
            if (imgTop) {
                if (y + 160 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                doc.text("Top productos más vendidos", margen, y); y += 8;
                doc.addImage(imgTop, 'PNG', margen, y, 260, 140);
                y += 152;
            }

            // --- TABLA DETALLE ---
            const productos = this.inventario.obtenerTodos();

            if (y + 40 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
            doc.setFontSize(12); 
            doc.text("Detalle por producto (acumulado)", margen, y); 
            y += 16;

            doc.setFontSize(10);
            doc.text("Producto", margen, y);
            doc.text("Vend.", margen + 220, y);
            doc.text("Gan.", margen + 300, y);
            y += 12;

            productos.forEach(p => {
                if (y > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                const vendidos = Number(p.vendido || 0);
                const gan = vendidos * ((Number(p.precioVenta || 0) - Number(p.precioCosto || 0)));

                doc.text(String(p.nombre).slice(0,30), margen, y);
                doc.text(String(vendidos), margen + 220, y);
                doc.text(`$${gan}`, margen + 300, y);
                y += 12;
            });

            // --- NOMBRE DE ARCHIVO CORRECTO ---
            const nombre = `estadisticas_dia_${this.usuario}_${new Date().toISOString().slice(0,10)}.pdf`;
            doc.save(nombre);

        } catch (err) {
            console.error("Error exportando PDF del día:", err);
            alert("No se pudo generar el PDF del día. Revisá la consola.");
        }
    }



    // ---------- EXPORTAR PDF DEL MES ----------
    async exportarPDFDelMes() {
        try {
            if (!(window.jspdf && window.jspdf.jsPDF)) {
                alert("jsPDF no cargado.");
                return;
            }
            const { jsPDF } = window.jspdf;

            // historicos normalizados
            const { registros } = this.obtenerDatosCompletos();
            const historicos = this._historicosAgrupadosPorFecha(registros);

            const mesActual = (new Date()).toISOString().slice(0,7);
            const historicosMes = historicos.filter(h => h.fecha.startsWith(mesActual));
            if (!historicosMes.length) { alert("No hay datos para el mes actual."); return; }

            const doc = new jsPDF('p','pt','a4');
            const margen = 28;
            let y = 40;


            // --- LOGO ---
            const logoData = await this._cargarImagenBase64('logo.webp');
            if (logoData) {
                try { doc.addImage(logoData, 'WEBP', margen, y, 48, 48); }
                catch(e) { try { doc.addImage(logoData, 'PNG', margen, y, 48, 48); } catch{} }
            }

            doc.setFontSize(16);
            doc.text(`Estadísticas - ${this.usuario}`, margen + (logoData ? 56 : 0), y + 14);
            y += 64;

            // Incluir 5 charts agrandados 150%
            const chartsOrder = [
                { obj: this.chartTopProductos, title: 'Top productos' },
                { obj: this.chartCategorias, title: 'Ventas por categoría' },
                { obj: this.chartPromedios, title: 'Promedios' },
                { obj: this.chartVentasPorDia, title: 'Ingreso por día' },
                { obj: this.chartGananciasPorDay || this.chartGananciasPorDia, title: 'Ganancias por día' } // fallback
            ];

            for (let i = 0; i < chartsOrder.length; i++) {
                const ch = chartsOrder[i];
                const img = this._chartToImage(ch.obj);
                if (!img) continue;
                const w = 360, h = 200;
                if (y + h > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                doc.setFontSize(12); doc.text(ch.title, margen, y); y += 12;
                doc.addImage(img, 'PNG', margen, y, w, h);
                y += h + 12;
            }

            // Detalle por día (resumen)
            if (y + 60 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
            doc.setFontSize(12); doc.text("Resumen diario del mes", margen, y); y += 14;
            doc.setFontSize(10);
            historicosMes.forEach(d => {
                if (y + 40 > doc.internal.pageSize.height - 40) { doc.addPage(); y = 40; }
                let ingreso = 0, ganancia = 0;
                d.datos.forEach(p => {
                    ingreso += Number(p.ingreso || (p.vendido * Number(p.precioVenta || 0)));
                    ganancia += Number(p.gananciaDia || (p.vendido * (Number(p.precioVenta||0)-Number(p.precioCosto||0))));
                });
                doc.text(`${d.fecha}  Ingreso: $${ingreso}  Ganancia: $${ganancia}`, margen, y);
                y += 12;
            });

            const filename = `estadisticas_mes_${this.usuario}_${mesActual}.pdf`;
            doc.save(filename);

        } catch (err) {
            console.error("Error exportando PDF del mes:", err);
            alert("No se pudo generar el PDF mensual. Revisá la consola.");
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {
    new VistaEstadisticas();
});

export default VistaEstadisticas;
