const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

const soloAdmin = (req, res, next) => {
  const sql = `
    SELECT Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    WHERE User.id = ?
  `;

  db.query(sql, [req.session.userId], (err, data) => {
    if (data.length === 0) return res.status(403).json({ error: "No existe" });
    if (data[0].role !== "administrador")
      return res.status(403).json({ error: "Sin permisos" });

    next();
  });
};

router.get("/usuarios", soloAdmin, (req, res) => {
  db.query(
    `SELECT Person.id AS person_id, Person.name, Person.surname,
            Person.email, Person.role, User.username
     FROM Person
     INNER JOIN User ON User.person_id = Person.id`,
    (err, data) => {
      if (err) return res.status(500).json({ error: err });
      res.json(data);
    }
  );
});

router.put("/usuarios/rol/:person_id", soloAdmin, (req, res) => {
  const { role } = req.body;
  const { person_id } = req.params;

  if (!["cliente", "administrador"].includes(role))
    return res.json({ error: "Rol inválido" });

  db.query(
    "UPDATE Person SET role = ? WHERE id = ?",
    [role, person_id],
    (err) => {
      if (err) return res.status(500).json({ error: err });

      res.json({ message: "Rol actualizado", role });
    }
  );
});

module.exports = router;
