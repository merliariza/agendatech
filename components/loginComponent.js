class LoginModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            <link href="css/style.css" rel="stylesheet" />
            <div class="modal-overlay hidden">
                <div class="modal">
                    <button class="close-btn">&times;</button>
                    <form>
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" class="input-field" placeholder="Correo Electrónico" required>
                        
                        <label for="password">Contraseña</label>
                        <div class="password-container">
                            <input type="password" id="password" class="input-field" placeholder="Contraseña" required>
                            <span class="eye-icon">
                                <img src="src/img/Eye.png">
                            </span>
                        </div>
                        
                        <div class="remember-container">
                            <input type="checkbox" id="remember">
                            <label for="remember">Recuérdame</label>
                        </div>

                        <button type="submit" class="login-btn">Acceder</button>

                        <div class="links">
                            <a href="#" id="passwordModal">Olvidé mi contraseña</a>
                            <a href="#" id="openSignupModal">Registrarme</a>
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
            alert("Inicio de sesión exitoso (simulado)");
            this.close();
        });

        this.shadowRoot.querySelector("#openSignupModal").addEventListener("click", (e) => {
            e.preventDefault();
            this.close(); 
            console.log("Cerrando Login y abriendo Registro");
            setTimeout(() => document.dispatchEvent(new Event("open-signup-modal")), 300);
        });

        this.shadowRoot.querySelector("#passwordModal").addEventListener("click", (e) => {
            e.preventDefault();
            this.close(); 
            console.log("Cerrando Login y abriendo olvidé mi contraseña");
            setTimeout(() => document.dispatchEvent(new Event("open-password-modal")), 300);
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
        document.addEventListener("open-login-modal", () => {
            console.log("Evento open-login-modal recibido");
            this.open();
        });
    }
}

customElements.define("login-modal", LoginModal);

document.getElementById("loginButton")?.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Disparando evento open-login-modal");
    document.dispatchEvent(new Event("open-login-modal"));
});
