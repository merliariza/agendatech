document.addEventListener("DOMContentLoaded", function () {

    // --- SECCIONES ---
    const seccionAgendamientos = document.getElementById("seccionAgendamientos");
    const seccionInventario = document.getElementById("seccionInventario");
    const seccionVentas = document.getElementById("seccionVentas");
    const seccionUsuarios = document.getElementById("seccionUsuarios");
    const seccionCitasCliente = document.getElementById("seccionCitasCliente"); // NUEVA

    // --- OCULTAR TODO ---
    function ocultarTodo() {
        console.log("Ocultando todas las secciones");
        seccionAgendamientos?.classList.add("hidden");
        seccionInventario?.classList.add("hidden");
        seccionVentas?.classList.add("hidden");
        seccionUsuarios?.classList.add("hidden");
        seccionCitasCliente?.classList.add("hidden"); // NUEVA
    }

    // --- BOTONES DEL MENÚ ---
    const btnAgendamientos = document.getElementById("btnAgendamientos");
    const btnInventario = document.getElementById("btnInventario");
    const btnVentas = document.getElementById("btnVentas");
    const btnUsuarios = document.getElementById("btnUsuarios");
    const btnCitasCliente = document.getElementById("btnCitasCliente"); // NUEVO

    // AGENAMIENTOS
    btnAgendamientos?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Agendamientos");
        seccionAgendamientos.classList.remove("hidden");
    });

    // INVENTARIO
    btnInventario?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Inventario");
        seccionInventario.classList.remove("hidden");
    });

    // VENTAS
    btnVentas?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Ventas");
        seccionVentas.classList.remove("hidden");
    });

    // USUARIOS
    btnUsuarios?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Usuarios");
        seccionUsuarios.classList.remove("hidden");
        cargarUsuarios();
    });

    // 👉 **CITAS DEL CLIENTE**
    btnCitasCliente?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Citas del Cliente");
        seccionCitasCliente.classList.remove("hidden");
        cargarCitasCliente(); // Función que tú ya tienes
    });

    // --- MENÚ MÓVIL ---
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle?.addEventListener("click", function () {
        console.log("Toggling menú");
        menu.classList.toggle("active");
    });

});
