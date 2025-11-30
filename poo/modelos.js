// // poo/modelos.js
// // Modelos principales: Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador/Importador
// // Comentarios incluidos para facilidad de mantenimiento.

// /* ======================================================================
//    PRODUCTO
//    ====================================================================== */
// export class Producto {
//     constructor(id, nombre, categoria, precioCosto, precioVenta, stockInicial, stock, vendido = 0) {
//         this.id = id;
//         this.nombre = nombre;
//         this.categoria = categoria || "";
//         this.precioCosto = Number(precioCosto) || 0;
//         this.precioVenta = Number(precioVenta) || 0;
//         this.stockInicial = (typeof stockInicial === 'number') ? stockInicial : (typeof stock === 'number' ? stock : 0);
//         this.stock = (typeof stock === 'number') ? stock : (this.stockInicial || 0);
//         this.vendido = Number(vendido) || 0;
//     }

//     calcularGananciaUnidad() {
//         return (this.precioVenta || 0) - (this.precioCosto || 0);
//     }

//     calcularGananciaTotal() {
//         return (this.vendido || 0) * this.calcularGananciaUnidad();
//     }

//     calcularIngresoEsperado() {
//         return (this.stock || 0) * (this.precioVenta || 0);
//     }

//     disminuirStock() {
//         if ((this.stock || 0) <= 0) return false;
//         this.stock = (this.stock || 0) - 1;
//         this.vendido = (this.vendido || 0) + 1;
//         return true;
//     }

//     aumentarStock(cantidad) {
//         cantidad = Number(cantidad) || 0;
//         this.stock = (this.stock || 0) + cantidad;
//         this.stockInicial = (this.stockInicial || 0) + cantidad;
//     }

//     registrarVenta() {
//         return this.disminuirStock();
//     }

//     devolverVenta() {
//         if ((this.vendido || 0) <= 0) return false;
//         this.vendido--;
//         this.stock++;
//         return true;
//     }

//     reiniciarVendidos() {
//         this.vendido = 0;
//     }
// }

// /* ======================================================================
//    INVENTARIO
//    ====================================================================== */
// export class Inventario {
//     constructor(usuarioActivo) {
//         this.clave = `productos_${usuarioActivo}`;
//         this.productos = this.cargar();
//     }

//     cargar() {
//         const guardados = JSON.parse(localStorage.getItem(this.clave)) || [];
//         return guardados.map(p => Object.assign(new Producto(), p));
//     }

//     guardar() {
//         localStorage.setItem(this.clave, JSON.stringify(this.productos));
//     }

//     obtenerTodos() {
//         return this.productos;
//     }

//     buscarPorId(id) {
//         return this.productos.find(p => p.id === id);
//     }

//     agregarProducto(producto) {
//         this.productos.push(producto);
//         this.guardar();
//     }

//     eliminarProducto(id) {
//         this.productos = this.productos.filter(p => p.id !== id);
//         this.guardar();
//     }

//     registrarVenta(id) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.registrarVenta()) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     devolverVenta(id) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.devolverVenta()) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     sumarStock(id, cantidad) {
//         const prod = this.buscarPorId(id);
//         if (!prod) return false;
//         prod.aumentarStock(cantidad);
//         this.guardar();
//         return true;
//     }

//     calcularTotales() {
//         let costoTotal = 0;
//         let ventaEsperada = 0;
//         let ingresoReal = 0;
//         let gananciaReal = 0;

//         this.productos.forEach(p => {
//             costoTotal += (p.stockInicial || 0) * (p.precioCosto || 0);
//             // venta esperada = stock actual por precio de venta (lo que queda por vender)
//             ventaEsperada += (p.stock || 0) * (p.precioVenta || 0);
//             ingresoReal += (p.vendido || 0) * (p.precioVenta || 0);
//             gananciaReal += (p.vendido || 0) * ((p.precioVenta || 0) - (p.precioCosto || 0));
//         });

//         return { costoTotal, ventaEsperada, ingresoReal, gananciaReal };
//     }
// }

// /* ======================================================================
//    USUARIO / SESIÓN
//    ====================================================================== */
// export class UsuarioSesion {
//     constructor() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         this._claveUltimaActividad = "ultimaActividad";
//         this._monitorId = null;
//         this._listenersAct = [];
//     }

//     login(usuario, password) {
//         const usuariosValidos = {
//             "admin": "1234",
//             "vendedor": "1234",
//             "cristian": "1234",
//             "karen": "1234",
//             "estela": "1234",
//             "juan": "1234"
//         };
//         if (usuariosValidos[usuario] === password) {
//             localStorage.setItem("usuarioActivo", usuario);
//             localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//             this.usuarioActivo = usuario;
//             return true;
//         }
//         return false;
//     }

//     cerrarSesion() {
//         this.detenerMonitor();
//         localStorage.removeItem("usuarioActivo");
//         localStorage.removeItem(this._claveUltimaActividad);
//         location.href = "login.html";
//     }

//     estaLogueado() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         return this.usuarioActivo !== null;
//     }

//     registrarActividad() {
//         localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//     }

//     obtenerUltimaActividad() {
//         const v = localStorage.getItem(this._claveUltimaActividad);
//         return v ? parseInt(v, 10) : null;
//     }

//     iniciarMonitor(inactividadMinutos = 15, onExpirar = null) {
//         if (this._monitorId) return;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct = ["click", "keydown", "mousemove", "touchstart"];
//         this._listenersAct.forEach(ev => window.addEventListener(ev, actualizar));
//         const intervalo = 15000;
//         const timeout = inactividadMinutos * 60000;
//         this._monitorId = setInterval(() => {
//             const ultima = this.obtenerUltimaActividad();
//             if (!ultima) {
//                 this.registrarActividad();
//                 return;
//             }
//             if (Date.now() - ultima > timeout) {
//                 this.detenerMonitor();
//                 localStorage.removeItem("usuarioActivo");
//                 localStorage.removeItem(this._claveUltimaActividad);
//                 if (onExpirar) onExpirar();
//                 else { alert("Sesión expirada por inactividad."); location.href = "login.html"; }
//             }
//         }, intervalo);
//     }

//     detenerMonitor() {
//         if (this._monitorId) clearInterval(this._monitorId);
//         this._monitorId = null;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct.forEach(ev => window.removeEventListener(ev, actualizar));
//         this._listenersAct = [];
//     }
// }

// /* ======================================================================
//    TURNOS
//    ====================================================================== */
// export class Turnos {
//     constructor(usuario) {
//         this.clave = `turnos_${usuario}`;
//         this.default = {
//             mañana: { inicio: "06:00", fin: "14:00" },
//             tarde: { inicio: "15:00", fin: "23:00" }
//         };
//         this.config = JSON.parse(localStorage.getItem(this.clave)) || this.default;
//     }

//     guardar() {
//         localStorage.setItem(this.clave, JSON.stringify(this.config));
//     }

//     obtenerTurnoActual() {
//         const ahora = new Date();
//         const hora = ahora.getHours() + ahora.getMinutes() / 60;
//         const m = this.config.mañana;
//         const t = this.config.tarde;
//         const parseHora = (str) => {
//             if (!str) return 0;
//             const parts = String(str).split(":");
//             return parseInt(parts[0] || 0, 10) + (parseInt(parts[1] || 0, 10) / 60);
//         };
//         const hM1 = parseHora(m.inicio);
//         const hM2 = parseHora(m.fin);
//         const hT1 = parseHora(t.inicio);
//         const hT2 = parseHora(t.fin);
//         if (hora >= hM1 && hora <= hM2) return "mañana";
//         if (hora >= hT1 && hora <= hT2) return "tarde";
//         return "fuera";
//     }
// }

// /* ======================================================================
//    ESTADISTICAS: manejo de registro_diario_... y registro_... (históricos)
//    - registro_diario_<usuario>_YYYY-MM-DD  => objeto diario (turnos + productos)
//    - registro_<usuario>_YYYY-MM-DD_HHMMSS   => array histórico (productos con vendido, ingreso, ganancia)
//    ====================================================================== */
// export class Estadisticas {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.prefijoDiario = `registro_diario_${this.usuario}_`;
//         this._claveUltimaFechaCierre = `ultima_fecha_cierre_${this.usuario}`;
//         this._cierreTimer = null;
//     }

//     _fechaHoyStr(date = null) {
//         const fecha = date ? new Date(date) : new Date();
//         const yyyy = fecha.getFullYear();
//         const mm = String(fecha.getMonth() + 1).padStart(2, "0");
//         const dd = String(fecha.getDate()).padStart(2, "0");
//         return `${yyyy}-${mm}-${dd}`;
//     }

//     obtenerRegistroDiario(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         return JSON.parse(localStorage.getItem(clave)) || null;
//     }

//     _crearRegistroDiarioBase(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         return {
//             fecha,
//             turnos: { mañana: { venta: 0, ganancia: 0 }, tarde: { venta: 0, ganancia: 0 } },
//             productos: {}
//         };
//     }

//     guardarRegistroDiario(registro, fechaStr) {
//         const fecha = fechaStr || registro.fecha || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         localStorage.setItem(clave, JSON.stringify(registro));
//     }

//     actualizarVentaEnDiario(productoInfo, turno = "mañana") {
//         const fecha = this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         let registro = JSON.parse(localStorage.getItem(clave));
//         if (!registro) registro = this._crearRegistroDiarioBase(fecha);

//         const t = (turno === "tarde") ? "tarde" : "mañana";
//         const cantidad = Number(productoInfo.cantidad) || 0;
//         const ganancia = Number(productoInfo.ganancia) || 0;
//         const precioVenta = Number(productoInfo.precioVenta || 0);
//         const precioCosto = Number(productoInfo.precioCosto || 0);

//         // actualizar turno
//         registro.turnos[t].venta = (registro.turnos[t].venta || 0) + cantidad;
//         registro.turnos[t].ganancia = (registro.turnos[t].ganancia || 0) + ganancia;
//         if (registro.turnos[t].venta < 0) registro.turnos[t].venta = 0;
//         if (registro.turnos[t].ganancia < 0) registro.turnos[t].ganancia = 0;

//         // producto
//         const pid = String(productoInfo.id);
//         registro.productos[pid] = registro.productos[pid] || {
//             id: productoInfo.id,
//             nombre: productoInfo.nombre,
//             categoria: productoInfo.categoria || "",
//             stockInicial: (typeof productoInfo.stockInicial !== 'undefined') ? Number(productoInfo.stockInicial) : null,
//             stockFinal: (typeof productoInfo.stockFinal !== 'undefined') ? Number(productoInfo.stockFinal) : null,
//             vendidosHoy: 0,
//             gananciaHoy: 0,
//             precioVenta: precioVenta || 0,
//             precioCosto: precioCosto || 0,
//             ingreso: 0
//         };

//         if (typeof productoInfo.stockInicial !== "undefined" && registro.productos[pid].stockInicial === null) {
//             registro.productos[pid].stockInicial = Number(productoInfo.stockInicial);
//         }
//         if (typeof productoInfo.stockFinal !== "undefined") {
//             registro.productos[pid].stockFinal = Number(productoInfo.stockFinal);
//         }

//         registro.productos[pid].vendidosHoy = (registro.productos[pid].vendidosHoy || 0) + cantidad;
//         registro.productos[pid].gananciaHoy = (registro.productos[pid].gananciaHoy || 0) + ganancia;
//         if (registro.productos[pid].vendidosHoy < 0) registro.productos[pid].vendidosHoy = 0;
//         if (registro.productos[pid].gananciaHoy < 0) registro.productos[pid].gananciaHoy = 0;

//         const pv = Number(registro.productos[pid].precioVenta) || 0;
//         registro.productos[pid].ingreso = registro.productos[pid].vendidosHoy * pv;

//         this.guardarRegistroDiario(registro, fecha);
//     }

//     // CIERRE: mueve registro_diario_{fecha} -> registro_{fecha}_{hhmmss} (histórico, array de productos)
//     cerrarDia(fechaStr = null) {
//         try {
//             const fechaACerrar = fechaStr || this._fechaHoyStr();
//             const claveDiario = this.prefijoDiario + fechaACerrar;
//             const registro = JSON.parse(localStorage.getItem(claveDiario));
//             // si no existe, marcamos la fecha como cerrada para evitar reintentos
//             if (!registro) {
//                 localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//                 return true;
//             }

//             const ahora = new Date();
//             const hh = String(ahora.getHours()).padStart(2, "0");
//             const mm = String(ahora.getMinutes()).padStart(2, "0");
//             const ss = String(ahora.getSeconds()).padStart(2, "0");
//             const claveHist = `registro_${this.usuario}_${fechaACerrar}_${hh}${mm}${ss}`;

