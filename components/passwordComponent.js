class PasswordModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            <link href="css/style.css" rel="stylesheet" />
            <div class="modal-overlay hidden">
                <div class="modal">
                    <button class="close-btn">&times;</button>
                    <form>

                        <label for="passwordEmail">Correo Electrónico</label>
                        <input type="email" id="passwordEmail" class="input-field" placeholder="Correo Electrónico" required>

                        <button type="submit" class="codePassword-btn">Enviar código de verificación</button>

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
        document.addEventListener("open-password-modal", () => {
            console.log("Evento open-password-modal recibido");
            this.open();
        });
    }
}

customElements.define("password-modal", PasswordModal);