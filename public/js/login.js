import { migrarCarritoAlLogin, cerrarSesionCarrito } from "./carrito.js";

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
  // ACTUALIZAR BOTÓN SESIÓN
  // ======================================
  function actualizarBotonSesion() {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    if (usuario) {
      openLoginBtn.textContent = "Cerrar sesión";
      openLoginBtn.classList.add("logout");
    } else {
      openLoginBtn.textContent = "Iniciar sesión";
      openLoginBtn.classList.remove("logout");
    }
  }

  actualizarBotonSesion();

  // ======================================
  // BOTÓN: ABRIR LOGIN / CERRAR SESIÓN
  // ======================================
  openLoginBtn.addEventListener("click", async () => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));

    if (usuario) {
      // Cerrar sesión
      if (!confirm("¿Cerrar sesión?")) return;

      try {
        await fetch('http://localhost:3000/api/usuarios/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error("Error cerrando sesión:", err);
      }

      sessionStorage.removeItem("usuario");
      cerrarSesionCarrito(); // Limpiar carrito
      
      alert("✅ Sesión cerrada");
      actualizarBotonSesion();
      location.reload();
      return;
    }

    // Abrir modal de login
    abrirLogin();
  });

  // ======================================
  // MODAL
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
  // MOSTRAR/OCULTAR CONTRASEÑA
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
      alert("⚠️ Completa todos los campos");
      return;
    }

    try {
      let endpoint = "";
      let body = {};

      if (isRegister) {
        // REGISTRO
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
        // LOGIN
        endpoint = "/api/usuarios/login";
        body = { email, password };
      }

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.error) {
        alert("❌ Error: " + data.error);
        return;
      }

      // ======================================
      // REGISTRO EXITOSO
      // ======================================
      if (isRegister) {
        alert("✅ Cuenta creada. Ahora inicia sesión.");
        
        // Cambiar a modo login
        isRegister = false;
        formTitle.textContent = "Iniciar Sesión";
        submitBtn.textContent = "Acceder";
        toggleRegister.textContent = "Registrarme";
        nameFields.style.display = "none";
        form.reset();
        return;
      }

      // ======================================
      // LOGIN EXITOSO
      // ======================================
      
      // 🔥 IMPORTANTE: Guardar usuario con person_id
      const usuarioData = {
        id: data.person_id,           // ← ID de Person (customer_id)
        username: data.username,
        email: data.email || email,
        role: data.role
      };

      sessionStorage.setItem("usuario", JSON.stringify(usuarioData));

      console.log("✅ Usuario guardado:", usuarioData);

      // Migrar carrito local a DB
      await migrarCarritoAlLogin(usuarioData);

      alert(`✅ Bienvenido ${data.username}`);
      cerrarLogin();
      actualizarBotonSesion();

      // Redirigir si es admin
      if (data.role?.toLowerCase() === "administrador") {
        window.location.href = "http://127.0.0.1:5502/public/pages/admin.html";
        return;
      }

      // Recargar página
      location.reload();

    } catch (err) {
      console.error("Error en login/registro:", err);
      alert("❌ Error al conectar con el servidor");
    }
  });

  // ======================================
  // PROTEGER MENÚ
  // ======================================
  const linksProtegidos = document.querySelectorAll(
    'nav ul li a:not(#openLoginBtn)'
  );

  function verificarAcceso(e) {
    const usuario = JSON.parse(sessionStorage.getItem("usuario"));
    
    const texto = e.target.textContent.trim();
    
    // Permitir acceso a "Productos" sin login
    if (texto === "Productos") return;
    
    if (!usuario) {
      e.preventDefault();
      alert("⚠️ Debes iniciar sesión");
      abrirLogin();
    }
  }

  linksProtegidos.forEach(link => {
    link.addEventListener("click", verificarAcceso);
  });

});