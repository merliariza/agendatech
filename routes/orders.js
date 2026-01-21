const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/", (req, res) => {
const sql = `
  SELECT po.*, 
         p.name, p.surname, p.email, p.phone
  FROM ProductOrder po
  LEFT JOIN Person p ON p.id = po.customer_id
  ORDER BY po.order_date DESC
`;
  
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error obteniendo pedidos:", err);
      return res.status(500).json({ error: "Error obteniendo pedidos" });
    }
    res.json(rows);
  });
});

router.get("/customer/:customer_id", (req, res) => {
  const customer_id = req.params.customer_id;
  
const sql = `
  SELECT po.*, 
         p.name, p.surname, p.email
  FROM ProductOrder po
  LEFT JOIN Person p ON p.id = po.customer_id
  WHERE po.customer_id = ?
  ORDER BY po.order_date DESC
`;
  
  db.query(sql, [customer_id], (err, rows) => {
    if (err) {
      console.error("Error obteniendo pedidos del cliente:", err);
      return res.status(500).json({ error: "Error obteniendo pedidos" });
    }
    res.json(rows);
  });
});

router.get("/:order_id", (req, res) => {
  const order_id = req.params.order_id;
  
const sqlOrder = `
  SELECT po.*, 
         p.name, p.surname, p.email, p.phone
  FROM ProductOrder po
  LEFT JOIN Person p ON p.id = po.customer_id
  WHERE po.id = ?
`;
  
  const sqlDetails = `
    SELECT pod.*, 
           pr.name, pr.image
    FROM ProductOrderDetail pod
    LEFT JOIN Product pr ON pr.id = pod.product_id
    WHERE pod.order_id = ?
  `;
  
  db.query(sqlOrder, [order_id], (err, orderRows) => {
    if (err) {
      console.error("Error obteniendo pedido:", err);
      return res.status(500).json({ error: "Error obteniendo pedido" });
    }
    
    if (!orderRows || orderRows.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    db.query(sqlDetails, [order_id], (err2, detailRows) => {
      if (err2) {
        console.error("Error obteniendo detalles:", err2);
        return res.status(500).json({ error: "Error obteniendo detalles" });
      }
      
      res.json({
        order: orderRows[0],
        items: detailRows
      });
    });
  });
});

router.put("/:order_id/status", (req, res) => {
  const order_id = req.params.order_id;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Estado requerido" });
  }
  
  const validStatuses = ['pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Estado inválido" });
  }
  
  const sql = "UPDATE ProductOrder SET status = ? WHERE id = ?";
  
  db.query(sql, [status, order_id], (err, result) => {
    if (err) {
      console.error("Error actualizando estado:", err);
      return res.status(500).json({ error: "Error actualizando estado" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    res.json({ message: "Estado actualizado correctamente", status });
  });
});

router.put("/:order_id/payment-status", (req, res) => {
  const order_id = req.params.order_id;
  const { payment_status } = req.body;
  
  if (!payment_status) {
    return res.status(400).json({ error: "Estado de pago requerido" });
  }
  
  const validStatuses = ['pendiente', 'pagado', 'fallido', 'reembolsado'];
  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ error: "Estado de pago inválido" });
  }
  
  const sql = "UPDATE ProductOrder SET payment_status = ? WHERE id = ?";
  
  db.query(sql, [payment_status, order_id], (err, result) => {
    if (err) {
      console.error("Error actualizando estado de pago:", err);
      return res.status(500).json({ error: "Error actualizando estado de pago" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    res.json({ message: "Estado de pago actualizado", payment_status });
  });
});

router.put("/:order_id/notes", (req, res) => {
  const order_id = req.params.order_id;
  const { notes } = req.body;
  
  const sql = "UPDATE ProductOrder SET notes = ? WHERE id = ?";
  
  db.query(sql, [notes, order_id], (err, result) => {
    if (err) {
      console.error("Error actualizando notas:", err);
      return res.status(500).json({ error: "Error actualizando notas" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    
    res.json({ message: "Notas actualizadas", notes });
  });
});

router.get("/stats/summary", (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pagado' THEN 1 ELSE 0 END) as paid_orders,
      SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) as cancelled_orders,
      SUM(CASE WHEN payment_status = 'pagado' THEN total_amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN payment_status = 'pagado' THEN total_amount ELSE NULL END) as avg_order_value
    FROM ProductOrder
  `;
  
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error obteniendo estadísticas:", err);
      return res.status(500).json({ error: "Error obteniendo estadísticas" });
    }
    res.json(rows[0]);
  });
});

module.exports = router;