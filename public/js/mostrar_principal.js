// ============================
// CAMBIO DE SECCIONES
// ============================

const seccionPrincipal = document.getElementById("seccionPrincipal");
const seccionProductos = document.getElementById("seccionProductos");
const seccionCuenta = document.getElementById("seccionCuenta");
const detalleProducto = document.getElementById("detalleProducto");
const seccionCarrito = document.getElementById("seccionCarrito");

// Botones del menú
const navLinks = document.querySelectorAll('nav ul li a');
const btnAgendate = navLinks[0];
const btnProductos = navLinks[1];
const btnCuenta = document.getElementById("btnCuenta");
const btnLogo = document.querySelector(".site-logo");

// Botón / ícono del carrito
const btnCarrito = document.getElementById("btnCarrito");

// -------- utilitario: ocultar todo --------
function ocultarTodo() {
    if (seccionPrincipal) seccionPrincipal.classList.add("hidden");
    if (seccionProductos) seccionProductos.classList.add("hidden");
    if (seccionCuenta) seccionCuenta.classList.add("hidden");
    if (detalleProducto) detalleProducto.classList.add("hidden");
    if (seccionCarrito) seccionCarrito.classList.add("hidden"); // ← CORREGIDO
}

// -------- mostrar página principal --------
export function mostrarPrincipal() {
    ocultarTodo();
    if (seccionPrincipal) seccionPrincipal.classList.remove("hidden");
    window.scrollTo(0, 0);
}

// -------- mostrar productos --------
export function mostrarProductos() {
    ocultarTodo();
    if (seccionProductos) seccionProductos.classList.remove("hidden");
    window.scrollTo(0, 0);
}

// -------- mostrar cuenta --------
export function mostrarCuenta() {
    ocultarTodo();
    if (seccionCuenta) seccionCuenta.classList.remove("hidden");
    window.scrollTo(0, 0);
}

// -------- mostrar carrito --------
export function mostrarCarrito() {
    ocultarTodo();
    if (seccionCarrito) seccionCarrito.classList.remove("hidden");
    window.scrollTo(0, 0);
}

// ============================
// EVENTOS DEL MENÚ
// ============================

if (btnLogo) {
    btnLogo.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarPrincipal();
    });
}

if (btnAgendate) {
    btnAgendate.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarPrincipal();
    });
}

if (btnProductos) {
    btnProductos.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarProductos();
    });
}

if (btnCuenta) {
    btnCuenta.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarCuenta();
    });
}

// -------- evento botón carrito --------
if (btnCarrito) {
    btnCarrito.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarCarrito();
    });
}

// ============================
// MOSTRAR PRINCIPAL AL CARGAR
// ============================
document.addEventListener('DOMContentLoaded', () => {
    mostrarPrincipal();
});
