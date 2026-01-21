document.addEventListener("DOMContentLoaded", function () {

    const sectionAppointments = document.getElementById("sectionAppointments");

    const btnAppointments = document.getElementById("btnAppointments");
    const logoutBtn = document.getElementById("logoutBtn");
    const btnOrders = document.getElementById("btnOrders"); 
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    function ocultarTodo() {
        console.log("Ocultando todas las secciones");
        sectionAppointments?.classList.add("hidden");
    }
    function ocultarTodo() {
        sectionAppointments?.classList.add("hidden");
    }
    btnAppointments?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando appointments");
        sectionAppointments.classList.remove("hidden");
    });

    logoutBtn?.addEventListener("click", async () => {
        if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

        try {
            await fetch('/api/users/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }

        localStorage.removeItem('user');
        alert('Sesión cerrada correctamente');
        window.location.href = '/';
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

    menuToggle?.addEventListener("click", () => {
        menu.classList.toggle("active");
    });

});
