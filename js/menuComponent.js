export default class NavbarComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        this.addMenuToggleEventListener();
    }

    addMenuToggleEventListener() {
        const menuToggleButton = this.shadowRoot.getElementById('menu-toggle');
        if (menuToggleButton) {
            menuToggleButton.addEventListener('click', () => {
                const menu = this.shadowRoot.getElementById('menu');
                menu.classList.toggle('active');
            });
        }
    }

    render() {
        this.shadowRoot.innerHTML = /* html */ `
        <link href="../css/style.css" rel="stylesheet">
        <button id="menu-toggle">☰</button>
        <nav id="menu" class="menu">
        <ul>
            <img src="./src/img/womanLogo.png">
            <img src="./src/img/bellezaLogo.png">
            <li><a href="#">Productos</a></li>
            <li><a href="#">Agéndate</a></li>
            <li><a href="#">Mis Compras</a></li>
            <li><a href="#">Inicia Sesión</a></li>
        </ul>
        </nav>
        `;
    }
}

customElements.define("navbar-component", NavbarComponent);
