// // poo/estadisticas.js
// // Vista / presentación de estadísticas — versión corregida para evitar conteos duplicados
// // - Agrupa históricos por fecha y toma sólo el historial "representativo" por día (el más reciente)
// // - Calcula venta esperada del día incluyendo productos que NO aparecen en registro_diario
// // - Evita duplicados en gráficos/tablas cuando hay múltiples registros con misma fecha

// import { Inventario, Estadisticas as EstadModel, UsuarioSesion, Producto } from './modelos.js';

// class VistaEstadisticas {
//     constructor(usuario = null) {
//         this.sesion = new UsuarioSesion();
//         if (!this.sesion.estaLogueado()) { alert('Debes iniciar sesión.'); location.href = 'login.html'; return; }
//         this.usuario = usuario || this.sesion.usuarioActivo || 'admin';
//         this.inventario = new Inventario(this.usuario);
//         this.estadisticasModel = new EstadModel(this.usuario, null);

//         this.resumenTotales = document.getElementById('resumenTotales');
//         this.tablaBody = document.querySelector('#tablaProductos tbody');
//         this.tablaDiasBody = document.querySelector('#tablaDias tbody');

//         // Chart refs
//         this.chartTopProductos = null;
//         this.chartCategorias = null;
//         this.chartIngresos = null;
//         this.chartPromedios = null;
//         this.chartDia = null;
//         this.chartVentasPorDay = null;
//         this.chartGananciasPorDay = null;

//         window.allCharts = window.allCharts || [];

//         this.init();
//     }

//     init() {
//         const volver = document.getElementById('volverBtn'); if (volver) volver.addEventListener('click', () => location.href = 'index.html');
//         const expBtn = document.getElementById('exportarCSVBtn'); if (expBtn) expBtn.addEventListener('click', () => this.exportarCSV());
//         const pdfBtn = document.getElementById('exportarPDFBtn'); if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportarPDF());

//         const resetBtn = document.getElementById('resetEstadisticasBtn');
//         if (resetBtn) {
//             resetBtn.addEventListener('click', () => {
//                 if (!confirm("¿Seguro que querés resetear TODAS las estadísticas?")) return;
//                 const prefDiario = `registro_diario_${this.usuario}_`;
//                 const prefHist = `registro_${this.usuario}_`;
//                 Object.keys(localStorage).forEach(k => {
//                     if (k.startsWith(prefDiario) || k.startsWith(prefHist)) localStorage.removeItem(k);
//                 });
//                 alert("Estadísticas reiniciadas.");
//                 this.renderizarTodo();
//             });
//         }

//         try { this.estadisticasModel.verificarCierreAutomatico(23,59); this.estadisticasModel.programarCierreDiario(23,59); } catch(e) { console.warn(e); }

//         // cuando haya cambios en ventas, refrescar vista
//         document.addEventListener('ventasActualizadas', () => this.renderizarTodo());

//         this.renderizarTodo();
//     }

//     obtenerDatosCompletos() {
//         // recupera inventario y registros históricos (sin transformar)
//         const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         const registros = this.estadisticasModel.obtenerRegistros();
//         return { productos, registros };
//     }

//     // -----------------------
//     // Helpers: agrupar históricos por FECHA (yyyy-mm-dd)
//     // -----------------------
//     // _historicosAgrupadosPorFechaSoloUltimo(registrosHistoricos) {
//     //     // registrosHistoricos: array { clave, datos } devuelto por modelos.obtenerRegistros()
//     //     // Devuelve array [{ fecha: 'YYYY-MM-DD', clave: '...', datos: [...] }] where for each fecha
//     //     // we keep only the registro con la clave "más grande" (último timestamp).
//     //     const porFecha = {};
//     //     registrosHistoricos.forEach(r => {
//     //         // intentar extraer fecha del nombre de la clave (formato: registro_<usuario>_YYYY-MM-DD_... )
//     //         const partes = (r.clave || '').split('_');
//     //         const fechaParte = partes[2] || null;
//     //         if (!fechaParte) return;
//     //         // inicializa si falta
//     //         porFecha[fechaParte] = porFecha[fechaParte] || { clave: r.clave, datos: r.datos };
//     //         // si hay otra entrada para la misma fecha, elegir la de mayor "clave" (cronológicamente más reciente por sufijo)
//     //         if (r.clave > porFecha[fechaParte].clave) {
//     //             porFecha[fechaParte] = { clave: r.clave, datos: r.datos };
//     //         }
//     //     });
//     //     // convertir a array ordenado por fecha asc
//     //     const arr = Object.keys(porFecha).sort().map(fecha => ({ fecha, clave: porFecha[fecha].clave, datos: porFecha[fecha].datos }));
//     //     return arr;
//     // }

//     // concatena todos los historiales del mismo día y luego agrupa por producto sumando vendido, ingreso y gananciaDia
//     _historicosAgrupadosPorFechaSoloUltimo(registrosHistoricos) {
//         // Queremos: devolver array [{ fecha, clave: 'YYYY-MM-DD', datos: [...productos acumulados del día...] }]
//         const porFecha = {};

//         registrosHistoricos.forEach(r => {
//             const partes = (r.clave || '').split('_');
//             const fechaParte = partes[2] || null;
//             if (!fechaParte) return;

//             // asegurarnos de que r.datos sea un array de productos históricos
//             const datosArr = Array.isArray(r.datos) ? r.datos : [];

//             if (!porFecha[fechaParte]) {
//                 // clonamos el array (lo convertimos a objetos con campos esperados)
//                 porFecha[fechaParte] = { fecha: fechaParte, clave: r.clave, datos: JSON.parse(JSON.stringify(datosArr)) };
//             } else {
//                 // Si ya existe día, concatenamos: luego normalizamos/agrupamos por producto si fuera necesario
//                 porFecha[fechaParte].datos = porFecha[fechaParte].datos.concat(JSON.parse(JSON.stringify(datosArr)));
//                 // mantener la 'clave' mayor para referencia (no es crítico)
//                 if (r.clave > porFecha[fechaParte].clave) porFecha[fechaParte].clave = r.clave;
//             }
//         });

//         // Ahora: los registros porFecha[fecha].datos pueden contener varias entradas del mismo producto (cierres parciales).
//         // Queremos devolver para cada fecha un array "normalizado" donde cada producto aparece una sola vez con sumas.
//         const arr = Object.keys(porFecha).sort().map(fecha => {
//             const raw = porFecha[fecha].datos || [];
//             const mapProd = {};
//             raw.forEach(p => {
//                 const key = String(p.id || p.nombre);
//                 mapProd[key] = mapProd[key] || {
//                     id: p.id,
//                     nombre: p.nombre,
//                     categoria: p.categoria,
//                     precioVenta: Number(p.precioVenta || 0),
//                     precioCosto: Number(p.precioCosto || 0),
//                     vendido: 0,
//                     ingreso: 0,
//                     gananciaDia: 0,
//                     stockInicial: p.stockInicial || null,
//                     stockFinal: p.stockFinal || null
//                 };
//                 mapProd[key].vendido += Number(p.vendido || 0);
//                 mapProd[key].ingreso += Number(p.ingreso || 0);
//                 mapProd[key].gananciaDia += Number(p.gananciaDia || 0) || (Number(p.vendido || 0) * (mapProd[key].precioVenta - mapProd[key].precioCosto));
//                 // conservar stockInicial/stockFinal si están (el criterio puede variar)
//                 if ((typeof p.stockInicial !== 'undefined') && p.stockInicial !== null) mapProd[key].stockInicial = p.stockInicial;
//                 if ((typeof p.stockFinal !== 'undefined') && p.stockFinal !== null) mapProd[key].stockFinal = p.stockFinal;
//             });

//             return { fecha, clave: porFecha[fecha].clave, datos: Object.values(mapProd) };
//         });

//         return arr;
//     }


//     // -----------------------
//     // Venta esperada hoy: combinar registro_diario + inventario (incluir productos que no aparecen en registro)
//     // -----------------------
//     _calcularVentaEsperadaHoyCombinada(registroHoy, productosInventario) {
//         // registroHoy: objeto diario (puede ser null)
//         // productosInventario: lista Product
//         let ventaEsperada = 0;

//         const mapRegistro = {};
//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 // si el registro tiene stockFinal lo usamos, sino calculamos pendiente = stockInicial - vendidosHoy
//                 const pv = Number(p.precioVenta || 0);
//                 const stockFinal = (typeof p.stockFinal !== 'undefined' && p.stockFinal !== null) ? Number(p.stockFinal) : null;
//                 if (stockFinal !== null) {
//                     mapRegistro[String(p.id)] = true;
//                     ventaEsperada += stockFinal * pv;
//                 } else if (typeof p.stockInicial !== 'undefined' && p.stockInicial !== null) {
//                     mapRegistro[String(p.id)] = true;
//                     const pendiente = Math.max(0, Number(p.stockInicial || 0) - Number(p.vendidosHoy || 0));
//                     ventaEsperada += pendiente * pv;
//                 } else {
//                     // si no hay info de stock inicial, no sumamos nada desde el registro (fallback vendrá del inventario)
//                     mapRegistro[String(p.id)] = true;
//                 }
//             });
//         }