//             const historialProductos = Object.values(registro.productos || {}).map(p => ({
//                 id: p.id,
//                 nombre: p.nombre,
//                 categoria: p.categoria,
//                 stockInicial: (typeof p.stockInicial !== 'undefined') ? p.stockInicial : null,
//                 stockFinal: (typeof p.stockFinal !== 'undefined') ? p.stockFinal : null,
//                 vendido: Number(p.vendidosHoy || 0),
//                 precioVenta: Number(p.precioVenta || 0),
//                 precioCosto: Number(p.precioCosto || 0),
//                 gananciaDia: Number(p.gananciaHoy || 0),
//                 ingreso: Number(p.ingreso || 0)
//             }));

//             localStorage.setItem(claveHist, JSON.stringify(historialProductos));

//             // reiniciar registro diario (preparar "hoy" vacío)
//             const nuevaFecha = this._fechaHoyStr();
//             const nuevoRegistro = this._crearRegistroDiarioBase(nuevaFecha);
//             this.guardarRegistroDiario(nuevoRegistro, nuevaFecha);

//             localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//             return true;
//         } catch (e) {
//             console.error("Error cerrando día:", e);
//             return false;
//         }
//     }

//     // cerrarDia() {
//     //     const fechaHoy = this._fechaHoyStr();
//     //     const registro = this.obtenerRegistroDiario();
//     //     if (!registro) return;

//     //     // 1. Crear copia para histórico
//     //     const productosHoy = Object.values(registro.productos || {}).map(p => ({
//     //         id: p.id,
//     //         nombre: p.nombre,
//     //         categoria: p.categoria,
//     //         precioCosto: p.precioCosto,
//     //         precioVenta: p.precioVenta,
//     //         stockInicial: p.stockInicial,
//     //         stockFinal: p.stockFinal,
//     //         vendido: p.vendidosHoy,
//     //         ingreso: p.ingreso,
//     //         ganancia: p.gananciaHoy
//     //     }));

//     //     // 2. Guardar histórico
//     //     const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
//     //     localStorage.setItem(
//     //         `registro_${this.usuario}_${fechaHoy}_${timestamp}`,
//     //         JSON.stringify(productosHoy)
//     //     );

//     //     // 3. Eliminar registro diario
//     //     localStorage.removeItem(`registro_diario_${this.usuario}_${fechaHoy}`);

//     //     // 4. RESETEAR PRODUCTOS DEL INVENTARIO (lo que pediste)
//     //     const productos = this.cargarProductosD();
//     //     Object.values(productos).forEach(p => {
//     //         p.vendido = 0;       // se borra la venta del día anterior
//     //         p.gananciaTotal = 0; // se borra la ganancia acumulada del día anterior
//     //     });
//     //     this._guardarProductos(productos);

//     //     // 5. Actualizar última fecha de cierre
//     //     localStorage.setItem(`ultima_fecha_cierre_${this.usuario}`, fechaHoy);
//     // }

//     // cerrarDia() {
//     //     const fechaHoy = this._fechaHoyStr();
//     //     const registro = this.obtenerRegistroDiario();
//     //     if (!registro) return;

//     //     // 1. Crear copia para histórico
//     //     const productosHoy = Object.values(registro.productos || {}).map(p => ({
//     //         id: p.id,
//     //         nombre: p.nombre,
//     //         categoria: p.categoria,
//     //         precioCosto: p.precioCosto,
//     //         precioVenta: p.precioVenta,
//     //         stockInicial: p.stockInicial,
//     //         stockFinal: p.stockFinal,
//     //         vendido: p.vendidosHoy,
//     //         ingreso: p.ingreso,
//     //         ganancia: p.gananciaHoy
//     //     }));

//     //     // 2. Guardar histórico
//     //     const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
//     //     localStorage.setItem(
//     //         `registro_${this.usuario}_${fechaHoy}_${timestamp}`,
//     //         JSON.stringify(productosHoy)
//     //     );

//     //     // 3. Eliminar registro diario
//     //     localStorage.removeItem(`registro_diario_${this.usuario}_${fechaHoy}`);

//     //     // 4. RESETEAR PRODUCTOS DEL INVENTARIO (versión correcta)
//     //     const productos = this.cargarProductosD();
//     //     Object.values(productos).forEach(p => {
//     //         p.vendido = 0;
//     //         p.gananciaTotal = 0;
//     //     });
//     //     this._guardarProductos(productos);

//     //     // 5. Actualizar última fecha de cierre
//     //     localStorage.setItem(`ultima_fecha_cierre_${this.usuario}`, fechaHoy);
//     // }

//     // cerrarDia() {
//     //     const fechaHoy = this._fechaHoyStr();
//     //     const registro = this.obtenerRegistroDiario();
//     //     if (!registro) return;

//     //     // 1. Crear copia para histórico
//     //     const productosHoy = Object.values(registro.productos || {}).map(p => ({
//     //         id: p.id,
//     //         nombre: p.nombre,
//     //         categoria: p.categoria,
//     //         precioCosto: p.precioCosto,
//     //         precioVenta: p.precioVenta,
//     //         stockInicial: p.stockInicial,
//     //         stockFinal: p.stockFinal,
//     //         vendido: p.vendidosHoy,
//     //         ingreso: p.ingreso,
//     //         ganancia: p.gananciaHoy
//     //     }));

//     //     // 2. Guardar histórico
//     //     const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
//     //     localStorage.setItem(
//     //         `registro_${this.usuario}_${fechaHoy}_${timestamp}`,
//     //         JSON.stringify(productosHoy)
//     //     );

//     //     // 3. Borrar registro diario
//     //     localStorage.removeItem(`registro_diario_${this.usuario}_${fechaHoy}`);

//     //     // 4. RESETEAR PRODUCTOS (versión correcta definitiva)
//     //     const productos = this.sistema.cargarProductosD();
//     //     Object.values(productos).forEach(p => {
//     //         p.vendido = 0;
//     //         p.gananciaTotal = 0;
//     //     });
//     //     this.sistema._guardarProductos(productos);

//     //     // 5. Actualizar última fecha de cierre
//     //     localStorage.setItem(`ultima_fecha_cierre_${this.usuario}`, fechaHoy);
//     // }




//     resetearEstadisticasDiarias() {
//         const hoy = this._fechaHoyStr();
//         const clave = this.prefijoDiario + hoy;
//         const nuevo = this._crearRegistroDiarioBase(hoy);
//         this.guardarRegistroDiario(nuevo, hoy);
//     }

//     verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
//             const hoy = this._fechaHoyStr();
//             if (ultima === hoy) return; // ya se cerró hoy
//             const now = new Date();
//             const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
//             let fechaACerrar;
//             if (pasadaHora) fechaACerrar = hoy;
//             else {
//                 const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//                 fechaACerrar = this._fechaHoyStr(ayer);
//             }
//             this.cerrarDia(fechaACerrar);
//         } catch (e) {
//             console.error("Error en verificarCierreAutomatico:", e);
//         }
//     }

//     programarCierreDiario(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             if (this._cierreTimer) { clearTimeout(this._cierreTimer); this._cierreTimer = null; }
//             const now = new Date();
//             const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
//             if (target <= now) target.setDate(target.getDate() + 1);
//             const waitMs = target.getTime() - now.getTime();
//             this._cierreTimer = setTimeout(() => {
//                 const fechaCierre = this._fechaHoyStr();
//                 this.cerrarDia(fechaCierre);
//                 this.programarCierreDiario(cutoffHour, cutoffMinute);
//             }, waitMs);
//         } catch (e) {
//             console.error("Error programando cierre diario:", e);
//         }
//     }



//     obtenerRegistros() {
//         // Devuelve SOLO los históricos (los archivos guardados por cierre)
//         // Formato esperado de clave histórica: registro_<usuario>_YYYY-MM-DD_HHMMSS (o con guiones en hora: hh-mm-ss)
//         const pref = `registro_${this.usuario}_`;
//         const registros = [];

//         for (let i = 0; i < localStorage.length; i++) {
//             const clave = localStorage.key(i);

//             if (!clave || !clave.startsWith(pref)) continue;

//             // Queremos que la clave tenga fecha Y hora (4 partes separadas por "_")
//             // Ejemplo válido: registro_juan_2025-11-28_17-18-02
//             const partes = clave.split("_");
//             if (partes.length < 4) {
//                 // no es un histórico con timestamp (p. ej. podría ser registro_diario_... o registro_usuario_fecha sin hora)
//                 continue;
//             }

//             // Tomamos sólo las claves que incluyen fecha + hora (seguridad extra con regex)
//             const fechaParte = partes[2] || "";
//             const horaParte = partes[3] || "";
//             const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaParte);
//             const horaValida = /^\d{2}-\d{2}-\d{2}$/.test(horaParte) || /^\d{6}$/.test(horaParte);

//             if (!fechaValida || !horaValida) continue;

//             try {
//                 const datos = JSON.parse(localStorage.getItem(clave));
//                 registros.push({ clave, datos });
//             } catch (e) {
//                 // si no parsea, lo ignoramos
//                 console.warn("No se pudo parsear histórico:", clave, e);
//             }
//         }

//         // ordenar cronológicamente por clave (opcional, pero útil)
//         registros.sort((a, b) => a.clave.localeCompare(b.clave));

//         return registros;
//     }

//     calcularPromedios() {
//         const registrosHistoricos = this.obtenerRegistros();
//         const registroDiario = this.obtenerRegistroDiario();
//         const hoy = new Date().toISOString().slice(0, 10);

//         // Acá guardaremos todos los acumulados
//         const acumulador = {};
//         let diasValidos = new Set();

//         // 🔹 1. Procesar SOLO días anteriores al actual
//         registrosHistoricos.forEach(reg => {
//             if (!reg.fecha || reg.fecha === hoy) return; // ignorar registros duplicados del mismo día

//             diasValidos.add(reg.fecha);

//             reg.datos.forEach(prod => {
//                 if (!acumulador[prod.nombre]) {
//                     acumulador[prod.nombre] = { total: 0 };
//                 }
//                 acumulador[prod.nombre].total += (prod.vendido || 0);
//             });
//         });

//         // 🔹 2. Sumar ventas de HOY si hay ventas reales
//         if (registroDiario && registroDiario.productos) {
//             const productosHoy = Object.values(registroDiario.productos);

//             const hayVentas = productosHoy.some(p => p.vendidosHoy > 0);

//             if (hayVentas) {
//                 diasValidos.add(hoy);
//                 productosHoy.forEach(prod => {
//                     if (!acumulador[prod.nombre]) {
//                         acumulador[prod.nombre] = { total: 0 };
//                     }
//                     acumulador[prod.nombre].total += (prod.vendidosHoy || 0);
//                 });
//             }
//         }

//         const dias = diasValidos.size || 1;

//         // 🔹 3. Calcular promedios finales
//         const resultado = {};
//         Object.keys(acumulador).forEach(nombre => {
//             resultado[nombre] = Number((acumulador[nombre].total / dias).toFixed(2));
//         });

//         return resultado;
//     }


//     // calcularTotalesDelDia() {
//     //     const registro = this.obtenerRegistroDiario();
//     //     if (!registro) return { costoVendido: 0, ventaEsperadaDelDia: 0, ingresoReal: 0, gananciaReal: 0, registro: null };
//     //     let ingresoReal = 0, gananciaReal = 0, costoVendido = 0, ventaEsperadaDelDia = 0;
//     //     Object.values(registro.productos || {}).forEach(prod => {
//     //         const vendidos = Number(prod.vendidosHoy || 0);
//     //         const pv = Number(prod.precioVenta || 0);
//     //         const pc = Number(prod.precioCosto || 0);
//     //         ingresoReal += vendidos * pv;
//     //         gananciaReal += Number(prod.gananciaHoy || 0);
//     //         costoVendido += vendidos * pc;
//     //         // venta esperada basada en stockFinal o stockInicial-vendidosHoy
//     //         const stockFinal = (typeof prod.stockFinal !== 'undefined' && prod.stockFinal !== null) ? Number(prod.stockFinal) : null;
//     //         if (stockFinal !== null) {
//     //             ventaEsperadaDelDia += stockFinal * pv;
//     //         } else if (typeof prod.stockInicial !== 'undefined' && prod.stockInicial !== null) {
//     //             const pendiente = Math.max(0, Number(prod.stockInicial || 0) - Number(prod.vendidosHoy || 0));
//     //             ventaEsperadaDelDia += pendiente * pv;
//     //         }
//     //     });
//     //     const ventaTotal = (Number(registro.turnos.mañana.venta) || 0) + (Number(registro.turnos.tarde.venta) || 0);
//     //     return { costoVendido, ventaEsperadaDelDia, ingresoReal, gananciaReal, ventaTotal, registro };
//     // }

//     // calcularTotalesDelDia() {
//     //     const registro = this.obtenerRegistroDiario();
//     //     const inventario = this._cargarProductos(); // ← SE AGREGA ESTO

