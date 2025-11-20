// routes/cart.js
const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const mercadopago = require("mercadopago");
require("dotenv").config();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || ""
});

// Helper: consulta carrito por customer_id
function getCartItems(customer_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT sc.id as cart_item_id, sc.customer_id, sc.product_id, sc.quantity, sc.unit_price,
             p.name, p.image, p.price as product_price
      FROM ShoppingCart sc
      LEFT JOIN Product p ON p.id = sc.product_id
      WHERE sc.customer_id = ?
    `;
    db.query(sql, [customer_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// LISTAR carrito (por customer_id). Si no hay customer_id -> 400.
router.get("/:customer_id", async (req, res) => {
  const customer_id = req.params.customer_id;
  if (!customer_id) return res.status(400).json({ error: "Falta customer_id" });
  try {
    const items = await getCartItems(customer_id);
    // calcular subtotal por item
    const mapped = items.map(it => ({
      cart_item_id: it.cart_item_id,
      product_id: it.product_id,
      name: it.name,
      image: it.image,
      unit_price: it.unit_price || it.product_price,
      quantity: it.quantity,
      subtotal: parseFloat(( (it.unit_price || it.product_price) * it.quantity ).toFixed(2))
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando carrito" });
  }
});

// AÑADIR al carrito -> Si customer_id existe: guarda en DB (ShoppingCart). Si viene customer_id=null: devuelve 400 (frontend guardará local)
router.post("/add", (req, res) => {
  const { customer_id, product_id, unit_price, quantity = 1 } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id requerido (si quieres persistir en BD)." });

  // insert or update quantity (unique key on customer_id+product_id)
  const sql = `
    INSERT INTO ShoppingCart (customer_id, product_id, unit_price, quantity)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price = VALUES(unit_price)
  `;
  db.query(sql, [customer_id, product_id, unit_price, quantity], (err, r) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error añadiendo carrito" });
    }
    return res.json({ message: "Producto añadido" });
  });
});

// ACTUALIZAR cantidad
router.put("/quantity", (req, res) => {
  const { cart_item_id, quantity } = req.body;
  if (!cart_item_id || !quantity) return res.status(400).json({ error: "cart_item_id y quantity requeridos" });

  db.query("UPDATE ShoppingCart SET quantity = ? WHERE id = ?", [quantity, cart_item_id], (err) => {
    if (err) return res.status(500).json({ error: "Error actualizando cantidad" });
    res.json({ message: "Cantidad actualizada" });
  });
});

// ELIMINAR item (by cart item id)
router.delete("/item/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM ShoppingCart WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error eliminando item" });
    res.json({ message: "Item eliminado" });
  });
});

// VACÍAR carrito (por customer_id)
router.delete("/clear/:customer_id", (req, res) => {
  const customer_id = req.params.customer_id;
  db.query("DELETE FROM ShoppingCart WHERE customer_id = ?", [customer_id], (err) => {
    if (err) return res.status(500).json({ error: "Error vaciando carrito" });
    res.json({ message: "Carrito vaciado" });
  });
});

// CHECKOUT -> crea preferencia Mercado Pago y devuelve init_point
// body: { customer_id, success_url, failure_url, shipping, tax_percent }
router.post("/checkout", async (req, res) => {
  const { customer_id, success_url, failure_url, shipping = 0, tax_percent = 0 } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id requerido para checkout" });

  try {
    const items = await getCartItems(customer_id);
    if (!items || items.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    const mpItems = items.map(it => ({
      id: String(it.product_id),
      title: it.name,
      quantity: it.quantity,
      unit_price: parseFloat((it.unit_price || it.product_price).toFixed(2)),
    }));

    // podemos añadir shipping como item
    if (shipping > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: parseFloat(shipping)
      });
    }

    const host = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const pref = {
      items: mpItems,
      back_urls: {
        success: success_url || `${host}/checkout-success.html`,
        failure: failure_url || `${host}/checkout-failure.html`,
        pending: `${host}/checkout-pending.html`
      },
      auto_return: "approved",
      external_reference: String(customer_id),
      metadata: { customer_id: String(customer_id) }
    };

    const response = await mercadopago.preferences.create(pref);
    res.json({ init_point: response.body.init_point, preference_id: response.body.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando preferencia Mercado Pago" });
  }
});

module.exports = router;