//         // ahora añadir productos que NO están en el registro diario: su stock actual * precioVenta
//         productosInventario.forEach(prod => {
//             if (!mapRegistro[String(prod.id)]) {
//                 const stock = Number(prod.stock || 0);
//                 const pv = Number(prod.precioVenta || 0);
//                 ventaEsperada += stock * pv;
//             }
//         });

//         return ventaEsperada;
//     }

//     // -----------------------
//     // Render principal
//     // -----------------------
//     renderizarTodo() {
//         const { productos, registros } = this.obtenerDatosCompletos();

//         const registroHoy = this.estadisticasModel.obtenerRegistroDiario();
//         const totalesDiaRaw = this.estadisticasModel.calcularTotalesDelDia() || {}; // desde modelo (puede no incluir productos sin ventas)
//         // corregimos / completamos ventaEsperada del día con inventario
//         const ventaEsperadaHoyCombinada = this._calcularVentaEsperadaHoyCombinada(registroHoy, productos);

//         // obtenemos históricos agrupados por fecha (y tomamos solo el último por fecha para evitar duplicados por sesión)
//         const historicosOrdenadosPorFecha = this._historicosAgrupadosPorFechaSoloUltimo(registros);

//         // calcular totales mensuales a partir de esos historicos
//         const porMes = {};
//         historicosOrdenadosPorFecha.forEach(h => {
//             const mes = (h.fecha || '').slice(0,7);
//             if (!mes) return;
//             porMes[mes] = porMes[mes] || [];
//             porMes[mes].push(h);
//         });
//         const mesActual = (new Date()).toISOString().slice(0,7);
//         const registrosDelMes = porMes[mesActual] || [];

//         const totalesMes = this._calcularTotalesParaRegistros(registrosDelMes, productos);

//         // llenar resumen rápido (uso ventaEsperadaHoyCombinada)
//         if (this.resumenTotales) {
//             this.resumenTotales.innerHTML = `
//                 <p><strong>Costo total (hoy):</strong> $${(totalesDiaRaw.costoVendido || 0)}</p>
//                 <p><strong>Venta esperada (hoy):</strong> $${ventaEsperadaHoyCombinada || 0}</p>
//                 <p><strong>Ingreso real (hoy):</strong> $${(totalesDiaRaw.ingresoReal || 0)}</p>
//                 <p><strong>Ganancia real (hoy):</strong> $${(totalesDiaRaw.gananciaReal || 0)}</p>
//                 <hr>
//                 <p><strong>Ingreso acumulado (mes):</strong> $${totalesMes.ingreso || 0}</p>
//                 <p><strong>Ganancia acumulada (mes):</strong> $${totalesMes.ganancia || 0}</p>
//                 <p><strong>Costo vendido (mes):</strong> $${totalesMes.costoVendido || 0}</p>
//                 <p><strong>Venta esperada (mes):</strong> $${totalesMes.ventaEsperada || 0}</p>
//             `;
//         }

//         // ACUMULADO por producto: sumo históricos (uno por fecha) + registroHoy
//         const acumuladoPorProducto = this._calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);

//         // Top productos (primeros 10)
//         const topEntries = Object.entries(acumuladoPorProducto).sort((a,b)=>b[1]-a[1]).slice(0,10);
//         const topLabels = topEntries.map(e=>e[0]);
//         const topValues = topEntries.map(e=>e[1]);
//         this._dibujarGraficoBarras('chartTopProductos', topLabels, topValues, 'Unidades vendidas');

//         // Ventas por categoría
//         const categoriasMap = this._calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);
//         const catLabels = Object.keys(categoriasMap);
//         const catValues = Object.values(categoriasMap);
//         this._dibujarGraficoDona('chartCategorias', catLabels, catValues);

//         // Ingresos vs venta esperada (hoy)
//         const ingresoHoy = totalesDiaRaw.ingresoReal || 0;
//         this._dibujarGraficoDona('chartIngresos', ['Ingreso real (hoy)','Venta esperada (hoy)'], [ingresoHoy, ventaEsperadaHoyCombinada || 0]);

//         // Promedios: delego al modelo (si querés cambiar, lo ajustamos ahí)
//         const promedios = this.estadisticasModel.calcularPromedios() || {};
//         this._dibujarGraficoBarras('chartPromedios', Object.keys(promedios), Object.values(promedios), 'Promedios');

//         // Ganancia por turno hoy
//         if (registroHoy) {
//             const labels = ['Mañana','Tarde'];
//             const values = [registroHoy.turnos.mañana.ganancia || 0, registroHoy.turnos.tarde.ganancia || 0];
//             this._dibujarGraficoBarras('chartDia', labels, values, 'Ganancia por turno');
//         }

//         // Tabla detalle por producto
//         this._llenarTabla(productos, acumuladoPorProducto);

//         // Tabla días del mes y gráficos por día (usamos los historicos agrupados por fecha)
//         this._llenarTablaDiasDelMes(registrosDelMes);
//         this._dibujarVentasYGananciasPorDia(registrosDelMes);
//     }

//     // -----------------------
//     // ACUMULADOS: partir de historicos por fecha (ya deduplicados) + registroHoy
//     // -----------------------
//     _calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
//         const acumulado = {};
//         // historicosOrdenadosPorFecha: array [{fecha, clave, datos: [...] (array de productos histórico)}]
//         historicosOrdenadosPorFecha.forEach(h => {
//             (h.datos || []).forEach(p => {
//                 acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendido || 0);
//             });
//         });

//         // sumar lo de hoy desde registro diario (vendidosHoy)
//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendidosHoy || 0);
//             });
//         }

//         return acumulado;
//     }

//     _calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
//         const map = {};
//         historicosOrdenadosPorFecha.forEach(h => {
//             (h.datos || []).forEach(p => {
//                 map[p.categoria] = (map[p.categoria] || 0) + (p.vendido || 0);
//             });
//         });
//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 map[p.categoria] = (map[p.categoria] || 0) + (p.vendidosHoy || 0);
//             });
//         }
//         return map;
//     }

//     // totales para registros (recibe registrosDelMes que ya son los historicos por fecha - array con {fecha, datos})
//     _calcularTotalesParaRegistros(registrosDelMes, productosInventario = []) {
//         const totales = { ingreso:0, ganancia:0, costoVendido:0, ventaEsperada:0 };

//         registrosDelMes.forEach(r => {
//             const reg = r.datos; // en historicos agrupados, "datos" es el array de productos históricos
//             if (!reg) return;
//             (reg || []).forEach(p => {
//                 const vendidos = Number(p.vendido || 0);
//                 const pv = Number(p.precioVenta || 0);
//                 const pc = Number(p.precioCosto || 0);
//                 totales.ingreso += vendidos * pv;
//                 totales.ganancia += Number(p.gananciaDia || 0) || (vendidos * ((pv || 0) - (pc || 0)));
//                 totales.costoVendido += vendidos * pc;
//             });
//         });

//         // venta esperada del mes: la estimación que pusiste originalmente era inventario actual * precio
//         // dejamos ese cálculo para que muestre lo que queda por vender AHORA (stock actual * precio)
//         const inventarioActual = productosInventario.length ? productosInventario : this.inventario.obtenerTodos();
//         totales.ventaEsperada = inventarioActual.reduce((acc,p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

//         return totales;
//     }

//     // -----------------------
//     // Gráficos por día (ingresos / ganancias)
//     // registrosDelMes: array [{fecha, clave, datos}]
//     // -----------------------
//     _dibujarVentasYGananciasPorDia(registrosDelMes) {
//         const dias = [], ventas = [], ganancias = [];
//         // ordenar por fecha asc
//         registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
//         registrosDelMes.forEach(r => {
//             // r.datos es array de productos históricos
//             const regArray = r.datos || [];
//             let ingreso = 0, ganancia = 0;
//             regArray.forEach(p => { ingreso += Number(p.ingreso || (p.vendido * (p.precioVenta || 0)) || 0); ganancia += Number(p.gananciaDia || (p.vendido * ((p.precioVenta||0)-(p.precioCosto||0))) || 0); });
//             dias.push(r.fecha);
//             ventas.push(ingreso);
//             ganancias.push(ganancia);
//         });

//         this._dibujarGraficoBarras('chartVentasPorDia', dias, ventas, 'Ingreso por día');
//         this._dibujarGraficoBarras('chartGananciasPorDia', dias, ganancias, 'Ganancias por día');
//     }

//     _llenarTablaDiasDelMes(registrosDelMes) {
//         if (!this.tablaDiasBody) return;
//         this.tablaDiasBody.innerHTML = '';
//         registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
//         registrosDelMes.forEach(r => {
//             const regArray = r.datos || [];
//             let ingreso = 0, ganancia = 0, costoVendido = 0;
//             regArray.forEach(p => {
//                 const vendidos = Number(p.vendido || 0);
//                 ingreso += vendidos * Number(p.precioVenta || 0);
//                 ganancia += Number(p.gananciaDia || 0) || (vendidos * ((Number(p.precioVenta||0) - Number(p.precioCosto||0))));
//                 costoVendido += vendidos * Number(p.precioCosto || 0);
//             });
//             const tr = document.createElement('tr');
//             tr.innerHTML = `<td>${r.fecha}</td><td>$${ingreso}</td><td>$${ganancia}</td><td>$${costoVendido}</td>`;
//             this.tablaDiasBody.appendChild(tr);
//         });
//     }

