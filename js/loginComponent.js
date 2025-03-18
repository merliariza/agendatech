class LoginModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            <link href="css/styleLogin.css" rel="stylesheet" />
            <div class="modal-overlay">
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
                            <a href="#">Olvidé mi contraseña</a>
                            <a href="#">Registrarme</a>
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
    }

    open() {
        this.overlay.classList.add("show");
        document.body.classList.add("modal-open");
    }

    close() {
        this.overlay.classList.remove("show");
        document.body.classList.remove("modal-open");
    }

    connectedCallback() {
        document.addEventListener("open-login-modal", () => this.open());
    }
}

customElements.define("login-modal", LoginModal);

document.getElementById("loginButton")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.dispatchEvent(new Event("open-login-modal"));
});