//     //     // Si no hay registro diario todavía → devolver venta esperada igual
//     //     const ventaEsperadaDelDia = Object.values(inventario).reduce(
//     //         (acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.precioVenta) || 0)),
//     //         0
//     //     );

//     //     if (!registro) {
//     //         return {
//     //             costoVendido: 0,
//     //             ventaEsperadaDelDia,
//     //             ingresoReal: 0,
//     //             gananciaReal: 0,
//     //             ventaTotal: 0,
//     //             registro: null
//     //         };
//     //     }

//     //     let ingresoReal = 0;
//     //     let gananciaReal = 0;
//     //     let costoVendido = 0;

//     //     // Totales basados en lo realmente vendido
//     //     Object.values(registro.productos || {}).forEach(prod => {
//     //         const vendidos = Number(prod.vendidosHoy || 0);
//     //         const pv = Number(prod.precioVenta || 0);
//     //         const pc = Number(prod.precioCosto || 0);

//     //         ingresoReal += vendidos * pv;
//     //         gananciaReal += Number(prod.gananciaHoy || 0);
//     //         costoVendido += vendidos * pc;
//     //     });

//     //     const ventaTotal = 
//     //         (Number(registro.turnos.mañana.venta) || 0) + 
//     //         (Number(registro.turnos.tarde.venta) || 0);

//     //     return {
//     //         costoVendido,
//     //         ventaEsperadaDelDia, // ← SIEMPRE DESDE INVENTARIO
//     //         ingresoReal,
//     //         gananciaReal,
//     //         ventaTotal,
//     //         registro
//     //     };
//     // }

//     calcularTotalesDelDia() {
//         const registro = this.obtenerRegistroDiario();

//         // Si no hay registro diario → devolvemos todo en 0
//         if (!registro) {
//             return {
//                 costoVendido: 0,
//                 ventaEsperadaDelDia: 0,
//                 ingresoReal: 0,
//                 gananciaReal: 0,
//                 ventaTotal: 0,
//                 registro: null
//             };
//         }

//         // Si HAY registro diario pero NO HAY productos → día vacío
//         if (!registro.productos || Object.keys(registro.productos).length === 0) {
//             return {
//                 costoVendido: 0,
//                 ventaEsperadaDelDia: 0,
//                 ingresoReal: 0,
//                 gananciaReal: 0,
//                 ventaTotal: 0,
//                 registro
//             };
//         }

//         let ingresoReal = 0;
//         let gananciaReal = 0;
//         let costoVendido = 0;
//         let ventaEsperadaDelDia = 0;

//         Object.values(registro.productos).forEach(prod => {
//             const vendidos = Number(prod.vendidosHoy || 0);
//             const pv = Number(prod.precioVenta || 0);
//             const pc = Number(prod.precioCosto || 0);

//             ingresoReal += vendidos * pv;
//             gananciaReal += Number(prod.gananciaHoy || 0);
//             costoVendido += vendidos * pc;

//             // Venta esperada = stockFinal * pv (si existe)
//             // Si no existe, se calcula con stockInicial - vendidosHoy
//             const stockFinal = 
//                 (typeof prod.stockFinal !== 'undefined' && prod.stockFinal !== null) 
//                 ? Number(prod.stockFinal)
//                 : null;

//             if (stockFinal !== null) {
//                 ventaEsperadaDelDia += stockFinal * pv;
//             } else if (typeof prod.stockInicial !== 'undefined' && prod.stockInicial !== null) {
//                 const restante = Math.max(0, Number(prod.stockInicial || 0) - vendidos);
//                 ventaEsperadaDelDia += restante * pv;
//             }
//         });

//         const ventaTotal =
//             (Number(registro.turnos.mañana.venta) || 0) +
//             (Number(registro.turnos.tarde.venta) || 0);

//         return {
//             costoVendido,
//             ventaEsperadaDelDia,
//             ingresoReal,
//             gananciaReal,
//             ventaTotal,
//             registro
//         };
//     }


// }

// /* ======================================================================
//    EXPORTADOR / IMPORTADOR
//    ====================================================================== */
// export class Exportador {
//     static exportarCSV(productos) {
//         let csv = "Nombre,Categoría,Stock,Precio Costo,Precio Venta,Vendidos\n";
//         productos.forEach(p => {
//             csv += `${p.nombre},${p.categoria},${p.stock},${p.precioCosto},${p.precioVenta},${p.vendido}\n`;
//         });
//         return csv;
//     }

//     static descargarArchivo(contenido, nombre, tipo) {
//         const blob = new Blob([contenido], { type: tipo });
//         const link = document.createElement("a");
//         link.href = URL.createObjectURL(blob);
//         link.download = nombre;
//         link.click();
//     }
// }

// export class Importador {
//     static parsearCSV(csv) {
//         const lineas = csv.split("\n").map(l => l.trim()).filter(l => l.length > 0);
//         const productos = [];
//         if (lineas.length < 2) return productos;
//         const encabezados = lineas[0].split(",").map(h => h.trim().toLowerCase());
//         for (let i = 1; i < lineas.length; i++) {
//             const valores = lineas[i].split(",").map(v => v.trim());
//             const prodData = {};
//             encabezados.forEach((enc, idx) => { prodData[enc] = valores[idx] || ""; });
//             const producto = new Producto(
//                 Date.now() + i,
//                 prodData["nombre"] || "Producto",
//                 prodData["categoría"] || "",
//                 parseFloat(prodData["precio costo"]) || 0,
//                 parseFloat(prodData["precio venta"]) || 0,
//                 parseInt(prodData["stock"], 10) || 0,
//                 parseInt(prodData["stock"], 10) || 0,
//                 parseInt(prodData["vendidos"], 10) || 0
//             );
//             productos.push(producto);
//         }
//         return productos;
//     }
// }























// // poo/modelos.js
// // Modelos principales: Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador

// /* ===========================================================
//    PRODUCTO
//    =========================================================== */
// export class Producto {
//     constructor(id, nombre, categoria, precioCosto, precioVenta, stockInicial, stock, vendido = 0) {
//         this.id = id;
//         this.nombre = nombre;
//         this.categoria = categoria || "";
//         this.precioCosto = Number(precioCosto) || 0;
//         this.precioVenta = Number(precioVenta) || 0;
//         // si se provee stockInicial se usa, sino se toma stock
//         this.stockInicial = (typeof stockInicial === 'number') ? stockInicial : (typeof stock === 'number' ? stock : 0);
//         this.stock = (typeof stock === 'number') ? stock : (this.stockInicial || 0);
//         this.vendido = Number(vendido) || 0;
//     }

//     calcularGananciaUnidad() {
//         return (this.precioVenta || 0) - (this.precioCosto || 0);
//     }

//     calcularGananciaTotal() {
//         return (this.vendido || 0) * this.calcularGananciaUnidad();
//     }

//     calcularIngresoEsperado() {
//         return (this.stock || 0) * (this.precioVenta || 0);
//     }

//     disminuirStock(cantidad = 1) {
//         cantidad = Number(cantidad) || 1;
//         if ((this.stock || 0) < cantidad) return false;
//         this.stock = (this.stock || 0) - cantidad;
//         this.vendido = (this.vendido || 0) + cantidad;
//         return true;
//     }

//     aumentarStock(cantidad) {
//         cantidad = Number(cantidad) || 0;
//         this.stock = (this.stock || 0) + cantidad;
//         this.stockInicial = (this.stockInicial || 0) + cantidad;
//     }

//     registrarVenta(cantidad = 1) {
//         return this.disminuirStock(cantidad);
//     }

//     devolverVenta(cantidad = 1) {
//         cantidad = Number(cantidad) || 1;
//         if ((this.vendido || 0) < cantidad) return false;
//         this.vendido -= cantidad;
//         this.stock += cantidad;
//         return true;
//     }

//     reiniciarVendidos() {
//         this.vendido = 0;
//     }
// }

// /* ===========================================================
//    INVENTARIO
//    =========================================================== */
// export class Inventario {
//     constructor(usuarioActivo) {
//         this.clave = `productos_${usuarioActivo}`;
//         this.productos = this.cargar();
//     }

//     cargar() {
//         try {
//             const guardados = JSON.parse(localStorage.getItem(this.clave)) || [];
//             // devolver instancias Producto
//             return guardados.map(p => Object.assign(new Producto(), p));
//         } catch (e) {
//             console.warn("Error leyendo inventario:", e);
//             return [];
//         }
//     }

//     guardar() {
//         try {
//             localStorage.setItem(this.clave, JSON.stringify(this.productos));
//         } catch (e) {
//             console.error("No se pudo guardar inventario:", e);
//         }
//     }

//     obtenerTodos() {
//         // devolver copias por seguridad
//         return this.productos.map(p => Object.assign(new Producto(), p));
//     }

//     buscarPorId(id) {
//         return this.productos.find(p => p.id === id);
//     }

//     agregarProducto(producto) {
//         this.productos.push(producto);
//         this.guardar();
//     }

//     eliminarProducto(id) {
//         this.productos = this.productos.filter(p => p.id !== id);
//         this.guardar();
//     }

//     registrarVenta(id, cantidad = 1) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.registrarVenta(cantidad)) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     devolverVenta(id, cantidad = 1) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.devolverVenta(cantidad)) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     sumarStock(id, cantidad) {
//         const prod = this.buscarPorId(id);
//         if (!prod) return false;
//         prod.aumentarStock(cantidad);
//         this.guardar();
//         return true;
//     }

//     calcularTotales() {
//         let costoTotal = 0;
//         let ventaEsperada = 0;
//         let ingresoReal = 0;
//         let gananciaReal = 0;

//         this.productos.forEach(p => {
//             costoTotal += (p.stockInicial || 0) * (p.precioCosto || 0);
//             ventaEsperada += (p.stock || 0) * (p.precioVenta || 0);
//             ingresoReal += (p.vendido || 0) * (p.precioVenta || 0);
//             gananciaReal += (p.vendido || 0) * ((p.precioVenta || 0) - (p.precioCosto || 0));
//         });

//         return { costoTotal, ventaEsperada, ingresoReal, gananciaReal };
//     }
// }

// /* ===========================================================
//    SESIÓN / USUARIO
//    =========================================================== */
// export class UsuarioSesion {
//     constructor() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         this._claveUltimaActividad = "ultimaActividad";
//         this._monitorId = null;
//         this._listenersAct = [];
//     }

//     login(usuario, password) {
//         const usuariosValidos = {
//             "admin": "1234",
//             "vendedor": "1234",
//             "cristian": "1234",
//             "karen": "1234",
//             "estela": "1234",
//             "juan": "1234"
//         };
//         if (usuariosValidos[usuario] === password) {
//             localStorage.setItem("usuarioActivo", usuario);
//             localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//             this.usuarioActivo = usuario;
//             return true;
//         }
//         return false;
//     }

//     cerrarSesion() {
//         this.detenerMonitor();
//         localStorage.removeItem("usuarioActivo");
//         localStorage.removeItem(this._claveUltimaActividad);
//         location.href = "login.html";
//     }

//     estaLogueado() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         return this.usuarioActivo !== null;
//     }

//     registrarActividad() {
//         localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//     }

//     obtenerUltimaActividad() {
//         const v = localStorage.getItem(this._claveUltimaActividad);
//         return v ? parseInt(v, 10) : null;
//     }

//     iniciarMonitor(inactividadMinutos = 15, onExpirar = null) {
//         if (this._monitorId) return;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct = ["click", "keydown", "mousemove", "touchstart"];
//         this._listenersAct.forEach(ev => window.addEventListener(ev, actualizar));
//         const intervalo = 15000;
//         const timeout = inactividadMinutos * 60000;
//         this._monitorId = setInterval(() => {
//             const ultima = this.obtenerUltimaActividad();
//             if (!ultima) {
//                 this.registrarActividad();
//                 return;
//             }
//             if (Date.now() - ultima > timeout) {
//                 this.detenerMonitor();
//                 localStorage.removeItem("usuarioActivo");
//                 localStorage.removeItem(this._claveUltimaActividad);
//                 if (onExpirar) onExpirar();
//                 else { alert("Sesión expirada por inactividad."); location.href = "login.html"; }
//             }
//         }, intervalo);
//     }

//     detenerMonitor() {
//         if (this._monitorId) clearInterval(this._monitorId);
//         this._monitorId = null;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct.forEach(ev => window.removeEventListener(ev, actualizar));
//         this._listenersAct = [];
//     }
// }

// /* ===========================================================
//    TURNOS
//    =========================================================== */
// export class Turnos {
//     constructor(usuario) {
//         this.clave = `turnos_${usuario}`;
//         this.default = {
//             mañana: { inicio: "06:00", fin: "14:00" },
//             tarde: { inicio: "15:00", fin: "23:00" }
//         };
//         this.config = JSON.parse(localStorage.getItem(this.clave)) || this.default;
//     }

