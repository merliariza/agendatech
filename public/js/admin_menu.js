document.addEventListener("DOMContentLoaded", function () {

    // --- section ---
    const sectionAppointments = document.getElementById("sectionAppointments");
    const sectioninventory = document.getElementById("sectioninventory");
    const sectionsales = document.getElementById("sectionsales");
    const sectionusers = document.getElementById("sectionusers");
    const sectionCitasCliente = document.getElementById("sectionCitasCliente"); // NUEVA

    // --- OCULTAR TODO ---
    function ocultarTodo() {
        console.log("Ocultando todas las secciones");
        sectionAppointments?.classList.add("hidden");
        sectioninventory?.classList.add("hidden");
        sectionsales?.classList.add("hidden");
        sectionusers?.classList.add("hidden");
        sectionCitasCliente?.classList.add("hidden"); // NUEVA
    }

    // --- BOTONES DEL MENÚ ---
    const btnAppointments = document.getElementById("btnAppointments");
    const btninventory = document.getElementById("btninventory");
    const btnsales = document.getElementById("btnsales");
    const btnusers = document.getElementById("btnusers");
    const btnCitasCliente = document.getElementById("btnCitasCliente"); 

    // AGENAMIENTOS
    btnAppointments?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando appointments");
        sectionAppointments.classList.remove("hidden");
    });

    // inventory
    btninventory?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando inventory");
        sectioninventory.classList.remove("hidden");
    });

    // sales
    btnsales?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando sales");
        sectionsales.classList.remove("hidden");
    });

    // user
    btnusers?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando users");
        sectionusers.classList.remove("hidden");
        cargarusers();
    });

    // **CITAS DEL CLIENTE**
    btnCitasCliente?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando Citas del Cliente");
        sectionCitasCliente.classList.remove("hidden");
        cargarCitasCliente(); 
    });

    // --- MENÚ MÓVIL ---
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle?.addEventListener("click", function () {
        console.log("Toggling menú");
        menu.classList.toggle("active");
    });

});
