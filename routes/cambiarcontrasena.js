const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

const authMiddleware = (req, res, next) => {
    console.log("🔐 Auth check - Session:", req.session);
    console.log("🔐 userId:", req.session?.userId);
    
    if (!req.session || !req.session.userId) {
        console.log("❌ No autenticado");
        return res.status(401).json({ message: "No autenticado" });
    }
    
    console.log("✅ Usuario autenticado, ID:", req.session.userId);
    next();
};

router.post("/", authMiddleware, async (req, res) => {
    console.log("📥 Request body:", req.body);
    
    const { phone, address, city, region, country } = req.body;
    const userId = req.session.userId;

    if (!phone && !address && !city && !region && !country) {
        console.log("❌ No se enviaron datos");
        return res.status(400).json({ message: "No se enviaron datos para actualizar" });
    }

    let conn;
    try {
        console.log("🔍 Buscando usuario ID:", userId);
        conn = await db.promise().getConnection();
        
        const [userRows] = await conn.query("SELECT person_id FROM User WHERE id = ?", [userId]);
        console.log("📊 Resultados query User:", userRows.length);
        
        if (!userRows.length) {
            console.log("❌ Usuario no encontrado");
            conn.release();
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        const personId = userRows[0].person_id;
        console.log("👤 person_id encontrado:", personId);

        console.log("💾 Actualizando Person con:", { phone, address, city, region, country, personId });
        
        await conn.query(
            "UPDATE Person SET phone = ?, address = ?, city = ?, region = ?, country = ? WHERE id = ?",
            [phone || null, address || null, city || null, region || null, country || null, personId]
        );
        
        conn.release();
        console.log("✅ Datos actualizados correctamente");
        res.json({ message: "Datos actualizados correctamente" });
        
    } catch (err) {
        console.error("❌ ERROR:", err);
        if (conn) conn.release();
        res.status(500).json({ message: "Error del servidor: " + err.message });
    }
});

module.exports = router;