const sectionPrincipal = document.getElementById("sectionPrincipal");
const sectionProductos = document.getElementById("sectionProductos");
const sectionaccount = document.getElementById("sectionaccount");
const detalleProducto = document.getElementById("detalleProducto");
const sectioncart = document.getElementById("sectioncart");

const btnAgendate = document.getElementById("btnAgendate"); 
const btnProductos = document.getElementById("btnProductos");
const btnaccount = document.getElementById("btnaccount");
const btnLogo = document.querySelector(".site-logo");
const btncart = document.getElementById("btncart");

function ocultarTodo() {
    if (sectionPrincipal) sectionPrincipal.classList.add("hidden");
    if (sectionProductos) sectionProductos.classList.add("hidden");
    if (sectionaccount) sectionaccount.classList.add("hidden");
    if (detalleProducto) detalleProducto.classList.add("hidden");
    if (sectioncart) sectioncart.classList.add("hidden");
}


export function mostrarPrincipal() {
    ocultarTodo();
    if (sectionPrincipal) sectionPrincipal.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostrarProductos() {
    ocultarTodo();
    if (sectionProductos) sectionProductos.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostraraccount() {
    ocultarTodo();
    if (sectionaccount) sectionaccount.classList.remove("hidden");
    window.scrollTo(0, 0);
}

export function mostrarcart() {
    ocultarTodo();
    if (sectioncart) sectioncart.classList.remove("hidden");
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

if (btnaccount) {
    btnaccount.addEventListener("click", (e) => {
        e.preventDefault();
        mostraraccount();
    });
}

if (btncart) {
    btncart.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarcart();
    });
}


document.addEventListener("DOMContentLoaded", () => {
    mostrarPrincipal();
});
