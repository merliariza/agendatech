const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const auth = (req, res, next) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "No autenticado" });
  next();
};

router.get("/", auth, (req, res) => {
  const sql = `
    SELECT 
      User.id AS user_id,
      User.username,
      Person.id AS person_id,
      Person.name,
      Person.surname,
      Person.email,
      Person.phone,
      Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    ORDER BY Person.id DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.patch("/rol/:id", auth, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const rolesValidos = ["administrador", "cliente", "empleado"];

  if (!role || !rolesValidos.includes(role))
    return res.status(400).json({ message: "Rol inválido" });

  const sql = `
    UPDATE Person 
    INNER JOIN User ON Person.id = User.person_id
    SET Person.role = ?
    WHERE User.id = ?
  `;

  db.query(sql, [role, userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Rol actualizado" });
  });
});

router.delete("/:id", auth, (req, res) => {
  const userId = req.params.id;

  const buscar = "SELECT person_id FROM User WHERE id = ?";

  db.query(buscar, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows.length)
      return res.status(404).json({ message: "user no encontrado" });

    const personId = rows[0].person_id;

    const deleteUser = "DELETE FROM User WHERE id = ?";

    db.query(deleteUser, [userId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      const deletePerson = "DELETE FROM Person WHERE id = ?";

      db.query(deletePerson, [personId], () => {
        res.json({ message: "user eliminado correctamente" });
      });
    });
  });
});

module.exports = router;