//     guardar() {
//         localStorage.setItem(this.clave, JSON.stringify(this.config));
//     }

//     obtenerTurnoActual() {
//         const ahora = new Date();
//         const hora = ahora.getHours() + ahora.getMinutes() / 60;
//         const m = this.config.mañana;
//         const t = this.config.tarde;
//         const parseHora = (str) => {
//             if (!str) return 0;
//             const parts = String(str).split(":");
//             return parseInt(parts[0] || 0, 10) + (parseInt(parts[1] || 0, 10) / 60);
//         };
//         const hM1 = parseHora(m.inicio);
//         const hM2 = parseHora(m.fin);
//         const hT1 = parseHora(t.inicio);
//         const hT2 = parseHora(t.fin);
//         if (hora >= hM1 && hora <= hM2) return "mañana";
//         if (hora >= hT1 && hora <= hT2) return "tarde";
//         return "fuera";
//     }
// }

// /* ===========================================================
//    ESTADISTICAS
//    - manejo de registro_diario_... y registro_... (históricos)
//    =========================================================== */
// export class Estadisticas {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.prefijoDiario = `registro_diario_${this.usuario}_`;
//         this.prefijoHist = `registro_${this.usuario}_`;
//         this._claveUltimaFechaCierre = `ultima_fecha_cierre_${this.usuario}`;
//         this._cierreTimer = null;
//     }

//     _fechaHoyStr(date = null) {
//         const fecha = date ? new Date(date) : new Date();
//         const yyyy = fecha.getFullYear();
//         const mm = String(fecha.getMonth() + 1).padStart(2, "0");
//         const dd = String(fecha.getDate()).padStart(2, "0");
//         return `${yyyy}-${mm}-${dd}`;
//     }

//     // retorna el registro diario (obj) o null
//     obtenerRegistroDiario(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         try {
//             return JSON.parse(localStorage.getItem(clave)) || null;
//         } catch (e) {
//             console.warn("registro diario corrupto:", clave, e);
//             return null;
//         }
//     }

//     _crearRegistroDiarioBase(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         return {
//             fecha,
//             turnos: { mañana: { venta: 0, ganancia: 0 }, tarde: { venta: 0, ganancia: 0 } },
//             productos: {}
//         };
//     }

//     guardarRegistroDiario(registro, fechaStr) {
//         const fecha = fechaStr || registro.fecha || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         try {
//             localStorage.setItem(clave, JSON.stringify(registro));
//         } catch (e) {
//             console.error("No se pudo guardar registro diario:", e);
//         }
//     }

//     actualizarVentaEnDiario(productoInfo, turno = "mañana") {
//         const fecha = this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         let registro = this.obtenerRegistroDiario(fecha);
//         if (!registro) registro = this._crearRegistroDiarioBase(fecha);

//         const t = (turno === "tarde") ? "tarde" : "mañana";
//         const cantidad = Number(productoInfo.cantidad) || 0;
//         const ganancia = Number(productoInfo.ganancia) || 0;
//         const precioVenta = Number(productoInfo.precioVenta || 0);
//         const precioCosto = Number(productoInfo.precioCosto || 0);

//         registro.turnos[t].venta = (registro.turnos[t].venta || 0) + cantidad;
//         registro.turnos[t].ganancia = (registro.turnos[t].ganancia || 0) + ganancia;
//         if (registro.turnos[t].venta < 0) registro.turnos[t].venta = 0;
//         if (registro.turnos[t].ganancia < 0) registro.turnos[t].ganancia = 0;

//         const pid = String(productoInfo.id);
//         registro.productos[pid] = registro.productos[pid] || {
//             id: productoInfo.id,
//             nombre: productoInfo.nombre,
//             categoria: productoInfo.categoria || "",
//             stockInicial: (typeof productoInfo.stockInicial !== 'undefined') ? Number(productoInfo.stockInicial) : null,
//             stockFinal: (typeof productoInfo.stockFinal !== 'undefined') ? Number(productoInfo.stockFinal) : null,
//             vendidosHoy: 0,
//             gananciaHoy: 0,
//             precioVenta: precioVenta || 0,
//             precioCosto: precioCosto || 0,
//             ingreso: 0
//         };

//         if (typeof productoInfo.stockInicial !== "undefined" && registro.productos[pid].stockInicial === null) {
//             registro.productos[pid].stockInicial = Number(productoInfo.stockInicial);
//         }
//         if (typeof productoInfo.stockFinal !== "undefined") {
//             registro.productos[pid].stockFinal = Number(productoInfo.stockFinal);
//         }

//         registro.productos[pid].vendidosHoy = (registro.productos[pid].vendidosHoy || 0) + cantidad;
//         registro.productos[pid].gananciaHoy = (registro.productos[pid].gananciaHoy || 0) + ganancia;
//         if (registro.productos[pid].vendidosHoy < 0) registro.productos[pid].vendidosHoy = 0;
//         if (registro.productos[pid].gananciaHoy < 0) registro.productos[pid].gananciaHoy = 0;

//         const pv = Number(registro.productos[pid].precioVenta) || 0;
//         registro.productos[pid].ingreso = registro.productos[pid].vendidosHoy * pv;

//         this.guardarRegistroDiario(registro, fecha);
//     }

//     // Cierra día: guarda histórico y crea registro diario del día siguiente poblado con inventario actual
//     cerrarDia(fechaStr = null) {
//         try {
//             const fechaACerrar = fechaStr || this._fechaHoyStr();
//             const claveDiario = this.prefijoDiario + fechaACerrar;
//             const registro = this.obtenerRegistroDiario(fechaACerrar);

//             // Si no existe registro diario, aún así marcamos cierre (evita reintentos)
//             if (!registro) {
//                 localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//                 return true;
//             }

//             const ahora = new Date();
//             const hh = String(ahora.getHours()).padStart(2, "0");
//             const mm = String(ahora.getMinutes()).padStart(2, "0");
//             const ss = String(ahora.getSeconds()).padStart(2, "0");
//             const claveHist = `${this.prefijoHist}${fechaACerrar}_${hh}${mm}${ss}`;

//             // convertir registro.productos (obj) a array de histórico con campos estandarizados
//             const historialProductos = Object.values(registro.productos || {}).map(p => ({
//                 id: p.id,
//                 nombre: p.nombre,
//                 categoria: p.categoria,
//                 stockInicial: (typeof p.stockInicial !== 'undefined') ? p.stockInicial : null,
//                 stockFinal: (typeof p.stockFinal !== 'undefined') ? p.stockFinal : null,
//                 vendido: Number(p.vendidosHoy || 0),
//                 precioVenta: Number(p.precioVenta || 0),
//                 precioCosto: Number(p.precioCosto || 0),
//                 gananciaDia: Number(p.gananciaHoy || 0),
//                 ingreso: Number(p.ingreso || 0)
//             }));

//             try {
//                 localStorage.setItem(claveHist, JSON.stringify(historialProductos));
//             } catch (e) {
//                 console.error("No se pudo guardar histórico:", e);
//             }

//             // PREPARAR registro diario PARA LA NUEVA FECHA Y POBLARLO CON EL INVENTARIO ACTUAL
//             const nuevaFecha = this._fechaHoyStr(); // "hoy" actual (puede ser la misma fecha si cerrás en otro momento)
//             const nuevoRegistro = this._crearRegistroDiarioBase(nuevaFecha);

//             try {
//                 // Usar Inventario para inicializar los productos del nuevo registro
//                 const inventario = new Inventario(this.usuario);
//                 inventario.obtenerTodos().forEach(prod => {
//                     const pid = String(prod.id);
//                     nuevoRegistro.productos[pid] = {
//                         id: prod.id,
//                         nombre: prod.nombre,
//                         categoria: prod.categoria || "",
//                         stockInicial: Number(prod.stock || 0),
//                         stockFinal: null,
//                         vendidosHoy: 0,
//                         gananciaHoy: 0,
//                         precioVenta: Number(prod.precioVenta || 0),
//                         precioCosto: Number(prod.precioCosto || 0),
//                         ingreso: 0
//                     };
//                 });
//             } catch (e) {
//                 console.warn("No se pudo inicializar registro diario con inventario:", e);
//                 // dejamos el nuevoRegistro vacío si falla
//             }

//             this.guardarRegistroDiario(nuevoRegistro, nuevaFecha);

//             // marcar fecha de cierre
//             localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//             return true;
//         } catch (e) {
//             console.error("Error en cerrarDia:", e);
//             return false;
//         }
//     }

//     resetearEstadisticasDiarias() {
//         const hoy = this._fechaHoyStr();
//         const clave = this.prefijoDiario + hoy;
//         const nuevo = this._crearRegistroDiarioBase(hoy);
//         this.guardarRegistroDiario(nuevo, hoy);
//     }

//     verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
//             const hoy = this._fechaHoyStr();
//             if (ultima === hoy) return; // ya se cerró hoy
//             const now = new Date();
//             const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
//             let fechaACerrar;
//             if (pasadaHora) fechaACerrar = hoy;
//             else {
//                 const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//                 fechaACerrar = this._fechaHoyStr(ayer);
//             }
//             this.cerrarDia(fechaACerrar);
//         } catch (e) {
//             console.error("Error en verificarCierreAutomatico:", e);
//         }
//     }

//     programarCierreDiario(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             if (this._cierreTimer) { clearTimeout(this._cierreTimer); this._cierreTimer = null; }
//             const now = new Date();
//             const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
//             if (target <= now) target.setDate(target.getDate() + 1);
//             const waitMs = target.getTime() - now.getTime();
//             this._cierreTimer = setTimeout(() => {
//                 const fechaCierre = this._fechaHoyStr();
//                 this.cerrarDia(fechaCierre);
//                 this.programarCierreDiario(cutoffHour, cutoffMinute);
//             }, waitMs);
//         } catch (e) {
//             console.error("Error programando cierre diario:", e);
//         }
//     }

//     // Devuelve sólo los históricos guardados (registro_... con fecha+hora)
//     obtenerRegistros() {
//         const pref = this.prefijoHist; // e.g. registro_usuario_
//         const registros = [];

//         for (let i = 0; i < localStorage.length; i++) {
//             const clave = localStorage.key(i);
//             if (!clave || !clave.startsWith(pref)) continue;

//             // Queremos claves que tengan fecha + hora (al menos 4 partes con "_")
//             const partes = clave.split("_");
//             if (partes.length < 4) continue;

//             // validación simple de fecha/hora
//             const fechaParte = partes[2] || "";
//             const horaParte = partes[3] || "";
//             const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaParte);
//             const horaValida = /^\d{6}$/.test(horaParte) || /^\d{2}\d{2}\d{2}$/.test(horaParte);

//             if (!fechaValida) continue;

//             try {
//                 const datos = JSON.parse(localStorage.getItem(clave));
//                 registros.push({ clave, datos });
//             } catch (e) {
//                 console.warn("No se pudo parsear histórico:", clave, e);
//             }
//         }

//         registros.sort((a, b) => a.clave.localeCompare(b.clave));
//         return registros;
//     }

//     // Calcula promedios por producto (usa históricos y registro hoy)
//     calcularPromedios() {
//         const registrosHistoricos = this.obtenerRegistros();
//         const registroDiario = this.obtenerRegistroDiario();
//         const hoy = this._fechaHoyStr();

//         const acumulador = {};
//         const diasValidos = new Set();

//         // procesar historicos (extraer fecha de la clave)
//         registrosHistoricos.forEach(reg => {
//             // intentar extraer fecha con regex: registro_<usuario>_YYYY-MM-DD_HHMMSS
//             const partes = reg.clave.split("_");
//             const fecha = partes[2] || null;
//             if (!fecha) return;
//             diasValidos.add(fecha);
//             (reg.datos || []).forEach(prod => {
//                 acumulador[prod.nombre] = acumulador[prod.nombre] || 0;
//                 acumulador[prod.nombre] += Number(prod.vendido || 0);
//             });
//         });

//         // sumar hoy si hay ventas
//         if (registroDiario && registroDiario.productos) {
//             const productosHoy = Object.values(registroDiario.productos);
//             const hayVentas = productosHoy.some(p => Number(p.vendidosHoy || 0) > 0);
//             if (hayVentas) {
//                 diasValidos.add(hoy);
//                 productosHoy.forEach(p => {
//                     acumulador[p.nombre] = acumulador[p.nombre] || 0;
//                     acumulador[p.nombre] += Number(p.vendidosHoy || 0);
//                 });
//             }
//         }

//         const dias = diasValidos.size || 1;
//         const resultado = {};
//         Object.keys(acumulador).forEach(nombre => {
//             resultado[nombre] = Number((acumulador[nombre] / dias).toFixed(2));
//         });

