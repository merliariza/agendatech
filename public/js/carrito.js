// ====================================
// CARRITO COMPLETO - AGENDATECH
// Soporta localStorage (invitado) + DB (usuario logueado)
// ====================================

const API_CART = "http://localhost:3000/api/carrito";
const CART_KEY = "agendatech_carrito_v1";

// Configuración
const ENVIO = 5000;
const IVA_PERCENT = 0.19; // 19%

// Estado del carrito
let carrito = [];
let usuarioLogueado = null; // {id, nombre, email}

// Elementos DOM
const carritoLista = document.getElementById("carritoLista");
const subtotalCarrito = document.getElementById("subtotalCarrito");
const impuestosCarrito = document.getElementById("impuestosCarrito");
const envioCarrito = document.getElementById("envioCarrito");
const totalCarrito = document.getElementById("totalCarrito");
const btnPagar = document.getElementById("btnPagar");

// ====================================
// INICIALIZACIÓN
// ====================================
export function inicializarCarrito(usuario = null) {
    usuarioLogueado = usuario;
    
    if (usuarioLogueado?.id) {
        // Usuario logueado: cargar desde DB
        cargarCarritoDB();
    } else {
        // Invitado: usar localStorage
        cargarCarritoLocal();
    }
}

// ====================================
// CARGAR CARRITO (LOCAL)
// ====================================
function cargarCarritoLocal() {
    const data = localStorage.getItem(CART_KEY);
    carrito = data ? JSON.parse(data) : [];
    renderCarrito();
}

// ====================================
// CARGAR CARRITO (DB)
// ====================================
async function cargarCarritoDB() {
    if (!usuarioLogueado?.id) return;
    
    try {
        const res = await fetch(`${API_CART}/${usuarioLogueado.id}`);
        if (!res.ok) throw new Error("Error cargando carrito");
        
        const items = await res.json();
        
        // Mapear a formato interno
        carrito = items.map(item => ({
            cart_item_id: item.cart_item_id,
            id: item.product_id,
            nombre: item.name,
            imagen: item.image,
            precio: parseFloat(item.unit_price),
            cantidad: item.quantity
        }));
        
        renderCarrito();
    } catch (err) {
        console.error("Error cargando carrito:", err);
        // Fallback a localStorage
        cargarCarritoLocal();
    }
}

// ====================================
// GUARDAR CARRITO
// ====================================
function guardarCarrito() {
    if (usuarioLogueado?.id) {
        // No guardamos en localStorage si está logueado
        // La DB ya tiene los datos actualizados
        return;
    }
    
    // Invitado: guardar en localStorage
    localStorage.setItem(CART_KEY, JSON.stringify(carrito));
}

// ====================================
// RENDERIZAR CARRITO
// ====================================
export function renderCarrito() {
    if (!carritoLista) return;
    
    carritoLista.innerHTML = "";
    
    if (carrito.length === 0) {
        carritoLista.innerHTML = `
            <div class="text-center py-5">
                <img src="src/img/empty-cart.png" alt="Carrito vacío" style="width:120px;opacity:0.5;" onerror="this.style.display='none'">
                <p class="text-muted mt-3">Tu carrito está vacío</p>
                <a href="#" class="btn btn-primary mt-2" onclick="irAProductos()">Ver Productos</a>
            </div>
        `;
        actualizarTotales(0, 0, 0);
        return;
    }

    carrito.forEach((producto, index) => {
        const subtotalItem = producto.precio * producto.cantidad;
        
        carritoLista.innerHTML += `
            <div class="cart-item d-flex align-items-center justify-content-between p-3 mb-3 shadow-sm rounded" data-index="${index}">
                
                <div class="d-flex align-items-center gap-3">
                    <img src="${producto.imagen || 'src/img/default-product.png'}" 
                         class="cart-img" 
                         alt="${producto.nombre}"
                         style="width:80px;height:80px;object-fit:cover;border-radius:8px;">
                    <div>
                        <h5 class="m-0 fw-semibold">${producto.nombre}</h5>
                        <p class="m-0 text-muted">$${producto.precio.toLocaleString('es-CO')}</p>
                        <p class="m-0 small text-primary fw-bold">Subtotal: $${subtotalItem.toLocaleString('es-CO')}</p>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <button class="qty-btn" onclick="window.cambiarCantidad(${index}, -1)" title="Disminuir">−</button>
                    <span class="fw-semibold px-2">${producto.cantidad}</span>
                    <button class="qty-btn" onclick="window.cambiarCantidad(${index}, 1)" title="Aumentar">+</button>
                    <button class="btn btn-sm btn-danger ms-2" onclick="window.eliminarProducto(${index})" title="Eliminar">🗑️</button>
                </div>

            </div>
        `;
    });

    calcularTotales();
}

