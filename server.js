const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const app = express();

// Base de datos
const db = require("./db/connection.js");

// ============================================
// IMPORTANTE: CORS Y SESSION ANTES DE TODO
// ============================================

// 1. PRIMERO: Configuración de sesión
app.use(session({
    secret: "unSecretoSuperSecreto",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,           // false para HTTP (desarrollo)
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000  // 24 horas
    }
}));

// 2. SEGUNDO: CORS (después de session, antes de rutas)
app.use(cors({
    origin: [
        "http://127.0.0.1:5502", 
        "http://localhost:5502",
        "http://127.0.0.1:5501", 
        "http://localhost:5501"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));

// 3. TERCERO: Middleware de parseo
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/products", express.static("uploads/products"));

// ============================================
// RUTAS
// ============================================

const productosRoutes = require("./routes/productos.js");
app.use("/api/productos", productosRoutes);

const usuariosRoutes = require("./routes/usuarios.js");
app.use("/api/usuarios", usuariosRoutes);

const actualizarDatosRoutes = require("./routes/actualizarDatos.js");
app.use("/api/actualizar-datos", actualizarDatosRoutes);

const cambiarPasswordRoutes = require("./routes/cambiarContrasena.js");
app.use("/api/cambiar-password", cambiarPasswordRoutes);

// Ruta de prueba de sesión
app.get("/api/check-session", (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            authenticated: true, 
            userId: req.session.userId 
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Prueba rápida
app.get("/", (req, res) => res.send("API funcionando"));

// ============================================
// SERVIDOR
// ============================================
app.listen(3000, () => {
    console.log("✅ Servidor corriendo en http://localhost:3000");
    console.log("✅ CORS habilitado para http://127.0.0.1:5502 y http://localhost:5502");
});