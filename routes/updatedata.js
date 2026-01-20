const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

const authMiddleware = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
};

router.post("/", authMiddleware, (req, res) => {
    console.log("Body recibido:", req.body);

    const { phone, address, city, region, country } = req.body;
    const userId = req.session.userId;

    if (!phone || !address || !city || !region || !country) {
        return res.status(400).json({ 
            message: "Todos los campos son obligatorios" 
        });
    }

    const queryUser = "SELECT person_id FROM User WHERE id = ?";

    db.query(queryUser, [userId], (err, userRows) => {
        if (err) {
            console.error("❌ Error obteniendo user:", err);
            return res.status(500).json({ error: err.message });
        }

        if (!userRows.length) {
            return res.status(404).json({ message: "user no encontrado" });
        }

        const personId = userRows[0].person_id;

        const updateQuery = `
            UPDATE Person
            SET phone = ?, address = ?, city = ?, region = ?, country = ?
            WHERE id = ?
        `;

        const params = [ phone, address, city, region, country, personId ];

        db.query(updateQuery, params, (err) => {
            if (err) {
                console.error("❌ Error actualizando Persona:", err);
                return res.status(500).json({ error: err.message });
            }

            res.json({ message: "Datos actualizados correctamente" });
        });
    });
});

module.exports = router;
