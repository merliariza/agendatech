document.addEventListener("DOMContentLoaded", function () {

    // --- SECCIONES ---
    const sectionAppointments = document.getElementById("sectionAppointments");

    // --- BOTONES DEL MENÚ ---
    const btnAppointments = document.getElementById("btnAppointments");
    const logoutBtn = document.getElementById("logoutBtn");
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("menu");

    // --- OCULTAR TODO ---  
    function ocultarTodo() {
        console.log("Ocultando todas las secciones");
        sectionAppointments?.classList.add("hidden");
    }
  // --- OCULTAR TODO ---
    function ocultarTodo() {
        sectionAppointments?.classList.add("hidden");
    }
    // AGENAMIENTOS
    btnAppointments?.addEventListener("click", () => {
        ocultarTodo();
        console.log("Mostrando appointments");
        sectionAppointments.classList.remove("hidden");
    });

    // CERRAR SESIÓN
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



  // --- MENÚ MÓVIL ---
    menuToggle?.addEventListener("click", () => {
        menu.classList.toggle("active");
    });

});