//     _llenarTabla(productos, acumulado) {
//         if (!this.tablaBody) return;
//         this.tablaBody.innerHTML = '';
//         productos.forEach(p => {
//             const vendidos = acumulado[p.nombre] || 0;
//             const ganancia = vendidos * ((Number(p.precioVenta) || 0) - (Number(p.precioCosto) || 0));
//             const tr = document.createElement('tr');
//             tr.innerHTML = `<td>${p.nombre}</td><td>${p.categoria || '(sin categoría)'}</td><td>${p.stock}</td><td>${vendidos}</td><td>$${p.precioVenta}</td><td>$${ganancia}</td>`;
//             this.tablaBody.appendChild(tr);
//         });
//     }

//     // -----------------------
//     // Chart helpers (aplican tema si existe window.chartThemes)
//     // -----------------------
//     _registerChartRef(id, chartObj) {
//         window.allCharts = window.allCharts || [];
//         window.allCharts = window.allCharts.filter(ch => { try { return ch && ch.canvas && ch.canvas.id !== id; } catch(e) { return true; } });
//         if (chartObj) window.allCharts.push(chartObj);
//     }

//     _dibujarGraficoBarras(id, labels, data, labelDataset='') {
//         const canvas = document.getElementById(id); if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
//         const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', barColors:['#3366cc'] };
//         const bgColors = (Array.isArray(C.barColors) && C.barColors.length>0) ? labels.map((_,i)=>C.barColors[i % C.barColors.length]) : labels.map(()=> '#3366cc');
//         const chart = new Chart(ctx, {
//             type:'bar',
//             data:{ labels, datasets:[{ label: labelDataset, data, backgroundColor: bgColors, borderColor: C.border, borderWidth:1 }] },
//             options:{
//                 responsive:true,
//                 animation:{ duration:400 },
//                 scales:{ x:{ ticks:{ color:C.text }, grid:{ color:C.grid } }, y:{ ticks:{ color:C.text }, grid:{ color:C.grid } } },
//                 plugins:{ legend:{ labels:{ color:C.text } }, title:{ display:false } }
//             }
//         });
//         this._registerChartRef(id, chart);
//         if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
//         this[id] = chart;
//     }

//     _dibujarGraficoDona(id, labels, data) {
//         const canvas = document.getElementById(id); if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
//         const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', donutColors:['#3366cc','#33aa33','#ff9933'] };
//         const bg = (Array.isArray(C.donutColors) && C.donutColors.length>0) ? C.donutColors : ['#3366cc','#33aa33','#ff9933'];
//         const chart = new Chart(ctx, {
//             type:'doughnut',
//             data:{ labels, datasets:[{ data, backgroundColor: bg.slice(0, labels.length), borderColor: C.border, borderWidth:1 }] },
//             options:{ responsive:true, plugins:{ legend:{ labels:{ color:C.text } } } }
//         });
//         this._registerChartRef(id, chart);
//         if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
//         this[id] = chart;
//     }

//     exportarCSV() {
//         const productos = this.inventario.obtenerTodos();
//         let csv = 'Nombre,Categoría,Stock,Vendidos,PrecioVenta,GananciaTotal\n';
//         productos.forEach(p => { csv += `${p.nombre},${p.categoria},${p.stock},${p.vendido},${p.precioVenta},${(typeof p.calcularGananciaTotal === 'function' ? p.calcularGananciaTotal() : 0)}\n`; });
//         const blob = new Blob([csv], { type: 'text/csv' });
//         const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'estadisticas_productos.csv'; link.click();
//     }

//     exportarPDF() {
//         try {
//             if (window.jspdf && window.jspdf.jsPDF) {
//                 const { jsPDF } = window.jspdf;
//                 const doc = new jsPDF('p','pt','a4');
//                 doc.setFontSize(14);
//                 doc.text(`Estadísticas - ${this.usuario}`, 40, 40);
//                 let y = 60;
//                 const resumenEl = document.getElementById('resumenTotales');
//                 if (resumenEl) {
//                     const lines = resumenEl.innerText.split('\n').map(l => l.trim()).filter(Boolean);
//                     lines.forEach(line => { doc.text(line, 40, y); y += 16; if (y > 750) { doc.addPage(); y=40; } });
//                     y += 8;
//                 }
//                 const rows = [];
//                 const productos = this.inventario.obtenerTodos();
//                 rows.push(['Producto','Vendidos','PrecioVenta','Ganancia']);
//                 productos.forEach(p => {
//                     const vendidos = p.vendido || 0;
//                     const gan = (vendidos * ((p.precioVenta || 0) - (p.precioCosto || 0)));
//                     rows.push([String(p.nombre), String(vendidos), `$${p.precioVenta}`, `$${gan}`]);
//                 });
//                 doc.setFontSize(11);
//                 rows.forEach(r => {
//                     const txt = r.join('  |  ');
//                     doc.text(txt, 40, y);
//                     y += 14;
//                     if (y > 750) { doc.addPage(); y = 40; }
//                 });
//                 doc.save(`estadisticas_${this.usuario}_${new Date().toISOString().slice(0,10)}.pdf`);
//                 return;
//             }
//         } catch (e) {
//             console.warn("jsPDF no disponible o falló:", e);
//         }
//         window.print();
//     }
// }

// document.addEventListener('DOMContentLoaded', () => new VistaEstadisticas());
// export default VistaEstadisticas;


















// // poo/estadisticas.js
// // Vista / presentación de estadísticas — versión final adaptada a modelos.js

// import { Inventario, Estadisticas as EstadModel, UsuarioSesion, Producto } from './modelos.js';

// class VistaEstadisticas {
//     constructor(usuario = null) {
//         this.sesion = new UsuarioSesion();
//         if (!this.sesion.estaLogueado()) { alert('Debes iniciar sesión.'); location.href = 'login.html'; return; }
//         this.usuario = usuario || this.sesion.usuarioActivo || 'admin';
//         this.inventario = new Inventario(this.usuario);
//         this.estadisticasModel = new EstadModel(this.usuario);

//         this.resumenTotales = document.getElementById('resumenTotales');
//         this.tablaBody = document.querySelector('#tablaProductos tbody');
//         this.tablaDiasBody = document.querySelector('#tablaDias tbody');

//         window.allCharts = window.allCharts || [];

//         this.init();
//     }

//     init() {
//         const volver = document.getElementById('volverBtn'); if (volver) volver.addEventListener('click', () => location.href = 'index.html');
//         const expBtn = document.getElementById('exportarCSVBtn'); if (expBtn) expBtn.addEventListener('click', () => this.exportarCSV());
//         const pdfBtn = document.getElementById('exportarPDFBtn'); if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportarPDF());

//         const resetBtn = document.getElementById('resetEstadisticasBtn');
//         if (resetBtn) {
//             resetBtn.addEventListener('click', () => {
//                 if (!confirm("¿Seguro que querés resetear TODAS las estadísticas?")) return;
//                 const prefDiario = `registro_diario_${this.usuario}_`;
//                 const prefHist = `registro_${this.usuario}_`;
//                 Object.keys(localStorage).forEach(k => {
//                     if (k.startsWith(prefDiario) || k.startsWith(prefHist)) localStorage.removeItem(k);
//                 });
//                 alert("Estadísticas reiniciadas.");
//                 this.renderizarTodo();
//             });
//         }

//         try { this.estadisticasModel.verificarCierreAutomatico(23,59); this.estadisticasModel.programarCierreDiario(23,59); } catch(e) { console.warn(e); }

//         document.addEventListener('ventasActualizadas', () => this.renderizarTodo());

//         this.renderizarTodo();
//     }

//     obtenerDatosCompletos() {
//         const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         const registros = this.estadisticasModel.obtenerRegistros();
//         return { productos, registros };
//     }

//     _historicosAgrupadosPorFecha(registrosHistoricos) {
//         const porFecha = {};

//         registrosHistoricos.forEach(r => {
//             const partes = (r.clave || '').split('_');
//             const fechaParte = partes[2] || null;
//             if (!fechaParte) return;
//             const datosArr = Array.isArray(r.datos) ? r.datos : [];
//             if (!porFecha[fechaParte]) {
//                 porFecha[fechaParte] = { fecha: fechaParte, clave: r.clave, datos: JSON.parse(JSON.stringify(datosArr)) };
//             } else {
//                 porFecha[fechaParte].datos = porFecha[fechaParte].datos.concat(JSON.parse(JSON.stringify(datosArr)));
//                 if (r.clave > porFecha[fechaParte].clave) porFecha[fechaParte].clave = r.clave;
//             }
//         });

