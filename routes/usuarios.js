const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");
const bcrypt = require("bcrypt");

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
// REGISTRAR USUARIO (POST)
// ================================
// Espera:
// { name, surname, email, username, password, role }
router.post("/", async (req, res) => {
    const { name, surname, email, username, password, role } = req.body;

    // Validar campos obligatorios
    if (!email || !username || !password || !name || !surname) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Rol por defecto -> CLIENTE
    const userRole = role || "cliente";

    // Verificar email duplicado
    db.query("SELECT * FROM Person WHERE email = ?", [email], async (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length > 0) {
            return res.json({ error: "El correo ya está registrado" });
        }

        // Crear persona
        const sqlPerson = `
            INSERT INTO Person (name, surname, email, role)
            VALUES (?, ?, ?, ?)
        `;
        db.query(sqlPerson, [name, surname, email, userRole], async (err, personResult) => {
            if (err) return res.status(500).json({ error: err });

            const personId = personResult.insertId;

            // Cifrar contraseña
            const hashedPass = await bcrypt.hash(password, 10);

            // Crear usuario
            const sqlUser = `
                INSERT INTO User (username, password, person_id)
                VALUES (?, ?, ?)
            `;
            db.query(sqlUser, [username, hashedPass, personId], (err, userResult) => {
                if (err) return res.status(500).json({ error: err });

                res.json({
                    message: "Usuario registrado",
                    username: username,
                    role: userRole
                });
            });
        });
    });
});

// ================================
// LOGIN DE USUARIO (POST)
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
        if (err) return res.status(500).json({ error: err });

        if (result.length === 0) {
            return res.json({ error: "Usuario no encontrado" });
        }

        const user = result[0];

        // Verificar contraseña
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({ error: "Contraseña incorrecta" });
        }

        res.json({
            message: "Login exitoso",
            username: user.username,
            role: user.role
        });
    });
});

module.exports = router;
