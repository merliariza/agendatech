class LoginAdminModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" }).innerHTML = `
            <link href="/css/style.css" rel="stylesheet" />

            <div class="admin-form-container">
                <div class="form-container">
                    <form>
                        <label for="email_or_username">Usuario o Correo Electrónico</label>
                        <input type="text" id="email_or_username" class="input-field" placeholder="Usuario o Correo Electrónico" required>

                        <label for="password">Contraseña</label>
                        <div class="password-container">
                            <input type="password" id="password" class="input-field" placeholder="Contraseña" required>
                            <img src="/src/img/EyeOff.png" class="toggle-password" data-target="password" alt="Toggle Password">
                        </div>

                        <div class="remember-container">
                            <input type="checkbox" id="remember">
                            <label for="remember">Recuérdame</label>
                        </div>

                        <button type="submit" class="login-btn">Acceder</button>
                    </form>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector("form").addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Inicio de sesión exitoso (simulado)");
        });

        this.shadowRoot.querySelector(".toggle-password").addEventListener("click", (e) => {
            const img = e.currentTarget;
            const targetId = img.getAttribute("data-target");
            const input = this.shadowRoot.getElementById(targetId);
            const isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            img.src = isHidden ? "/src/img/Eye.png" : "/src/img/EyeOff.png";
        });
    }

    connectedCallback() {
        document.body.classList.add("bloquear-scroll");
    }

    disconnectedCallback() {
        document.body.classList.remove("bloquear-scroll");
    }
}

customElements.define('login-admin-modal', LoginAdminModal);
