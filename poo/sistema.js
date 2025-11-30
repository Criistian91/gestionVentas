// // poo/sistema.js
// import { Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador } from './modelos.js';

// export class SistemaPanificados {
//     constructor() {
//         this.sesion = new UsuarioSesion();
//         if (!this.sesion.estaLogueado()) {
//             alert("Debe iniciar sesión.");
//             location.href = "login.html";
//             return;
//         }

//         this.inventario = new Inventario(this.sesion.usuarioActivo);
//         this.turnos = new Turnos(this.sesion.usuarioActivo);
//         this.estadisticas = new Estadisticas(this.sesion.usuarioActivo, this);

//         this.mostrarPrecios = false;
//         this.categoriaSeleccionada = "";
//     }

//     iniciarSistema() {
//         this.configurarEventosUI();

//         try {
//             this.sesion.iniciarMonitor(10, () => {
//                 alert("Tu sesión expiró por inactividad. Vas a ser redirigido al login.");
//                 location.href = "login.html";
//             });
//         } catch (e) {
//             console.warn("No se pudo iniciar monitor de sesión:", e);
//         }

//         // Verificar y programar cierre diario
//         try {
//             this.estadisticas.verificarCierreAutomatico(23, 59);
//             this.estadisticas.programarCierreDiario(23, 59);
//         } catch (e) {
//             console.warn("Error cierre diario:", e);
//         }

//         this.cargarProductosEnPantalla();
//         this.actualizarCategorias();
//         this.cargarHorarios();
//     }

//     configurarEventosUI() {
//         const toggleBtn = document.getElementById("togglePreciosBtn");
//         if (toggleBtn) toggleBtn.addEventListener("click", () => {
//             this.mostrarPrecios = !this.mostrarPrecios;
//             this.cargarProductosEnPantalla();
//         });

//         const cerrarBtn = document.getElementById("cerrarSesionBtn");
//         if (cerrarBtn) {
//             cerrarBtn.addEventListener("click", () => {
//                 // this.guardarRegistroHistorico(true);
//                 this.sesion.cerrarSesion();
//             });
//         }

//         const addBtn = document.getElementById("addStockBtn") || document.getElementById("crearProductoBtn");
//         if (addBtn) addBtn.addEventListener("click", () => this.mostrarModalNuevoProducto());

//         const crearBtn = document.getElementById("btnCrearProducto");
//         if (crearBtn) crearBtn.addEventListener("click", (e) => { e.preventDefault(); this.crearProductoDesdeFormulario(); });

//         const btnAgregarCat = document.getElementById("btnAgregarCategoria");
//         if (btnAgregarCat) btnAgregarCat.addEventListener("click", (e) => { e.preventDefault(); this.agregarCategoriaDesdeInput(); });

//         const cierreBtn = document.getElementById("cierreDiaBtn");
//         if (cierreBtn) cierreBtn.addEventListener("click", () => {
//             if (confirm("¿Deseás cerrar el día y archivar las ventas diarias?")) {
//                 this.cierreDelDia();
//             }
//         });

//         const form = document.getElementById("formularioNuevoProducto");
//         if (form) {
//             form.addEventListener("keydown", (ev) => {
//                 if (ev.key === "Enter") { ev.preventDefault(); const crear = document.getElementById("btnCrearProducto"); if (crear) crear.click(); }
//             });
//         }
//     }

//     cargarProductosEnPantalla() {
//         const cont = document.getElementById("productosContainer");
//         if (!cont) return;
//         cont.innerHTML = "";

//         const prodList = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         this.crearSelectCategorias(prodList);

//         const filtrados = this.categoriaSeleccionada ? prodList.filter(p => p.categoria === this.categoriaSeleccionada) : prodList;

//         filtrados.forEach(p => {
//             const caja = document.createElement("div");
//             caja.className = "producto-item";
//             let html = `<h3>${p.nombre}</h3><p>Stock: ${p.stock}</p><p>Categoría: ${p.categoria || '(sin categoría)'}</p>`;
//             if (this.mostrarPrecios) {
//                 html += `<p>Precio costo: $${p.precioCosto}</p><p>Precio venta: $${p.precioVenta}</p>`;
//             }
//             const acciones = document.createElement("div"); acciones.className = "acciones";

//             const btnVender = document.createElement("button"); btnVender.textContent = "Vender"; btnVender.addEventListener("click", () => this.registrarVenta(p.id));
//             const btnDevolver = document.createElement("button"); btnDevolver.textContent = "Devolver"; btnDevolver.addEventListener("click", () => this.devolverProducto(p.id));
//             const btnSumar = document.createElement("button"); btnSumar.textContent = "Sumar stock"; btnSumar.addEventListener("click", () => this.sumarStock(p.id));
//             const btnEliminar = document.createElement("button"); btnEliminar.textContent = "Eliminar"; btnEliminar.addEventListener("click", () => { if (confirm("¿Seguro?")) { this.eliminarProducto(p.id); this.actualizarCategorias(); } });

//             acciones.appendChild(btnVender); acciones.appendChild(btnDevolver); acciones.appendChild(btnSumar); acciones.appendChild(btnEliminar);

//             caja.innerHTML = html;
//             caja.appendChild(acciones);
//             cont.appendChild(caja);
//         });

//         this.mostrarTotales();
//     }

//     crearSelectCategorias(productos) {
//         let select = document.getElementById("selectCategorias");
//         if (!select) {
//             select = document.createElement("select");
//             select.id = "selectCategorias";
//             const cont = document.getElementById("productosContainer");
//             if (cont) cont.before(select);
//         }
//         const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
//         select.innerHTML = `<option value="">Todas las categorías</option>`;
//         categorias.forEach(cat => { select.innerHTML += `<option value="${cat}">${cat}</option>`; });
//         select.value = this.categoriaSeleccionada || "";
//         select.replaceWith(select.cloneNode(true));
//         select = document.getElementById("selectCategorias");
//         if (select) select.addEventListener("change", () => { this.categoriaSeleccionada = select.value; this.cargarProductosEnPantalla(); });
//     }

