const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
    console.log("📥 Body:", req.body);

    const { actual, nueva } = req.body;
    const userId = req.session.userId;

    if (!actual || !nueva) {
        console.log("❌ Faltan datos");
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const [rows] = await db.promise().query(
            "SELECT password FROM User WHERE id = ?",
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const passwordActual = rows[0].password;

        const coincide = await bcrypt.compare(actual, passwordActual);
        if (!coincide) {
            return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }

        const nuevaHash = await bcrypt.hash(nueva, 10);

        await db.promise().query(
            "UPDATE User SET password = ? WHERE id = ?",
            [nuevaHash, userId]
        );

        return res.json({ message: "Contraseña actualizada correctamente" });

    } catch (err) {
        console.error("❌ ERROR:", err);

        return res.status(500).json({ message: "Error del servidor" });
    }
});

module.exports = router;
