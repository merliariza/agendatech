const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");
const bcrypt = require("bcrypt");

const auth = (req, res, next) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "No autenticado" });
  next();
};

router.get("/", (req, res) => {
  const sql = `
    SELECT User.id, User.username, Person.id AS person_id,
           Person.name, Person.surname, Person.email, Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
  `;

  db.query(sql, (err, data) => {
    if (err) return res.status(500).json({ error: err });
    res.json(data);
  });
});

router.get("/perfil", auth, (req, res) => {
  const sql = `
    SELECT User.username, Person.name, Person.surname, Person.email,
           Person.phone, Person.address, Person.city, Person.region,
           Person.country, Person.role
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    WHERE User.id = ?
  `;

  db.query(sql, [req.session.userId], (err, data) => {
    if (err) return res.status(500).json({ error: "Error" });
    if (data.length === 0) return res.status(404).json({ error: "No existe" });

    res.json(data[0]);
  });
});

router.post("/", async (req, res) => {
  const { name, surname, email, username, password } = req.body;

  if (!name || !surname || !email || !username || !password)
    return res.json({ error: "Faltan datos" });

  db.query(
    "SELECT * FROM Person WHERE email = ?",
    [email],
    async (err, result) => {
      if (result.length > 0)
        return res.json({ error: "Correo ya registrado" });

      const hashed = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO Person (name, surname, email, role) VALUES (?, ?, ?, 'cliente')",
        [name, surname, email],
        (err, personResult) => {
          if (err) return res.json({ error: err });

          const pid = personResult.insertId;

          db.query(
            "INSERT INTO User (username, password, person_id) VALUES (?, ?, ?)",
            [username, hashed, pid],
            (err) => {
              if (err) return res.json({ error: err });

              res.json({
                message: "user registrado",
                username,
                role: "cliente",
              });
            }
          );
        }
      );
    }
  );
});


router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT User.id, User.username, User.password, 
           Person.id AS person_id, Person.role, Person.email
    FROM User
    INNER JOIN Person ON User.person_id = Person.id
    WHERE Person.email = ?
  `;

  db.query(sql, [email], async (err, data) => {
    if (data.length === 0)
      return res.json({ error: "user no encontrado" });

    const user = data[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ error: "Contraseña incorrecta" });

    req.session.userId = user.id;

    req.session.save(() => {
      res.json({
        message: "Login exitoso",
        person_id: user.person_id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    });
  });
});


router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

module.exports = router;