//         return resultado;
//     }

//     // Totales del día (útil para mostrar en pantalla)
//     calcularTotalesDelDia() {
//         const registro = this.obtenerRegistroDiario();
//         if (!registro) return { costoVendido: 0, ingresoReal: 0, gananciaReal: 0, registro: null };

//         let ingresoReal = 0, gananciaReal = 0, costoVendido = 0;
//         Object.values(registro.productos || {}).forEach(p => {
//             const vendidos = Number(p.vendidosHoy || 0);
//             const pv = Number(p.precioVenta || 0);
//             const pc = Number(p.precioCosto || 0);
//             ingresoReal += vendidos * pv;
//             gananciaReal += Number(p.gananciaHoy || 0) || (vendidos * (pv - pc));
//             costoVendido += vendidos * pc;
//         });

//         return { costoVendido, ingresoReal, gananciaReal, registro };
//     }

//     // Vaciar históricos (usado para reset desde UI)
//     vaciarHistoricos() {
//         const pref = this.prefijoHist;
//         const keysToRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(pref)) keysToRemove.push(k);
//         }
//         keysToRemove.forEach(k => localStorage.removeItem(k));
//     }
// }

// /* ===========================================================
//    Exportador (utilidad pequeña para UI)
//    =========================================================== */
// export class Exportador {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.pref = `registro_${usuario}_`;
//     }

//     obtenerTodos() {
//         const out = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (!k || !k.startsWith(this.pref)) continue;
//             try {
//                 out.push({ clave: k, datos: JSON.parse(localStorage.getItem(k)) });
//             } catch (e) { /* ignorar */ }
//         }
//         out.sort((a,b) => a.clave.localeCompare(b.clave));
//         return out;
//     }

//     vaciar() {
//         const toRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(this.pref)) toRemove.push(k);
//         }
//         toRemove.forEach(k => localStorage.removeItem(k));
//     }
// }




















// poo/modelos.js
// Modelos principales: Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador

// /* ===========================================================
//    PRODUCTO
//    =========================================================== */
// export class Producto {
//     constructor(id, nombre, categoria, precioCosto, precioVenta, stockInicial, stock, vendido = 0) {
//         this.id = id;
//         this.nombre = nombre;
//         this.categoria = categoria || "";
//         this.precioCosto = Number(precioCosto) || 0;
//         this.precioVenta = Number(precioVenta) || 0;
//         this.stockInicial = (typeof stockInicial === 'number') ? stockInicial : (typeof stock === 'number' ? stock : 0);
//         this.stock = (typeof stock === 'number') ? stock : (this.stockInicial || 0);
//         this.vendido = Number(vendido) || 0;
//     }

//     calcularGananciaUnidad() {
//         return (this.precioVenta || 0) - (this.precioCosto || 0);
//     }

//     calcularGananciaTotal() {
//         return (this.vendido || 0) * this.calcularGananciaUnidad();
//     }

//     calcularIngresoEsperado() {
//         return (this.stock || 0) * (this.precioVenta || 0);
//     }

//     disminuirStock(cantidad = 1) {
//         cantidad = Number(cantidad) || 1;
//         if ((this.stock || 0) < cantidad) return false;
//         this.stock = (this.stock || 0) - cantidad;
//         this.vendido = (this.vendido || 0) + cantidad;
//         return true;
//     }

//     aumentarStock(cantidad) {
//         cantidad = Number(cantidad) || 0;
//         this.stock = (this.stock || 0) + cantidad;
//         this.stockInicial = (this.stockInicial || 0) + cantidad;
//     }

//     registrarVenta(cantidad = 1) {
//         return this.disminuirStock(cantidad);
//     }

//     devolverVenta(cantidad = 1) {
//         cantidad = Number(cantidad) || 1;
//         if ((this.vendido || 0) < cantidad) return false;
//         this.vendido -= cantidad;
//         this.stock += cantidad;
//         return true;
//     }

//     reiniciarVendidos() {
//         this.vendido = 0;
//     }
// }

// /* ===========================================================
//    INVENTARIO
//    =========================================================== */
// export class Inventario {
//     constructor(usuarioActivo) {
//         this.usuario = usuarioActivo;
//         this.clave = `productos_${usuarioActivo}`;
//         this.productos = this.cargar();
//     }

//     cargar() {
//         try {
//             const guardados = JSON.parse(localStorage.getItem(this.clave)) || [];
//             return guardados.map(p => Object.assign(new Producto(), p));
//         } catch (e) {
//             console.warn("Error leyendo inventario:", e);
//             return [];
//         }
//     }

//     guardar() {
//         try {
//             localStorage.setItem(this.clave, JSON.stringify(this.productos));
//         } catch (e) {
//             console.error("No se pudo guardar inventario:", e);
//         }
//     }

//     obtenerTodos() {
//         return this.productos.map(p => Object.assign(new Producto(), p));
//     }

//     buscarPorId(id) {
//         return this.productos.find(p => p.id === id);
//     }

//     agregarProducto(producto) {
//         this.productos.push(producto);
//         this.guardar();
//     }

//     eliminarProducto(id) {
//         this.productos = this.productos.filter(p => p.id !== id);
//         this.guardar();
//     }

//     registrarVenta(id, cantidad = 1) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.registrarVenta(cantidad)) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     devolverVenta(id, cantidad = 1) {
//         const prod = this.buscarPorId(id);
//         if (prod && prod.devolverVenta(cantidad)) {
//             this.guardar();
//             return true;
//         }
//         return false;
//     }

//     sumarStock(id, cantidad) {
//         const prod = this.buscarPorId(id);
//         if (!prod) return false;
//         prod.aumentarStock(cantidad);
//         this.guardar();
//         return true;
//     }

//     calcularTotales() {
//         let costoTotal = 0;
//         let ventaEsperada = 0;
//         let ingresoReal = 0;
//         let gananciaReal = 0;

//         this.productos.forEach(p => {
//             costoTotal += (p.stockInicial || 0) * (p.precioCosto || 0);
//             ventaEsperada += (p.stock || 0) * (p.precioVenta || 0);
//             ingresoReal += (p.vendido || 0) * (p.precioVenta || 0);
//             gananciaReal += (p.vendido || 0) * ((p.precioVenta || 0) - (p.precioCosto || 0));
//         });

//         return { costoTotal, ventaEsperada, ingresoReal, gananciaReal };
//     }
// }

// /* ===========================================================
//    SESIÓN / USUARIO
//    =========================================================== */
// export class UsuarioSesion {
//     constructor() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         this._claveUltimaActividad = "ultimaActividad";
//         this._monitorId = null;
//         this._listenersAct = [];
//     }

//     login(usuario, password) {
//         const usuariosValidos = {
//             "admin": "1234",
//             "vendedor": "1234",
//             "cristian": "1234",
//             "karen": "1234",
//             "estela": "1234",
//             "juan": "1234"
//         };
//         if (usuariosValidos[usuario] === password) {
//             localStorage.setItem("usuarioActivo", usuario);
//             localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//             this.usuarioActivo = usuario;
//             return true;
//         }
//         return false;
//     }

//     cerrarSesion() {
//         this.detenerMonitor();
//         localStorage.removeItem("usuarioActivo");
//         localStorage.removeItem(this._claveUltimaActividad);
//         location.href = "login.html";
//     }

//     estaLogueado() {
//         this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
//         return this.usuarioActivo !== null;
//     }

//     registrarActividad() {
//         localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
//     }

//     obtenerUltimaActividad() {
//         const v = localStorage.getItem(this._claveUltimaActividad);
//         return v ? parseInt(v, 10) : null;
//     }

//     iniciarMonitor(inactividadMinutos = 15, onExpirar = null) {
//         if (this._monitorId) return;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct = ["click", "keydown", "mousemove", "touchstart"];
//         this._listenersAct.forEach(ev => window.addEventListener(ev, actualizar));
//         const intervalo = 15000;
//         const timeout = inactividadMinutos * 60000;
//         this._monitorId = setInterval(() => {
//             const ultima = this.obtenerUltimaActividad();
//             if (!ultima) {
//                 this.registrarActividad();
//                 return;
//             }
//             if (Date.now() - ultima > timeout) {
//                 this.detenerMonitor();
//                 localStorage.removeItem("usuarioActivo");
//                 localStorage.removeItem(this._claveUltimaActividad);
//                 if (onExpirar) onExpirar();
//                 else { alert("Sesión expirada por inactividad."); location.href = "login.html"; }
//             }
//         }, intervalo);
//     }

//     detenerMonitor() {
//         if (this._monitorId) clearInterval(this._monitorId);
//         this._monitorId = null;
//         const actualizar = () => this.registrarActividad();
//         this._listenersAct.forEach(ev => window.removeEventListener(ev, actualizar));
//         this._listenersAct = [];
//     }
// }

// /* ===========================================================
//    TURNOS
//    =========================================================== */
// export class Turnos {
//     constructor(usuario) {
//         this.clave = `turnos_${usuario}`;
//         this.default = {
//             mañana: { inicio: "06:00", fin: "14:00" },
//             tarde: { inicio: "15:00", fin: "23:00" }
//         };
//         this.config = JSON.parse(localStorage.getItem(this.clave)) || this.default;
//     }

//     guardar() {
//         localStorage.setItem(this.clave, JSON.stringify(this.config));
//     }

//     obtenerTurnoActual() {
//         const ahora = new Date();
//         const hora = ahora.getHours() + ahora.getMinutes() / 60;
//         const m = this.config.mañana;
//         const t = this.config.tarde;
//         const parseHora = (str) => {
//             if (!str) return 0;
//             const parts = String(str).split(":");
//             return parseInt(parts[0] || 0, 10) + (parseInt(parts[1] || 0, 10) / 60);
//         };
//         const hM1 = parseHora(m.inicio);
//         const hM2 = parseHora(m.fin);
//         const hT1 = parseHora(t.inicio);
//         const hT2 = parseHora(t.fin);
//         if (hora >= hM1 && hora <= hM2) return "mañana";
//         if (hora >= hT1 && hora <= hT2) return "tarde";
//         return "fuera";
//     }
// }

// /* ===========================================================
//    ESTADISTICAS
//    - manejo de registro_diario_... y registro_... (históricos)
//    =========================================================== */
// export class Estadisticas {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.prefijoDiario = `registro_diario_${this.usuario}_`;
//         this.prefijoHist = `registro_${this.usuario}_`;
//         this._claveUltimaFechaCierre = `ultima_fecha_cierre_${this.usuario}`;
//         this._cierreTimer = null;
//     }

//     _fechaStrFromDate(date) {
//         const fecha = date ? new Date(date) : new Date();
//         const yyyy = fecha.getFullYear();
//         const mm = String(fecha.getMonth() + 1).padStart(2, "0");
//         const dd = String(fecha.getDate()).padStart(2, "0");
//         return `${yyyy}-${mm}-${dd}`;
//     }

//     _fechaHoyStr(date = null) {
//         return this._fechaStrFromDate(date);
//     }

//     _fechaSiguienteStr(date = null) {
//         const d = date ? new Date(date) : new Date();
//         d.setDate(d.getDate() + 1);
//         return this._fechaStrFromDate(d);
//     }

//     obtenerRegistroDiario(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         try {
//             return JSON.parse(localStorage.getItem(clave)) || null;
//         } catch (e) {
//             console.warn("registro diario corrupto:", clave, e);
//             return null;
//         }
//     }

//     _crearRegistroDiarioBase(fechaStr) {
//         const fecha = fechaStr || this._fechaHoyStr();
//         return {
//             fecha,
//             turnos: { mañana: { venta: 0, ganancia: 0 }, tarde: { venta: 0, ganancia: 0 } },
//             productos: {}
//         };
//     }

//     guardarRegistroDiario(registro, fechaStr) {
//         const fecha = fechaStr || (registro && registro.fecha) || this._fechaHoyStr();
//         const clave = this.prefijoDiario + fecha;
//         try {
//             localStorage.setItem(clave, JSON.stringify(registro));
//         } catch (e) {
//             console.error("No se pudo guardar registro diario:", e);
//         }
//     }

//     actualizarVentaEnDiario(productoInfo, turno = "mañana") {
//         const fecha = this._fechaHoyStr();
//         let registro = this.obtenerRegistroDiario(fecha);
//         if (!registro) registro = this._crearRegistroDiarioBase(fecha);

//         const t = (turno === "tarde") ? "tarde" : "mañana";
//         const cantidad = Number(productoInfo.cantidad) || 0;
//         const ganancia = Number(productoInfo.ganancia) || 0;
//         const precioVenta = Number(productoInfo.precioVenta || 0);
//         const precioCosto = Number(productoInfo.precioCosto || 0);

