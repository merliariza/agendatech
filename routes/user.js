const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, p.name, p.surname, p.email, p.role
      FROM User u
      JOIN Person p ON u.person_id = p.id
    `);
    res.json(rows); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, surname, email, username, password, role } = req.body;

    if (!name || !surname || !email || !username || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const [personResult] = await pool.query(
      "INSERT INTO Person (name, surname, email, role) VALUES (?, ?, ?, ?)",
      [name, surname, email, role]
    );

    const personId = personResult.insertId;

    const [userResult] = await pool.query(
      "INSERT INTO User (username, password, person_id) VALUES (?, ?, ?)",
      [username, password, personId]
    );

    res.status(201).json({ id: userResult.insertId, username, email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

module.exports = router;