//     actualizarCategorias() {
//         const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
//         const select = document.getElementById("categoriaNueva");
//         const selectVista = document.getElementById("selectCategorias");
//         if (select) {
//             select.innerHTML = `<option value="">(Seleccionar categoría)</option>`;
//             categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; select.appendChild(opt); });
//         }
//         if (selectVista) {
//             selectVista.innerHTML = `<option value="">Todas las categorías</option>`;
//             categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; selectVista.appendChild(opt); });
//             selectVista.value = this.categoriaSeleccionada || "";
//         }
//     }

//     mostrarModalNuevoProducto() {
//         const form = document.getElementById("formularioNuevoProducto");
//         if (!form) { console.error("No se encontró form"); return; }
//         this.actualizarCategorias();
//         form.style.display = form.style.display === "block" ? "none" : "block";
//         if (form.style.display === "block") { const nombre = document.getElementById("nombreInput"); if (nombre) nombre.focus(); form.scrollIntoView({ behavior: "smooth" }); }
//     }

//     agregarCategoriaDesdeInput() {
//         const input = document.getElementById("categoriaAgregar");
//         const select = document.getElementById("categoriaNueva");
//         if (!input || !select) return;
//         const valor = (input.value || "").trim();
//         if (!valor) return alert("Ingresá el nombre de la categoría.");
//         const existing = Array.from(select.options).some(o => o.value.toLowerCase() === valor.toLowerCase());
//         if (existing) { alert("La categoría ya existe."); input.value = ""; return; }
//         const opt = document.createElement("option"); opt.value = valor; opt.textContent = valor; select.appendChild(opt); select.value = valor; input.value = ""; alert("Categoría agregada.");
//     }

//     crearProductoDesdeFormulario() {
//         const nombreEl = document.getElementById('nombreInput');
//         const precioCostoEl = document.getElementById('precioCostoInput');
//         const precioVentaEl = document.getElementById('precioVentaInput');
//         const stockEl = document.getElementById('stockInput');
//         const categoriaSel = document.getElementById('categoriaNueva');
//         if (!nombreEl || !precioCostoEl || !precioVentaEl || !stockEl || !categoriaSel) return alert("Formulario incompleto.");
//         const nombre = nombreEl.value.trim(); if (!nombre) return alert('El nombre es obligatorio.');
//         const precioCosto = parseFloat(precioCostoEl.value) || 0;
//         const precioVenta = parseFloat(precioVentaEl.value) || 0;
//         const stockInicial = parseInt(stockEl.value, 10) || 0;
//         const categoria = (categoriaSel.value || "").trim();
//         const nuevo = new Producto(Date.now(), nombre, categoria, precioCosto, precioVenta, stockInicial, stockInicial, 0);
//         this.inventario.agregarProducto(nuevo);
//         this.cargarProductosEnPantalla();
//         this.actualizarCategorias();
//         nombreEl.value = ""; precioCostoEl.value = ""; precioVentaEl.value = ""; stockEl.value = ""; const catTxt = document.getElementById("categoriaAgregar"); if (catTxt) catTxt.value = "";
//         alert('Producto creado correctamente.');
//     }

//     // Registrar venta: actualiza inventario y registro diario
//     registrarVenta(id) {
//         const prod = this.inventario.buscarPorId(id);
//         if (!prod || prod.stock <= 0) return;
//         const stockAntes = Number(prod.stock);
//         if (this.inventario.registrarVenta(id)) {
//             const stockDespues = Number(prod.stock);
//             const turno = this.turnos.obtenerTurnoActual() || 'mañana';
//             const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

//             // actualiza registro diario (no tocamos inventario.vendido aquí, inventario ya lo manejó)
//             this.estadisticas.actualizarVentaEnDiario({
//                 id: prod.id,
//                 nombre: prod.nombre,
//                 categoria: prod.categoria || "",
//                 cantidad: 1,
//                 ganancia: gananciaUnidad,
//                 precioVenta: prod.precioVenta,
//                 precioCosto: prod.precioCosto,
//                 stockInicial: stockAntes,
//                 stockFinal: stockDespues
//             }, turno);

//             if (typeof this.mostrarTotales === "function") this.mostrarTotales();
//             document.dispatchEvent(new Event("ventasActualizadas"));
//             this.cargarProductosEnPantalla();
//         }
//     }

//     devolverProducto(id) {
//         const prod = this.inventario.buscarPorId(id);
//         if (!prod || prod.vendido <= 0) return;
//         const stockAntes = Number(prod.stock);
//         if (this.inventario.devolverVenta(id)) {
//             const stockDespues = Number(prod.stock);
//             const turno = this.turnos.obtenerTurnoActual() || 'mañana';
//             const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

//             this.estadisticas.actualizarVentaEnDiario({
//                 id: prod.id,
//                 nombre: prod.nombre,
//                 categoria: prod.categoria || "",
//                 cantidad: -1,
//                 ganancia: -gananciaUnidad,
//                 precioVenta: prod.precioVenta,
//                 precioCosto: prod.precioCosto,
//                 stockInicial: stockAntes,
//                 stockFinal: stockDespues
//             }, turno);

//             if (typeof this.mostrarTotales === "function") this.mostrarTotales();
//             document.dispatchEvent(new Event("ventasActualizadas"));
//             this.cargarProductosEnPantalla();
//         }
//     }

//     sumarStock(id) {
//         const cantidad = parseInt(prompt("¿Cuántas unidades agregar?"), 10);
//         if (cantidad > 0) {
//             this.inventario.sumarStock(id, cantidad);
//             this.cargarProductosEnPantalla();
//         }
//     }

//     eliminarProducto(id) {
//         if (confirm("¿Seguro que querés eliminar el producto?")) {
//             this.inventario.eliminarProducto(id);
//             this.cargarProductosEnPantalla();
//             this.actualizarCategorias();
//         }
//     }