//         const arr = Object.keys(porFecha).sort().map(fecha => {
//             const raw = porFecha[fecha].datos || [];
//             const mapProd = {};
//             raw.forEach(p => {
//                 const key = String(p.id || p.nombre);
//                 mapProd[key] = mapProd[key] || {
//                     id: p.id,
//                     nombre: p.nombre,
//                     categoria: p.categoria,
//                     precioVenta: Number(p.precioVenta || 0),
//                     precioCosto: Number(p.precioCosto || 0),
//                     vendido: 0,
//                     ingreso: 0,
//                     gananciaDia: 0,
//                     stockInicial: p.stockInicial || null,
//                     stockFinal: p.stockFinal || null
//                 };
//                 mapProd[key].vendido += Number(p.vendido || 0);
//                 mapProd[key].ingreso += Number(p.ingreso || 0);
//                 mapProd[key].gananciaDia += (Number(p.gananciaDia) || (Number(p.vendido || 0) * (mapProd[key].precioVenta - mapProd[key].precioCosto)));
//                 if ((typeof p.stockInicial !== 'undefined') && p.stockInicial !== null) mapProd[key].stockInicial = p.stockInicial;
//                 if ((typeof p.stockFinal !== 'undefined') && p.stockFinal !== null) mapProd[key].stockFinal = p.stockFinal;
//             });

//             return { fecha, clave: porFecha[fecha].clave, datos: Object.values(mapProd) };
//         });

//         return arr;
//     }

//     _calcularVentaEsperadaHoyCombinada(registroHoy, productosInventario) {
//         let ventaEsperada = 0;
//         const mapRegistro = {};
//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 const pv = Number(p.precioVenta || 0);
//                 const stockFinal = (typeof p.stockFinal !== 'undefined' && p.stockFinal !== null) ? Number(p.stockFinal) : null;
//                 if (stockFinal !== null) {
//                     mapRegistro[String(p.id)] = true;
//                     ventaEsperada += stockFinal * pv;
//                 } else if (typeof p.stockInicial !== 'undefined' && p.stockInicial !== null) {
//                     mapRegistro[String(p.id)] = true;
//                     const pendiente = Math.max(0, Number(p.stockInicial || 0) - Number(p.vendidosHoy || 0));
//                     ventaEsperada += pendiente * pv;
//                 } else {
//                     mapRegistro[String(p.id)] = true;
//                 }
//             });
//         }

//         productosInventario.forEach(prod => {
//             if (!mapRegistro[String(prod.id)]) {
//                 const stock = Number(prod.stock || 0);
//                 const pv = Number(prod.precioVenta || 0);
//                 ventaEsperada += stock * pv;
//             }
//         });

//         return ventaEsperada;
//     }

//     renderizarTodo() {
//         const { productos, registros } = this.obtenerDatosCompletos();

//         const registroHoy = this.estadisticasModel.obtenerRegistroDiario();
//         const totalesDiaRaw = this.estadisticasModel.calcularTotalesDelDia() || {};
//         const ventaEsperadaHoyCombinada = this._calcularVentaEsperadaHoyCombinada(registroHoy, productos);

//         const historicosOrdenadosPorFecha = this._historicosAgrupadosPorFecha(registros);

//         const porMes = {};
//         historicosOrdenadosPorFecha.forEach(h => {
//             const mes = (h.fecha || '').slice(0,7);
//             if (!mes) return;
//             porMes[mes] = porMes[mes] || [];
//             porMes[mes].push(h);
//         });
//         const mesActual = (new Date()).toISOString().slice(0,7);
//         const registrosDelMes = porMes[mesActual] || [];

//         const totalesMes = this._calcularTotalesParaRegistros(registrosDelMes, productos);

//         if (this.resumenTotales) {
//             this.resumenTotales.innerHTML = `
//                 <p><strong>Costo total (hoy):</strong> $${(totalesDiaRaw.costoVendido || 0)}</p>
//                 <p><strong>Venta esperada (hoy):</strong> $${ventaEsperadaHoyCombinada || 0}</p>
//                 <p><strong>Ingreso real (hoy):</strong> $${(totalesDiaRaw.ingresoReal || 0)}</p>
//                 <p><strong>Ganancia real (hoy):</strong> $${(totalesDiaRaw.gananciaReal || 0)}</p>
//                 <hr>
//                 <p><strong>Ingreso acumulado (mes):</strong> $${totalesMes.ingreso || 0}</p>
//                 <p><strong>Ganancia acumulada (mes):</strong> $${totalesMes.ganancia || 0}</p>
//                 <p><strong>Costo vendido (mes):</strong> $${totalesMes.costoVendido || 0}</p>
//                 <p><strong>Venta esperada (mes):</strong> $${totalesMes.ventaEsperada || 0}</p>
//             `;
//         }

//         const acumuladoPorProducto = this._calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);

//         const topEntries = Object.entries(acumuladoPorProducto).sort((a,b)=>b[1]-a[1]).slice(0,10);
//         const topLabels = topEntries.map(e=>e[0]);
//         const topValues = topEntries.map(e=>e[1]);
//         this._dibujarGraficoBarras('chartTopProductos', topLabels, topValues, 'Unidades vendidas');

//         const categoriasMap = this._calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);
//         const catLabels = Object.keys(categoriasMap);
//         const catValues = Object.values(categoriasMap);
//         this._dibujarGraficoDona('chartCategorias', catLabels, catValues);

//         const ingresoHoy = totalesDiaRaw.ingresoReal || 0;
//         this._dibujarGraficoDona('chartIngresos', ['Ingreso real (hoy)','Venta esperada (hoy)'], [ingresoHoy, ventaEsperadaHoyCombinada || 0]);

//         const promedios = this.estadisticasModel.calcularPromedios() || {};
//         this._dibujarGraficoBarras('chartPromedios', Object.keys(promedios), Object.values(promedios), 'Promedios');

//         if (registroHoy) {
//             const labels = ['Mañana','Tarde'];
//             const values = [registroHoy.turnos.mañana.ganancia || 0, registroHoy.turnos.tarde.ganancia || 0];
//             this._dibujarGraficoBarras('chartDia', labels, values, 'Ganancia por turno');
//         }

//         this._llenarTabla(productos, acumuladoPorProducto);

//         this._llenarTablaDiasDelMes(registrosDelMes);
//         this._dibujarVentasYGananciasPorDia(registrosDelMes);
//     }

//     _calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
//         const acumulado = {};
//         historicosOrdenadosPorFecha.forEach(h => {
//             (h.datos || []).forEach(p => {
//                 acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendido || 0);
//             });
//         });

//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendidosHoy || 0);
//             });
//         }

//         return acumulado;
//     }

//     _calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
//         const map = {};
//         historicosOrdenadosPorFecha.forEach(h => {
//             (h.datos || []).forEach(p => {
//                 map[p.categoria] = (map[p.categoria] || 0) + (p.vendido || 0);
//             });
//         });
//         if (registroHoy && registroHoy.productos) {
//             Object.values(registroHoy.productos).forEach(p => {
//                 map[p.categoria] = (map[p.categoria] || 0) + (p.vendidosHoy || 0);
//             });
//         }
//         return map;
//     }

//     _calcularTotalesParaRegistros(registrosDelMes, productosInventario = []) {
//         const totales = { ingreso:0, ganancia:0, costoVendido:0, ventaEsperada:0 };

//         registrosDelMes.forEach(r => {
//             const reg = r.datos;
//             if (!reg) return;
//             (reg || []).forEach(p => {
//                 const vendidos = Number(p.vendido || 0);
//                 const pv = Number(p.precioVenta || 0);
//                 const pc = Number(p.precioCosto || 0);
//                 totales.ingreso += vendidos * pv;
//                 totales.ganancia += Number(p.gananciaDia || 0) || (vendidos * ((pv || 0) - (pc || 0)));
//                 totales.costoVendido += vendidos * pc;
//             });
//         });

//         const inventarioActual = productosInventario.length ? productosInventario : this.inventario.obtenerTodos();
//         totales.ventaEsperada = inventarioActual.reduce((acc,p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

//         return totales;
//     }

//     _dibujarVentasYGananciasPorDia(registrosDelMes) {
//         const dias = [], ventas = [], ganancias = [];
//         registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
//         registrosDelMes.forEach(r => {
//             const regArray = r.datos || [];
//             let ingreso = 0, ganancia = 0;
//             regArray.forEach(p => { ingreso += Number(p.ingreso || (p.vendido * (p.precioVenta || 0)) || 0); ganancia += Number(p.gananciaDia || (p.vendido * ((p.precioVenta||0)-(p.precioCosto||0))) || 0); });
//             dias.push(r.fecha);
//             ventas.push(ingreso);
//             ganancias.push(ganancia);
//         });

//         this._dibujarGraficoBarras('chartVentasPorDia', dias, ventas, 'Ingreso por día');
//         this._dibujarGraficoBarras('chartGananciasPorDia', dias, ganancias, 'Ganancias por día');
//     }

//     _llenarTablaDiasDelMes(registrosDelMes) {
//         if (!this.tablaDiasBody) return;
//         this.tablaDiasBody.innerHTML = '';
//         registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
//         registrosDelMes.forEach(r => {
//             const regArray = r.datos || [];
//             let ingreso = 0, ganancia = 0, costoVendido = 0;
//             regArray.forEach(p => {
//                 const vendidos = Number(p.vendido || 0);
//                 ingreso += vendidos * Number(p.precioVenta || 0);
//                 ganancia += Number(p.gananciaDia || 0) || (vendidos * ((Number(p.precioVenta||0) - Number(p.precioCosto||0))));
//                 costoVendido += vendidos * Number(p.precioCosto || 0);
//             });
//             const tr = document.createElement('tr');
//             tr.innerHTML = `<td>${r.fecha}</td><td>$${ingreso}</td><td>$${ganancia}</td><td>$${costoVendido}</td>`;
//             this.tablaDiasBody.appendChild(tr);
//         });
//     }

