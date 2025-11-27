import { agregarAlCarrito } from "./carrito.js";

const API_URL = "http://localhost:3000/api/productos";

const productosGrid = document.getElementById("productosGrid");
const buscarInput = document.getElementById("buscarProducto");
const seccionProductos = document.getElementById("seccionProductos");
const detalleProducto = document.getElementById("detalleProducto");

let productosPublic = [];
let categoriaActual = "Todos";

async function cargarProductosPublic() {
    try {
        const res = await fetch(API_URL);
        productosPublic = await res.json();
        console.log("✅ Productos cargados:", productosPublic.length);
        pintarTarjetas();
    } catch (err) {
        console.error("❌ Error cargando productos:", err);
        if (productosGrid) {
            productosGrid.innerHTML = "<p class='text-danger text-center py-5'>Error cargando productos</p>";
        }
    }
}

function pintarTarjetas() {
    if (!productosGrid) return;

    let filtrados = productosPublic.filter(p => p.active === 1 || p.active === true);

    if (categoriaActual !== "Todos") {
        filtrados = filtrados.filter(p => p.category === categoriaActual);
    }

    const text = buscarInput?.value.toLowerCase() || "";
    if (text) {
        filtrados = filtrados.filter(p =>
            p.name.toLowerCase().includes(text)
        );
    }

    productosGrid.innerHTML = "";

    if (filtrados.length === 0) {
        productosGrid.innerHTML = "<p class='text-center text-muted py-5'>No hay productos disponibles</p>";
        return;
    }

    filtrados.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.dataset.id = p.id;
        
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p class="price">$${parseFloat(p.price).toLocaleString('es-CO')}</p>
            <button class="add-cart-btn">🛒 Agregar</button>
        `;

        card.addEventListener("click", (e) => {
            if (!e.target.classList.contains("add-cart-btn")) {
                mostrarDetalleProducto(p.id);
            }
        });

        const btnAgregar = card.querySelector(".add-cart-btn");
        btnAgregar.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("🛒 Agregando al carrito:", p.name);
            agregarAlCarrito({
                id: p.id,
                nombre: p.name,
                imagen: p.image,
                precio: parseFloat(p.price)
            });
        });

        productosGrid.appendChild(card);
    });
}

function mostrarDetalleProducto(id) {
    const p = productosPublic.find(x => x.id == id);
    if (!p) {
        console.error("❌ Producto no encontrado:", id);
        return;
    }

    if (!detalleProducto) return;

    seccionProductos.classList.add("hidden");
    detalleProducto.classList.remove("hidden");

    let cantidadActual = 1;

    detalleProducto.innerHTML = `
        <button id="volverProductos" class="btn-volver">⬅ Volver</button>

        <div class="detalle-wrapper">
            <div class="detalle-grid">
                
                <div class="detalle-img-container">
                    <img src="${p.image}" class="detalle-img" alt="${p.name}">
                </div>

                <div class="detalle-info">
                    <h2 class="detalle-titulo">${p.name}</h2>
                    <h3 class="detalle-precio">$${parseFloat(p.price).toLocaleString('es-CO')}</h3>

                    <p class="detalle-desc">${p.description || "Sin descripción disponible"}</p>

                    <div class="contador mb-3">
                        <button class="cont-btn" id="btnRestar">−</button>
                        <span id="cantidadSpan">${cantidadActual}</span>
                        <button class="cont-btn" id="btnSumar">+</button>
                    </div>

                    <button class="btn-add" id="btnAgregarDetalle">🛒 Agregar al carrito</button>
                </div>

            </div>
        </div>
    `;

    const btnVolver = document.getElementById("volverProductos");
    const btnRestar = document.getElementById("btnRestar");
    const btnSumar = document.getElementById("btnSumar");
    const cantidadSpan = document.getElementById("cantidadSpan");
    const btnAgregarDetalle = document.getElementById("btnAgregarDetalle");

    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            detalleProducto.classList.add("hidden");
            seccionProductos.classList.remove("hidden");
        });
    }

    if (btnRestar) {
        btnRestar.addEventListener("click", () => {
            if (cantidadActual > 1) {
                cantidadActual--;
                if (cantidadSpan) cantidadSpan.textContent = cantidadActual;
                console.log("➖ Cantidad:", cantidadActual);
            }
        });
    }

    if (btnSumar) {
        btnSumar.addEventListener("click", () => {
            cantidadActual++;
            if (cantidadSpan) cantidadSpan.textContent = cantidadActual;
            console.log("➕ Cantidad:", cantidadActual);
        });
    }

    if (btnAgregarDetalle) {
        btnAgregarDetalle.addEventListener("click", () => {
            console.log(`🛒 Agregando ${cantidadActual} unidad(es) de ${p.name}`);
            
            for (let i = 0; i < cantidadActual; i++) {
                agregarAlCarrito({
                    id: p.id,
                    nombre: p.name,
                    imagen: p.image,
                    precio: parseFloat(p.price)
                });
            }
            
            setTimeout(() => {
                detalleProducto.classList.add("hidden");
                seccionProductos.classList.remove("hidden");
            }, 800);
        });
    }
}

if (buscarInput) {
    buscarInput.addEventListener("input", () => {
        console.log("🔍 Buscando:", buscarInput.value);
        pintarTarjetas();
    });
}

document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".cat-btn.active")?.classList.remove("active");
        btn.classList.add("active");
        categoriaActual = btn.dataset.cat;
        console.log("📂 Categoría:", categoriaActual);
        pintarTarjetas();
    });
});

function mostrarProductos() {
    console.log("📦 Mostrando sección productos");
    
    const seccionPrincipal = document.getElementById("seccionPrincipal");
    const seccionCuenta = document.getElementById("seccionCuenta");
    const seccionCarrito = document.getElementById("seccionCarrito");
    
    if (seccionPrincipal) seccionPrincipal.classList.add("hidden");
    if (seccionCuenta) seccionCuenta.classList.add("hidden");
    if (seccionCarrito) seccionCarrito.classList.add("hidden");
    if (detalleProducto) detalleProducto.classList.add("hidden");

    if (seccionProductos) seccionProductos.classList.remove("hidden");
    
    pintarTarjetas();
}
const linksMenu = document.querySelectorAll("nav ul li a");

linksMenu.forEach(link => {
    link.addEventListener("click", (e) => {
        const texto = link.textContent.trim();

        if (texto === "Productos") {
            e.preventDefault();
            mostrarProductos();
        }
    });
});

window.mostrarProductos = mostrarProductos;
window.mostrarDetalleProducto = mostrarDetalleProducto;

console.log("🚀 Módulo user_productos.js cargado");
cargarProductosPublic();