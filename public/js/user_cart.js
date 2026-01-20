const API_CART = "http://localhost:3000/api/cart";
const CART_KEY = "agendatech_cart_v1";

const ENVIO = 5000;
const IVA_PERCENT = 0.19; 

let cart = [];
let userLogueado = null; 

const cartlist = document.getElementById("cartlist");
const subtotalcart = document.getElementById("subtotalcart");
const impuestoscart = document.getElementById("impuestoscart");
const enviocart = document.getElementById("enviocart");
const totalcart = document.getElementById("totalcart");
const btnpay = document.getElementById("btnpay");

export function inicializarcart(user = null) {
    userLogueado = user;
    
    if (userLogueado?.id) {
        cargarcartDB();
    } else {
        cargarcartLocal();
    }
}

function cargarcartLocal() {
    const data = localStorage.getItem(CART_KEY);
    cart = data ? JSON.parse(data) : [];
    rendercart();
}

async function cargarcartDB() {
    if (!userLogueado?.id) return;
    
    try {
        const res = await fetch(`${API_CART}/${userLogueado.id}`);
        if (!res.ok) throw new Error("Error cargando cart");
        
        const items = await res.json();
        
        cart = items.map(item => ({
            cart_item_id: item.cart_item_id,
            id: item.product_id,
            nombre: item.name,
            imagen: item.image,
            precio: parseFloat(item.unit_price),
            cantidad: item.quantity
        }));
        
        rendercart();
    } catch (err) {
        console.error("Error cargando cart:", err);
        cargarcartLocal();
    }
}

function guardarcart() {
    if (userLogueado?.id) {
        return;
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function rendercart() {
    if (!cartlist) return;
    
    cartlist.innerHTML = "";
    
    if (cart.length === 0) {
        cartlist.innerHTML = `
            <div class="text-center py-5">
                <img src="src/img/empty-cart.png" alt="carrito vacío" style="width:120px;opacity:0.5;" onerror="this.style.display='none'">
                <p class="text-muted mt-3">Tu carrito está vacío</p>
                <a href="#" class="btn btn-primary mt-2" onclick="irAProductos()">Ver Productos</a>
            </div>
        `;
        actualizarTotales(0, 0, 0);
        return;
    }

    cart.forEach((producto, index) => {
        const subtotalItem = producto.precio * producto.cantidad;
        
        cartlist.innerHTML += `
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

function calcularTotales() {
    const subtotal = cart.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const envio = subtotal > 0 ? ENVIO : 0;
    const total = subtotal + impuestos + envio;
    
    actualizarTotales(subtotal, impuestos, envio, total);
}

function actualizarTotales(subtotal, impuestos, envio, total = 0) {
    if (subtotalcart) subtotalcart.textContent = `$${subtotal.toLocaleString('es-CO')}`;
    if (impuestoscart) impuestoscart.textContent = `$${impuestos.toLocaleString('es-CO')}`;
    if (enviocart) enviocart.textContent = envio > 0 ? `$${envio.toLocaleString('es-CO')}` : "Gratis";
    if (totalcart) totalcart.textContent = `$${total.toLocaleString('es-CO')}`;
    
    if (btnpay) {
        btnpay.disabled = cart.length === 0;
    }
}

export async function agregarAlcart(producto) {
    if (!producto || !producto.id || !producto.precio) {
        alert("❌ Error: producto inválido");
        return;
    }

    const existente = cart.find(p => p.id === producto.id);

    if (existente) {
        existente.cantidad++;
    } else {
        cart.push({
            id: producto.id,
            nombre: producto.nombre || producto.name,
            imagen: producto.imagen || producto.image,
            precio: parseFloat(producto.precio || producto.price),
            cantidad: 1
        });
    }

    if (userLogueado?.id) {
        await agregarAcartDB(producto.id, producto.precio);
    } else {
        guardarcart();
    }

    rendercart();
    
    mostrarNotificacion("✅ Producto agregado al cart");
}

async function agregarAcartDB(product_id, unit_price) {
    if (!userLogueado?.id) return;
    
    try {
        const res = await fetch(`${API_CART}/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: userLogueado.id,
                product_id,
                unit_price,
                quantity: 1
            })
        });
        
        if (!res.ok) throw new Error("Error agregando a DB");
    } catch (err) {
        console.error("Error DB:", err);
        guardarcart();
    }
}