// ====================================
// CALCULAR TOTALES
// ====================================
function calcularTotales() {
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const envio = subtotal > 0 ? ENVIO : 0;
    const total = subtotal + impuestos + envio;
    
    actualizarTotales(subtotal, impuestos, envio, total);
}

function actualizarTotales(subtotal, impuestos, envio, total = 0) {
    if (subtotalCarrito) subtotalCarrito.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    if (impuestosCarrito) impuestosCarrito.textContent = `$${impuestos.toLocaleString('es-CO')}`;
    if (envioCarrito) envioCarrito.textContent = envio > 0 ? `$${envio.toLocaleString('es-CO')}` : "Gratis";
    if (totalCarrito) totalCarrito.textContent = `$${total.toLocaleString('es-CO')}`;
    
    // Deshabilitar botón pagar si carrito vacío
    if (btnPagar) {
        btnPagar.disabled = carrito.length === 0;
    }
}

// ====================================
// AGREGAR AL CARRITO
// ====================================
export async function agregarAlCarrito(producto) {
    // Validar producto
    if (!producto || !producto.id || !producto.precio) {
        alert("❌ Error: producto inválido");
        return;
    }

    // Verificar si ya existe
    const existente = carrito.find(p => p.id === producto.id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre || producto.name,
            imagen: producto.imagen || producto.image,
            precio: parseFloat(producto.precio || producto.price),
            cantidad: 1
        });
    }

    // Guardar según modo
    if (usuarioLogueado?.id) {
        await agregarACarritoDB(producto.id, producto.precio);
    } else {
        guardarCarrito();
    }

    renderCarrito();
    
    // Feedback visual
    mostrarNotificacion("✅ Producto agregado al carrito");
}

// ====================================
// AGREGAR A CARRITO DB
// ====================================
async function agregarACarritoDB(product_id, unit_price) {
    if (!usuarioLogueado?.id) return;
    
    try {
        const res = await fetch(`${API_CART}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: usuarioLogueado.id,
                product_id,
                unit_price,
                quantity: 1
            })
        });
        
        if (!res.ok) throw new Error("Error agregando a DB");
    } catch (err) {
        console.error("Error DB:", err);
        // Fallback: guardar local
        guardarCarrito();
    }
}

// ====================================
// CAMBIAR CANTIDAD
// ====================================
window.cambiarCantidad = async function(index, delta) {
    if (index < 0 || index >= carrito.length) return;
    
    const producto = carrito[index];
    producto.cantidad += delta;

    // Si cantidad llega a 0, eliminar
    if (producto.cantidad <= 0) {
        await eliminarProducto(index);
        return;
    }

    // Actualizar en DB si está logueado
    if (usuarioLogueado?.id && producto.cart_item_id) {
        await actualizarCantidadDB(producto.cart_item_id, producto.cantidad);
    } else {
        guardarCarrito();
    }

    renderCarrito();
};

// ====================================
// ACTUALIZAR CANTIDAD EN DB
// ====================================
async function actualizarCantidadDB(cart_item_id, quantity) {
    try {
        const res = await fetch(`${API_CART}/quantity`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart_item_id, quantity })
        });
        
        if (!res.ok) throw new Error("Error actualizando cantidad");
    } catch (err) {
        console.error("Error actualizando cantidad:", err);
    }
}

// ====================================
// ELIMINAR PRODUCTO
// ====================================
window.eliminarProducto = async function(index) {
    if (index < 0 || index >= carrito.length) return;
    
    if (!confirm("¿Eliminar este producto del carrito?")) return;
    
    const producto = carrito[index];
    
    // Eliminar de DB si está logueado
    if (usuarioLogueado?.id && producto.cart_item_id) {
        await eliminarDeDB(producto.cart_item_id);
    }
    
    // Eliminar del array
    carrito.splice(index, 1);
    
    guardarCarrito();
    renderCarrito();
    
    mostrarNotificacion("🗑️ Producto eliminado");
};

// ====================================
// ELIMINAR DE DB
// ====================================
async function eliminarDeDB(cart_item_id) {
    try {
        const res = await fetch(`${API_CART}/item/${cart_item_id}`, {
            method: "DELETE"
        });
        
        if (!res.ok) throw new Error("Error eliminando de DB");
    } catch (err) {
        console.error("Error eliminando:", err);
    }
}

// ====================================
// VACIAR CARRITO
// ====================================
export async function vaciarCarrito() {
    if (carrito.length === 0) return;
    
    if (!confirm("¿Vaciar todo el carrito?")) return;
    
    // Vaciar en DB si está logueado
    if (usuarioLogueado?.id) {
        await vaciarCarritoDB();
    }
    
    carrito = [];
    guardarCarrito();
    renderCarrito();
    
    mostrarNotificacion("🗑️ Carrito vaciado");
}

async function vaciarCarritoDB() {
    try {
        await fetch(`${API_CART}/clear/${usuarioLogueado.id}`, {
            method: "DELETE"
        });
    } catch (err) {
        console.error("Error vaciando carrito DB:", err);
    }
}

// ====================================
// CHECKOUT / PAGAR
// ====================================
if (btnPagar) {
    btnPagar.addEventListener("click", async () => {
        if (carrito.length === 0) {
            alert("❌ El carrito está vacío");
            return;
        }

        if (!usuarioLogueado?.id) {
            alert("⚠️ Debes iniciar sesión para continuar con el pago");
            // Aquí podrías abrir el modal de login
            return;
        }

        // Preparar checkout con Mercado Pago
        await procesarCheckout();
    });
}

async function procesarCheckout() {
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const total = subtotal + impuestos + ENVIO;

    console.log("Procesando pago por:", total);

    try {
        const res = await fetch(`${API_CART}/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: usuarioLogueado.id,
                success_url: `${window.location.origin}/checkout-success.html`,
                failure_url: `${window.location.origin}/checkout-failure.html`,
                shipping: ENVIO,
                tax_percent: IVA_PERCENT
            })
        });

        if (!res.ok) throw new Error("Error en checkout");

        const data = await res.json();
        
        // Redirigir a Mercado Pago
        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            throw new Error("No se recibió URL de pago");
        }

    } catch (err) {
        console.error("Error en checkout:", err);
        alert("❌ Error procesando el pago. Intenta nuevamente.");
    }
}

