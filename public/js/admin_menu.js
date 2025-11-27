document.addEventListener("DOMContentLoaded", function () {

    const seccionAgendamientos = document.getElementById("seccionAgendamientos");
    const seccionInventario = document.getElementById("seccionInventario");
    const seccionVentas = document.getElementById("seccionVentas");

    function ocultarTodo() {
        seccionAgendamientos.classList.add("hidden");
        seccionInventario.classList.add("hidden");
        seccionVentas.classList.add("hidden");
    }

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

    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle.addEventListener("click", function () {
        menu.classList.toggle("active");
    });

});
