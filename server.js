const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const app = express();

// Base de datos
const db = require("./db/connection.js");

app.use(session({
    secret: "unSecretoSuperSecreto",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,           
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000  
    }
}));

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads/products", express.static("uploads/products"));

const productosRoutes = require("./routes/productos.js");
app.use("/api/productos", productosRoutes);

const usuariosRoutes = require("./routes/usuarios.js");
app.use("/api/usuarios", usuariosRoutes);

const actualizarDatosRoutes = require("./routes/actualizarDatos.js");
app.use("/api/actualizar-datos", actualizarDatosRoutes);

const cambiarPasswordRoutes = require("./routes/cambiarContrasena.js");
app.use("/api/cambiar-password", cambiarPasswordRoutes);

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

app.get("/", (req, res) => res.send("API funcionando"));

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
    console.log("CORS habilitado para http://127.0.0.1:5502 y http://localhost:5502");
});