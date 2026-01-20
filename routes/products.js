const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

router.get("/", (req, res) => {
    db.query("SELECT * FROM Product", (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

router.post("/", (req, res) => {
    const {
        name,
        description,
        price,
        stock,
        min_stock,
        category,
        active,
        image     
    } = req.body;

    const sql = `
        INSERT INTO Product (name, description, price, stock, min_stock, category, active, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, description, price, stock, min_stock, category, active, image], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto registrado", id: result.insertId });
    });
});

router.put("/:id", (req, res) => {
    const id = req.params.id;

    const {
        name,
        description,
        price,
        stock,
        min_stock,
        category,
        active,
        image   
    } = req.body;

    const sql = `
        UPDATE Product
        SET name = ?, description = ?, price = ?, stock = ?, min_stock = ?, category = ?, active = ?, image = ?
        WHERE id = ?
    `;

    db.query(sql, [name, description, price, stock, min_stock, category, active, image, id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto actualizado" });
    });
});

router.delete("/:id", (req, res) => {
    db.query("DELETE FROM Product WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: "Producto eliminado" });
    });
});

module.exports = router;
