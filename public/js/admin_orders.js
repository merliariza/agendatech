const API_ORDERS = "http://localhost:3000/api/orders";

let allOrders = [];
let currentOrderId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
    setupFilters();
});

async function loadOrders() {
    try {
        const res = await fetch(API_ORDERS);
        if (!res.ok) throw new Error("Error cargando pedidos");
        
        allOrders = await res.json();
        renderOrders(allOrders);
    } catch (err) {
        console.error("Error:", err);
        const tbody = document.getElementById("ordersTableBody");
        if(tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error conectando con el servidor</td></tr>`;
    }
}

function renderOrders(orders) {
    const tbody = document.getElementById("ordersTableBody");
    if (!tbody) return;
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No hay pedidos registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.name || ''} ${order.surname || ''}</td>
            <td>${formatDate(order.order_date)}</td>
            <td>$${parseFloat(order.total_amount).toLocaleString('es-CO')}</td>
            <td><span class="badge badge-${order.status}">${order.status}</span></td>
            <td><span class="badge badge-${order.payment_status}">${order.payment_status}</span></td>
            <td>${order.payment_method || 'N/A'}</td>
            <td>
                <button class="btn-view-order" onclick="viewOrderDetails(${order.id})">
                    👁️ Ver Detalles
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewOrderDetails(orderId) {
    currentOrderId = orderId;
    
    try {
        const res = await fetch(`${API_ORDERS}/${orderId}`);
        if (!res.ok) throw new Error("Error cargando detalles");
        
        const data = await res.json();
        const { order, items } = data;
        
        document.getElementById("modalOrderId").textContent = order.id;
        document.getElementById("modalOrderDate").textContent = formatDate(order.order_date);
        document.getElementById("modalCustomerName").textContent = `${order.name || 'N/A'} ${order.surname || ''}`;
        document.getElementById("modalCustomerEmail").textContent = order.email || 'N/A';
        document.getElementById("orderStatusSelect").value = order.status;
        
        const payBadge = document.getElementById("modalPaymentStatus");
        if (payBadge) {
            payBadge.textContent = order.payment_status;
            payBadge.className = `badge badge-${order.payment_status}`;
        }
        
        document.getElementById("modalPaymentMethod").textContent = order.payment_method || 'N/A';
        document.getElementById("modalShippingAddress").textContent = order.shipping_address || 'No especificada';
        document.getElementById("modalOrderNotes").textContent = order.notes || 'Sin notas';
        document.getElementById("modalOrderTotal").textContent = parseFloat(order.total_amount).toLocaleString('es-CO');
        
        const itemsTable = document.getElementById("orderItemsTable");
        if (itemsTable) {
            itemsTable.innerHTML = items.map(item => `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${item.image ? `<img src="${item.image}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : '📦'}
                            <span>${item.name || 'Producto'}</span>
                        </div>
                    </td>
                    <td>$${parseFloat(item.price).toLocaleString('es-CO')}</td>
                    <td>${item.quantity}</td>
                    <td>$${parseFloat(item.subtotal).toLocaleString('es-CO')}</td>
                </tr>
            `).join('');
        }
        
        const modal = document.getElementById("orderDetailsModal");
        if (modal) {
            modal.classList.add("active");
            modal.style.display = "flex";
        }
        
    } catch (err) {
        console.error("Error cargando modal:", err);
        alert("No se pudieron cargar los detalles.");
    }
}

async function updateOrderStatus() {
    if (!currentOrderId) return;
    
    const statusSelect = document.getElementById("orderStatusSelect");
    const newStatus = statusSelect.value;
    
    if (!confirm(`¿Cambiar estado del pedido #${currentOrderId} a "${newStatus}"?`)) return;

    try {
        const response = await fetch(`${API_ORDERS}/${currentOrderId}/status`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus }) 
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Respuesta del servidor:", result);
            throw new Error(result.error || "Error 400: Petición incorrecta");
        }

        alert("✅ Estado actualizado con éxito");
        closeOrderModal();
        loadOrders(); 

    } catch (err) {
        console.error("Error en updateOrderStatus:", err);
        alert(`❌ Error: ${err.message}`);
    }
}

function closeOrderModal() {
    const modal = document.getElementById("orderDetailsModal");
    if (modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
    }
    currentOrderId = null;
}

document.getElementById("orderDetailsModal")?.addEventListener("click", (e) => {
    if (e.target.id === "orderDetailsModal") closeOrderModal();
});

function setupFilters() {
    const ids = ["filterStatus", "filterPaymentStatus", "filterDate"];
    ids.forEach(id => document.getElementById(id)?.addEventListener("change", applyFilters));
    document.getElementById("btnClearFilters")?.addEventListener("click", () => {
        ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; });
        applyFilters();
    });
}

function applyFilters() {
    const status = document.getElementById("filterStatus").value;
    const payment = document.getElementById("filterPaymentStatus").value;
    const date = document.getElementById("filterDate").value;
    
    const filtered = allOrders.filter(o => {
        const matchStatus = !status || o.status === status;
        const matchPayment = !payment || o.payment_status === payment;
        const matchDate = !date || new Date(o.order_date).toISOString().split('T')[0] === date;
        return matchStatus && matchPayment && matchDate;
    });
    renderOrders(filtered);
}

function formatDate(dateString) {
    if(!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

window.viewOrderDetails = viewOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.closeOrderModal = closeOrderModal;