window.cambiarCantidad = async function(index, delta) {
    if (index < 0 || index >= cart.length) return;
    
    const producto = cart[index];
    producto.cantidad += delta;

    if (producto.cantidad <= 0) {
        await eliminarProducto(index);
        return;
    }

    if (userLogueado?.id && producto.cart_item_id) {
        await actualizarCantidadDB(producto.cart_item_id, producto.cantidad);
    } else {
        guardarcart();
    }

    rendercart();
};

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

window.eliminarProducto = async function(index) {
    if (index < 0 || index >= cart.length) return;
    
    if (!confirm("¿Eliminar este producto del cart?")) return;
    
    const producto = cart[index];
    
    if (userLogueado?.id && producto.cart_item_id) {
        await eliminarDeDB(producto.cart_item_id);
    }
    
    cart.splice(index, 1);
    
    guardarcart();
    rendercart();
    
    mostrarNotificacion("🗑️ Producto eliminado");
};

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

export async function vaciarcart() {
    if (cart.length === 0) return;
    
    if (!confirm("¿Vaciar todo el cart?")) return;
    
    if (userLogueado?.id) {
        await vaciarcartDB();
    }
    
    cart = [];
    guardarcart();
    rendercart();
    
    mostrarNotificacion("🗑️ cart vaciado");
}

async function vaciarcartDB() {
    try {
        await fetch(`${API_CART}/clear/${userLogueado.id}`, {
            method: "DELETE"
        });
    } catch (err) {
        console.error("Error vaciando cart DB:", err);
    }
}

if (btnpay) {
    btnpay.addEventListener("click", async () => {
        if (cart.length === 0) {
            alert("❌ El carrito está vacío");
            return;
        }

        if (!userLogueado?.id) {
            alert("⚠️ Debes iniciar sesión para continuar con el payment");
            return;
        }

        await procesarCheckout();
    });
}

async function procesarCheckout() {
    const subtotal = cart.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const total = subtotal + impuestos + ENVIO;

    console.log("Procesando payment por:", total);

    try {
        const res = await fetch(`${API_CART}/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customer_id: userLogueado.id,
                success_url: `${window.location.origin}/checkout-success.html`,
                failure_url: `${window.location.origin}/checkout-failure.html`,
                shipping: ENVIO,
                tax_percent: IVA_PERCENT
            })
        });

        if (!res.ok) throw new Error("Error en checkout");

        const data = await res.json();
        
        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            throw new Error("No se recibió URL de payment");
        }

    } catch (err) {
        console.error("Error en checkout:", err);
        alert("❌ Error procesando el pago. Intenta nuevamente.");
    }
}

export async function migrarcartAlLogin(user) {
    if (!user?.id) return;
    
    const cartLocal = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    
    if (cartLocal.length === 0) {
        userLogueado = user;
        await cargarcartDB();
        return;
    }

    for (const producto of cartLocal) {
        await agregarAcartDB(producto.id, producto.precio);
    }

    localStorage.removeItem(CART_KEY);
    
    userLogueado = user;
    await cargarcartDB();
    
    mostrarNotificacion("cart sincronizado");
}

export function logoutcart() {
    userLogueado = null;
    cart = [];
    localStorage.removeItem(CART_KEY);
    rendercart();
}

export function obtenerResumencart() {
    const subtotal = cart.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const impuestos = subtotal * IVA_PERCENT;
    const total = subtotal + impuestos + ENVIO;
    
    return {
        items: cart.length,
        cantidad: cart.reduce((sum, p) => sum + p.cantidad, 0),
        subtotal,
        impuestos,
        envio: ENVIO,
        total
    };
}

function mostrarNotificacion(mensaje) {
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

window.irAProductos = function() {
    const sectionProductos = document.getElementById("sectionProductos");
    const sectioncart = document.getElementById("sectioncart");
    
    if (sectioncart) sectioncart.classList.add("hidden");
    if (sectionProductos) sectionProductos.classList.remove("hidden");
};

document.addEventListener("DOMContentLoaded", () => {
    const userData = sessionStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;
    
    inicializarcart(user);
});