const API_BASE = location.origin; 
const CART_KEY = "agendatech_cart_local_v1"; 
const TAX_PERCENT = 0.10; 
const SHIPPING = 5000; 

let userId = localStorage.getItem("userId") || null;

const cartListEl = document.getElementById("cartList");
const subtotalLabel = document.getElementById("subtotalLabel");
const shippingLabel = document.getElementById("shippingLabel");
const taxLabel = document.getElementById("taxLabel");
const totalLabel = document.getElementById("totalLabel");
const cartCountBadge = document.getElementById("cartCountBadge");
const checkoutBtn = document.getElementById("checkoutBtn");

let items = []; 

document.addEventListener("DOMContentLoaded", init);

function currency(n){ return "$" + Number(n).toLocaleString(); }

async function init(){
  await loadCart();
  render();
  checkoutBtn.addEventListener("click", onCheckout);
}

async function loadCart(){
  if (userId) {
    try {
      const res = await fetch(`${API_BASE}/api/cart/${userId}`);
      if (res.ok) {
        items = await res.json();
        
        items = items.map(it => ({
          id: it.cart_item_id,
          product_id: it.product_id,
          name: it.name,
          image: it.image,
          price: parseFloat(it.unit_price),
          quantity: parseInt(it.quantity),
          subtotal: parseFloat(it.subtotal)
        }));
        updateCount();
        return;
      }
    } catch (e) {
      console.warn("No se pudo obtener cart server:", e);
    }
  }
  items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  updateCount();
}

function saveLocal(){
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCount();
}

function updateCount(){
  const totalQty = items.reduce((s,i)=> s + (i.quantity || 0), 0);
  cartCountBadge.textContent = totalQty || "";
}

function render(){
  cartListEl.innerHTML = "";

  if (!items.length) {
    cartListEl.innerHTML = `<div style="padding:24px; color:#777;">Tu carrito está vacío</div>`;
    subtotalLabel.textContent = currency(0);
    shippingLabel.textContent = currency(0);
    taxLabel.textContent = currency(0);
    totalLabel.textContent = currency(0);
    return;
  }

  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <img src="${it.image || '/mnt/data/be587476-674d-4b2d-b145-d167cb8fd4e9.png'}" />
      <div class="meta">
        <h4>${escapeHtml(it.name)}</h4>
        <p>${currency(it.price)}</p>
      </div>
      <div class="qty-controls">
        <button class="dec">-</button>
        <span class="qty">${it.quantity}</span>
        <button class="inc">+</button>
        <button class="remove small">Eliminar</button>
      </div>
      <div style="min-width:80px; text-align:right;">
        <strong>${currency((it.price * it.quantity).toFixed(2))}</strong>
      </div>
    `;
    row.querySelector(".inc").addEventListener("click", ()=>changeQty(it, +1));
    row.querySelector(".dec").addEventListener("click", ()=>changeQty(it, -1));
    row.querySelector(".remove").addEventListener("click", ()=>removeItem(it));
    cartListEl.appendChild(row);
  });

  recalcSummary();
}

function recalcSummary(){
  const subtotal = items.reduce((s,i)=> s + (i.price * i.quantity), 0);
  const shipping = items.length ? SHIPPING : 0;
  const taxes = subtotal * TAX_PERCENT;
  const total = subtotal + shipping + taxes;

  subtotalLabel.textContent = currency(subtotal.toFixed(2));
  shippingLabel.textContent = currency(shipping.toFixed(2));
  taxLabel.textContent = currency(taxes.toFixed(2));
  totalLabel.textContent = currency(total.toFixed(2));
}

async function changeQty(item, delta){
  const newQty = Math.max(1, item.quantity + delta);

  if (userId && item.id) {
    await fetch(`${API_BASE}/api/cart/quantity`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ cart_item_id: item.id, quantity: newQty })
    });
    await loadCart();
    render();
    return;
  }

  item.quantity = newQty;
  saveLocal();
  render();
}

async function removeItem(item){
  if (userId && item.id) {
    await fetch(`${API_BASE}/api/cart/item/${item.id}`, { method: "DELETE" });
    await loadCart();
    render();
    return;
  }
  items = items.filter(i => i.product_id !== item.product_id);
  saveLocal();
  render();
}

async function onCheckout(){
  if (!items.length) return alert("carrito vacío.");

  if (!userId) {
    const mpItems = items.map(it => ({
      id: String(it.product_id),
      title: it.name,
      quantity: it.quantity,
      unit_price: parseFloat(it.price)
    }));
    return alert("Debes iniciar sesión para completar la compra (o adaptar checkout para invitados).");
  }

  try {
    const payload = {
      customer_id: userId,
      shipping: SHIPPING,
      tax_percent: TAX_PERCENT,
      success_url: `${location.origin}/checkout-success.html`,
      failure_url: `${location.origin}/checkout-failure.html`
    };
    const resp = await fetch(`${API_BASE}/api/cart/checkout`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.init_point) {
      window.location.href = data.init_point;
    } else {
      console.error(data);
      alert("Error creando preferencia de payment.");
    }
  } catch (e) {
    console.error(e);
    alert("Error procesando payment.");
  }
}

function escapeHtml(text){
  if(!text) return "";
  return text.replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
