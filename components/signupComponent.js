class SignupModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            
        <link href="css/style.css" rel="stylesheet" />
            <div class="modal-overlay hidden">
                <div class="modal">
                    <button class="close-btn">&times;</button>
                    <form>
                       <label for="username">Usuario</label>
                        <input type="text" id="username" class="input-field" placeholder="Usuario" required>

                        <div class="input-group">
                            <div>
                                <label for="first_name">Nombre</label>
                                <input type="text" id="first_name" class="input-field" placeholder="Nombre" required>
                            </div>

                            <div>
                                <label for="last_name">Apellido</label>
                                <input type="text" id="last_name" class="input-field" placeholder="Apellido" required>
                            </div>
                        </div>

                        <label for="signupEmail">Correo Electrónico</label>
                        <input type="email" id="signupEmail" class="input-field" placeholder="Correo Electrónico" required>
                        
                        <div class="input-group">
                        <div>
                        <label for="signupPassword">Contraseña</label>
                        <div class="password-container">
                        <input type="password" id="signupPassword" class="input-field" placeholder="Contraseña" required>
                        <img src="src/img/EyeOff.png" class="toggle-password" data-target="signupPassword" alt="Toggle Password">
                        </div>
                        </div>

                        <div>
                        <label for="confirmPassword">Confirmar Contraseña</label>
                         <div class="password-container">
                        <input type="password" id="confirmPassword" class="input-field" placeholder="Confirmar Contraseña" required>
                        <img src="src/img/EyeOff.png" class="toggle-password" data-target="confirmPassword" alt="Toggle Password">
                        </div>
                        </div>
                        </div>

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

        this.shadowRoot.querySelectorAll(".toggle-password").forEach((img) => {
            img.addEventListener("click", (e) => {
                const targetId = img.getAttribute("data-target");
                const input = this.shadowRoot.getElementById(targetId);
                const isHidden = input.type === "password";
                input.type = isHidden ? "text" : "password";
                img.src = isHidden ? "src/img/Eye.png" : "src/img/EyeOff.png";
            });
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