//         registro.turnos[t].venta = (registro.turnos[t].venta || 0) + cantidad;
//         registro.turnos[t].ganancia = (registro.turnos[t].ganancia || 0) + ganancia;
//         if (registro.turnos[t].venta < 0) registro.turnos[t].venta = 0;
//         if (registro.turnos[t].ganancia < 0) registro.turnos[t].ganancia = 0;

//         const pid = String(productoInfo.id);
//         registro.productos[pid] = registro.productos[pid] || {
//             id: productoInfo.id,
//             nombre: productoInfo.nombre,
//             categoria: productoInfo.categoria || "",
//             stockInicial: (typeof productoInfo.stockInicial !== 'undefined') ? Number(productoInfo.stockInicial) : null,
//             stockFinal: (typeof productoInfo.stockFinal !== 'undefined') ? Number(productoInfo.stockFinal) : null,
//             vendidosHoy: 0,
//             gananciaHoy: 0,
//             precioVenta: precioVenta || 0,
//             precioCosto: precioCosto || 0,
//             ingreso: 0,
//             turno: t
//         };

//         if (typeof productoInfo.stockInicial !== "undefined" && registro.productos[pid].stockInicial === null) {
//             registro.productos[pid].stockInicial = Number(productoInfo.stockInicial);
//         }
//         if (typeof productoInfo.stockFinal !== "undefined") {
//             registro.productos[pid].stockFinal = Number(productoInfo.stockFinal);
//         }

//         registro.productos[pid].vendidosHoy = (registro.productos[pid].vendidosHoy || 0) + cantidad;
//         registro.productos[pid].gananciaHoy = (registro.productos[pid].gananciaHoy || 0) + ganancia;
//         if (registro.productos[pid].vendidosHoy < 0) registro.productos[pid].vendidosHoy = 0;
//         if (registro.productos[pid].gananciaHoy < 0) registro.productos[pid].gananciaHoy = 0;

//         const pv = Number(registro.productos[pid].precioVenta) || 0;
//         registro.productos[pid].ingreso = registro.productos[pid].vendidosHoy * pv;

//         registro.productos[pid].turno = t;

//         this.guardarRegistroDiario(registro, fecha);
//     }

//     // Cierra día: guarda histórico y crea registro diario para el día SIGUIENTE poblado con inventario actual.
//     cerrarDia(fechaStr = null) {
//         try {
//             const fechaACerrar = fechaStr || this._fechaHoyStr();
//             const registro = this.obtenerRegistroDiario(fechaACerrar);

//             // Si no existe registro diario, aún así marcamos cierre (evita reintentos)
//             if (!registro) {
//                 localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//                 return true;
//             }

//             const ahora = new Date();
//             const hh = String(ahora.getHours()).padStart(2, "0");
//             const mm = String(ahora.getMinutes()).padStart(2, "0");
//             const ss = String(ahora.getSeconds()).padStart(2, "0");
//             const claveHist = `${this.prefijoHist}${fechaACerrar}_${hh}${mm}${ss}`;

//             // convertir registro.productos (obj) a array estandarizado
//             const historialProductos = Object.values(registro.productos || {}).map(p => ({
//                 id: p.id,
//                 nombre: p.nombre,
//                 categoria: p.categoria,
//                 stockInicial: (typeof p.stockInicial !== 'undefined') ? p.stockInicial : null,
//                 stockFinal: (typeof p.stockFinal !== 'undefined') ? p.stockFinal : null,
//                 vendido: Number(p.vendidosHoy || 0),
//                 precioVenta: Number(p.precioVenta || 0),
//                 precioCosto: Number(p.precioCosto || 0),
//                 gananciaDia: Number(p.gananciaHoy || 0),
//                 ingreso: Number(p.ingreso || 0),
//                 turno: p.turno || null
//             }));

//             try {
//                 localStorage.setItem(claveHist, JSON.stringify(historialProductos));
//             } catch (e) {
//                 console.error("No se pudo guardar histórico:", e);
//             }

//             // Actualizar Inventario: después del cierre del día, queremos que stockInicial refleje stock actual
//             // para que el "Costo total" del siguiente día represente lo que queda en stock.
//             try {
//                 const inv = new Inventario(this.usuario);
//                 // sincronizar productos por id: si un producto existe en inventario, ajustar stockInicial = stock
//                 inv.productos.forEach(prod => {
//                     prod.stockInicial = Number(prod.stock || 0);
//                 });
//                 inv.guardar();
//             } catch (e) {
//                 console.warn("No se pudo actualizar inventario al cerrar día:", e);
//             }

//             // PREPARAR registro diario PARA LA FECHA SIGUIENTE Y POBLARLO CON EL INVENTARIO ACTUAL
//             const nuevaFecha = this._fechaSiguienteStr(fechaACerrar);
//             const nuevoRegistro = this._crearRegistroDiarioBase(nuevaFecha);

//             try {
//                 const inventario = new Inventario(this.usuario);
//                 inventario.obtenerTodos().forEach(prod => {
//                     const pid = String(prod.id);
//                     nuevoRegistro.productos[pid] = {
//                         id: prod.id,
//                         nombre: prod.nombre,
//                         categoria: prod.categoria || "",
//                         stockInicial: Number(prod.stock || 0),
//                         stockFinal: null,
//                         vendidosHoy: 0,
//                         gananciaHoy: 0,
//                         precioVenta: Number(prod.precioVenta || 0),
//                         precioCosto: Number(prod.precioCosto || 0),
//                         ingreso: 0,
//                         turno: null
//                     };
//                 });
//             } catch (e) {
//                 console.warn("No se pudo inicializar registro diario con inventario:", e);
//             }

//             this.guardarRegistroDiario(nuevoRegistro, nuevaFecha);

//             localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
//             return true;
//         } catch (e) {
//             console.error("Error en cerrarDia:", e);
//             return false;
//         }
//     }

//     resetearEstadisticasDiarias() {
//         const hoy = this._fechaHoyStr();
//         const clave = this.prefijoDiario + hoy;
//         const nuevo = this._crearRegistroDiarioBase(hoy);
//         this.guardarRegistroDiario(nuevo, hoy);
//     }

//     verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
//             const hoy = this._fechaHoyStr();
//             if (ultima === hoy) return;
//             const now = new Date();
//             const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
//             let fechaACerrar;
//             if (pasadaHora) fechaACerrar = hoy;
//             else {
//                 const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//                 fechaACerrar = this._fechaHoyStr(ayer);
//             }
//             this.cerrarDia(fechaACerrar);
//         } catch (e) {
//             console.error("Error en verificarCierreAutomatico:", e);
//         }
//     }

//     programarCierreDiario(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             if (this._cierreTimer) { clearTimeout(this._cierreTimer); this._cierreTimer = null; }
//             const now = new Date();
//             const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
//             if (target <= now) target.setDate(target.getDate() + 1);
//             const waitMs = target.getTime() - now.getTime();
//             this._cierreTimer = setTimeout(() => {
//                 const fechaCierre = this._fechaHoyStr();
//                 this.cerrarDia(fechaCierre);
//                 this.programarCierreDiario(cutoffHour, cutoffMinute);
//             }, waitMs);
//         } catch (e) {
//             console.error("Error programando cierre diario:", e);
//         }
//     }

//     obtenerRegistros() {
//         const pref = this.prefijoHist;
//         const registros = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const clave = localStorage.key(i);
//             if (!clave || !clave.startsWith(pref)) continue;
//             const partes = clave.split("_");
//             if (partes.length < 4) continue;
//             const fechaParte = partes[2] || "";
//             if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaParte)) continue;
//             try {
//                 const datos = JSON.parse(localStorage.getItem(clave));
//                 // convertimos a formato { clave, datos } (datos puede ser array)
//                 registros.push({ clave, datos });
//             } catch (e) {
//                 console.warn("No se pudo parsear histórico:", clave, e);
//             }
//         }
//         registros.sort((a, b) => a.clave.localeCompare(b.clave));
//         return registros;
//     }

//     calcularPromedios() {
//         const registrosHistoricos = this.obtenerRegistros();
//         const registroDiario = this.obtenerRegistroDiario();
//         const hoy = this._fechaHoyStr();

//         const acumulador = {};
//         const diasValidos = new Set();

//         registrosHistoricos.forEach(reg => {
//             const partes = reg.clave.split("_");
//             const fecha = partes[2] || null;
//             if (!fecha) return;
//             diasValidos.add(fecha);
//             (reg.datos || []).forEach(prod => {
//                 acumulador[prod.nombre] = acumulador[prod.nombre] || 0;
//                 acumulador[prod.nombre] += Number(prod.vendido || 0);
//             });
//         });

//         if (registroDiario && registroDiario.productos) {
//             const productosHoy = Object.values(registroDiario.productos);
//             const hayVentas = productosHoy.some(p => Number(p.vendidosHoy || 0) > 0);
//             if (hayVentas) {
//                 diasValidos.add(hoy);
//                 productosHoy.forEach(p => {
//                     acumulador[p.nombre] = acumulador[p.nombre] || 0;
//                     acumulador[p.nombre] += Number(p.vendidosHoy || 0);
//                 });
//             }
//         }

//         const dias = diasValidos.size || 1;
//         const resultado = {};
//         Object.keys(acumulador).forEach(nombre => {
//             resultado[nombre] = Number((acumulador[nombre] / dias).toFixed(2));
//         });

//         return resultado;
//     }

//     calcularTotalesDelDia() {
//         const registro = this.obtenerRegistroDiario();
//         if (!registro) return { costoVendido: 0, ingresoReal: 0, gananciaReal: 0, registro: null };

//         let ingresoReal = 0, gananciaReal = 0, costoVendido = 0;
//         Object.values(registro.productos || {}).forEach(p => {
//             const vendidos = Number(p.vendidosHoy || 0);
//             const pv = Number(p.precioVenta || 0);
//             const pc = Number(p.precioCosto || 0);
//             ingresoReal += vendidos * pv;
//             gananciaReal += Number(p.gananciaHoy || 0) || (vendidos * (pv - pc));
//             costoVendido += vendidos * pc;
//         });

//         return { costoVendido, ingresoReal, gananciaReal, registro };
//     }

//     vaciarHistoricos() {
//         const pref = this.prefijoHist;
//         const keysToRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(pref)) keysToRemove.push(k);
//         }
//         keysToRemove.forEach(k => localStorage.removeItem(k));
//     }
// }

// /* ===========================================================
//    Exportador (utilidad pequeña para UI)
//    =========================================================== */
// export class Exportador {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.pref = `registro_${usuario}_`;
//     }

//     obtenerTodos() {
//         const out = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (!k || !k.startsWith(this.pref)) continue;
//             try {
//                 out.push({ clave: k, datos: JSON.parse(localStorage.getItem(k)) });
//             } catch (e) { /* ignorar */ }
//         }
//         out.sort((a,b) => a.clave.localeCompare(b.clave));
//         return out;
//     }

//     vaciar() {
//         const toRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(this.pref)) toRemove.push(k);
//         }
//         toRemove.forEach(k => localStorage.removeItem(k));
//     }
// }
//     verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
//             const hoy = this._fechaHoyStr();
//             if (ultima === hoy) return;
//             const now = new Date();
//             const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
//             let fechaACerrar;
//             if (pasadaHora) fechaACerrar = hoy;
//             else {
//                 const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//                 fechaACerrar = this._fechaHoyStr(ayer);
//             }
//             this.cerra   rDia(fechaACerrar);
//         } catch (e) {
//             console.error("Error en verificarCierreAutomatico:", e);
//         }
//     }    
//     programarCierreDiario(cutoffHour = 23, cutoffMinute = 59) {
//         try {
//             if (this._cierreTimer) { clearTimeout(this._cierreTimer); this._cierreTimer = null; }
//             const now = new Date();
//             const target = new Date(now.getFull  Year(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
//             if (target <= now) target.setDate(target.getDate() + 1);
//             const waitMs = target.getTime() - now.getTime();
//             this._cierreTimer = setTimeout(() => {
//                 const fechaCierre = this._fechaHoyStr(); 
//                 this.cerrarDia(fechaCierre);
//                 this.programarCierreDiario(cutoffHour, cutoffMinute);
//             }, waitMs);
//         } catch (e) {
//             console.error("Error programando cierre diario:", e);
//         }
//     }
//     obtenerRegistros() {
//         const pref = this.prefijoHist;
//         const registros = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const clave = localStorage.key(i);
//             if (!clave || !clave.startsWith(pref)) continue;
//             const partes = clave.split("_");
//             if (partes.length < 4) continue;
// / // validar formato simple de fecha/hora
//             const fechaParte = partes[2] || "";
//             const horaParte = partes[3] || "";
//             const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaParte);
//             const horaValida = /^\d{6}$/.test(horaParte) || /^\d{2}\d{2}\d{2}$/.test(horaParte);
//           if (!horaValida || !fechaValida) continue; 
//             try {
//                 const datos = JSON.parse(localStorage.getItem(clave));
//                 // convertimos a formato { clave, datos } (datos puede ser array)
//                 registros.push({ clave, datos });
//             } catch (e) {
//                 console.warn("No se pudo parsear histórico:", clave, e   );
//             }
//         }
//         registros.sort((a, b) => a.clave.localeCompare(b.clave));
//         return registros;
//     }
//     calcularPromedios() {
//         const registrosHistoricos = this.obtenerRegistros();
//         const registroDiario = this.obtenerRegistroDiario();
//         const hoy = this._fechaHoyStr();

