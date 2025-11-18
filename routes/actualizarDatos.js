const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
};

router.post("/", authMiddleware, async (req, res) => {
    console.log("📥 Body recibido:", req.body);

    const { phone, address, city, region, country } = req.body;
    const userId = req.session.userId;

    // Validación
    if (
        phone === undefined &&
        address === undefined &&
        city === undefined &&
        region === undefined &&
        country === undefined
    ) {
        return res.status(400).json({ message: "No se enviaron datos para actualizar" });
    }

    let conn;
    try {
        conn = await db.getConnection();

        // Buscar el person_id
        const [userRows] = await conn.query(
            "SELECT person_id FROM User WHERE id = ?",
            [userId]
        );

        if (!userRows.length) {
            conn.release();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const personId = userRows[0].person_id;

        // Actualizar Person
        await conn.query(
            `UPDATE Person 
             SET phone = ?, address = ?, city = ?, region = ?, country = ?
             WHERE id = ?`,
            [
                phone || null,
                address || null,
                city || null,
                region || null,
                country || null,
                personId
            ]
        );

        conn.release();

        res.json({ message: "Datos actualizados correctamente" });

    } catch (err) {
        console.error("❌ Error:", err);
        if (conn) conn.release();
        res.status(500).json({ 
            message: "Error del servidor", 
            error: err.message 
        });
    }
});

module.exports = router;
