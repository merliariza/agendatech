import { migrarcartAlLogin, logoutcart } from "./user_cart.js";

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

  function actualizarBotonSesion() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user) {
      openLoginBtn.textContent = "Cerrar sesión";
      openLoginBtn.classList.add("logout");
    } else {
      openLoginBtn.textContent = "Iniciar sesión";
      openLoginBtn.classList.remove("logout");
    }
  }

  actualizarBotonSesion();

  openLoginBtn.addEventListener("click", async () => {
    const user = JSON.parse(sessionStorage.getItem("user"));

    if (user) {
      if (!confirm("¿Cerrar sesión?")) return;

      try {
        await fetch('http://localhost:3000/api/users/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error("Error cerrando sesión:", err);
      }

      sessionStorage.removeItem("user");
      logoutcart(); 
      
      alert("✅ Sesión cerrada");
      actualizarBotonSesion();
      location.reload();
      return;
    }

    abrirLogin();
  });

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

  toggleBtn.addEventListener("click", () => {
    const isHidden = passInput.type === "password";
    passInput.type = isHidden ? "text" : "password";
    toggleBtn.textContent = isHidden ? "👁️" : "🙈";
  });

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
        endpoint = "/api/users";
        body = {
          name,
          surname,
          email,
          username: email.split("@")[0],
          password,
          role: "cliente"
        };
      } else {
        endpoint = "/api/users/login";
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

      if (isRegister) {
        alert("✅ Cuenta creada. Ahora inicia sesión.");
        
        isRegister = false;
        formTitle.textContent = "Iniciar Sesión";
        submitBtn.textContent = "Acceder";
        toggleRegister.textContent = "Registrarme";
        nameFields.style.display = "none";
        form.reset();
        return;
      }

      const userData = {
        id: data.person_id,           
        username: data.username,
        email: data.email || email,
        role: data.role
      };

      sessionStorage.setItem("user", JSON.stringify(userData));

      console.log("user guardado:", userData);

      await migrarcartAlLogin(userData);

      alert(`Bienvenido ${data.username}`);
      cerrarLogin();
      actualizarBotonSesion();

      if (data.role?.toLowerCase() === "administrador") {
        window.location.href = "/pages/admin.html";
        return;
      }

      if (data.role?.toLowerCase() === "empleado") {
        window.location.href = "/pages/employee.html";
        return;
      }

      location.reload();

    } catch (err) {
      console.error("Error en login/registro:", err);
      alert("❌ Error al conectar con el servidor");
    }
  });

  const linksProtegidos = document.querySelectorAll(
    'nav ul li a:not(#openLoginBtn)'
  );

  function verificarAcceso(e) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    
    const texto = e.target.textContent.trim();
    
    if (texto === "Productos") return;
    
    if (!user) {
      e.preventDefault();
      alert("⚠️ Debes iniciar sesión");
      abrirLogin();
    }
  }

  linksProtegidos.forEach(link => {
    link.addEventListener("click", verificarAcceso);
  });

});