//         const acumulador = {};
//         const diasValidos = new Set();
//         // procesar histórico (sumar vendidos y contar días con ventas en la clave)
//         registrosHistoricos.forEach(reg => {
//             // clave formato: registro_usuariO_YYYY-MM-DD_HHMMSS
//             const partes = reg.clave.split("_");
//             const fecha = partes[2] || null;
//             if (!fecha) return;
//             diasValidos.add(fecha);
//             (reg.datos || []).forEach(prod => {
//                 acumulador[prod.nombre] = acumulador[prod.nombre] || 0;
//                 acumulador[prod.nombre] += Number(prod.vendido || 0);
//             });
//         });

//         // procesar día actual si hay ventas
//         if (registroDiario && registroDiario.productos) {
//             const productosHoy = Object.values(registroDiario.productos);
//             const hayVentas = productosHoy.some(p => Number(p.vendidosHoy || 0) > 0);
//             if (hayVentas) {
//                 diasValidos.add(hoy);
//                 productosHoy.forEach(p => {
//                     acumulador[p.nombre] = acumulador[p.nombre] || 0;
//                     acumulador[p.nombre] += Number(p.vendidosHoy || 0);
//                 });
//             }
//         }
//         const dias = diasValidos.size || 1;
//         const resultado = {};
//         Object.keys(acumulador).forEach(nombre => {
//             resultado[nombre] = Number((acumulador[nombre] / dias).toFixed(2));
//         });
//         return resultado;
//     }
//     // Calcular totales del día (para resumen rápido y reporte)
//     calcularTotalesDelDia() {
//        const registro = this.obtenerRegistroDiario();
//         if (!registro) return { costoVendido: 0, ingresoReal: 0, gananciaReal: 0, registro: null };

//         let ingresoReal = 0, gananciaReal = 0, costoVendido = 0;
//         Object.values(registro.productos || {}).forEach(p => {
//             const vendidos = Number(p.vendidosHoy || 0);
//             const pv = Number(p.precioVenta || 0);
//             const pc = Number(p.precioCosto || 0);
//             ingresoReal += vendidos * pv;
//             gananciaReal += Number(p.gananciaHoy || 0) || (vendidos * (pv - pc));
//             costoVendido += vendidos * pc;
//         });
//         return { costoVendido, ingresoReal, gananciaReal, registro };
//     }
//     // Vaciar históricos (uso especial, p.ej. para pruebas)
//     vaciarHistoricos() {
//        const pref = this.prefijoHist;
//         const keysToRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(pref)) keysToRemove.push(k);
//         }
//         keysToRemove.forEach(k => localStorage.removeItem(k));
//     }
/* ===========================================================
   Exportador (utilidad pequeña para UI)
   =========================================================== */
// export class Exportador {
//     constructor(usuario) {
//         this.usuario = usuario;
//         this.pref = `registro_${usuario}_`;
//     }
//     obtenerTodos() {
//         const out = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (!k || !k.startsWith(this.pref)) continue;
//             try {
//                 out.push({ clave: k, datos: JSON.parse(localStorage.getItem(k)) });
//             } catch (e) { /* ignorar */ }
//         }
//         out.sort((a, b) => a.clave.localeCompare(b.clave));
//         return out;
//     }
//     vaciar() {
//         const toRemove = [];
//         for (let i = 0; i < localStorage.length; i++) {
//             const k = localStorage.key(i);
//             if (k && k.startsWith(this.pref)) toRemove.push(k);
//         }
//         toRemove.forEach(k => localStorage.removeItem(k));
//     }
// }


































// poo/modelos.js
// Modelos principales: Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador

/* ===========================================================
   PRODUCTO
   =========================================================== */
export class Producto {
    constructor(id, nombre, categoria, precioCosto, precioVenta, stockInicial, stock, vendido = 0, minimoDeseado = 0) {
        this.id = id;
        this.nombre = nombre;
        this.categoria = categoria || "";
        this.precioCosto = Number(precioCosto) || 0;
        this.precioVenta = Number(precioVenta) || 0;
        // si se provee stockInicial se usa, sino se toma stock
        this.stockInicial = (typeof stockInicial === 'number') ? stockInicial : (typeof stock === 'number' ? stock : 0);
        this.stock = (typeof stock === 'number') ? stock : (this.stockInicial || 0);
        this.vendido = Number(vendido) || 0;
        this.minimoDeseado = Number(minimoDeseado) || 0; // nuevo campo: umbral de reposición
    }

    calcularGananciaUnidad() {
        return (this.precioVenta || 0) - (this.precioCosto || 0);
    }

    calcularGananciaTotal() {
        return (this.vendido || 0) * this.calcularGananciaUnidad();
    }

    calcularIngresoEsperado() {
        return (this.stock || 0) * (this.precioVenta || 0);
    }

    disminuirStock(cantidad = 1) {
        cantidad = Number(cantidad) || 1;
        if ((this.stock || 0) < cantidad) return false;
        this.stock = (this.stock || 0) - cantidad;
        this.vendido = (this.vendido || 0) + cantidad;
        return true;
    }

    aumentarStock(cantidad) {
        cantidad = Number(cantidad) || 0;
        this.stock = (this.stock || 0) + cantidad;
        this.stockInicial = (this.stockInicial || 0) + cantidad;
    }

    registrarVenta(cantidad = 1) {
        return this.disminuirStock(cantidad);
    }

    devolverVenta(cantidad = 1) {
        cantidad = Number(cantidad) || 1;
        if ((this.vendido || 0) < cantidad) return false;
        this.vendido -= cantidad;
        this.stock += cantidad;
        return true;
    }

    reiniciarVendidos() {
        this.vendido = 0;
    }
}

/* ===========================================================
   INVENTARIO
   =========================================================== */
export class Inventario {
    constructor(usuarioActivo) {
        this.usuario = usuarioActivo;
        this.clave = `productos_${usuarioActivo}`;
        this.productos = this.cargar();
    }

    cargar() {
        try {
            const guardados = JSON.parse(localStorage.getItem(this.clave)) || [];
            // devolver instancias Producto
            return guardados.map(p => Object.assign(new Producto(), p));
        } catch (e) {
            console.warn("Error leyendo inventario:", e);
            return [];
        }
    }

    guardar() {
        try {
            localStorage.setItem(this.clave, JSON.stringify(this.productos));
        } catch (e) {
            console.error("No se pudo guardar inventario:", e);
        }
    }

    obtenerTodos() {
        // devolver copias por seguridad
        return this.productos.map(p => Object.assign(new Producto(), p));
    }

    buscarPorId(id) {
        // acepta number o string
        return this.productos.find(p => String(p.id) === String(id));
    }

    agregarProducto(producto) {
        this.productos.push(producto);
        this.guardar();
    }

    eliminarProducto(id) {
        this.productos = this.productos.filter(p => String(p.id) !== String(id));
        this.guardar();
    }

    actualizarProducto(id, campos = {}) {
        const prod = this.buscarPorId(id);
        if (!prod) return false;
        // actualizar solo campos pasados
        Object.keys(campos).forEach(k => {
            if (k in prod) {
                if (k === 'precioCosto' || k === 'precioVenta' || k === 'stock' || k === 'stockInicial' || k === 'vendido' || k === 'minimoDeseado') {
                    prod[k] = Number(campos[k] || 0);
                } else {
                    prod[k] = campos[k];
                }
            } else {
                // permitir agregar nuevos campos dinámicos
                prod[k] = campos[k];
            }
        });
        this.guardar();
        return true;
    }

    registrarVenta(id, cantidad = 1) {
        const prod = this.buscarPorId(id);
        if (prod && prod.registrarVenta(cantidad)) {
            this.guardar();
            return true;
        }
        return false;
    }

    devolverVenta(id, cantidad = 1) {
        const prod = this.buscarPorId(id);
        if (prod && prod.devolverVenta(cantidad)) {
            this.guardar();
            return true;
        }
        return false;
    }

    sumarStock(id, cantidad) {
        const prod = this.buscarPorId(id);
        if (!prod) return false;
        prod.aumentarStock(cantidad);
        this.guardar();
        return true;
    }

    calcularTotales() {
        let costoTotal = 0;
        let ventaEsperada = 0;
        let ingresoReal = 0;
        let gananciaReal = 0;

        this.productos.forEach(p => {
            costoTotal += (p.stockInicial || 0) * (p.precioCosto || 0);
            ventaEsperada += (p.stock || 0) * (p.precioVenta || 0);
            ingresoReal += (p.vendido || 0) * (p.precioVenta || 0);
            gananciaReal += (p.vendido || 0) * ((p.precioVenta || 0) - (p.precioCosto || 0));
        });

        return { costoTotal, ventaEsperada, ingresoReal, gananciaReal };
    }

    tieneStockBajo(p) {
        // retorna true si p.minimoDeseado > 0 y stock <= minimoDeseado
        if (!p) return false;
        return Number(p.minimoDeseado || 0) >= 0 && Number(p.minimoDeseado || 0) !== 0 && Number(p.stock || 0) <= Number(p.minimoDeseado || 0);
    }

    obtenerProductosBajoStock() {
        return this.productos.filter(p => this.tieneStockBajo(p)).map(p => Object.assign(new Producto(), p));
    }
}

/* ===========================================================
   SESIÓN / USUARIO
   =========================================================== */
export class UsuarioSesion {
    constructor() {
        this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
        this._claveUltimaActividad = "ultimaActividad";
        this._monitorId = null;
        this._listenersAct = [];
    }

    login(usuario, password) {
        const usuariosValidos = {
            "admin": "1234",
            "vendedor": "1234",
            "cristian": "1234",
            "karen": "1234",
            "estela": "1234",
            "juan": "1234"
        };
        if (usuariosValidos[usuario] === password) {
            localStorage.setItem("usuarioActivo", usuario);
            localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
            this.usuarioActivo = usuario;
            return true;
        }
        return false;
    }

    cerrarSesion() {
        this.detenerMonitor();
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem(this._claveUltimaActividad);
        location.href = "login.html";
    }

    estaLogueado() {
        this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
        return this.usuarioActivo !== null;
    }

    registrarActividad() {
        localStorage.setItem(this._claveUltimaActividad, String(Date.now()));
    }

    obtenerUltimaActividad() {
        const v = localStorage.getItem(this._claveUltimaActividad);
        return v ? parseInt(v, 10) : null;
    }

    iniciarMonitor(inactividadMinutos = 15, onExpirar = null) {
        if (this._monitorId) return;
        const actualizar = () => this.registrarActividad();
        this._listenersAct = ["click", "keydown", "mousemove", "touchstart"];
        this._listenersAct.forEach(ev => window.addEventListener(ev, actualizar));
        const intervalo = 15000;
        const timeout = inactividadMinutos * 60000;
        this._monitorId = setInterval(() => {
            const ultima = this.obtenerUltimaActividad();
            if (!ultima) {
                this.registrarActividad();
                return;
            }
            if (Date.now() - ultima > timeout) {
                this.detenerMonitor();
                localStorage.removeItem("usuarioActivo");
                localStorage.removeItem(this._claveUltimaActividad);
                if (onExpirar) onExpirar();
                else { alert("Sesión expirada por inactividad."); location.href = "login.html"; }
            }
        }, intervalo);
    }

    detenerMonitor() {
        if (this._monitorId) clearInterval(this._monitorId);
        this._monitorId = null;
        const actualizar = () => this.registrarActividad();
        this._listenersAct.forEach(ev => window.removeEventListener(ev, actualizar));
        this._listenersAct = [];
    }
}

/* ===========================================================
   TURNOS
   =========================================================== */
export class Turnos {
    constructor(usuario) {
        this.clave = `turnos_${usuario}`;
        this.default = {
            mañana: { inicio: "06:00", fin: "14:00" },
            tarde: { inicio: "15:00", fin: "23:00" }
        };
        this.config = JSON.parse(localStorage.getItem(this.clave)) || this.default;
    }

    guardar() {
        localStorage.setItem(this.clave, JSON.stringify(this.config));
    }