//     mostrarTotales() {
//         const tot = this.inventario.calcularTotales();
//         // diarios viene desde Estadisticas (ingreso, ganancia, etc) pero para ventaEsperada usamos inventario (todos los productos)
//         const diarios = this.estadisticas.calcularTotalesDelDia();
//         const cont = document.getElementById("totalesContainer");
//         if (!cont) return;

//         // venta esperada -> usar inventario (producto por producto) para incluir productos sin ventas hoy
//         const ventaEsperadaHoy = this.inventario.obtenerTodos().reduce((acc, p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

//         cont.innerHTML = `
//             <p><strong>Costo total:</strong> $${tot.costoTotal}</p>
//             <p><strong>Venta esperada:</strong> $${ventaEsperadaHoy}</p>
//             <p><strong>Ingreso real (hoy):</strong> $${diarios.ingresoReal}</p>
//             <p><strong>Ganancia real (hoy):</strong> $${diarios.gananciaReal}</p>
//         `;
//     }

//     cargarHorarios() {
//         const cfg = this.turnos.config;
//         try {
//             document.getElementById("inicioManana").value = cfg.mañana.inicio;
//             document.getElementById("finManana").value = cfg.mañana.fin;
//             document.getElementById("inicioTarde").value = cfg.tarde.inicio;
//             document.getElementById("finTarde").value = cfg.tarde.fin;
//         } catch (e) { /* no hay campos */ }
//     }

//     // guardarRegistroHistorico(omitReset = false) {
//     //     try {
//     //         const productosSnapshot = this.inventario.obtenerTodos().map(p => ({
//     //             id: p.id, nombre: p.nombre, categoria: p.categoria,
//     //             precioCosto: p.precioCosto, precioVenta: p.precioVenta,
//     //             stockInicial: p.stockInicial, stock: p.stock, vendido: p.vendido || 0
//     //         }));
//     //         const hayVentas = productosSnapshot.some(p => (p.vendido || 0) > 0);
//     //         if (!hayVentas) { console.log("No hay ventas en la sesión actual: no se guarda registro histórico."); return; }
//     //         const fecha = new Date();
//     //         const yyyy = fecha.getFullYear();
//     //         const mm = String(fecha.getMonth() + 1).padStart(2, "0");
//     //         const dd = String(fecha.getDate()).padStart(2, "0");
//     //         const hh = String(fecha.getHours()).padStart(2, "0");
//     //         const min = String(fecha.getMinutes()).padStart(2, "0");
//     //         const ss = String(fecha.getSeconds()).padStart(2, "0");
//     //         const clave = `registro_${this.sesion.usuarioActivo}_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
//     //         localStorage.setItem(clave, JSON.stringify(productosSnapshot));
//     //         if (!omitReset) {
//     //             this.inventario.productos.forEach(p => { p.vendido = 0; });
//     //             this.inventario.guardar();
//     //         }
//     //         console.log("Registro histórico guardado:", clave);
//     //     } catch (e) { console.error("Error guardando registro histórico:", e); }
//     // }

//     cierreDelDia() {
//         try {
//             const ok = this.estadisticas.cerrarDia();
//             if (ok) {
//                 alert("Cierre del día realizado y archivado.");
//                 if (typeof this.mostrarTotales === 'function') this.mostrarTotales();
//                 document.dispatchEvent(new Event('ventasActualizadas'));
//                 this.cargarProductosEnPantalla();
//             } else {
//                 alert("No había registro diario para cerrar.");
//             }
//         } catch (e) {
//             console.error("Error en cierre del día:", e);
//             alert("Error al cerrar el día. Revisá la consola.");
//         }
//     }
// }
















// // poo/sistema.js
// import { Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador } from './modelos.js';

// export class SistemaPanificados {
//     constructor() {
//         this.sesion = new UsuarioSesion();
//         if (!this.sesion.estaLogueado()) {
//             alert("Debe iniciar sesión.");
//             location.href = "login.html";
//             return;
//         }

//         this.inventario = new Inventario(this.sesion.usuarioActivo);
//         this.turnos = new Turnos(this.sesion.usuarioActivo);
//         this.estadisticas = new Estadisticas(this.sesion.usuarioActivo);

//         this.mostrarPrecios = false;
//         this.categoriaSeleccionada = "";
//     }

//     iniciarSistema() {
//         this.configurarEventosUI();

//         try {
//             this.sesion.iniciarMonitor(10, () => {
//                 alert("Tu sesión expiró por inactividad. Vas a ser redirigido al login.");
//                 location.href = "login.html";
//             });
//         } catch (e) {
//             console.warn("No se pudo iniciar monitor de sesión:", e);
//         }

//         try {
//             this.estadisticas.verificarCierreAutomatico(23, 59);
//             this.estadisticas.programarCierreDiario(23, 59);
//         } catch (e) {
//             console.warn("Error cierre diario:", e);
//         }

//         this.cargarProductosEnPantalla();
//         this.actualizarCategorias();
//         this.cargarHorarios();
//     }

//     configurarEventosUI() {
//         const toggleBtn = document.getElementById("togglePreciosBtn");
//         if (toggleBtn) toggleBtn.addEventListener("click", () => {
//             this.mostrarPrecios = !this.mostrarPrecios;
//             this.cargarProductosEnPantalla();
//         });

//         const cerrarBtn = document.getElementById("cerrarSesionBtn");
//         if (cerrarBtn) {
//             cerrarBtn.addEventListener("click", () => {
//                 this.sesion.cerrarSesion();
//             });
//         }

//         const addBtn = document.getElementById("addStockBtn") || document.getElementById("crearProductoBtn");
//         if (addBtn) addBtn.addEventListener("click", () => this.mostrarModalNuevoProducto());

//         const crearBtn = document.getElementById("btnCrearProducto");
//         if (crearBtn) crearBtn.addEventListener("click", (e) => { e.preventDefault(); this.crearProductoDesdeFormulario(); });

//         const btnAgregarCat = document.getElementById("btnAgregarCategoria");
//         if (btnAgregarCat) btnAgregarCat.addEventListener("click", (e) => { e.preventDefault(); this.agregarCategoriaDesdeInput(); });

