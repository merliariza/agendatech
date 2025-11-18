const API_URL = "http://localhost:3000/api/productos";

const productosGrid = document.getElementById("productosGrid");
const buscarInput = document.getElementById("buscarProducto");

let productosPublic = [];
let categoriaActual = "Todos";

// =============================
// CARGAR PRODUCTOS
// =============================
async function cargarProductosPublic() {
    const res = await fetch(API_URL);
    productosPublic = await res.json();
    pintarTarjetas();       // Pintas tarjetas
}                           // NO llamas activarEventosTarjetas aquí

cargarProductosPublic();

// =============================
// PINTAR TARJETAS
// =============================
function pintarTarjetas() {
    let filtrados = productosPublic.filter(p => p.active === 1 || p.active === true);

    if (categoriaActual !== "Todos") {
        filtrados = filtrados.filter(p => p.category === categoriaActual);
    }

    const text = buscarInput.value.toLowerCase();
    filtrados = filtrados.filter(p =>
        p.name.toLowerCase().includes(text)
    );

    productosGrid.innerHTML = "";

    if (filtrados.length === 0) {
        productosGrid.innerHTML = "<p>No hay productos disponibles.</p>";
        return;
    }

    filtrados.forEach(p => {
        productosGrid.innerHTML += `
            <div class="product-card" data-id="${p.id}">
                <img src="${p.image}" alt="${p.name}">
                <h4>${p.name}</h4>
                <p class="price">$${p.price}</p>
                <button class="add-cart-btn">Agregar al carrito</button>
            </div>
        `;
    });

    // 🔥 Importante: los eventos se agregan cuando las tarjetas YA existen
    activarEventosTarjetas();
}

function activarEventosTarjetas() {
    document.querySelectorAll(".product-card").forEach(card => {
        card.addEventListener("click", () => {
            const id = card.dataset.id;
            mostrarDetalleProducto(id);
        });
    });
}
function mostrarDetalleProducto(id) {
    const p = productosPublic.find(x => x.id == id);
    const detalle = document.getElementById("detalleProducto");

    // Ocultar lista y mostrar detalle
    seccionProductos.classList.add("hidden");
    detalle.classList.remove("hidden");

    detalle.innerHTML = `
        <button id="volverProductos" class="btn-volver">⬅ Volver</button>

        <div class="detalle-wrapper">
            <div class="detalle-grid">
                
                <!-- Imagen -->
                <div class="detalle-img-container">
                    <img src="${p.image}" class="detalle-img">
                </div>

                <!-- Información -->
                <div class="detalle-info">
                    <h2 class="detalle-titulo">${p.name}</h2>
                    <h3 class="detalle-precio">$ ${p.price.toLocaleString()}</h3>

                    <p class="detalle-desc">${p.description ?? "Sin descripción disponible."}</p>

                    <button class="btn-add">Agregar al carrito 🛒</button>

                    <div class="contador">
                        <button class="cont-btn">-</button>
                        <span>1</span>
                        <button class="cont-btn">+</button>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Volver
    document.getElementById("volverProductos").addEventListener("click", () => {
        detalle.classList.add("hidden");
        seccionProductos.classList.remove("hidden");
    });
}


// =============================
// EVENTOS
// =============================

// Buscar mientras escribe
buscarInput.addEventListener("input", pintarTarjetas);

// Click en categorías
document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".cat-btn.active").classList.remove("active");
        btn.classList.add("active");
        categoriaActual = btn.dataset.cat;
        pintarTarjetas();
    });
});

// Seleccionar menú
const linksMenu = document.querySelectorAll("nav ul li a");

// Sección productos
const seccionProductos = document.getElementById("seccionProductos");

// Carrusel y otras secciones
const carrusel = document.querySelector(".custom-carousel-container");

function ocultarTodo() {
    seccionProductos.classList.add("hidden");
    carrusel.classList.remove("hidden");  // el carrusel vuelve a mostrarse si te vas
}

// Evento para cada link
linksMenu.forEach(link => {
    link.addEventListener("click", (e) => {
        const texto = link.textContent.trim();

        if (texto === "Productos") {
            e.preventDefault();
            mostrarProductos();
        } else {
            ocultarTodo();
        }
    });
});