//     _llenarTabla(productos, acumulado) {
//         if (!this.tablaBody) return;
//         this.tablaBody.innerHTML = '';
//         productos.forEach(p => {
//             const vendidos = acumulado[p.nombre] || 0;
//             const ganancia = vendidos * ((Number(p.precioVenta) || 0) - (Number(p.precioCosto) || 0));
//             const tr = document.createElement('tr');
//             tr.innerHTML = `<td>${p.nombre}</td><td>${p.categoria || '(sin categoría)'}</td><td>${p.stock}</td><td>${vendidos}</td><td>$${p.precioVenta}</td><td>$${ganancia}</td>`;
//             this.tablaBody.appendChild(tr);
//         });
//     }

//     _registerChartRef(id, chartObj) {
//         window.allCharts = window.allCharts || [];
//         window.allCharts = window.allCharts.filter(ch => { try { return ch && ch.canvas && ch.canvas.id !== id; } catch(e) { return true; } });
//         if (chartObj) window.allCharts.push(chartObj);
//     }

//     _dibujarGraficoBarras(id, labels, data, labelDataset='') {
//         const canvas = document.getElementById(id); if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
//         const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', barColors:['#3366cc'] };
//         const bgColors = (Array.isArray(C.barColors) && C.barColors.length>0) ? labels.map((_,i)=>C.barColors[i % C.barColors.length]) : labels.map(()=> '#3366cc');
//         const chart = new Chart(ctx, {
//             type:'bar',
//             data:{ labels, datasets:[{ label: labelDataset, data, backgroundColor: bgColors, borderColor: C.border, borderWidth:1 }] },
//             options:{
//                 responsive:true,
//                 animation:{ duration:400 },
//                 scales:{ x:{ ticks:{ color:C.text }, grid:{ color:C.grid } }, y:{ ticks:{ color:C.text }, grid:{ color:C.grid } } },
//                 plugins:{ legend:{ labels:{ color:C.text } }, title:{ display:false } }
//             }
//         });
//         this._registerChartRef(id, chart);
//         if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
//         this[id] = chart;
//     }

//     _dibujarGraficoDona(id, labels, data) {
//         const canvas = document.getElementById(id); if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
//         const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', donutColors:['#3366cc','#33aa33','#ff9933'] };
//         const bg = (Array.isArray(C.donutColors) && C.donutColors.length>0) ? C.donutColors : ['#3366cc','#33aa33','#ff9933'];
//         const chart = new Chart(ctx, {
//             type:'doughnut',
//             data:{ labels, datasets:[{ data, backgroundColor: bg.slice(0, labels.length), borderColor: C.border, borderWidth:1 }] },
//             options:{ responsive:true, plugins:{ legend:{ labels:{ color:C.text } } } }
//         });
//         this._registerChartRef(id, chart);
//         if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
//         this[id] = chart;
//     }

//     exportarCSV() {
//         const productos = this.inventario.obtenerTodos();
//         let csv = 'Nombre,Categoría,Stock,Vendidos,PrecioVenta,GananciaTotal\n';
//         productos.forEach(p => { csv += `${p.nombre},${p.categoria},${p.stock},${p.vendido},${p.precioVenta},${(typeof p.calcularGananciaTotal === 'function' ? p.calcularGananciaTotal() : 0)}\n`; });
//         const blob = new Blob([csv], { type: 'text/csv' });
//         const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'estadisticas_productos.csv'; link.click();
//     }

//     exportarPDF() {
//         try {
//             if (window.jspdf && window.jspdf.jsPDF) {
//                 const { jsPDF } = window.jspdf;
//                 const doc = new jsPDF('p','pt','a4');
//                 doc.setFontSize(14);
//                 doc.text(`Estadísticas - ${this.usuario}`, 40, 40);
//                 let y = 60;
//                 const resumenEl = document.getElementById('resumenTotales');
//                 if (resumenEl) {
//                     const lines = resumenEl.innerText.split('\n').map(l => l.trim()).filter(Boolean);
//                     lines.forEach(line => { doc.text(line, 40, y); y += 16; if (y > 750) { doc.addPage(); y=40; } });
//                     y += 8;
//                 }
//                 const rows = [];
//                 const productos = this.inventario.obtenerTodos();
//                 rows.push(['Producto','Vendidos','PrecioVenta','Ganancia']);
//                 productos.forEach(p => {
//                     const vendidos = p.vendido || 0;
//                     const gan = (vendidos * ((p.precioVenta || 0) - (p.precioCosto || 0)));
//                     rows.push([String(p.nombre), String(vendidos), `$${p.precioVenta}`, `$${gan}`]);
//                 });
//                 doc.setFontSize(11);
//                 rows.forEach(r => {
//                     const txt = r.join('  |  ');
//                     doc.text(txt, 40, y);
//                     y += 14;
//                     if (y > 750) { doc.addPage(); y = 40; }
//                 });
//                 doc.save(`estadisticas_${this.usuario}_${new Date().toISOString().slice(0,10)}.pdf`);
//                 return;
//             }
//         } catch (e) {
//             console.warn("jsPDF no disponible o falló:", e);
//         }
//         window.print();
//     }
// }

// document.addEventListener('DOMContentLoaded', () => new VistaEstadisticas());
// export default VistaEstadisticas;


















// // // ===============================
// // //  ESTADISTICAS.JS – COMPLETO
// // // ===============================

// // import { SistemaPanificados } from "./sistema.js";

// // export class EstadisticasPanificados {

// //     constructor() {
// //         this.sistema = new SistemaPanificados();

// //         this.canvasTopProductos = document.getElementById("chartTopProductos");
// //         this.canvasCategorias = document.getElementById("chartCategorias");
// //         this.canvasIngresos = document.getElementById("chartIngresos");
// //         this.canvasPromedios = document.getElementById("chartPromedios");
// //         this.canvasDia = document.getElementById("chartDia");
// //         this.canvasVentasPorDia = document.getElementById("chartVentasPorDia");
// //         this.canvasGananciasPorDia = document.getElementById("chartGananciasPorDia");

// //         this.resumenTotalesDiv = document.getElementById("resumenTotales");
// //         this.tablaBody = document.querySelector("#tablaProductos tbody");
// //         this.tablaDiasBody = document.querySelector("#tablaDias tbody");

// //         this.charts = [];
// //     }

// //     // ======================================================
// //     // Cargar estadísticas
// //     // ======================================================
// //     iniciar() {
// //         const btnVolver = document.getElementById("volverBtn");
// //         const btnCSV = document.getElementById("exportarCSVBtn");
// //         const btnPDF = document.getElementById("exportarPDFBtn");
// //         const btnReset = document.getElementById("resetEstadisticasBtn");

// //         if (btnVolver) btnVolver.onclick = () => history.back();
// //         if (btnCSV) btnCSV.onclick = () => this.exportarCSV();
// //         if (btnPDF) btnPDF.onclick = () => this.exportarPDF();
// //         if (btnReset) btnReset.onclick = () => this.resetearEstadisticas();

// //         this.renderizarTodo();
// //     }

// //     // ======================================================
// //     // Obtener datos del sistema
// //     // ======================================================
// //     obtenerDatos() {
// //         const historicos = this.sistema.historial.obtenerTodos();
// //         const registroHoy = this.sistema.registroDiario.obtenerRegistroHoy();
// //         const inventario = this.sistema.productos.obtenerTodos();

// //         return {
// //             historicos,
// //             registroHoy,
// //             inventario
// //         };
// //     }

// //     // ======================================================
// //     // Render principal
// //     // ======================================================
// //     renderizarTodo() {
// //         const { historicos, registroHoy, inventario } = this.obtenerDatos();

// //         // Agrupar históricos SUMANDO ventas del mismo día
// //         const historicosAgrupados = this._agruparHistoricosPorFecha(historicos);

// //         // Acumulado mensual (para gráficos)
// //         const acumuladoMensual = this._acumuladoDesdeHistoricos(historicosAgrupados);

// //         // Acumulado diario (para detalle por producto)
// //         const acumuladoHoy = this._acumuladoDesdeRegistroHoy(registroHoy);

// //         // Render resumen del día
// //         this._renderResumenHoy(registroHoy);

// //         // Render gráficos mensuales
// //         this._renderCharts(acumuladoMensual, historicosAgrupados);

// //         // Render tabla detalle por producto
// //         this._llenarTablaDetalle(inventario, acumuladoHoy);

// //         // Render tabla mensual por día
// //         this._llenarTablaDias(historicosAgrupados);
// //     }

// //     // ======================================================
// //     // Agrupador nuevo (CORREGIDO)
// //     // ======================================================
// //     _agruparHistoricosPorFecha(registros) {
// //         const porFecha = {};

// //         registros.forEach(r => {
// //             const partes = r.clave.split("_");
// //             const fecha = partes[2];
// //             if (!fecha) return;

// //             if (!porFecha[fecha]) porFecha[fecha] = [];