//         const cierreBtn = document.getElementById("cierreDiaBtn");
//         if (cierreBtn) cierreBtn.addEventListener("click", () => {
//             if (confirm("¿Deseás cerrar el día y archivar las ventas diarias?")) {
//                 this.cierreDelDia();
//             }
//         });

//         const form = document.getElementById("formularioNuevoProducto");
//         if (form) {
//             form.addEventListener("keydown", (ev) => {
//                 if (ev.key === "Enter") { ev.preventDefault(); const crear = document.getElementById("btnCrearProducto"); if (crear) crear.click(); }
//             });
//         }
//     }

//     cargarProductosEnPantalla() {
//         const cont = document.getElementById("productosContainer");
//         if (!cont) return;
//         cont.innerHTML = "";

//         const prodList = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         this.crearSelectCategorias(prodList);

//         const filtrados = this.categoriaSeleccionada ? prodList.filter(p => p.categoria === this.categoriaSeleccionada) : prodList;

//         filtrados.forEach(p => {
//             const caja = document.createElement("div");
//             caja.className = "producto-item";
//             let html = `<h3>${p.nombre}</h3><p>Stock: ${p.stock}</p><p>Categoría: ${p.categoria || '(sin categoría)'}</p>`;
//             if (this.mostrarPrecios) {
//                 html += `<p>Precio costo: $${p.precioCosto}</p><p>Precio venta: $${p.precioVenta}</p>`;
//             }
//             const acciones = document.createElement("div"); acciones.className = "acciones";

//             const btnVender = document.createElement("button"); btnVender.textContent = "Vender"; btnVender.addEventListener("click", () => this.registrarVenta(p.id));
//             const btnDevolver = document.createElement("button"); btnDevolver.textContent = "Devolver"; btnDevolver.addEventListener("click", () => this.devolverProducto(p.id));
//             const btnSumar = document.createElement("button"); btnSumar.textContent = "Sumar stock"; btnSumar.addEventListener("click", () => this.sumarStock(p.id));
//             const btnEliminar = document.createElement("button"); btnEliminar.textContent = "Eliminar"; btnEliminar.addEventListener("click", () => { if (confirm("¿Seguro?")) { this.eliminarProducto(p.id); this.actualizarCategorias(); } });

//             acciones.appendChild(btnVender); acciones.appendChild(btnDevolver); acciones.appendChild(btnSumar); acciones.appendChild(btnEliminar);

//             caja.innerHTML = html;
//             caja.appendChild(acciones);
//             cont.appendChild(caja);
//         });

//         this.mostrarTotales();
//     }

//     crearSelectCategorias(productos) {
//         let select = document.getElementById("selectCategorias");
//         if (!select) {
//             select = document.createElement("select");
//             select.id = "selectCategorias";
//             const cont = document.getElementById("productosContainer");
//             if (cont) cont.before(select);
//         }
//         const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
//         select.innerHTML = `<option value="">Todas las categorías</option>`;
//         categorias.forEach(cat => { select.innerHTML += `<option value="${cat}">${cat}</option>`; });
//         select.value = this.categoriaSeleccionada || "";
//         select.replaceWith(select.cloneNode(true));
//         select = document.getElementById("selectCategorias");
//         if (select) select.addEventListener("change", () => { this.categoriaSeleccionada = select.value; this.cargarProductosEnPantalla(); });
//     }

//     actualizarCategorias() {
//         const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
//         const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
//         const select = document.getElementById("categoriaNueva");
//         const selectVista = document.getElementById("selectCategorias");
//         if (select) {
//             select.innerHTML = `<option value="">(Seleccionar categoría)</option>`;
//             categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; select.appendChild(opt); });
//         }
//         if (selectVista) {
//             selectVista.innerHTML = `<option value="">Todas las categorías</option>`;
//             categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; selectVista.appendChild(opt); });
//             selectVista.value = this.categoriaSeleccionada || "";
//         }
//     }

//     mostrarModalNuevoProducto() {
//         const form = document.getElementById("formularioNuevoProducto");
//         if (!form) { console.error("No se encontró form"); return; }
//         this.actualizarCategorias();
//         form.style.display = form.style.display === "block" ? "none" : "block";
//         if (form.style.display === "block") { const nombre = document.getElementById("nombreInput"); if (nombre) nombre.focus(); form.scrollIntoView({ behavior: "smooth" }); }
//     }

//     agregarCategoriaDesdeInput() {
//         const input = document.getElementById("categoriaAgregar");
//         const select = document.getElementById("categoriaNueva");
//         if (!input || !select) return;
//         const valor = (input.value || "").trim();
//         if (!valor) return alert("Ingresá el nombre de la categoría.");
//         const existing = Array.from(select.options).some(o => o.value.toLowerCase() === valor.toLowerCase());
//         if (existing) { alert("La categoría ya existe."); input.value = ""; return; }
//         const opt = document.createElement("option"); opt.value = valor; opt.textContent = valor; select.appendChild(opt); select.value = valor; input.value = ""; alert("Categoría agregada.");
//     }

//     crearProductoDesdeFormulario() {
//         const nombreEl = document.getElementById('nombreInput');
//         const precioCostoEl = document.getElementById('precioCostoInput');
//         const precioVentaEl = document.getElementById('precioVentaInput');
//         const stockEl = document.getElementById('stockInput');
//         const categoriaSel = document.getElementById('categoriaNueva');
//         if (!nombreEl || !precioCostoEl || !precioVentaEl || !stockEl || !categoriaSel) return alert("Formulario incompleto.");
//         const nombre = nombreEl.value.trim(); if (!nombre) return alert('El nombre es obligatorio.');
//         const precioCosto = parseFloat(precioCostoEl.value) || 0;
//         const precioVenta = parseFloat(precioVentaEl.value) || 0;
//         const stockInicial = parseInt(stockEl.value, 10) || 0;
//         const categoria = (categoriaSel.value || "").trim();
//         const nuevo = new Producto(Date.now(), nombre, categoria, precioCosto, precioVenta, stockInicial, stockInicial, 0);
//         this.inventario.agregarProducto(nuevo);
//         this.cargarProductosEnPantalla();
//         this.actualizarCategorias();
//         nombreEl.value = ""; precioCostoEl.value = ""; precioVentaEl.value = ""; stockEl.value = ""; const catTxt = document.getElementById("categoriaAgregar"); if (catTxt) catTxt.value = "";
//         alert('Producto creado correctamente.');
//     }

