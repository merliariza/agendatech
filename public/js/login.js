document.addEventListener("DOMContentLoaded", () => {

  const loginContainer = document.getElementById("loginContainer");
  const overlay = document.getElementById("overlay");
  const openLoginBtn = document.getElementById("openLoginBtn");
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passInput = document.getElementById("password");
  const toggleBtn = document.querySelector(".toggle-password");
  const closeBtn = document.querySelector(".close-btn");
  const toggleRegister = document.getElementById("toggleRegister");
  const formTitle = document.getElementById("formTitle");
  const submitBtn = document.getElementById("submitBtn");
  const nameFields = document.getElementById("nameFields");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");

  let isRegister = false;

  // ======================================
  // CAMBIAR BOTÓN A "INICIAR / CERRAR SESIÓN"
  // ======================================

  function actualizarBotonSesion() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (usuario) {
      openLoginBtn.textContent = "Cerrar sesión";
      openLoginBtn.classList.add("logout");
    } else {
      openLoginBtn.textContent = "Iniciar sesión";
      openLoginBtn.classList.remove("logout");
    }
  }

  actualizarBotonSesion();

  openLoginBtn.addEventListener("click", () => {
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    // Si está logueado → cerrar sesión
    if (usuario) {
      localStorage.removeItem("usuario");
      alert("Sesión cerrada");
      actualizarBotonSesion();
      location.reload();
      return;
    }

    // Si no está logueado → mostrar modal
    abrirLogin();
  });

  // ======================================
  // MODAL LOGIN / REGISTRO
  // ======================================

  function abrirLogin() {
    loginContainer.classList.add("show");
    overlay.classList.add("show");
    document.body.classList.add("modal-open");
    form.reset();
    passInput.type = "password";
    toggleBtn.textContent = "🙈";
    if (!isRegister) nameFields.style.display = "none";
  }

  function cerrarLogin() {
    loginContainer.classList.remove("show");
    overlay.classList.remove("show");
    document.body.classList.remove("modal-open");
  }

  closeBtn.addEventListener("click", cerrarLogin);
  overlay.addEventListener("click", cerrarLogin);

  // ======================================
  // MOSTRAR / OCULTAR CONTRASEÑA
  // ======================================

  toggleBtn.addEventListener("click", () => {
    const isHidden = passInput.type === "password";
    passInput.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "👁️" : "🙈";
  });

  // ======================================
  // CAMBIAR ENTRE LOGIN Y REGISTRO
  // ======================================

  toggleRegister.addEventListener("click", () => {
    isRegister = !isRegister;

    if (isRegister) {
      formTitle.textContent = "Registrarse";
      submitBtn.textContent = "Registrarme";
      toggleRegister.textContent = "Ya tengo cuenta";
      nameFields.style.display = "block";
    } else {
      formTitle.textContent = "Iniciar Sesión";
      submitBtn.textContent = "Acceder";
      toggleRegister.textContent = "Registrarme";
      nameFields.style.display = "none";
    }

    form.reset();
    passInput.type = "password";
    toggleBtn.textContent = "🙈";
  });

  // ======================================
  // REGISTRO / LOGIN
  // ======================================

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    const name = firstName.value.trim();
    const surname = lastName.value.trim();

    if (!email || !password || (isRegister && (!name || !surname))) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      let endpoint = "";
      let body = {};

      if (isRegister) {
        endpoint = "/api/usuarios";
        body = {
          name,
          surname,
          email,
          username: email.split("@")[0],
          password,
          role: "cliente"
        };
      } else {
        endpoint = "/api/usuarios/login";
        body = { email, password };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      // Guardar sesión local
      localStorage.setItem("usuario", JSON.stringify({
        username: data.username,
        role: data.role
      }));

      alert(
        isRegister
          ? "Cuenta creada con éxito"
          : "Bienvenido " + data.username
      );

      cerrarLogin();
      actualizarBotonSesion();

      // Redirección si es administrador
      if (!isRegister && data.role === "administrador") {
        window.location.href = "http://127.0.0.1:5502/pages/login.html#";
        return;
      }

    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor.");
    }
  });

  // ======================================
  // PROTEGER MENÚ PARA SOLO USUARIOS LOGUEADOS
  // ======================================

  const protecciones = document.querySelectorAll(
    'nav ul li a:not(.login-btn-header)'
  );

  function verificarAcceso(e) {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    if (!usuario) {
      e.preventDefault();
      abrirLogin();
    }
  }

  protecciones.forEach(link => {
    link.addEventListener("click", verificarAcceso);
  });

});
