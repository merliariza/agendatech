document.getElementById("cerrarSesionBtn").addEventListener("click", () => {
    localStorage.removeItem("usuario");
    window.location.href = "../../public/index.html";
});