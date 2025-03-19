class SignupModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            <link href="css/styleSignup.css" rel="stylesheet" />
            <div class="modal-overlay hidden">
                <div class="modal">
                    <button class="close-btn">&times;</button>
                    <form>
                        <label for="fullname">Nombre Completo</label>
                        <input type="text" id="fullname" class="input-field" placeholder="Nombre Completo" required>

                        <label for="birthdate">Fecha de Nacimiento</label>
                        <input type="date" id="birthdate" class="input-field" required>

                        <label for="docnumber">Número de Documento</label>
                        <input type="text" id="docnumber" class="input-field" placeholder="Número de Documento" required>

                        <label for="doctype">Tipo de Documento</label>
                        <select class="doctype" id="doctype" required>
                          <option value="" disabled selected>Selecciona un tipo</option>
                          <option value="dni">DNI</option>
                          <option value="cedula">Cédula</option>
                          <option value="pasaporte">Pasaporte</option>
                        </select>

                        <label for="signupEmail">Correo Electrónico</label>
                        <input type="email" id="signupEmail" class="input-field" placeholder="Correo Electrónico" required>

                        <label for="signupPassword">Contraseña</label>
                        <input type="password" id="signupPassword" class="input-field" placeholder="Contraseña" required>

                        <label for="confirmPassword">Confirmar Contraseña</label>
                        <input type="password" id="confirmPassword" class="input-field" placeholder="Confirmar Contraseña" required>

                        <button type="submit" class="signup-btn">Registrarme</button>

                        <div class="links">
                            <a href="#" id="openLoginModal">Inicia Sesión</a>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.overlay = this.shadowRoot.querySelector(".modal-overlay");
        this.overlay.addEventListener("click", (e) => e.target === this.overlay && this.close());
        this.shadowRoot.querySelector(".close-btn").addEventListener("click", () => this.close());
        this.shadowRoot.querySelector("form").addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Registro exitoso (simulado)");
            this.close();
        });

        this.shadowRoot.querySelector("#openLoginModal").addEventListener("click", (e) => {
            e.preventDefault();
            this.close();
            console.log("Cerrando Registro y abriendo Login");
            setTimeout(() => document.dispatchEvent(new Event("open-login-modal")), 300);
        });
    }

    open() {
        this.overlay.classList.remove("hidden");
        this.overlay.classList.add("show");
        document.body.classList.add("modal-open");
    }

    close() {
        this.overlay.classList.remove("show");
        this.overlay.classList.add("hidden");
        document.body.classList.remove("modal-open");
    }

    connectedCallback() {
        document.addEventListener("open-signup-modal", () => {
            console.log("Evento open-signup-modal recibido");
            this.open();
        });
    }
}

customElements.define("signup-modal", SignupModal);
