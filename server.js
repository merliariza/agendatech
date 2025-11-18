const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db/connection.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
const productosRoutes = require("./routes/productos.js");
app.use("/api/productos", productosRoutes);

const usuariosRoutes = require("./routes/usuarios.js");
app.use("/api/usuarios", usuariosRoutes);


// Prueba rápida
app.get("/", (req, res) => {
    res.send("API funcionando");
});

// Servir imágenes
app.use("/uploads/products", express.static("uploads/products"));

// Servidor
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