//     registrarVenta(id) {
//         const prod = this.inventario.buscarPorId(id);
//         if (!prod || prod.stock <= 0) return;
//         const stockAntes = Number(prod.stock);
//         if (this.inventario.registrarVenta(id)) {
//             const stockDespues = Number(prod.stock);
//             const turno = this.turnos.obtenerTurnoActual() || 'mañana';
//             const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

//             this.estadisticas.actualizarVentaEnDiario({
//                 id: prod.id,
//                 nombre: prod.nombre,
//                 categoria: prod.categoria || "",
//                 cantidad: 1,
//                 ganancia: gananciaUnidad,
//                 precioVenta: prod.precioVenta,
//                 precioCosto: prod.precioCosto,
//                 stockInicial: stockAntes,
//                 stockFinal: stockDespues
//             }, turno);

//             if (typeof this.mostrarTotales === "function") this.mostrarTotales();
//             document.dispatchEvent(new Event("ventasActualizadas"));
//             this.cargarProductosEnPantalla();
//         }
//     }

//     devolverProducto(id) {
//         const prod = this.inventario.buscarPorId(id);
//         if (!prod || prod.vendido <= 0) return;
//         const stockAntes = Number(prod.stock);
//         if (this.inventario.devolverVenta(id)) {
//             const stockDespues = Number(prod.stock);
//             const turno = this.turnos.obtenerTurnoActual() || 'mañana';
//             const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

//             this.estadisticas.actualizarVentaEnDiario({
//                 id: prod.id,
//                 nombre: prod.nombre,
//                 categoria: prod.categoria || "",
//                 cantidad: -1,
//                 ganancia: -gananciaUnidad,
//                 precioVenta: prod.precioVenta,
//                 precioCosto: prod.precioCosto,
//                 stockInicial: stockAntes,
//                 stockFinal: stockDespues
//             }, turno);

//             if (typeof this.mostrarTotales === "function") this.mostrarTotales();
//             document.dispatchEvent(new Event("ventasActualizadas"));
//             this.cargarProductosEnPantalla();
//         }
//     }

//     sumarStock(id) {
//         const cantidad = parseInt(prompt("¿Cuántas unidades agregar?"), 10);
//         if (cantidad > 0) {
//             this.inventario.sumarStock(id, cantidad);
//             this.cargarProductosEnPantalla();
//         }
//     }

//     eliminarProducto(id) {
//         if (confirm("¿Seguro que querés eliminar el producto?")) {
//             this.inventario.eliminarProducto(id);
//             this.cargarProductosEnPantalla();
//             this.actualizarCategorias();
//         }
//     }

//     mostrarTotales() {
//         const tot = this.inventario.calcularTotales();
//         const diarios = this.estadisticas.calcularTotalesDelDia();
//         const cont = document.getElementById("totalesContainer");
//         if (!cont) return;

//         const ventaEsperadaHoy = this.inventario.obtenerTodos().reduce((acc, p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

//         cont.innerHTML = `
//             <p><strong>Costo total:</strong> $${tot.costoTotal}</p>
//             <p><strong>Venta esperada:</strong> $${ventaEsperadaHoy}</p>
//             <p><strong>Ingreso real (hoy):</strong> $${diarios.ingresoReal}</p>
//             <p><strong>Ganancia real (hoy):</strong> $${diarios.gananciaReal}</p>
//         `;
//     }

//     cargarHorarios() {
//         const cfg = this.turnos.config;
//         try {
//             document.getElementById("inicioManana").value = cfg.mañana.inicio;
//             document.getElementById("finManana").value = cfg.mañana.fin;
//             document.getElementById("inicioTarde").value = cfg.tarde.inicio;
//             document.getElementById("finTarde").value = cfg.tarde.fin;
//         } catch (e) { /* no hay campos */ }
//     }

//     cierreDelDia() {
//         try {
//             const ok = this.estadisticas.cerrarDia();
//             if (ok) {
//                 alert("Cierre del día realizado y archivado.");
//                 if (typeof this.mostrarTotales === 'function') this.mostrarTotales();
//                 document.dispatchEvent(new Event('ventasActualizadas'));
//                 this.cargarProductosEnPantalla();
//             } else {
//                 alert("No había registro diario para cerrar.");
//             }
//         } catch (e) {
//             console.error("Error en cierre del día:", e);
//             alert("Error al cerrar el día. Revisá la consola.");
//         }
//     }
// }





























// poo/sistema.js
import { Producto, Inventario, UsuarioSesion, Turnos, Estadisticas, Exportador } from './modelos.js';

export class SistemaPanificados {
    constructor() {
        this.sesion = new UsuarioSesion();
        if (!this.sesion.estaLogueado()) {
            alert("Debe iniciar sesión.");
            location.href = "login.html";
            return;
        }

        this.inventario = new Inventario(this.sesion.usuarioActivo);
        this.turnos = new Turnos(this.sesion.usuarioActivo);
        this.estadisticas = new Estadisticas(this.sesion.usuarioActivo);

        this.mostrarPrecios = false;
        this.categoriaSeleccionada = "";
    }