    obtenerTurnoActual() {
        const ahora = new Date();
        const hora = ahora.getHours() + ahora.getMinutes() / 60;
        const m = this.config.mañana;
        const t = this.config.tarde;
        const parseHora = (str) => {
            if (!str) return 0;
            const parts = String(str).split(":");
            return parseInt(parts[0] || 0, 10) + (parseInt(parts[1] || 0, 10) / 60);
        };
        const hM1 = parseHora(m.inicio);
        const hM2 = parseHora(m.fin);
        const hT1 = parseHora(t.inicio);
        const hT2 = parseHora(t.fin);
        if (hora >= hM1 && hora <= hM2) return "mañana";
        if (hora >= hT1 && hora <= hT2) return "tarde";
        return "fuera";
    }
}

/* ===========================================================
   ESTADISTICAS
   - manejo de registro_diario_... y registro_... (históricos)
   =========================================================== */
export class Estadisticas {
    constructor(usuario) {
        this.usuario = usuario;
        this.prefijoDiario = `registro_diario_${this.usuario}_`;
        this.prefijoHist = `registro_${this.usuario}_`;
        this._claveUltimaFechaCierre = `ultima_fecha_cierre_${this.usuario}`;
        this._cierreTimer = null;
    }

    _fechaStrFromDate(date) {
        const fecha = date ? new Date(date) : new Date();
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, "0");
        const dd = String(fecha.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    _fechaHoyStr(date = null) {
        return this._fechaStrFromDate(date);
    }

    _fechaSiguienteStr(date = null) {
        const d = date ? new Date(date) : new Date();
        d.setDate(d.getDate() + 1);
        return this._fechaStrFromDate(d);
    }

    obtenerRegistroDiario(fechaStr) {
        const fecha = fechaStr || this._fechaHoyStr();
        const clave = this.prefijoDiario + fecha;
        try {
            return JSON.parse(localStorage.getItem(clave)) || null;
        } catch (e) {
            console.warn("registro diario corrupto:", clave, e);
            return null;
        }
    }

    _crearRegistroDiarioBase(fechaStr) {
        const fecha = fechaStr || this._fechaHoyStr();
        return {
            fecha,
            turnos: { mañana: { venta: 0, ganancia: 0 }, tarde: { venta: 0, ganancia: 0 } },
            productos: {}
        };
    }

    guardarRegistroDiario(registro, fechaStr) {
        const fecha = fechaStr || (registro && registro.fecha) || this._fechaHoyStr();
        const clave = this.prefijoDiario + fecha;
        try {
            localStorage.setItem(clave, JSON.stringify(registro));
        } catch (e) {
            console.error("No se pudo guardar registro diario:", e);
        }
    }

    actualizarVentaEnDiario(productoInfo, turno = "mañana") {
        const fecha = this._fechaHoyStr();
        let registro = this.obtenerRegistroDiario(fecha);
        if (!registro) registro = this._crearRegistroDiarioBase(fecha);

        const t = (turno === "tarde") ? "tarde" : "mañana";
        const cantidad = Number(productoInfo.cantidad) || 0;
        const ganancia = Number(productoInfo.ganancia) || 0;
        const precioVenta = Number(productoInfo.precioVenta || 0);
        const precioCosto = Number(productoInfo.precioCosto || 0);

        registro.turnos[t].venta = (registro.turnos[t].venta || 0) + cantidad;
        registro.turnos[t].ganancia = (registro.turnos[t].ganancia || 0) + ganancia;
        if (registro.turnos[t].venta < 0) registro.turnos[t].venta = 0;
        if (registro.turnos[t].ganancia < 0) registro.turnos[t].ganancia = 0;

        const pid = String(productoInfo.id);
        registro.productos[pid] = registro.productos[pid] || {
            id: productoInfo.id,
            nombre: productoInfo.nombre,
            categoria: productoInfo.categoria || "",
            stockInicial: (typeof productoInfo.stockInicial !== 'undefined') ? Number(productoInfo.stockInicial) : null,
            stockFinal: (typeof productoInfo.stockFinal !== 'undefined') ? Number(productoInfo.stockFinal) : null,
            vendidosHoy: 0,
            gananciaHoy: 0,
            precioVenta: precioVenta || 0,
            precioCosto: precioCosto || 0,
            ingreso: 0,
            turno: t
        };

        if (typeof productoInfo.stockInicial !== "undefined" && registro.productos[pid].stockInicial === null) {
            registro.productos[pid].stockInicial = Number(productoInfo.stockInicial);
        }
        if (typeof productoInfo.stockFinal !== "undefined") {
            registro.productos[pid].stockFinal = Number(productoInfo.stockFinal);
        }

        registro.productos[pid].vendidosHoy = (registro.productos[pid].vendidosHoy || 0) + cantidad;
        registro.productos[pid].gananciaHoy = (registro.productos[pid].gananciaHoy || 0) + ganancia;
        if (registro.productos[pid].vendidosHoy < 0) registro.productos[pid].vendidosHoy = 0;
        if (registro.productos[pid].gananciaHoy < 0) registro.productos[pid].gananciaHoy = 0;

        const pv = Number(registro.productos[pid].precioVenta) || 0;
        registro.productos[pid].ingreso = registro.productos[pid].vendidosHoy * pv;

        registro.productos[pid].turno = t;

        this.guardarRegistroDiario(registro, fecha);
    }

    cerrarDia(fechaStr = null) {
        try {
            const fechaACerrar = fechaStr || this._fechaHoyStr();
            const registro = this.obtenerRegistroDiario(fechaACerrar);

            if (!registro) {
                localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
                return true;
            }

            const ahora = new Date();
            const hh = String(ahora.getHours()).padStart(2, "0");
            const mm = String(ahora.getMinutes()).padStart(2, "0");
            const ss = String(ahora.getSeconds()).padStart(2, "0");
            const claveHist = `${this.prefijoHist}${fechaACerrar}_${hh}${mm}${ss}`;

            const historialProductos = Object.values(registro.productos || {}).map(p => ({
                id: p.id,
                nombre: p.nombre,
                categoria: p.categoria,
                stockInicial: (typeof p.stockInicial !== 'undefined') ? p.stockInicial : null,
                stockFinal: (typeof p.stockFinal !== 'undefined') ? p.stockFinal : null,
                vendido: Number(p.vendidosHoy || 0),
                precioVenta: Number(p.precioVenta || 0),
                precioCosto: Number(p.precioCosto || 0),
                gananciaDia: Number(p.gananciaHoy || 0),
                ingreso: Number(p.ingreso || 0),
                turno: p.turno || null
            }));

            try {
                localStorage.setItem(claveHist, JSON.stringify(historialProductos));
            } catch (e) {
                console.error("No se pudo guardar histórico:", e);
            }

            // Actualizar Inventario: stockInicial = stock actual
            try {
                const inv = new Inventario(this.usuario);
                inv.productos.forEach(prod => {
                    prod.stockInicial = Number(prod.stock || 0);
                });
                inv.guardar();
            } catch (e) {
                console.warn("No se pudo actualizar inventario al cerrar día:", e);
            }

            // Preparar registro diario para la fecha siguiente con inventario actual
            const nuevaFecha = this._fechaSiguienteStr(fechaACerrar);
            const nuevoRegistro = this._crearRegistroDiarioBase(nuevaFecha);

            try {
                const inventario = new Inventario(this.usuario);
                inventario.obtenerTodos().forEach(prod => {
                    const pid = String(prod.id);
                    nuevoRegistro.productos[pid] = {
                        id: prod.id,
                        nombre: prod.nombre,
                        categoria: prod.categoria || "",
                        stockInicial: Number(prod.stock || 0),
                        stockFinal: null,
                        vendidosHoy: 0,
                        gananciaHoy: 0,
                        precioVenta: Number(prod.precioVenta || 0),
                        precioCosto: Number(prod.precioCosto || 0),
                        ingreso: 0,
                        turno: null
                    };
                });
            } catch (e) {
                console.warn("No se pudo inicializar registro diario con inventario:", e);
            }

            this.guardarRegistroDiario(nuevoRegistro, nuevaFecha);
            localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
            return true;
        } catch (e) {
            console.error("Error en cerrarDia:", e);
            return false;
        }
    }

    resetearEstadisticasDiarias() {
        const hoy = this._fechaHoyStr();
        const clave = this.prefijoDiario + hoy;
        const nuevo = this._crearRegistroDiarioBase(hoy);
        this.guardarRegistroDiario(nuevo, hoy);
    }

    verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
        try {
            const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
            const hoy = this._fechaHoyStr();
            if (ultima === hoy) return;
            const now = new Date();
            const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
            let fechaACerrar;
            if (pasadaHora) fechaACerrar = hoy;
            else {
                const ayer = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                fechaACerrar = this._fechaHoyStr(ayer);
            }
            this.cerrarDia(fechaACerrar);
        } catch (e) {
            console.error("Error en verificarCierreAutomatico:", e);
        }
    }

    programarCierreDiario(cutoffHour = 23, cutoffMinute = 59) {
        try {
            if (this._cierreTimer) { clearTimeout(this._cierreTimer); this._cierreTimer = null; }
            const now = new Date();
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
            if (target <= now) target.setDate(target.getDate() + 1);
            const waitMs = target.getTime() - now.getTime();
            this._cierreTimer = setTimeout(() => {
                const fechaCierre = this._fechaHoyStr();
                this.cerrarDia(fechaCierre);
                this.programarCierreDiario(cutoffHour, cutoffMinute);
            }, waitMs);
        } catch (e) {
            console.error("Error programando cierre diario:", e);
        }
    }

    obtenerRegistros() {
        const pref = this.prefijoHist;
        const registros = [];
        for (let i = 0; i < localStorage.length; i++) {
            const clave = localStorage.key(i);
            if (!clave || !clave.startsWith(pref)) continue;
            const partes = clave.split("_");
            if (partes.length < 4) continue;
            const fechaParte = partes[2] || "";
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaParte)) continue;
            try {
                const datos = JSON.parse(localStorage.getItem(clave));
                registros.push({ clave, datos });
            } catch (e) {
                console.warn("No se pudo parsear histórico:", clave, e);
            }
        }
        registros.sort((a, b) => a.clave.localeCompare(b.clave));
        return registros;
    }

    calcularPromedios() {
        const registrosHistoricos = this.obtenerRegistros();
        const registroDiario = this.obtenerRegistroDiario();
        const hoy = this._fechaHoyStr();

        const acumulador = {};
        const diasValidos = new Set();

        registrosHistoricos.forEach(reg => {
            const partes = reg.clave.split("_");
            const fecha = partes[2] || null;
            if (!fecha) return;
            diasValidos.add(fecha);
            (reg.datos || []).forEach(prod => {
                acumulador[prod.nombre] = acumulador[prod.nombre] || 0;
                acumulador[prod.nombre] += Number(prod.vendido || 0);
            });
        });

        if (registroDiario && registroDiario.productos) {
            const productosHoy = Object.values(registroDiario.productos);
            const hayVentas = productosHoy.some(p => Number(p.vendidosHoy || 0) > 0);
            if (hayVentas) {
                diasValidos.add(hoy);
                productosHoy.forEach(p => {
                    acumulador[p.nombre] = acumulador[p.nombre] || 0;
                    acumulador[p.nombre] += Number(p.vendidosHoy || 0);
                });
            }
        }

        const dias = diasValidos.size || 1;
        const resultado = {};
        Object.keys(acumulador).forEach(nombre => {
            resultado[nombre] = Number((acumulador[nombre] / dias).toFixed(2));
        });

        return resultado;
    }

    calcularTotalesDelDia() {
        const registro = this.obtenerRegistroDiario();
        if (!registro) return { costoVendido: 0, ingresoReal: 0, gananciaReal: 0, registro: null };

        let ingresoReal = 0, gananciaReal = 0, costoVendido = 0;
        Object.values(registro.productos || {}).forEach(p => {
            const vendidos = Number(p.vendidosHoy || 0);
            const pv = Number(p.precioVenta || 0);
            const pc = Number(p.precioCosto || 0);
            ingresoReal += vendidos * pv;
            gananciaReal += Number(p.gananciaHoy || 0) || (vendidos * (pv - pc));
            costoVendido += vendidos * pc;
        });

        return { costoVendido, ingresoReal, gananciaReal, registro };
    }

    vaciarHistoricos() {
        const pref = this.prefijoHist;
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(pref)) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    }
}

/* ===========================================================
   Exportador (utilidad pequeña para UI)
   =========================================================== */
export class Exportador {
    constructor(usuario) {
        this.usuario = usuario;
        this.pref = `registro_${usuario}_`;
    }

    obtenerTodos() {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith(this.pref)) continue;
            try {
                out.push({ clave: k, datos: JSON.parse(localStorage.getItem(k)) });
            } catch (e) { /* ignorar */ }
        }
        out.sort((a,b) => a.clave.localeCompare(b.clave));
        return out;
    }

    vaciar() {
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(this.pref)) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
    }
}
