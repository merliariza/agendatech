document.addEventListener("DOMContentLoaded", function () {

    // SECCIONES
    const seccionAgendamientos = document.getElementById("seccionAgendamientos");
    const seccionInventario = document.getElementById("seccionInventario");
    const seccionVentas = document.getElementById("seccionVentas");
    const seccionCuenta = document.getElementById("seccionCuenta");

    function ocultarTodo() {
        seccionAgendamientos.classList.add("hidden");
        seccionInventario.classList.add("hidden");
        seccionVentas.classList.add("hidden");
        seccionCuenta.classList.add("hidden");
    }

    // BOTONES MENU
    document.getElementById("btnAgendamientos").addEventListener("click", () => {
        ocultarTodo();
        seccionAgendamientos.classList.remove("hidden");
    });

    document.getElementById("btnInventario").addEventListener("click", () => {
        ocultarTodo();
        seccionInventario.classList.remove("hidden");
    });

    document.getElementById("btnVentas").addEventListener("click", () => {
        ocultarTodo();
        seccionVentas.classList.remove("hidden");
    });

    document.getElementById("btnCuenta").addEventListener("click", () => {
        ocultarTodo();
        seccionCuenta.classList.remove("hidden");
    });

    // MENU RESPONSIVE
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle.addEventListener("click", function () {
        menu.classList.toggle("active");
    });

});