    iniciarSistema() {
        this.configurarEventosUI();

        try {
            this.sesion.iniciarMonitor(10, () => {
                alert("Tu sesión expiró por inactividad. Vas a ser redirigido al login.");
                location.href = "login.html";
            });
        } catch (e) {
            console.warn("No se pudo iniciar monitor de sesión:", e);
        }

        try {
            this.estadisticas.verificarCierreAutomatico(23, 59);
            this.estadisticas.programarCierreDiario(23, 59);
        } catch (e) {
            console.warn("Error cierre diario:", e);
        }

        this.cargarProductosEnPantalla();
        this.actualizarCategorias();
        this.cargarHorarios();
        this.mostrarAlertasDeStock(); // mostrar alertas al iniciar
    }

    configurarEventosUI() {
        const toggleBtn = document.getElementById("togglePreciosBtn");
        if (toggleBtn) toggleBtn.addEventListener("click", () => {
            this.mostrarPrecios = !this.mostrarPrecios;
            this.cargarProductosEnPantalla();
        });

        const cerrarBtn = document.getElementById("cerrarSesionBtn");
        if (cerrarBtn) {
            cerrarBtn.addEventListener("click", () => {
                this.sesion.cerrarSesion();
            });
        }

        const addBtn = document.getElementById("addStockBtn") || document.getElementById("crearProductoBtn");
        if (addBtn) addBtn.addEventListener("click", () => this.mostrarModalNuevoProducto());

        const crearBtn = document.getElementById("btnCrearProducto");
        if (crearBtn) crearBtn.addEventListener("click", (e) => { e.preventDefault(); this.crearProductoDesdeFormulario(); });

        const btnAgregarCat = document.getElementById("btnAgregarCategoria");
        if (btnAgregarCat) btnAgregarCat.addEventListener("click", (e) => { e.preventDefault(); this.agregarCategoriaDesdeInput(); });

        const cierreBtn = document.getElementById("cierreDiaBtn");
        if (cierreBtn) cierreBtn.addEventListener("click", () => {
            if (confirm("¿Deseás cerrar el día y archivar las ventas diarias?")) {
                this.cierreDelDia();
            }
        });

        const form = document.getElementById("formularioNuevoProducto");
        if (form) {
            form.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") { ev.preventDefault(); const crear = document.getElementById("btnCrearProducto"); if (crear) crear.click(); }
            });
        }
    }

    cargarProductosEnPantalla() {
        const cont = document.getElementById("productosContainer");
        if (!cont) return;
        cont.innerHTML = "";

        const prodList = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
        this.crearSelectCategorias(prodList);

        const filtrados = this.categoriaSeleccionada ? prodList.filter(p => p.categoria === this.categoriaSeleccionada) : prodList;

        filtrados.forEach(p => {
            const caja = document.createElement("div");
            caja.className = "producto-item";
            let html = `<h3>${p.nombre}</h3><p>Stock: ${p.stock}</p><p>Categoría: ${p.categoria || '(sin categoría)'}</p>`;
            if (this.mostrarPrecios) {
                html += `<p>Precio costo: $${p.precioCosto}</p><p>Precio venta: $${p.precioVenta}</p>`;
            }
            html += `<p>Min. deseado: ${p.minimoDeseado || 0}</p>`;

            const acciones = document.createElement("div"); acciones.className = "acciones";

            const btnVender = document.createElement("button"); btnVender.textContent = "Vender"; btnVender.addEventListener("click", () => this.registrarVenta(p.id));
            const btnDevolver = document.createElement("button"); btnDevolver.textContent = "Devolver"; btnDevolver.addEventListener("click", () => this.devolverProducto(p.id));
            const btnSumar = document.createElement("button"); btnSumar.textContent = "Sumar stock"; btnSumar.addEventListener("click", () => this.sumarStock(p.id));
            const btnEditar = document.createElement("button"); btnEditar.textContent = "Editar"; btnEditar.addEventListener("click", () => this.mostrarModalEditarProducto(p.id));
            const btnEliminar = document.createElement("button"); btnEliminar.textContent = "Eliminar"; btnEliminar.addEventListener("click", () => { if (confirm("¿Seguro?")) { this.eliminarProducto(p.id); this.actualizarCategorias(); } });

            acciones.appendChild(btnVender); acciones.appendChild(btnDevolver); acciones.appendChild(btnSumar);
            acciones.appendChild(btnEditar); acciones.appendChild(btnEliminar);

            caja.innerHTML = html;
            caja.appendChild(acciones);
            cont.appendChild(caja);
        });

        this.mostrarTotales();
        this.mostrarAlertasDeStock();
    }

    crearSelectCategorias(productos) {
        let select = document.getElementById("selectCategorias");
        if (!select) {
            select = document.createElement("select");
            select.id = "selectCategorias";
            const cont = document.getElementById("productosContainer");
            if (cont) cont.before(select);
        }
        const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
        select.innerHTML = `<option value="">Todas las categorías</option>`;
        categorias.forEach(cat => { select.innerHTML += `<option value="${cat}">${cat}</option>`; });
        select.value = this.categoriaSeleccionada || "";
        select.replaceWith(select.cloneNode(true));
        select = document.getElementById("selectCategorias");
        if (select) select.addEventListener("change", () => { this.categoriaSeleccionada = select.value; this.cargarProductosEnPantalla(); });
    }

    actualizarCategorias() {
        const productos = this.inventario.obtenerTodos().map(p => Object.assign(new Producto(), p));
        const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
        const select = document.getElementById("categoriaNueva");
        const selectVista = document.getElementById("selectCategorias");
        if (select) {
            select.innerHTML = `<option value="">(Seleccionar categoría)</option>`;
            categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; select.appendChild(opt); });
        }
        if (selectVista) {
            selectVista.innerHTML = `<option value="">Todas las categorías</option>`;
            categorias.forEach(cat => { const opt = document.createElement("option"); opt.value = cat; opt.textContent = cat; selectVista.appendChild(opt); });
            selectVista.value = this.categoriaSeleccionada || "";
        }
    }

    mostrarModalNuevoProducto() {
        const form = document.getElementById("formularioNuevoProducto");
        if (!form) { console.error("No se encontró form"); return; }
        this.actualizarCategorias();
        // añadimos el campo minimoDeseado si no existe en el form
        if (!document.getElementById("minimoDeseadoInput")) {
            const wrapper = document.createElement("label");
            wrapper.innerHTML = `Mínimo deseado:
                <input id="minimoDeseadoInput" type="number" min="0" value="0">`;
            form.insertBefore(wrapper, form.querySelector("#stockInput").parentElement.nextSibling);
        }
        form.style.display = form.style.display === "block" ? "none" : "block";
        if (form.style.display === "block") { const nombre = document.getElementById("nombreInput"); if (nombre) nombre.focus(); form.scrollIntoView({ behavior: "smooth" }); }
    }

    agregarCategoriaDesdeInput() {
        const input = document.getElementById("categoriaAgregar");
        const select = document.getElementById("categoriaNueva");
        if (!input || !select) return;
        const valor = (input.value || "").trim();
        if (!valor) return alert("Ingresá el nombre de la categoría.");
        const existing = Array.from(select.options).some(o => o.value.toLowerCase() === valor.toLowerCase());
        if (existing) { alert("La categoría ya existe."); input.value = ""; return; }
        const opt = document.createElement("option"); opt.value = valor; opt.textContent = valor; select.appendChild(opt); select.value = valor; input.value = ""; alert("Categoría agregada.");
    }

    crearProductoDesdeFormulario() {
        const nombreEl = document.getElementById('nombreInput');
        const precioCostoEl = document.getElementById('precioCostoInput');
        const precioVentaEl = document.getElementById('precioVentaInput');
        const stockEl = document.getElementById('stockInput');
        const categoriaSel = document.getElementById('categoriaNueva');
        const minimoEl = document.getElementById('minimoDeseadoInput');
        if (!nombreEl || !precioCostoEl || !precioVentaEl || !stockEl || !categoriaSel) return alert("Formulario incompleto.");
        const nombre = nombreEl.value.trim(); if (!nombre) return alert('El nombre es obligatorio.');
        const precioCosto = parseFloat(precioCostoEl.value) || 0;
        const precioVenta = parseFloat(precioVentaEl.value) || 0;
        const stockInicial = parseInt(stockEl.value, 10) || 0;
        const categoria = (categoriaSel.value || "").trim();
        const minimoDeseado = minimoEl ? Number(minimoEl.value || 0) : 0;
        const nuevo = new Producto(Date.now(), nombre, categoria, precioCosto, precioVenta, stockInicial, stockInicial, 0, minimoDeseado);
        this.inventario.agregarProducto(nuevo);
        this.cargarProductosEnPantalla();
        this.actualizarCategorias();
        if (nombreEl) nombreEl.value = "";
        if (precioCostoEl) precioCostoEl.value = "";
        if (precioVentaEl) precioVentaEl.value = "";
        if (stockEl) stockEl.value = "";
        if (document.getElementById("categoriaAgregar")) document.getElementById("categoriaAgregar").value = "";
        if (minimoEl) minimoEl.value = "0";
        alert('Producto creado correctamente.');
    }

    // Modal dinámico para editar producto
    mostrarModalEditarProducto(id) {
        const prod = this.inventario.buscarPorId(id);
        if (!prod) return alert("Producto no encontrado.");

        // crear overlay
        const overlay = document.createElement("div");
        overlay.className = "modal";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";

        const modal = document.createElement("div");
        modal.className = "modal-content";
        modal.style.width = "360px";

        modal.innerHTML = `
            <h3>Editar producto</h3>
            <label>Nombre: <input id="edit_nombre" type="text" value="${prod.nombre}"></label>
            <label>Categoría: <input id="edit_categoria" type="text" value="${prod.categoria || ''}"></label>
            <label>Precio costo: <input id="edit_precioCosto" type="number" step="0.01" value="${prod.precioCosto}"></label>
            <label>Precio venta: <input id="edit_precioVenta" type="number" step="0.01" value="${prod.precioVenta}"></label>
            <label>Stock: <input id="edit_stock" type="number" step="1" value="${prod.stock}"></label>
            <label>Mínimo deseado: <input id="edit_minimo" type="number" step="1" value="${prod.minimoDeseado || 0}"></label>
            <div style="margin-top:8px; display:flex; gap:8px; justify-content:flex-end;">
                <button id="btnSaveEdit">Guardar</button>
                <button id="btnCancelEdit">Cancelar</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById("btnCancelEdit").addEventListener("click", () => overlay.remove());
        document.getElementById("btnSaveEdit").addEventListener("click", () => {
            const campos = {
                nombre: document.getElementById("edit_nombre").value.trim(),
                categoria: document.getElementById("edit_categoria").value.trim(),
                precioCosto: Number(document.getElementById("edit_precioCosto").value || 0),
                precioVenta: Number(document.getElementById("edit_precioVenta").value || 0),
                stock: Number(document.getElementById("edit_stock").value || 0),
                minimoDeseado: Number(document.getElementById("edit_minimo").value || 0)
            };
            this.inventario.actualizarProducto(id, campos);
            overlay.remove();
            this.cargarProductosEnPantalla();
            this.actualizarCategorias();
            alert("Producto actualizado.");
        });
    }

    registrarVenta(id) {
        const prod = this.inventario.buscarPorId(id);
        if (!prod || prod.stock <= 0) return;
        const stockAntes = Number(prod.stock);
        if (this.inventario.registrarVenta(id)) {
            // después de registrarVenta invocamos buscarPorId de nuevo para valores actualizados
            const prodActual = this.inventario.buscarPorId(id);
            const stockDespues = Number(prodActual.stock);
            const turno = this.turnos.obtenerTurnoActual() || 'mañana';
            const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

            this.estadisticas.actualizarVentaEnDiario({
                id: prod.id,
                nombre: prod.nombre,
                categoria: prod.categoria || "",
                cantidad: 1,
                ganancia: gananciaUnidad,
                precioVenta: prod.precioVenta,
                precioCosto: prod.precioCosto,
                stockInicial: stockAntes,
                stockFinal: stockDespues
            }, turno);

            if (typeof this.mostrarTotales === "function") this.mostrarTotales();
            document.dispatchEvent(new Event("ventasActualizadas"));
            this.cargarProductosEnPantalla();
        }
    }

    devolverProducto(id) {
        const prod = this.inventario.buscarPorId(id);
        if (!prod || prod.vendido <= 0) return;
        const stockAntes = Number(prod.stock);
        if (this.inventario.devolverVenta(id)) {
            const prodActual = this.inventario.buscarPorId(id);
            const stockDespues = Number(prodActual.stock);
            const turno = this.turnos.obtenerTurnoActual() || 'mañana';
            const gananciaUnidad = (prod.precioVenta || 0) - (prod.precioCosto || 0);

            this.estadisticas.actualizarVentaEnDiario({
                id: prod.id,
                nombre: prod.nombre,
                categoria: prod.categoria || "",
                cantidad: -1,
                ganancia: -gananciaUnidad,
                precioVenta: prod.precioVenta,
                precioCosto: prod.precioCosto,
                stockInicial: stockAntes,
                stockFinal: stockDespues
            }, turno);

            if (typeof this.mostrarTotales === "function") this.mostrarTotales();
            document.dispatchEvent(new Event("ventasActualizadas"));
            this.cargarProductosEnPantalla();
        }
    }

    sumarStock(id) {
        const cantidad = parseInt(prompt("¿Cuántas unidades agregar?"), 10);
        if (cantidad > 0) {
            this.inventario.sumarStock(id, cantidad);
            this.cargarProductosEnPantalla();
        }
    }

    eliminarProducto(id) {
        if (confirm("¿Seguro que querés eliminar el producto?")) {
            this.inventario.eliminarProducto(id);
            this.cargarProductosEnPantalla();
            this.actualizarCategorias();
        }
    }

    mostrarTotales() {
        const tot = this.inventario.calcularTotales();
        const diarios = this.estadisticas.calcularTotalesDelDia();
        const cont = document.getElementById("totalesContainer");
        if (!cont) return;

        const ventaEsperadaHoy = this.inventario.obtenerTodos().reduce((acc, p) => acc + ((p.stock || 0) * (p.precioVenta || 0)), 0);

        cont.innerHTML = `
            <p><strong>Costo total:</strong> $${tot.costoTotal}</p>
            <p><strong>Venta esperada:</strong> $${ventaEsperadaHoy}</p>
            <p><strong>Ingreso real (hoy):</strong> $${diarios.ingresoReal}</p>
            <p><strong>Ganancia real (hoy):</strong> $${diarios.gananciaReal}</p>
        `;
    }

    // ---------- ALERTAS DE STOCK ----------
    mostrarAlertasDeStock() {
        // crear contenedor si no existe
        let cont = document.getElementById("alertasContainer");
        if (!cont) {
            cont = document.createElement("div");
            cont.id = "alertasContainer";
            const productosSection = document.getElementById("productosSection") || document.body;
            productosSection.insertAdjacentElement('afterend', cont);
        }
        const bajos = this.inventario.obtenerProductosBajoStock();
        cont.innerHTML = `<h2>Alertas de stock</h2>`;
        if (!bajos || bajos.length === 0) {
            cont.innerHTML += `<p>No hay productos por reponer.</p>`;
            return;
        }
        const ul = document.createElement("div");
        ul.style.display = "grid";
        ul.style.gridTemplateColumns = "repeat(auto-fit,minmax(200px,1fr))";
        ul.style.gap = "8px";
        bajos.forEach(p => {
            const nivel = Number(p.stock || 0);
            const min = Number(p.minimoDeseado || 0);
            const card = document.createElement("div");
            card.style.padding = "8px";
            card.style.borderRadius = "6px";
            card.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
            card.innerHTML = `<strong>${p.nombre}</strong><div>Stock: ${nivel}</div><div>Min: ${min}</div>`;
            // if (nivel <= 0) {
            //     card.style.background = "#ffdddd";
            //     card.style.border = "1px solid #ff6b6b";
            // } else if (nivel <= min) {
            //     card.style.background = "#fff3cd";
            //     card.style.border = "1px solid #ffd24a";
            // } else {
            //     card.style.background = "#e6ffed";
            //     card.style.border = "1px solid #7dd38d";
            // }
            card.classList.add("alerta-stock");

            if (nivel <= 0) {
                card.classList.add("alerta-roja");
            } else if (nivel <= min) {
                card.classList.add("alerta-amarilla");
            } else {
                card.classList.add("alerta-verde");
            }

            // boton rapido para sumar stock
            const btn = document.createElement("button");
            btn.textContent = "Reponer";
            btn.style.marginTop = "8px";
            btn.addEventListener("click", () => {
                const q = parseInt(prompt(`¿Cuántas unidades agregar a ${p.nombre}?`), 10);
                if (q > 0) {
                    this.inventario.sumarStock(p.id, q);
                    this.cargarProductosEnPantalla();
                }
            });
            card.appendChild(btn);
            ul.appendChild(card);
        });
        cont.appendChild(ul);
    }

    cargarHorarios() {
        const cfg = this.turnos.config;
        try {
            document.getElementById("inicioManana").value = cfg.mañana.inicio;
            document.getElementById("finManana").value = cfg.mañana.fin;
            document.getElementById("inicioTarde").value = cfg.tarde.inicio;
            document.getElementById("finTarde").value = cfg.tarde.fin;
        } catch (e) { /* no hay campos */ }
    }

    cierreDelDia() {
        try {
            const ok = this.estadisticas.cerrarDia();
            if (ok) {
                alert("Cierre del día realizado y archivado.");
                if (typeof this.mostrarTotales === 'function') this.mostrarTotales();
                document.dispatchEvent(new Event('ventasActualizadas'));
                this.cargarProductosEnPantalla();
            } else {
                alert("No había registro diario para cerrar.");
            }
        } catch (e) {
            console.error("Error en cierre del día:", e);
            alert("Error al cerrar el día. Revisá la consola.");
        }
    }
}