// //             if (Array.isArray(r.datos)) {
// //                 porFecha[fecha].push(...r.datos);
// //             }
// //         });

// //         // Normalizar → sumar productos repetidos
// //         const resultado = Object.keys(porFecha).sort().map(fecha => {
// //             const acumulado = {};

// //             porFecha[fecha].forEach(p => {
// //                 const key = p.nombre;

// //                 if (!acumulado[key]) {
// //                     acumulado[key] = {
// //                         nombre: p.nombre,
// //                         categoria: p.categoria,
// //                         precioCosto: Number(p.precioCosto),
// //                         precioVenta: Number(p.precioVenta),
// //                         vendido: 0,
// //                         ingreso: 0,
// //                         ganancia: 0,
// //                         costoVendido: 0
// //                     };
// //                 }

// //                 acumulado[key].vendido += Number(p.vendido || 0);
// //                 acumulado[key].ingreso += Number(p.ingreso || 0);
// //                 acumulado[key].costoVendido += Number(p.precioCosto) * Number(p.vendido || 0);
// //                 acumulado[key].ganancia +=
// //                     (Number(p.precioVenta) - Number(p.precioCosto)) * Number(p.vendido || 0);
// //             });

// //             return {
// //                 fecha,
// //                 productos: Object.values(acumulado)
// //             };
// //         });

// //         return resultado;
// //     }

// //     // ======================================================
// //     // Acumulado mensual
// //     // ======================================================
// //     _acumuladoDesdeHistoricos(historicosAgrupados) {
// //         const acumulado = {};

// //         historicosAgrupados.forEach(reg => {
// //             reg.productos.forEach(p => {
// //                 if (!acumulado[p.nombre]) acumulado[p.nombre] = 0;
// //                 acumulado[p.nombre] += Number(p.vendido || 0);
// //             });
// //         });

// //         return acumulado;
// //     }

// //     // ======================================================
// //     // Acumulado del día (solo registroHoy)
// //     // ======================================================
// //     _acumuladoDesdeRegistroHoy(registroHoy) {
// //         const acum = {};
// //         if (!registroHoy || !registroHoy.productos) return acum;

// //         Object.values(registroHoy.productos).forEach(p => {
// //             acum[p.nombre] = Number(p.vendidosHoy || 0);
// //         });

// //         return acum;
// //     }

// //     // ======================================================
// //     // Resumen del día
// //     // ======================================================
// //     _renderResumenHoy(registroHoy) {
// //         if (!registroHoy || !registroHoy.productos) {
// //             this.resumenTotalesDiv.innerHTML = "<p>No hay ventas cargadas hoy.</p>";
// //             return;
// //         }

// //         let ingreso = 0, ganancia = 0, costo = 0, vendidos = 0;

// //         Object.values(registroHoy.productos).forEach(p => {
// //             vendidos += Number(p.vendidosHoy || 0);
// //             costo += Number(p.precioCosto) * Number(p.vendidosHoy || 0);
// //             ingreso += Number(p.precioVenta) * Number(p.vendidosHoy || 0);
// //         });

// //         ganancia = ingreso - costo;

// //         this.resumenTotalesDiv.innerHTML = `
// //             <p><strong>Unidades vendidas hoy:</strong> ${vendidos}</p>
// //             <p><strong>Ingreso total hoy:</strong> $${ingreso.toFixed(2)}</p>
// //             <p><strong>Costo vendido hoy:</strong> $${costo.toFixed(2)}</p>
// //             <p><strong>Ganancia del día:</strong> $${ganancia.toFixed(2)}</p>
// //         `;
// //     }

// //     // ======================================================
// //     // TABLA DETALLE POR PRODUCTO (SOLO HOY)
// //     // ======================================================
// //     _llenarTablaDetalle(inventario, acumuladoHoy) {
// //         if (!this.tablaBody) return;

// //         this.tablaBody.innerHTML = "";

// //         inventario.forEach(p => {
// //             const vendidos = Number(acumuladoHoy[p.nombre] || 0);
// //             const ganancia = vendidos * (p.precioVenta - p.precioCosto);

// //             const tr = document.createElement("tr");

// //             tr.innerHTML = `
// //                 <td>${p.nombre}</td>
// //                 <td>${p.categoria}</td>
// //                 <td>${p.stock}</td>
// //                 <td>${vendidos}</td>
// //                 <td>$${p.precioVenta}</td>
// //                 <td>$${ganancia.toFixed(2)}</td>
// //             `;

// //             this.tablaBody.appendChild(tr);
// //         });
// //     }

// //     // ======================================================
// //     // TABLA POR DÍA DEL MES
// //     // ======================================================
// //     _llenarTablaDias(historicosAgrupados) {
// //         if (!this.tablaDiasBody) return;

// //         this.tablaDiasBody.innerHTML = "";

// //         historicosAgrupados.forEach(reg => {
// //             let ingreso = 0, costo = 0, ganancia = 0;

// //             reg.productos.forEach(p => {
// //                 ingreso += p.ingreso;
// //                 costo += p.precioCosto * p.vendido;
// //                 ganancia += p.ganancia;
// //             });

// //             const tr = document.createElement("tr");

// //             tr.innerHTML = `
// //                 <td>${reg.fecha}</td>
// //                 <td>$${ingreso.toFixed(2)}</td>
// //                 <td>$${ganancia.toFixed(2)}</td>
// //                 <td>$${costo.toFixed(2)}</td>
// //             `;

// //             this.tablaDiasBody.appendChild(tr);
// //         });
// //     }

// //     // ======================================================
// //     // GRÁFICOS
// //     // ======================================================
// //     _renderCharts(acumMensual, historicosAgrupados) {
// //         this._destruirCharts();

// //         const labels = Object.keys(acumMensual);
// //         const dataVendidos = Object.values(acumMensual);

// //         this.charts.push(new Chart(this.canvasTopProductos, {
// //             type: "bar",
// //             data: {
// //                 labels,
// //                 datasets: [{
// //                     label: "Unidades vendidas",
// //                     data: dataVendidos
// //                 }]
// //             },
// //             options: { responsive: true }
// //         }));

// //         // Ingresos por día (mensual)
// //         this._chartIngresos(historicosAgrupados);
// //         this._chartGanancias(historicosAgrupados);
// //         this._chartPromedios(acumMensual);
// //     }

// //     _chartIngresos(historicosAgrupados) {
// //         const fechas = historicosAgrupados.map(r => r.fecha);
// //         const ingresos = historicosAgrupados.map(r =>
// //             r.productos.reduce((sum, p) => sum + p.ingreso, 0)
// //         );

// //         this.charts.push(new Chart(this.canvasVentasPorDia, {
// //             type: "line",
// //             data: {
// //                 labels: fechas,
// //                 datasets: [{ label: "Ingresos", data: ingresos }]
// //             }
// //         }));
// //     }

// //     _chartGanancias(historicosAgrupados) {
// //         const fechas = historicosAgrupados.map(r => r.fecha);
// //         const ganancias = historicosAgrupados.map(r =>
// //             r.productos.reduce((sum, p) => sum + p.ganancia, 0)
// //         );

// //         this.charts.push(new Chart(this.canvasGananciasPorDia, {
// //             type: "line",
// //             data: {
// //                 labels: fechas,
// //                 datasets: [{ label: "Ganancia", data: ganancias }]
// //             }
// //         }));
// //     }

// //     _chartPromedios(acum) {
// //         const promedios = Object.keys(acum).map(k => acum[k]);

// //         this.charts.push(new Chart(this.canvasPromedios, {
// //             type: "bar",
// //             data: {
// //                 labels: Object.keys(acum),
// //                 datasets: [{ label: "Promedio", data: promedios }]
// //             }
// //         }));
// //     }

// //     _destruirCharts() {
// //         this.charts.forEach(c => c.destroy());
// //         this.charts = [];
// //     }

// //     // ================================
// //     // EXPORTACIONES
// //     // ================================
// //     exportarCSV() {
// //         alert("Exportar CSV todavía no implementado aquí.");
// //     }

// //     exportarPDF() {
// //         alert("Exportar PDF todavía no implementado aquí.");
// //     }

// //     resetearEstadisticas() {
// //         if (confirm("¿Eliminar todos los históricos?")) {
// //             this.sistema.historial.vaciar();
// //             this.renderizarTodo();
// //         }
// //     }
// // }

// // // Inicialización automática
// // document.addEventListener("DOMContentLoaded", () => {
// //     const est = new EstadisticasPanificados();
// //     est.iniciar();
// // });































// poo/estadisticas.js
// Vista / presentación de estadísticas — versión final adaptada a modelos.js + proyección de stock

import { Inventario, Estadisticas as EstadModel, UsuarioSesion, Producto } from './modelos.js';

class VistaEstadisticas {
    constructor(usuario = null) {
        this.sesion = new UsuarioSesion();
        if (!this.sesion.estaLogueado()) { alert('Debes iniciar sesión.'); location.href = 'login.html'; return; }
        this.usuario = usuario || this.sesion.usuarioActivo || 'admin';
        this.inventario = new Inventario(this.usuario);
        this.estadisticasModel = new EstadModel(this.usuario);

        this.resumenTotales = document.getElementById('resumenTotales');
        this.tablaBody = document.querySelector('#tablaProductos tbody');
        this.tablaDiasBody = document.querySelector('#tablaDias tbody');

        window.allCharts = window.allCharts || [];

        this.init();
    }

