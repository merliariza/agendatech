console.log('URL actual:', window.location.href);
console.log('Cookies:', document.cookie);

async function verificarSesion() {
    const sectionaccount = document.getElementById('sectionaccount');

    if (!sectionaccount || sectionaccount.classList.contains('hidden')) {
        console.log('No estamos en Mi Cuenta, no verificar sesión');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/check-session', {
            credentials: 'include'
        });

        const data = await res.json();
        console.log('Estado de sesión:', data);

        if (!data.authenticated) {
            console.warn('⚠️ No hay sesión activa');
            alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            localStorage.removeItem('user');
            window.location.href = '/';
        }

    } catch (err) {
        console.error('❌ Error verificando sesión:', err);
    }
}

const formCambiarPass = document.getElementById('formCambiarPass');

if (formCambiarPass) {
    formCambiarPass.addEventListener('submit', async e => {
        e.preventDefault();

        const actual = document.getElementById('passActual').value.trim();
        const nueva = document.getElementById('passNueva').value.trim();
        const confirmar = document.getElementById('passConfirm').value.trim();

        if (!actual || !nueva || !confirmar) {
            alert('Por favor completa todos los campos');
            return;
        }

        if (nueva !== confirmar) {
            alert('La nueva contraseña y la confirmación no coinciden');
            return;
        }

        if (nueva.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ actual, nueva })
            });

            const data = await res.json();
            console.log('Respuesta:', res.status, data);

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Tu sesión ha expirado.');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                    return;
                }
                alert(data.message || `Error: ${res.status}`);
                return;
            }

            alert(data.message || 'Contraseña actualizada correctamente');
            formCambiarPass.reset();

        } catch (err) {
            console.error('❌ Error:', err);
            alert("Error de conexión con el servidor");
        }
    });
}

const accountContent = document.querySelector('.account-content');

if (accountContent && !document.getElementById('formDatos')) {
    const formDatos = document.createElement('form');
    formDatos.id = 'formDatos';

    formDatos.innerHTML = `
        <h2>Actualizar Datos Personales</h2>

        <label>Teléfono</label>
        <input type="tel" id="phone" placeholder="Ejemplo: +57 300 123 4567" />

        <label>Dirección</label>
        <input type="text" id="address" placeholder="Calle 123 # 45-67" />

        <label>Ciudad</label>
        <input type="text" id="city" placeholder="Bucaramanga" />

        <label>Región/Departamento</label>
        <input type="text" id="region" placeholder="Santander" />

        <label>País</label>
        <input type="text" id="country" placeholder="Colombia" />

        <button type="submit" class="btn-actualizar">Actualizar Datos</button>
    `;

    accountContent.appendChild(formDatos);

    formDatos.addEventListener('submit', async e => {
        e.preventDefault();

        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const region = document.getElementById('region').value.trim();
        const country = document.getElementById('country').value.trim();

        if (!phone && !address && !city && !region && !country) {
            alert('Por favor completa al menos un campo para actualizar');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/update-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone, address, city, region, country })
            });

            const data = await res.json();
            console.log('Respuesta:', res.status, data);

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Sesión expirada.');
                    localStorage.removeItem('user');
                    window.location.href = '/';
                    return;
                }

                alert(data.message || `Error: ${res.status}`);
                return;
            }

            alert(data.message || 'Datos actualizados correctamente');
            formDatos.reset();

        } catch (err) {
            console.error('❌ Error:', err);
            alert("Error de conexión con el servidor");
        }
    });
}

async function cargarDatosuser() {
    const formDatos = document.getElementById('formDatos');
    if (!formDatos) return;

    try {
        const res = await fetch('http://localhost:3000/api/users/perfil', {
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            console.log('Datos del user:', data);

            if (data.phone) document.getElementById('phone').value = data.phone;
            if (data.address) document.getElementById('address').value = data.address;
            if (data.city) document.getElementById('city').value = data.city;
            if (data.region) document.getElementById('region').value = data.region;
            if (data.country) document.getElementById('country').value = data.country;

            const nombreuser = document.getElementById('nombre-user');
            if (nombreuser && data.name) {
                nombreuser.textContent = `¡Hola, ${data.name}!`;
            }
        }

    } catch (err) {
        console.error('❌ Error cargando datos del user:', err);
    }
}

const observer = new MutationObserver(() => {
    const formDatos = document.getElementById('formDatos');
    if (formDatos) {
        cargarDatosuser();
        observer.disconnect();
    }
});

if (accountContent) {
    observer.observe(accountContent, { childList: true, subtree: true });
}

const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

        try {
            await fetch('http://localhost:3000/api/users/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Error cerrando sesión:', err);
        }

        localStorage.removeItem('user');
        alert('Sesión cerrada correctamente');
        window.location.href = '/';
    });
}

window.addEventListener('DOMContentLoaded', () => {

    const user = JSON.parse(localStorage.getItem('user'));
    const nombreuser = document.getElementById('nombre-user');

    if (nombreuser && user) {
        nombreuser.textContent = `¡Hola, ${user.username}!`;
    }

    const btnaccount = document.getElementById('btnaccount');
    if (btnaccount) {
        btnaccount.addEventListener('click', () => {
            setTimeout(verificarSesion, 300);
        });
    }
});
