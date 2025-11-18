document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");
    const body = document.body;

    menuToggle.addEventListener("click", function () {
        body.classList.toggle("menu-active");
        menu.classList.toggle("active");
    });

    document.addEventListener("click", function (event) {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
            body.classList.remove("menu-active");
            menu.classList.remove("active");
        }
    });
});

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/productos", require("./routes/products"));

app.listen(3000, () => console.log("API corriendo en http://localhost:3000"));