// ====================================
// MIGRAR CARRITO LOCAL A DB
// ====================================
export async function migrarCarritoAlLogin(usuario) {
    if (!usuario?.id) return;
    
    const carritoLocal = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    
    if (carritoLocal.length === 0) {
        usuarioLogueado = usuario;
        await cargarCarritoDB();
        return;
    }

    // Migrar cada producto al carrito DB
    for (const producto of carritoLocal) {
        await agregarACarritoDB(producto.id, producto.precio);
    }

    // Limpiar localStorage
    localStorage.removeItem(CART_KEY);
    
    // Actualizar usuario y recargar carrito
    usuarioLogueado = usuario;
    await cargarCarritoDB();
    
    mostrarNotificacion("✅ Carrito sincronizado");
}

// ====================================
// CERRAR SESIÓN
// ====================================
export function cerrarSesionCarrito() {
    usuarioLogueado = null;
    carrito = [];
    localStorage.removeItem(CART_KEY);
    renderCarrito();
}

// ====================================
// OBTENER INFO CARRITO
// ====================================
export function obtenerResumenCarrito() {
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const total = subtotal + impuestos + ENVIO;
    
    return {
        items: carrito.length,
        cantidad: carrito.reduce((sum, p) => sum + p.cantidad, 0),
        subtotal,
        impuestos,
        envio: ENVIO,
        total
    };
}

// ====================================
// NOTIFICACIONES
// ====================================
function mostrarNotificacion(mensaje) {
    // Crear notificación temporal
    const notif = document.createElement("div");
    notif.className = "cart-notification";
    notif.textContent = mensaje;
    notif.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}

// Estilos para animaciones (agregar al CSS)
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ====================================
// FUNCIÓN AUXILIAR PARA IR A PRODUCTOS
// ====================================
window.irAProductos = function() {
    const seccionProductos = document.getElementById("seccionProductos");
    const seccionCarrito = document.getElementById("seccionCarrito");
    
    if (seccionCarrito) seccionCarrito.classList.add("hidden");
    if (seccionProductos) seccionProductos.classList.remove("hidden");
};

// ====================================
// INICIALIZACIÓN AUTOMÁTICA
// ====================================
document.addEventListener("DOMContentLoaded", () => {
    // Intentar cargar usuario desde sessionStorage
    const userData = sessionStorage.getItem("usuario");
    const usuario = userData ? JSON.parse(userData) : null;
    
    inicializarCarrito(usuario);
});