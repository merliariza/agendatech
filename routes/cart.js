const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { MercadoPagoConfig, Preference, Payment } = require("mercadopago");
require("dotenv").config();

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "APP_USR-4962878384222526-012017-e40bfef999b66a3dcef7459a4e9a8103-3148099934"
});

const preference = new Preference(client);
const payment = new Payment(client);


function getCartItems(customer_id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT sc.id as cart_item_id, sc.customer_id, sc.product_id, sc.quantity, sc.unit_price,
             p.name, p.image, p.price as product_price, p.stock
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

function crearOrden(customer_id, total_amount, items) {
  return new Promise((resolve, reject) => {
    const sqlOrden = `
      INSERT INTO ProductOrder (customer_id, total_amount, status, payment_method, payment_status)
      VALUES (?, ?, 'pendiente', 'mercadopago', 'pendiente')
    `;
    
    db.query(sqlOrden, [customer_id, total_amount], (err, result) => {
      if (err) return reject(err);
      
      const order_id = result.insertId;
      const detalles = items.map(it => [
        order_id,
        it.product_id,
        it.quantity,
        it.unit_price || it.product_price,
        (it.unit_price || it.product_price) * it.quantity
      ]);
      
      const sqlDetalles = `
        INSERT INTO ProductOrderDetail (order_id, product_id, quantity, price, subtotal)
        VALUES ?
      `;
      
      db.query(sqlDetalles, [detalles], (err2) => {
        if (err2) return reject(err2);
        resolve(order_id);
      });
    });
  });
}

function actualizarStock(product_id, quantity, user_id, order_id) {
  return new Promise((resolve, reject) => {

    db.query('SELECT stock FROM Product WHERE id = ?', [product_id], (err, rows) => {
      if (err) return reject(err);
      if (!rows || rows.length === 0) return reject(new Error('Producto no encontrado'));
      
      const previous_stock = rows[0].stock;
      const updated_stock = previous_stock - quantity;
      
      if (updated_stock < 0) {
        return reject(new Error(`Stock insuficiente para producto ${product_id}`));
      }
      
      db.query('UPDATE Product SET stock = ? WHERE id = ?', [updated_stock, product_id], (err2) => {
        if (err2) return reject(err2);
        
        const sqlMovimiento = `
          INSERT INTO StockMovement (product_id, movement_type, quantity, previous_stock, 
                                    updated_stock, reason, reference_type, reference_id, user_id)
          VALUES (?, 'salida', ?, ?, ?, 'Venta online', 'orden', ?, ?)
        `;
        
        db.query(sqlMovimiento, [product_id, quantity, previous_stock, updated_stock, order_id, user_id], (err3) => {
          if (err3) return reject(err3);
          resolve(updated_stock);
        });
      });
    });
  });
}

function actualizarEstadoOrden(order_id, status, payment_status) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE ProductOrder SET status = ?, payment_status = ? WHERE id = ?';
    db.query(sql, [status, payment_status, order_id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

router.get("/:customer_id", async (req, res) => {
  const customer_id = req.params.customer_id;
  if (!customer_id) return res.status(400).json({ error: "Falta customer_id" });
  
  try {
    const items = await getCartItems(customer_id);
    const mapped = items.map(it => ({
      cart_item_id: it.cart_item_id,
      product_id: it.product_id,
      name: it.name,
      image: it.image,
      unit_price: it.unit_price || it.product_price,
      quantity: it.quantity,
      stock: it.stock,
      subtotal: parseFloat(((it.unit_price || it.product_price) * it.quantity).toFixed(2))
    }));
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando carrito" });
  }
});

router.post("/add", (req, res) => {
  const { customer_id, product_id, unit_price, quantity = 1 } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id requerido" });
  if (!product_id) return res.status(400).json({ error: "product_id requerido" });

  const sql = `
    INSERT INTO ShoppingCart (customer_id, product_id, unit_price, quantity)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price = VALUES(unit_price)
  `;
  
  db.query(sql, [customer_id, product_id, unit_price, quantity], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error añadiendo al carrito" });
    }
    res.json({ message: "Producto añadido" });
  });
});
router.put("/quantity", (req, res) => {
  const { cart_item_id, quantity } = req.body;
  if (!cart_item_id || !quantity) return res.status(400).json({ error: "cart_item_id y quantity requeridos" });

  db.query("UPDATE ShoppingCart SET quantity = ? WHERE id = ?", [quantity, cart_item_id], (err) => {
    if (err) return res.status(500).json({ error: "Error actualizando cantidad" });
    res.json({ message: "Cantidad actualizada" });
  });
});

router.delete("/item/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM ShoppingCart WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Error eliminando item" });
    res.json({ message: "Item eliminado" });
  });
});

router.delete("/clear/:customer_id", (req, res) => {
  const customer_id = req.params.customer_id;
  db.query("DELETE FROM ShoppingCart WHERE customer_id = ?", [customer_id], (err) => {
    if (err) return res.status(500).json({ error: "Error vaciando carrito" });
    res.json({ message: "Carrito vaciado" });
  });
});

