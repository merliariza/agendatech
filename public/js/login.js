    const loginContainer = document.getElementById("loginContainer");
    const overlay = document.getElementById("overlay");
    const openLoginBtn = document.getElementById("openLoginBtn");
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("password");
    const toggleBtn = form.querySelector(".toggle-password");
    const closeBtn = form.querySelector(".close-btn");
    const toggleRegister = document.getElementById("toggleRegister");
    const formTitle = document.getElementById("formTitle");
    const submitBtn = document.getElementById("submitBtn");
    const nameFields = document.getElementById("nameFields");
    const firstName = document.getElementById("firstName");
    const lastName = document.getElementById("lastName");

    let isRegister = false;

    // Funciones abrir/cerrar modal
    function abrirLogin() {
      loginContainer.classList.add("show");
      overlay.classList.add("show");
      document.body.classList.add("modal-open");
      form.reset();
      passInput.type = "password";
      toggleBtn.textContent = "🙈";
      if(!isRegister) nameFields.style.display="none";
    }
    function cerrarLogin() {
      loginContainer.classList.remove("show");
      overlay.classList.remove("show");
      document.body.classList.remove("modal-open");
    }

    openLoginBtn.addEventListener("click", abrirLogin);
    closeBtn.addEventListener("click", cerrarLogin);
    overlay.addEventListener("click", cerrarLogin);

    // Toggle contraseña
    toggleBtn.addEventListener("click", () => {
      if(passInput.type==="password"){ passInput.type="text"; toggleBtn.textContent="👁️"; }
      else { passInput.type="password"; toggleBtn.textContent="🙈"; }
    });

    // Cambiar entre login y registro
toggleRegister.addEventListener("click", () => {
  isRegister = !isRegister;

  if(isRegister){
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

    // Enviar login / registro
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passInput.value.trim();
      const name = firstName.value.trim();
      const surname = lastName.value.trim();

      if(!email || !password || (isRegister && (!name || !surname))) {
        alert("Completa todos los campos");
        return;
      }

      try {
        const res = await fetch("/api/usuarios", {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            name: isRegister? name : "Usuario",
            surname: isRegister? surname : "Prueba",
            email,
            username: email.split("@")[0],
            password,
            role:"cliente"
          })
        });
        const data = await res.json();
        if(data.error) alert("Error: "+data.error);
        else {
          alert(isRegister? `Usuario registrado: ${data.username}` : `¡Bienvenido ${data.username}!`);
          form.reset();
          cerrarLogin();
          listarUsuarios();
        }
      } catch(err){ console.error(err); alert("Error al conectar con el servidor"); }
    });

    // Listar usuarios
    async function listarUsuarios() {
      try {
        const res = await fetch("/api/usuarios");
        const data = await res.json();
        console.log("Usuarios registrados:", data);
      } catch(err){ console.error(err); }
    }