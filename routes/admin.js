const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

const onlyAdmin = (req, res, next) => {
  const sql = `
    SELECT Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    WHERE User.id = ?
  `;

  db.query(sql, [req.session.userId], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    if (data.length === 0) return res.status(403).json({ error: "Usuario no encontrado" });
    if (data[0].role !== "administrador")
      return res.status(403).json({ error: "Acceso denegado: Solo administrador" });
    next();
  });
};

const onlyEmployee = (req, res, next) => {
  const sql = `
    SELECT Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    WHERE User.id = ?
  `;

  db.query(sql, [req.session.userId], (err, data) => {
    if (err) return res.status(500).json({ error: err });
    if (data.length === 0) return res.status(403).json({ error: "Usuario no encontrado" });
    if (data[0].role !== "empleado")
      return res.status(403).json({ error: "Acceso denegado: Solo empleado" });
    next();
  });
};

router.get("/users", onlyAdmin, (req, res) => {
  const sql = `
    SELECT Person.id AS person_id, Person.name, Person.surname,
           Person.email, Person.role, User.username
    FROM Person
    INNER JOIN User ON User.person_id = Person.id
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ ok: true, users: data });
  });
});

router.put("/users/role/:person_id", onlyAdmin, (req, res) => {
  const { role } = req.body;
  const { person_id } = req.params;

  if (!["cliente", "administrador", "empleado"].includes(role))
    return res.status(400).json({ error: "Rol inválido" });

  db.query("UPDATE Person SET role = ? WHERE id = ?", [role, person_id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ ok: true, message: "Rol actualizado correctamente", role });
  });
});

router.get("/my-appointments", onlyEmployee, (req, res) => {
  const userId = req.session.userId;
  const sql = `
    SELECT a.*, CONCAT(e.name,' ',e.surname) AS employee_name
    FROM Appointment a
    JOIN Person e ON a.employee_id = e.id
    WHERE a.employee_id = ?
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ ok: true, appointments: rows });
  });
});

router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;


module.exports = router;