router.post("/checkout", async (req, res) => {
  const { customer_id, shipping = 0, tax_percent = 0 } = req.body;
  if (!customer_id) return res.status(400).json({ error: "customer_id requerido para checkout" });

  try {
    const items = await getCartItems(customer_id);
    if (!items || items.length === 0) return res.status(400).json({ error: "Carrito vacío" });

    for (const item of items) {
      if (item.quantity > item.stock) {
        return res.status(400).json({ 
          error: `Stock insuficiente para ${item.name}. Disponible: ${item.stock}, solicitado: ${item.quantity}` 
        });
      }
    }

    const subtotal = items.reduce((sum, it) => sum + ((it.unit_price || it.product_price) * it.quantity), 0);
    const impuestos = subtotal * tax_percent;
    const total = subtotal + impuestos + shipping;

    const order_id = await crearOrden(customer_id, total, items);

    const mpItems = items.map(it => {
      const price = parseFloat(it.unit_price || it.product_price);
      return {
        id: String(it.product_id),
        title: it.name,
        quantity: it.quantity,
        unit_price: parseFloat(price.toFixed(2)),
      };
    });

    if (shipping > 0) {
      mpItems.push({
        id: "shipping",
        title: "Envío",
        quantity: 1,
        unit_price: parseFloat(parseFloat(shipping).toFixed(2))
      });
    }

    if (impuestos > 0) {
      mpItems.push({
        id: "tax",
        title: "IVA",
        quantity: 1,
        unit_price: parseFloat(parseFloat(impuestos).toFixed(2))
      });
    }

    const host = process.env.BASE_URL || "http://localhost:3000";
    
    const preferenceData = {
      items: mpItems,
      back_urls: {
        success: `${host}/checkout-success.html`,
        failure: `${host}/checkout-failure.html`,
        pending: `${host}/checkout-pending.html`
      },
      external_reference: String(order_id),
      statement_descriptor: "AgendaTech",
      metadata: { 
        customer_id: String(customer_id),
        order_id: String(order_id)
      }
    };
    
    console.log("📦 Preferencia a crear:", JSON.stringify(preferenceData, null, 2));

    const response = await preference.create({ body: preferenceData });
    
    console.log("✅ Preferencia creada:", response.id);
    
    res.json({ 
      init_point: response.init_point, 
      preference_id: response.id,
      order_id: order_id
    });
  } catch (err) {
    console.error("❌ Error en checkout:", err);
    res.status(500).json({ error: err.message || "Error creando preferencia Mercado Pago" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log("Webhook recibido:", { type, data });

    if (type === "payment") {
      const payment_id = data.id;
      
      const paymentData = await payment.get({ id: payment_id });
      
      console.log("Pago:", paymentData);

      const order_id = parseInt(paymentData.external_reference);
      const customer_id = parseInt(paymentData.metadata.customer_id);

      if (paymentData.status === "approved") {
   
        const sqlItems = `
          SELECT product_id, quantity 
          FROM ProductOrderDetail 
          WHERE order_id = ?
        `;
        
        db.query(sqlItems, [order_id], async (err, orderItems) => {
          if (err) {
            console.error("Error obteniendo items:", err);
            return res.sendStatus(500);
          }

          try {
            for (const item of orderItems) {
              await actualizarStock(item.product_id, item.quantity, customer_id, order_id);
            }

            await actualizarEstadoOrden(order_id, 'pagado', 'pagado');

            db.query("DELETE FROM ShoppingCart WHERE customer_id = ?", [customer_id], (err) => {
              if (err) console.error("Error vaciando carrito:", err);
            });

            console.log(`✅ Orden ${order_id} procesada exitosamente`);
            
          } catch (stockErr) {
            console.error("Error actualizando stock:", stockErr);
            await actualizarEstadoOrden(order_id, 'pagado', 'pagado');
          }
        });

      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        await actualizarEstadoOrden(order_id, 'cancelado', 'fallido');
        
      } else if (paymentData.status === "pending" || paymentData.status === "in_process") {
        await actualizarEstadoOrden(order_id, 'pendiente', 'pendiente');
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error en webhook:", err);
    res.sendStatus(500);
  }
});

router.get("/payment/status/:order_id", async (req, res) => {
  const order_id = req.params.order_id;
  
  try {
    const sql = `
      SELECT po.*, 
             p.first_name, p.last_name, p.email
      FROM ProductOrder po
      LEFT JOIN Person p ON p.id = po.customer_id
      WHERE po.id = ?
    `;
    
    db.query(sql, [order_id], (err, rows) => {
      if (err) return res.status(500).json({ error: "Error consultando orden" });
      if (!rows || rows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
      
      res.json(rows[0]);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verificando estado" });
  }
});

router.get("/order/:order_id", async (req, res) => {
  const order_id = req.params.order_id;
  
  try {
    const sqlOrden = 'SELECT * FROM ProductOrder WHERE id = ?';
    const sqlDetalles = `
      SELECT pod.*, p.name, p.image 
      FROM ProductOrderDetail pod
      LEFT JOIN Product p ON p.id = pod.product_id
      WHERE pod.order_id = ?
    `;
    
    db.query(sqlOrden, [order_id], (err, orderRows) => {
      if (err) return res.status(500).json({ error: "Error consultando orden" });
      if (!orderRows || orderRows.length === 0) return res.status(404).json({ error: "Orden no encontrada" });
      
      db.query(sqlDetalles, [order_id], (err2, detailRows) => {
        if (err2) return res.status(500).json({ error: "Error consultando detalles" });
        
        res.json({
          order: orderRows[0],
          items: detailRows
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo orden" });
  }
});

module.exports = router;