const seccionPrincipal = document.getElementById("seccionPrincipal");
const seccionProductos = document.getElementById("seccionProductos");
const seccionCuenta = document.getElementById("seccionCuenta");
const detalleProducto = document.getElementById("detalleProducto");
const seccionCarrito = document.getElementById("seccionCarrito");

const btnAgendate = document.getElementById("btnAgendate"); 
const btnProductos = document.getElementById("btnProductos");
const btnCuenta = document.getElementById("btnCuenta");
const btnLogo = document.querySelector(".site-logo");
const btnCarrito = document.getElementById("btnCarrito");

function ocultarTodo() {
    if (seccionPrincipal) seccionPrincipal.classList.add("hidden");
    if (seccionProductos) seccionProductos.classList.add("hidden");
    if (seccionCuenta) seccionCuenta.classList.add("hidden");
    if (detalleProducto) detalleProducto.classList.add("hidden");
    if (seccionCarrito) seccionCarrito.classList.add("hidden");
}


export function mostrarPrincipal() {
    ocultarTodo();
    if (seccionPrincipal) seccionPrincipal.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostrarProductos() {
    ocultarTodo();
    if (seccionProductos) seccionProductos.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostrarCuenta() {
    ocultarTodo();
    if (seccionCuenta) seccionCuenta.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostrarCarrito() {
    ocultarTodo();
    if (seccionCarrito) seccionCarrito.classList.remove("hidden");
    window.scrollTo(0, 0);
}


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

if (btnCarrito) {
    btnCarrito.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarCarrito();
    });
}


document.addEventListener("DOMContentLoaded", () => {
    mostrarPrincipal();
});
