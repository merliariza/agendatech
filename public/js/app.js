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