    init() {
        const volver = document.getElementById('volverBtn'); if (volver) volver.addEventListener('click', () => location.href = 'index.html');
        const expBtn = document.getElementById('exportarCSVBtn'); if (expBtn) expBtn.addEventListener('click', () => this.exportarCSV());
        const pdfBtn = document.getElementById('exportarPDFBtn'); if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportarPDF());

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

        try { this.estadisticasModel.verificarCierreAutomatico(23,59); this.estadisticasModel.programarCierreDiario(23,59); } catch(e) { console.warn(e); }

        document.addEventListener('ventasActualizadas', () => {
            // recargar inventario y vista
            this.inventario = new Inventario(this.usuario);
            this.renderizarTodo();
        });

        this.renderizarTodo();
    }

    obtenerDatosCompletos() {
        const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
        const registros = this.estadisticasModel.obtenerRegistros();
        return { productos, registros };
    }

    _historicosAgrupadosPorFecha(registrosHistoricos) {
        const porFecha = {};

        registrosHistoricos.forEach(r => {
            const partes = (r.clave || '').split('_');
            const fechaParte = partes[2] || null;
            if (!fechaParte) return;
            const datosArr = Array.isArray(r.datos) ? r.datos : [];
            if (!porFecha[fechaParte]) {
                porFecha[fechaParte] = { fecha: fechaParte, clave: r.clave, datos: JSON.parse(JSON.stringify(datosArr)) };
            } else {
                porFecha[fechaParte].datos = porFecha[fechaParte].datos.concat(JSON.parse(JSON.stringify(datosArr)));
                if (r.clave > porFecha[fechaParte].clave) porFecha[fechaParte].clave = r.clave;
            }
        });

        const arr = Object.keys(porFecha).sort().map(fecha => {
            const raw = porFecha[fecha].datos || [];
            const mapProd = {};
            raw.forEach(p => {
                const key = String(p.id || p.nombre);
                mapProd[key] = mapProd[key] || {
                    id: p.id,
                    nombre: p.nombre,
                    categoria: p.categoria,
                    precioVenta: Number(p.precioVenta || 0),
                    precioCosto: Number(p.precioCosto || 0),
                    vendido: 0,
                    ingreso: 0,
                    gananciaDia: 0,
                    stockInicial: p.stockInicial || null,
                    stockFinal: p.stockFinal || null
                };
                mapProd[key].vendido += Number(p.vendido || 0);
                mapProd[key].ingreso += Number(p.ingreso || 0);
                mapProd[key].gananciaDia += (Number(p.gananciaDia) || (Number(p.vendido || 0) * (mapProd[key].precioVenta - mapProd[key].precioCosto)));
                if ((typeof p.stockInicial !== 'undefined') && p.stockInicial !== null) mapProd[key].stockInicial = p.stockInicial;
                if ((typeof p.stockFinal !== 'undefined') && p.stockFinal !== null) mapProd[key].stockFinal = p.stockFinal;
            });

            return { fecha, clave: porFecha[fecha].clave, datos: Object.values(mapProd) };
        });

        return arr;
    }

    _calcularVentaEsperadaHoyCombinada(registroHoy, productosInventario) {
        let ventaEsperada = 0;
        const mapRegistro = {};
        if (registroHoy && registroHoy.productos) {
            Object.values(registroHoy.productos).forEach(p => {
                const pv = Number(p.precioVenta || 0);
                const stockFinal = (typeof p.stockFinal !== 'undefined' && p.stockFinal !== null) ? Number(p.stockFinal) : null;
                if (stockFinal !== null) {
                    mapRegistro[String(p.id)] = true;
                    ventaEsperada += stockFinal * pv;
                } else if (typeof p.stockInicial !== 'undefined' && p.stockInicial !== null) {
                    mapRegistro[String(p.id)] = true;
                    const pendiente = Math.max(0, Number(p.stockInicial || 0) - Number(p.vendidosHoy || 0));
                    ventaEsperada += pendiente * pv;
                } else {
                    mapRegistro[String(p.id)] = true;
                }
            });
        }

        productosInventario.forEach(prod => {
            if (!mapRegistro[String(prod.id)]) {
                const stock = Number(prod.stock || 0);
                const pv = Number(prod.precioVenta || 0);
                ventaEsperada += stock * pv;
            }
        });

        return ventaEsperada;
    }

    renderizarTodo() {
        const { productos, registros } = this.obtenerDatosCompletos();

        const registroHoy = this.estadisticasModel.obtenerRegistroDiario();
        const totalesDiaRaw = this.estadisticasModel.calcularTotalesDelDia() || {};
        const ventaEsperadaHoyCombinada = this._calcularVentaEsperadaHoyCombinada(registroHoy, productos);

        const historicosOrdenadosPorFecha = this._historicosAgrupadosPorFecha(registros);

        const porMes = {};
        historicosOrdenadosPorFecha.forEach(h => {
            const mes = (h.fecha || '').slice(0,7);
            if (!mes) return;
            porMes[mes] = porMes[mes] || [];
            porMes[mes].push(h);
        });
        const mesActual = (new Date()).toISOString().slice(0,7);
        const registrosDelMes = porMes[mesActual] || [];

        const totalesMes = this._calcularTotalesParaRegistros(registrosDelMes, productos);

        if (this.resumenTotales) {
            this.resumenTotales.innerHTML = `
                <p><strong>Costo total (hoy):</strong> $${(totalesDiaRaw.costoVendido || 0)}</p>
                <p><strong>Venta esperada (hoy):</strong> $${ventaEsperadaHoyCombinada || 0}</p>
                <p><strong>Ingreso real (hoy):</strong> $${(totalesDiaRaw.ingresoReal || 0)}</p>
                <p><strong>Ganancia real (hoy):</strong> $${(totalesDiaRaw.gananciaReal || 0)}</p>
                <hr>
                <p><strong>Ingreso acumulado (mes):</strong> $${totalesMes.ingreso || 0}</p>
                <p><strong>Ganancia acumulada (mes):</strong> $${totalesMes.ganancia || 0}</p>
                <p><strong>Costo vendido (mes):</strong> $${totalesMes.costoVendido || 0}</p>
                <p><strong>Venta esperada (mes):</strong> $${totalesMes.ventaEsperada || 0}</p>
            `;
        }

        const acumuladoPorProducto = this._calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);

        const topEntries = Object.entries(acumuladoPorProducto).sort((a,b)=>b[1]-a[1]).slice(0,10);
        const topLabels = topEntries.map(e=>e[0]);
        const topValues = topEntries.map(e=>e[1]);
        this._dibujarGraficoBarras('chartTopProductos', topLabels, topValues, 'Unidades vendidas');

        const categoriasMap = this._calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy);
        const catLabels = Object.keys(categoriasMap);
        const catValues = Object.values(categoriasMap);
        this._dibujarGraficoDona('chartCategorias', catLabels, catValues);

        const ingresoHoy = totalesDiaRaw.ingresoReal || 0;
        this._dibujarGraficoDona('chartIngresos', ['Ingreso real (hoy)','Venta esperada (hoy)'], [ingresoHoy, ventaEsperadaHoyCombinada || 0]);

        const promedios = this.estadisticasModel.calcularPromedios() || {};
        this._dibujarGraficoBarras('chartPromedios', Object.keys(promedios), Object.values(promedios), 'Promedios');

        if (registroHoy) {
            const labels = ['Mañana','Tarde'];
            const values = [registroHoy.turnos.mañana.ganancia || 0, registroHoy.turnos.tarde.ganancia || 0];
            this._dibujarGraficoBarras('chartDia', labels, values, 'Ganancia por turno');
        }

        this._llenarTabla(productos, acumuladoPorProducto);

        this._llenarTablaDiasDelMes(registrosDelMes);
        this._dibujarVentasYGananciasPorDia(registrosDelMes);

        // Proyección de días restantes usando promedios diarios
        this._renderizarProyeccionStock(promedios, productos);
    }

    _calcularAcumuladoPorProductoDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
        const acumulado = {};
        historicosOrdenadosPorFecha.forEach(h => {
            (h.datos || []).forEach(p => {
                acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendido || 0);
            });
        });

        if (registroHoy && registroHoy.productos) {
            Object.values(registroHoy.productos).forEach(p => {
                acumulado[p.nombre] = (acumulado[p.nombre] || 0) + (p.vendidosHoy || 0);
            });
        }

        return acumulado;
    }

    _calcularVentasPorCategoriaDesdeHistoricos(historicosOrdenadosPorFecha, registroHoy) {
        const map = {};
        historicosOrdenadosPorFecha.forEach(h => {
            (h.datos || []).forEach(p => {
                map[p.categoria] = (map[p.categoria] || 0) + (p.vendido || 0);
            });
        });
        if (registroHoy && registroHoy.productos) {
            Object.values(registroHoy.productos).forEach(p => {
                map[p.categoria] = (map[p.categoria] || 0) + (p.vendidosHoy || 0);
            });
        }
        return map;
    }

    _calcularTotalesParaRegistros(registrosDelMes, productosInventario = []) {
        const totales = { ingreso:0, ganancia:0, costoVendido:0, ventaEsperada:0 };

        registrosDelMes.forEach(r => {
            const reg = r.datos;
            if (!reg) return;
            (reg || []).forEach(p => {
                const vendidos = Number(p.vendido || 0);
                const pv = Number(p.precioVenta || 0);
                const pc = Number(p.precioCosto || 0);
                totales.ingreso += vendidos * pv;
                totales.ganancia += Number(p.gananciaDia || 0) || (vendidos * ((pv || 0) - (pc || 0)));
                totales.costoVendido += vendidos * pc;
            });
        });

        const inventarioActual = productosInventario.length ? productosInventario : this.inventario.obtenerTodos();
        totales.ventaEsperada = inventarioActual.reduce((acc,p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

        return totales;
    }

    _dibujarVentasYGananciasPorDia(registrosDelMes) {
        const dias = [], ventas = [], ganancias = [];
        registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
        registrosDelMes.forEach(r => {
            const regArray = r.datos || [];
            let ingreso = 0, ganancia = 0;
            regArray.forEach(p => { ingreso += Number(p.ingreso || (p.vendido * (p.precioVenta || 0)) || 0); ganancia += Number(p.gananciaDia || (p.vendido * ((p.precioVenta||0)-(p.precioCosto||0))) || 0); });
            dias.push(r.fecha);
            ventas.push(ingreso);
            ganancias.push(ganancia);
        });

        this._dibujarGraficoBarras('chartVentasPorDia', dias, ventas, 'Ingreso por día');
        this._dibujarGraficoBarras('chartGananciasPorDia', dias, ganancias, 'Ganancias por día');
    }

    _llenarTablaDiasDelMes(registrosDelMes) {
        if (!this.tablaDiasBody) return;
        this.tablaDiasBody.innerHTML = '';
        registrosDelMes.sort((a,b)=>a.fecha.localeCompare(b.fecha));
        registrosDelMes.forEach(r => {
            const regArray = r.datos || [];
            let ingreso = 0, ganancia = 0, costoVendido = 0;
            regArray.forEach(p => {
                const vendidos = Number(p.vendido || 0);
                ingreso += vendidos * Number(p.precioVenta || 0);
                ganancia += Number(p.gananciaDia || 0) || (vendidos * ((Number(p.precioVenta||0) - Number(p.precioCosto||0))));
                costoVendido += vendidos * Number(p.precioCosto || 0);
            });
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.fecha}</td><td>$${ingreso}</td><td>$${ganancia}</td><td>$${costoVendido}</td>`;
            this.tablaDiasBody.appendChild(tr);
        });
    }

    _llenarTabla(productos, acumulado) {
        if (!this.tablaBody) return;
        this.tablaBody.innerHTML = '';
        productos.forEach(p => {
            const vendidos = acumulado[p.nombre] || 0;
            const ganancia = vendidos * ((Number(p.precioVenta) || 0) - (Number(p.precioCosto) || 0));
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${p.nombre}</td><td>${p.categoria || '(sin categoría)'}</td><td>${p.stock}</td><td>${vendidos}</td><td>$${p.precioVenta}</td><td>$${ganancia}</td>`;
            this.tablaBody.appendChild(tr);
        });
    }

    _renderizarProyeccionStock(promedios, productos) {
        // crear contenedor si no existe
        let cont = document.getElementById("proyeccionStockContainer");
        if (!cont) {
            cont = document.createElement("div");
            cont.id = "proyeccionStockContainer";
            const resumen = document.getElementById("resumenSection") || document.querySelector("main");
            if (resumen) resumen.insertAdjacentElement('afterend', cont);
        }

        cont.innerHTML = `<h2>Proyección de días restantes por producto</h2>`;
        const list = document.createElement("div");
        list.style.display = "grid";
        list.style.gridTemplateColumns = "repeat(auto-fit,minmax(200px,1fr))";
        list.style.gap = "8px";

        productos.forEach(p => {
            const promedio = promedios[p.nombre] || 0; // promedio ventas por día
            const stock = Number(p.stock || 0);
            let dias = null;
            if (promedio <= 0) dias = Infinity;
            else dias = Number((stock / promedio).toFixed(2));
            const card = document.createElement("div");
            card.style.padding = "8px";
            card.style.borderRadius = "6px";
            card.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            card.innerHTML = `<strong>${p.nombre}</strong><div>Stock actual: ${stock}</div><div>Promedio diario: ${promedio}</div><div>Días restantes: ${dias === Infinity ? '∞ (sin ventas históricas)' : dias}</div>`;
            list.appendChild(card);
        });

        cont.appendChild(list);
    }

    // -----------------------
    // Chart helpers (aplican tema si existe window.chartThemes)
    // -----------------------
    _registerChartRef(id, chartObj) {
        window.allCharts = window.allCharts || [];
        window.allCharts = window.allCharts.filter(ch => { try { return ch && ch.canvas && ch.canvas.id !== id; } catch(e) { return true; } });
        if (chartObj) window.allCharts.push(chartObj);
    }

    _dibujarGraficoBarras(id, labels, data, labelDataset='') {
        const canvas = document.getElementById(id); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
        const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', barColors:['#3366cc'] };
        const bgColors = (Array.isArray(C.barColors) && C.barColors.length>0) ? labels.map((_,i)=>C.barColors[i % C.barColors.length]) : labels.map(()=> '#3366cc');
        const chart = new Chart(ctx, {
            type:'bar',
            data:{ labels, datasets:[{ label: labelDataset, data, backgroundColor: bgColors, borderColor: C.border, borderWidth:1 }] },
            options:{
                responsive:true,
                animation:{ duration:400 },
                scales:{ x:{ ticks:{ color:C.text }, grid:{ color:C.grid } }, y:{ ticks:{ color:C.text }, grid:{ color:C.grid } } },
                plugins:{ legend:{ labels:{ color:C.text } }, title:{ display:false } }
            }
        });
        this._registerChartRef(id, chart);
        if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
        this[id] = chart;
    }

    _dibujarGraficoDona(id, labels, data) {
        const canvas = document.getElementById(id); if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (this[id]) { try { this[id].destroy(); } catch(e) {} this[id] = null; }
        const C = (window.chartThemes && typeof window.chartThemes.getColors === 'function') ? window.chartThemes.getColors() : { text:'#222', grid:'rgba(0,0,0,0.15)', border:'#444', donutColors:['#3366cc','#33aa33','#ff9933'] };
        const bg = (Array.isArray(C.donutColors) && C.donutColors.length>0) ? C.donutColors : ['#3366cc','#33aa33','#ff9933'];
        const chart = new Chart(ctx, {
            type:'doughnut',
            data:{ labels, datasets:[{ data, backgroundColor: bg.slice(0, labels.length), borderColor: C.border, borderWidth:1 }] },
            options:{ responsive:true, plugins:{ legend:{ labels:{ color:C.text } } } }
        });
        this._registerChartRef(id, chart);
        if (window.chartThemes && typeof window.chartThemes.applyToChart === 'function') window.chartThemes.applyToChart(chart);
        this[id] = chart;
    }

    exportarCSV() {
        const productos = this.inventario.obtenerTodos();
        let csv = 'Nombre,Categoría,Stock,Vendidos,PrecioVenta,GananciaTotal\n';
        productos.forEach(p => { csv += `${p.nombre},${p.categoria},${p.stock},${p.vendido},${p.precioVenta},${(typeof p.calcularGananciaTotal === 'function' ? p.calcularGananciaTotal() : 0)}\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'estadisticas_productos.csv'; link.click();
    }

    exportarPDF() {
        try {
            if (window.jspdf && window.jspdf.jsPDF) {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p','pt','a4');
                doc.setFontSize(14);
                doc.text(`Estadísticas - ${this.usuario}`, 40, 40);
                let y = 60;
                const resumenEl = document.getElementById('resumenTotales');
                if (resumenEl) {
                    const lines = resumenEl.innerText.split('\n').map(l => l.trim()).filter(Boolean);
                    lines.forEach(line => { doc.text(line, 40, y); y += 16; if (y > 750) { doc.addPage(); y=40; } });
                    y += 8;
                }
                const rows = [];
                const productos = this.inventario.obtenerTodos();
                rows.push(['Producto','Vendidos','PrecioVenta','Ganancia']);
                productos.forEach(p => {
                    const vendidos = p.vendido || 0;
                    const gan = (vendidos * ((p.precioVenta || 0) - (p.precioCosto || 0)));
                    rows.push([String(p.nombre), String(vendidos), `$${p.precioVenta}`, `$${gan}`]);
                });
                doc.setFontSize(11);
                rows.forEach(r => {
                    const txt = r.join('  |  ');
                    doc.text(txt, 40, y);
                    y += 14;
                    if (y > 750) { doc.addPage(); y = 40; }
                });
                doc.save(`estadisticas_${this.usuario}_${new Date().toISOString().slice(0,10)}.pdf`);
                return;
            }
        } catch (e) {
            console.warn("jsPDF no disponible o falló:", e);
        }
        window.print();
    }
}

document.addEventListener('DOMContentLoaded', () => new VistaEstadisticas());
export default VistaEstadisticas;
