const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");
const upload = require("../middlewares/upload.js");

// Obtener todos
router.get("/", (req, res) => {
    db.query("SELECT * FROM Product", (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

// Crear producto con imagen
router.post("/", upload.single("image"), (req, res) => {
    const { name, description, price, stock, min_stock, category, active } = req.body;

    const image = req.file ? req.file.filename : null;

    const sql = `
        INSERT INTO Product (name, description, price, stock, min_stock, category, active, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, description, price, stock, min_stock, category, active, image], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto registrado", id: result.insertId });
    });
});

// Actualizar producto con imagen opcional
router.put("/:id", upload.single("image"), (req, res) => {
    const id = req.params.id;
    let data = req.body;

    if (req.file) {
        data.image = req.file.filename;
    }

    db.query("UPDATE Product SET ? WHERE id = ?", [data, id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto actualizado" });
    });
});

// Eliminar
router.delete("/:id", (req, res) => {
    db.query("DELETE FROM Product WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto eliminado" });
    });
});

module.exports = router;
