document.addEventListener("DOMContentLoaded", function () {

    const sectionAppointments = document.getElementById("sectionAppointments");
    const sectioninventory = document.getElementById("sectioninventory");
    const sectionsales = document.getElementById("sectionsales");
    const sectionusers = document.getElementById("sectionusers");
    const sectionOrders = document.getElementById("sectionOrders"); 
    const sectionCitasCliente = document.getElementById("sectionCitasCliente");

    function ocultarTodo() {
        console.log("Limpiando pantalla...");
        const secciones = [
            sectionAppointments, 
            sectioninventory, 
            sectionsales, 
            sectionusers, 
            sectionOrders, 
            sectionCitasCliente
        ];
        
        secciones.forEach(sec => {
            if (sec) sec.classList.add("hidden");
        });
    }

    const btnAppointments = document.getElementById("btnAppointments");
    const btninventory = document.getElementById("btninventory");
    const btnsales = document.getElementById("btnsales");
    const btnusers = document.getElementById("btnusers");
    const btnOrders = document.getElementById("btnOrders"); 
    const btnCitasCliente = document.getElementById("btnCitasCliente");

    btnAppointments?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        sectionAppointments?.classList.remove("hidden");
    });

    btninventory?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        sectioninventory?.classList.remove("hidden");
    });

    btnsales?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        sectionsales?.classList.remove("hidden");
    });

    btnusers?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        sectionusers?.classList.remove("hidden");
        if (typeof cargarusers === 'function') cargarusers();
    });

    btnOrders?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        console.log("Mostrando Pedidos");
        sectionOrders?.classList.remove("hidden");
        if (typeof loadOrders === 'function') {
            loadOrders();
        } else {
            console.warn("La función loadOrders() no está definida.");
        }
    });

    btnCitasCliente?.addEventListener("click", (e) => {
        e.preventDefault();
        ocultarTodo();
        sectionCitasCliente?.classList.remove("hidden");
        if (typeof cargarCitasCliente === 'function') cargarCitasCliente();
    });

    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    menuToggle?.addEventListener("click", function () {
        menu?.classList.toggle("active");
    });
});