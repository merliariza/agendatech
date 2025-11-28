const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const app = express();

app.set("trust proxy", 1);

app.use(
  session({
    secret: "secretSuperSeguro123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(
  cors({
    origin: ["http://127.0.0.1:5502", "http://localhost:5502"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/products", express.static("uploads/products"));

app.use("/api/usuarios", require("./routes/usuarios.js"));
app.use("/api/admin", require("./routes/admin.js"));
app.use("/api/productos", require("./routes/productos.js"));
app.use("/api/actualizar-datos", require("./routes/actualizarDatos.js"));
app.use("/api/cambiar-password", require("./routes/cambiarContrasena.js"));
app.use("/api/admin-usuarios", require("./routes/admin_usuarios.js"));

app.get("/api/check-session", (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    userId: req.session.userId || null,
  });
});

app.listen(3000, () => {
  console.log("SERVIDOR OK -> http://localhost:3000");
});
