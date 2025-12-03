// poo/modelos.js
// Modelos: Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador

/* ===========================================================
   PRODUCTO
   =========================================================== */
export class Producto {
    constructor(id, nombre, categoria, precioCosto = 0, precioVenta = 0, stockInicial = 0, stock = null, vendido = 0, minimoDeseado = 0, bloqueado = 0) {
        this.id = id;
        this.nombre = nombre || "";
        this.categoria = categoria || "";
        this.precioCosto = Number(precioCosto) || 0;
        this.precioVenta = Number(precioVenta) || 0;

        this.stockInicial = Number(stockInicial) || 0;
        // si no viene stock, tomar stockInicial
        this.stock = (stock === null || typeof stock === 'undefined') ? Number(this.stockInicial || 0) : Number(stock);
        this.vendido = Number(vendido) || 0;

        // unidades que pertenecen a días ya cerrados (no pueden devolverse)
        this.bloqueado = Number(bloqueado) || 0;

        this.minimoDeseado = Number(minimoDeseado) || 0;
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

    aumentarStock(cantidad = 1) {
        cantidad = Number(cantidad) || 0;
        this.stock = (this.stock || 0) + cantidad;
        this.stockInicial = (this.stockInicial || 0) + cantidad;
    }

    registrarVenta(cantidad = 1) {
        return this.disminuirStock(cantidad);
    }

    devolverVenta(cantidad = 1) {
        cantidad = Number(cantidad) || 1;
        // no se puede devolver ventas que ya estén bloqueadas (de días cerrados)
        // ventas disponibles para devolución = vendido - bloqueado
        const disponibles = (this.vendido || 0) - (this.bloqueado || 0);
        if (disponibles < cantidad) return false;
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
        this.usuario = usuarioActivo || 'admin';
        this.clave = `productos_${this.usuario}`;
        this.productos = this.cargar();
    }

    cargar() {
        try {
            const raw = JSON.parse(localStorage.getItem(this.clave) || "[]");
            // devolver instancias Producto (para tener métodos)
            return raw.map(p => Object.assign(new Producto(), p));
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
        // devolver copias (instanciadas)
        return this.productos.map(p => Object.assign(new Producto(), p));
    }

    buscarPorId(id) {
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
        Object.keys(campos).forEach(k => {
            if (k in prod) {
                if (['precioCosto','precioVenta','stock','stockInicial','vendido','minimoDeseado','bloqueado'].includes(k)) {
                    prod[k] = Number(campos[k] || 0);
                } else {
                    prod[k] = campos[k];
                }
            } else {
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
        if (!prod) return false;

        // comprobar si venta disponible para devolver
        const disponibles = (prod.vendido || 0) - (prod.bloqueado || 0);
        if (disponibles < cantidad) {
            // no hay suficientes ventas "de hoy" para devolver
            console.warn("Devolución bloqueada: esa venta pertenece a un día cerrado.");
            return false;
        }

        if (prod.devolverVenta(cantidad)) {
            this.guardar();
            return true;
        }
        return false;
    }

    sumarStock(id, cantidad = 1) {
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
        if (!p) return false;
        return Number(p.minimoDeseado || 0) > 0 && Number(p.stock || 0) <= Number(p.minimoDeseado || 0);
    }

    obtenerProductosBajoStock() {
        return this.productos.filter(p => this.tieneStockBajo(p)).map(p => Object.assign(new Producto(), p));
    }
}

/* ===========================================================
   USUARIO / SESION
   =========================================================== */
export class UsuarioSesion {
    constructor() {
        this.usuarioActivo = localStorage.getItem("usuarioActivo") || null;
        this._claveUltimaActividad = "ultimaActividad";
        this._monitorId = null;
        this._listenersAct = [];
        this._usuariosKey = "usuarios_app";
        this._inicializarUsuarios();
    }

    _inicializarUsuarios() {
        const existentes = JSON.parse(localStorage.getItem(this._usuariosKey) || "null");
        if (!Array.isArray(existentes)) {
            const porDefecto = [
                { usuario: "admin", password: "1234", rol: "admin", nombre: "Administrador" },
                { usuario: "vendedor", password: "1234", rol: "vendedor", nombre: "Vendedor" }
            ];
            localStorage.setItem(this._usuariosKey, JSON.stringify(porDefecto));
        }
    }

    login(usuario, password) {
        const usuarios = JSON.parse(localStorage.getItem(this._usuariosKey) || "[]");
        const found = usuarios.find(u => u.usuario === usuario && u.password === password);
        if (found) {
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

    iniciarMonitor(inactividadMinutos = 5, onExpirar = null) {
        if (this._monitorId) return;
        const actualizar = () => this.registrarActividad();
        this._listenersAct = ["click","keydown","mousemove","touchstart"];
        this._listenersAct.forEach(ev => window.addEventListener(ev, actualizar));
        const intervalo = 15000;
        const timeout = inactividadMinutos * 60000;
        this._monitorId = setInterval(() => {
            const ultima = this.obtenerUltimaActividad();
            if (!ultima) { this.registrarActividad(); return; }
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

    obtenerUsuarios() {
        return JSON.parse(localStorage.getItem(this._usuariosKey) || "[]");
    }

    crearUsuario({usuario, password, rol = "vendedor", nombre = ""}) {
        if (!usuario || !password) throw new Error("Usuario y contraseña requeridos");
        const usuarios = this.obtenerUsuarios();
        if (usuarios.find(u => u.usuario === usuario)) throw new Error("El usuario ya existe");
        usuarios.push({usuario, password, rol, nombre});
        localStorage.setItem(this._usuariosKey, JSON.stringify(usuarios));
        return true;
    }

    editarUsuario(usuarioClave, {password, rol, nombre}) {
        const usuarios = this.obtenerUsuarios();
        const idx = usuarios.findIndex(u => u.usuario === usuarioClave);
        if (idx === -1) throw new Error("Usuario no encontrado");
        if (typeof password !== "undefined") usuarios[idx].password = password;
        if (typeof rol !== "undefined") usuarios[idx].rol = rol;
        if (typeof nombre !== "undefined") usuarios[idx].nombre = nombre;
        localStorage.setItem(this._usuariosKey, JSON.stringify(usuarios));
        return true;
    }

    eliminarUsuario(usuarioClave) {
        let usuarios = this.obtenerUsuarios();
        usuarios = usuarios.filter(u => u.usuario !== usuarioClave);
        localStorage.setItem(this._usuariosKey, JSON.stringify(usuarios));
        return true;
    }

    obtenerRol(usuario) {
        const usuarios = this.obtenerUsuarios();
        const u = usuarios.find(x => x.usuario === usuario);
        return u ? u.rol : null;
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
        this.config = JSON.parse(localStorage.getItem(this.clave) || "null") || this.default;
    }

    guardar() {
        localStorage.setItem(this.clave, JSON.stringify(this.config));
    }

    obtenerTurnoActual() {
        const ahora = new Date();
        const hora = ahora.getHours() + ahora.getMinutes()/60;
        const m = this.config.mañana;
        const t = this.config.tarde;
        const parseHora = (str) => {
            if (!str) return 0;
            const parts = String(str).split(":");
            return parseInt(parts[0]||0,10) + (parseInt(parts[1]||0,10)/60);
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
   ESTADISTICAS (CON CORRECIONES)
   =========================================================== */
export class Estadisticas {
    constructor(usuario) {
        this.usuario = usuario || 'admin';
        this.prefijoDiario = `registro_diario_${this.usuario}_`;
        this.prefijoHist = `registro_${this.usuario}_`;
        this._claveUltimaFechaCierre = `ultima_fecha_cierre_${this.usuario}`;
        this._cierreTimer = null;
    }

    // devuelve YYYY-MM-DD de una Date (o de ahora si no se pasa)
    _fechaStrFromDate(date) {
        const f = date ? new Date(date) : new Date();
        const yyyy = f.getFullYear();
        const mm = String(f.getMonth()+1).padStart(2,'0');
        const dd = String(f.getDate()).padStart(2,'0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // Esta función respeta la posible fecha forzada en localStorage ("fecha_actual_sistema")
    // útil para testing. Si no existe, devuelve la fecha real del sistema.
    _fechaHoyStr(date = null) {
        const fGuardada = localStorage.getItem("fecha_actual_sistema");
        if (fGuardada) return fGuardada;
        if (date instanceof Date) return date.toISOString().slice(0,10);
        return new Date().toISOString().slice(0,10);
    }

    _fechaSiguienteStr(dateStr = null) {
        const d = dateStr ? new Date(dateStr) : new Date();
        d.setDate(d.getDate() + 1);
        return this._fechaStrFromDate(d);
    }

    estaFechaCerrada(fechaStr = null) {
        try {
            const fecha = fechaStr || this._fechaHoyStr();
            const pref = `${this.prefijoHist}${fecha}_`;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k) continue;
                if (k.startsWith(pref)) {
                    const resto = k.slice(pref.length);
                    // si tiene HHMMSS (6 dígitos) asumimos histórico válido
                    if (/^\d{6}$/.test(resto)) return true;
                }
            }
            return false;
        } catch (e) {
            console.warn("Error comprobando cierre:", e);
            return false;
        }
    }

    obtenerRegistroDiario(fechaStr = null) {
        // si se pide una fecha, usarla; si no, tomar la fecha hoy (respeta fecha_actual_sistema)
        const fecha = fechaStr || this._fechaHoyStr();
        const clave = this.prefijoDiario + fecha;
        try {
            return JSON.parse(localStorage.getItem(clave) || "null");
        } catch (e) {
            console.warn("registro diario corrupto:", clave, e);
            return null;
        }
    }

    _crearRegistroDiarioBase(fechaStr = null) {
        const fecha = fechaStr || this._fechaHoyStr();
        return {
            fecha,
            turnos: { mañana: { venta:0, ganancia:0 }, tarde: { venta:0, ganancia:0 } },
            productos: {}
        };
    }

    guardarRegistroDiario(registro, fechaStr = null) {
        // fechaStr tiene precedencia; si no viene usamos registro.fecha o la fecha de hoy
        const fecha = fechaStr || (registro && registro.fecha) || this._fechaHoyStr();
        const clave = this.prefijoDiario + fecha;
        try {
            localStorage.setItem(clave, JSON.stringify(registro));
        } catch (e) {
            console.error("No se pudo guardar registro diario:", e);
        }
    }

    actualizarVentaEnDiario(productoInfo, turno = "mañana") {
        // Actualiza el registro del día actual (respeta fecha_actual_sistema)
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
            // si fechaStr fue pasada explícitamente, la usamos; si no, usamos la fecha "de hoy" controlada
            // esto evita off-by-one: cerramos siempre para la fecha que queremos, no para "mañana".
            const fechaACerrar = fechaStr || this._fechaHoyStr();

            // obtener registro del día que vamos a cerrar
            const registro = this.obtenerRegistroDiario(fechaACerrar);

            // si no hay registro lo marcamos como cerrado (ultima fecha) y listo
            if (!registro) {
                localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
                return true;
            }

            // guardar histórico (fecha + hora)
            const ahora = new Date();
            const hh = String(ahora.getHours()).padStart(2,'0');
            const mm = String(ahora.getMinutes()).padStart(2,'0');
            const ss = String(ahora.getSeconds()).padStart(2,'0');
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

            // BLOQUEAR las unidades vendidas (estas ventas corresponden a días cerrados)
            try {
                const inv = new Inventario(this.usuario);
                Object.values(registro.productos || {}).forEach(p => {
                    if ((p.vendidosHoy || 0) > 0) {
                        const prodInv = inv.buscarPorId(p.id);
                        if (prodInv) {
                            // sumar bloqueadas: estas unidades corresponden a días cerrados
                            prodInv.bloqueado = (prodInv.bloqueado || 0) + Number(p.vendidosHoy || 0);

                            // NOTA: NO restamos prodInv.vendido aquí.
                            // Mantener prodInv.vendido como acumulado facilita devoluciones dentro de la lógica 'vendido - bloqueado'.
                        }
                    }
                });
                // actualizar stockInicial = stock actual (plantilla para el siguiente día)
                inv.productos.forEach(pr => pr.stockInicial = Number(pr.stock || 0));
                inv.guardar();
            } catch (e) {
                console.warn("No se pudo bloquear productos vendidos:", e);
            }

            // preparar registro diario para la fecha siguiente con inventario actual
            try {
                const nuevaFecha = this._fechaSiguienteStr(fechaACerrar);
                const nuevoRegistro = this._crearRegistroDiarioBase(nuevaFecha);

                const inventario = new Inventario(this.usuario);
                inventario.obtenerTodos().forEach(prod => {
                    nuevoRegistro.productos[String(prod.id)] = {
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

                // Guardamos la plantilla del registro diario para la fecha siguiente
                this.guardarRegistroDiario(nuevoRegistro, nuevaFecha);
            } catch (e) {
                console.warn("No se pudo inicializar registro diario con inventario:", e);
            }

            // marcar última fecha de cierre como la fecha que cerramos (para evitar dobles cierres por automatismo)
            localStorage.setItem(this._claveUltimaFechaCierre, fechaACerrar);
            return true;

        } catch (e) {
            console.error("Error en cerrarDia:", e);
            return false;
        }
    }

    obtenerRegistros() {
        const pref = this.prefijoHist;
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith(pref)) continue;
            try {
                const datos = JSON.parse(localStorage.getItem(k));
                out.push({ clave: k, datos });
            } catch (e) {
                console.warn("No se pudo parsear histórico:", k, e);
            }
        }
        out.sort((a,b) => a.clave.localeCompare(b.clave));
        return out;
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
                acumulador[prod.nombre] = (acumulador[prod.nombre] || 0) + Number(prod.vendido || 0);
            });
        });

        if (registroDiario && registroDiario.productos) {
            const productosHoy = Object.values(registroDiario.productos);
            const hayVentas = productosHoy.some(p => Number(p.vendidosHoy || 0) > 0);
            if (hayVentas) {
                diasValidos.add(hoy);
                productosHoy.forEach(p => {
                    acumulador[p.nombre] = (acumulador[p.nombre] || 0) + Number(p.vendidosHoy || 0);
                });
            }
        }

        const dias = diasValidos.size || 1;
        const resultado = {};
        Object.keys(acumulador).forEach(n => resultado[n] = Number((acumulador[n] / dias).toFixed(2)));
        return resultado;
    }

    calcularTotalesDelDia() {
        const registro = this.obtenerRegistroDiario();
        if (!registro) return { costoVendido:0, ingresoReal:0, gananciaReal:0, registro: null };

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

    verificarCierreAutomatico(cutoffHour = 23, cutoffMinute = 59) {
        try {
            const ultima = localStorage.getItem(this._claveUltimaFechaCierre);
            const hoy = this._fechaHoyStr();
            if (ultima === hoy) return; // ya cerró hoy

            const now = new Date();
            const pasadaHora = (now.getHours() > cutoffHour) || (now.getHours() === cutoffHour && now.getMinutes() >= cutoffMinute);
            let fechaACerrar;
            if (pasadaHora) {
                // si ya pasó la hora de corte, cerramos para la fecha "hoy"
                fechaACerrar = this._fechaStrFromDate(now);
            } else {
                // si aún no llegó, cerramos "ayer" para capturar ventas previas
                const ayer = new Date(now.getTime() - 24*60*60*1000);
                fechaACerrar = this._fechaStrFromDate(ayer);
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
            let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHour, cutoffMinute, 0, 0);
            if (target <= now) target.setDate(target.getDate() + 1); // siguiente ocurrencia
            const waitMs = target.getTime() - now.getTime();

            // Programamos el cierre para la fecha asociada al target (cuando se dispare)
            this._cierreTimer = setTimeout(() => {
                // Cuando se ejecute, target representa el momento exacto del corte.
                // Usamos la fecha de ese momento para cerrar de forma determinista.
                const fechaCierre = this._fechaStrFromDate(new Date()); // fecha actual al disparo
                this.cerrarDia(fechaCierre);
                // reprogramar el siguiente día
                this.programarCierreDiario(cutoffHour, cutoffMinute);
            }, waitMs);
        } catch (e) {
            console.error("Error programando cierre diario:", e);
        }
    }

    vaciarHistoricos() {
        const pref = this.prefijoHist;
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(pref)) toRemove.push(k);
        }
        toRemove.forEach(k => localStorage.removeItem(k));
    }
}

/* ===========================================================
   EXPORTADOR
   =========================================================== */
export class Exportador {
    constructor(usuario) {
        this.usuario = usuario || 'admin';
        this.pref = `registro_${this.usuario}_`;
    }

    obtenerTodos() {
        const out = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith(this.pref)) continue;
            try { out.push({ clave: k, datos: JSON.parse(localStorage.getItem(k)) }); } catch(e) {}
        }
        out.sort((a,b) => a.clave.localeCompare(b.clave));
        return out;
    }

    vaciar() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(this.pref)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
    }
}

