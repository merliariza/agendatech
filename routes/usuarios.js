const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");
const bcrypt = require("bcrypt");

// ================================
// MIDDLEWARE DE AUTENTICACIÓN
// ================================
const authMiddleware = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: "No autenticado" });
    }
    next();
};

// ================================
// LISTAR USUARIOS (GET)
// ================================
router.get("/", (req, res) => {
    const sql = `
        SELECT User.id, username, Person.name, Person.surname, Person.email, Person.role
        FROM User
        INNER JOIN Person ON User.person_id = Person.id
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
});

// ================================
// OBTENER PERFIL DEL USUARIO LOGUEADO
// ================================
router.get("/perfil", authMiddleware, (req, res) => {
    const userId = req.session.userId;
    
    const sql = `
        SELECT 
            User.username,
            Person.name,
            Person.surname,
            Person.email,
            Person.phone,
            Person.address,
            Person.city,
            Person.region,
            Person.country,
            Person.role
        FROM User
        INNER JOIN Person ON User.person_id = Person.id
        WHERE User.id = ?
    `;
    
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Error obteniendo perfil:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        res.json(result[0]);
    });
});

// ================================
// REGISTRAR USUARIO (POST)
// ================================
router.post("/", async (req, res) => {
    const { name, surname, email, username, password, role } = req.body;
    
    if (!email || !username || !password || !name || !surname) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    
    const userRole = role || "cliente";

    db.query("SELECT * FROM Person WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length > 0) return res.json({ error: "El correo ya está registrado" });

        // Crear persona
        db.query(
            "INSERT INTO Person (name, surname, email, role) VALUES (?, ?, ?, ?)",
            [name, surname, email, userRole],
            async (err, personResult) => {
                if (err) return res.status(500).json({ error: err });
                const personId = personResult.insertId;

                // Hashear password
                const hashedPass = await bcrypt.hash(password, 10);

                // Crear usuario
                db.query(
                    "INSERT INTO User (username, password, person_id) VALUES (?, ?, ?)",
                    [username, hashedPass, personId],
                    (err) => {
                        if (err) return res.status(500).json({ error: err });
                        res.json({ message: "Usuario registrado", username, role: userRole });
                    }
                );
            }
        );
    });
});

// ================================
// LOGIN USUARIO (POST)
// ================================
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.json({ error: "Faltan datos" });
    }

    const sql = `
        SELECT User.id, username, password, Person.role 
        FROM User
        INNER JOIN Person ON User.person_id = Person.id
        WHERE Person.email = ?
    `;
    
    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.error("Error en login:", err);
            return res.status(500).json({ error: "Error del servidor" });
        }
        
        if (result.length === 0) {
            return res.json({ error: "Usuario no encontrado" });
        }

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.json({ error: "Contraseña incorrecta" });
        }

        // ✅ GUARDAR userId en sesión
        req.session.userId = user.id;

        // ✅ CRÍTICO: Asegurar que la sesión se guarde antes de responder
        req.session.save((err) => {
            if (err) {
                console.error("Error guardando sesión:", err);
                return res.status(500).json({ error: "Error al iniciar sesión" });
            }
            
            console.log("✅ Sesión guardada, userId:", req.session.userId);
            console.log("✅ SessionID:", req.sessionID);
            
            res.json({ 
                message: "Login exitoso", 
                username: user.username, 
                role: user.role 
            });
        });
    });
});

// ================================
// LOGOUT (POST)
// ================================
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destruyendo sesión:", err);
            return res.status(500).json({ error: "Error cerrando sesión" });
        }
        
        res.clearCookie("connect.sid");
        console.log("✅ Sesión destruida correctamente");
        res.json({ message: "Sesión cerrada" });
    });
});

module.exports = router;