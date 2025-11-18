// ============================================
// DEBUG
// ============================================
console.log('📍 URL actual:', window.location.href);
console.log('📍 Cookies:', document.cookie);

// ============================================
// VERIFICAR SESIÓN (solo cuando "Mi Cuenta" esté abierta)
// ============================================
async function verificarSesion() {
    const seccionCuenta = document.getElementById('seccionCuenta');

    // Solo verificar si la sección está visible
    if (!seccionCuenta || seccionCuenta.classList.contains('hidden')) {
        console.log('📝 No estamos en Mi Cuenta, no verificar sesión');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/check-session', {
            credentials: 'include'
        });

        const data = await res.json();
        console.log('🔐 Estado de sesión:', data);

        if (!data.authenticated) {
            console.warn('⚠️ No hay sesión activa');
            alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            localStorage.removeItem('usuario');
            window.location.href = '/';
        }

    } catch (err) {
        console.error('❌ Error verificando sesión:', err);
    }
}

// ❌ SE ELIMINA ESTA LÍNEA QUE CREABA EL BUCLE
// window.addEventListener('DOMContentLoaded', () => setTimeout(verificarSesion, 500));


// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
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
            const res = await fetch('http://localhost:3000/api/cambiar-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ actual, nueva })
            });

            const data = await res.json();
            console.log('📥 Respuesta:', res.status, data);

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Tu sesión ha expirado.');
                    localStorage.removeItem('usuario');
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


// ============================================
// CREAR FORMULARIO DE DATOS PERSONALES
// ============================================
const cuentaContent = document.querySelector('.cuenta-content');

if (cuentaContent && !document.getElementById('formDatos')) {
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

    cuentaContent.appendChild(formDatos);

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
            const res = await fetch('http://localhost:3000/api/actualizar-datos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone, address, city, region, country })
            });

            const data = await res.json();
            console.log('📥 Respuesta:', res.status, data);

            if (!res.ok) {
                if (res.status === 401) {
                    alert('Sesión expirada.');
                    localStorage.removeItem('usuario');
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


// ============================================
// CARGAR DATOS DEL USUARIO
// ============================================
async function cargarDatosUsuario() {
    const formDatos = document.getElementById('formDatos');
    if (!formDatos) return;

    try {
        const res = await fetch('http://localhost:3000/api/usuarios/perfil', {
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            console.log('👤 Datos del usuario:', data);

            if (data.phone) document.getElementById('phone').value = data.phone;
            if (data.address) document.getElementById('address').value = data.address;
            if (data.city) document.getElementById('city').value = data.city;
            if (data.region) document.getElementById('region').value = data.region;
            if (data.country) document.getElementById('country').value = data.country;

            const nombreUsuario = document.getElementById('nombre-usuario');
            if (nombreUsuario && data.name) {
                nombreUsuario.textContent = `¡Hola, ${data.name}!`;
            }
        }

    } catch (err) {
        console.error('❌ Error cargando datos del usuario:', err);
    }
}


// ============================================
// OBSERVER → Detectar cuando aparece el formulario
// ============================================
const observer = new MutationObserver(() => {
    const formDatos = document.getElementById('formDatos');
    if (formDatos) {
        cargarDatosUsuario();
        observer.disconnect();
    }
});

if (cuentaContent) {
    observer.observe(cuentaContent, { childList: true, subtree: true });
}


// ============================================
// CERRAR SESIÓN
// ============================================
const cerrarSesionBtn = document.getElementById('cerrarSesionBtn');

if (cerrarSesionBtn) {
    cerrarSesionBtn.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;

        try {
            await fetch('http://localhost:3000/api/usuarios/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Error cerrando sesión:', err);
        }

        localStorage.removeItem('usuario');
        alert('Sesión cerrada correctamente');
        window.location.href = '/';
    });
}


// ============================================
// MOSTRAR NOMBRE + VERIFICACIÓN SOLO CUANDO ABREN "MI CUENTA"
// ============================================
window.addEventListener('DOMContentLoaded', () => {

    const usuario = JSON.parse(localStorage.getItem('usuario'));
    const nombreUsuario = document.getElementById('nombre-usuario');

    if (nombreUsuario && usuario) {
        nombreUsuario.textContent = `¡Hola, ${usuario.username}!`;
    }

    const btnCuenta = document.getElementById('btnCuenta');
    if (btnCuenta) {
        btnCuenta.addEventListener('click', () => {
            // Verificar sesión SOLO cuando abren “Mi Cuenta”
            setTimeout(verificarSesion, 300);
        });
    }
});
