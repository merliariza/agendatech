// js/citas.js
console.log('=== Módulo de citas cargado ===');

const API_BASE = "http://localhost:3000/api";

let employees = [];
let userAppointments = [];
let selectedDate = null;
let currentYear, currentMonth;

// Elementos del DOM
const btnNuevaCita = document.getElementById('btnNuevaCita');
const panelNuevaCita = document.getElementById('panelNuevaCita');
const btnCancelarNuevaCita = document.getElementById('btnCancelarNuevaCita');
const formNuevaCita = document.getElementById('formNuevaCita');
const userAppointmentsList = document.getElementById('userAppointmentsList');
const userBookingFeedback = document.getElementById('userBookingFeedback');

// Elementos del calendario
const userMonthYear = document.getElementById('userMonthYear');
const userCalendarDays = document.getElementById('userCalendarDays');
const userPrevMonth = document.getElementById('userPrevMonth');
const userNextMonth = document.getElementById('userNextMonth');
const userSelectedDateText = document.getElementById('userSelectedDateText');

// Selectores del formulario
const userEmployeeSelect = document.getElementById('userEmployeeSelect');
const userTimeSelect = document.getElementById('userTimeSelect');
const userNotes = document.getElementById('userNotes');

// Inicializar cuando se muestra la sección
export function initUserAppointments() {
    console.log('Inicializando módulo de citas de usuario');
    loadEmployees();
    loadUserAppointments();
    initCalendar();
    setupEventListeners();
}

function setupEventListeners() {
    btnNuevaCita?.addEventListener('click', () => {
        panelNuevaCita.style.display = 'block';
        btnNuevaCita.style.display = 'none';
    });

    btnCancelarNuevaCita?.addEventListener('click', () => {
        panelNuevaCita.style.display = 'none';
        btnNuevaCita.style.display = 'block';
        formNuevaCita.reset();
        selectedDate = null;
        userSelectedDateText.textContent = 'Ninguna';
        userBookingFeedback.textContent = '';
        userBookingFeedback.className = '';
        
        document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
    });

    userPrevMonth?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentYear--;
            currentMonth = 11;
        }
        renderCalendar(currentYear, currentMonth);
    });

    userNextMonth?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentYear++;
            currentMonth = 0;
        }
        renderCalendar(currentYear, currentMonth);
    });

    userEmployeeSelect?.addEventListener('change', () => {
        if (selectedDate) {
            populateTimeOptions(selectedDate);
        }
    });

    formNuevaCita?.addEventListener('submit', handleCreateAppointment);
}

async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/citas/employees`, {
            credentials: 'include'
        });
        const data = await res.json();

        if (data.ok) {
            employees = data.employees;
            populateEmployeeSelect();
        } else {
            console.error('Error al cargar empleados:', data.message);
        }
    } catch (error) {
        console.error('Error cargando empleados:', error);
    }
}

function populateEmployeeSelect() {
    userEmployeeSelect.innerHTML = '<option value="">Seleccione un especialista</option>';
    employees.forEach(emp => {
        userEmployeeSelect.innerHTML += `<option value="${emp.id}">${emp.name} ${emp.surname}</option>`;
    });
}

async function loadUserAppointments() {
    console.log('Cargando citas del usuario...');
    try {
        const res = await fetch(`${API_BASE}/citas/my-appointments`, {
            credentials: 'include'
        });
        
        console.log('Respuesta del servidor:', res.status);
        
        if (res.status === 401) {
            console.error('Usuario no autenticado');
            userAppointmentsList.innerHTML = `
                <div class="text-center py-5">
                    <p class="text-danger fs-5">Debes iniciar sesión para ver tus citas</p>
                    <button class="btn btn-primary mt-3" onclick="document.getElementById('openLoginBtn').click()">
                        Iniciar Sesión
                    </button>
                </div>
            `;
            return;
        }
        
        const data = await res.json();
        console.log('Datos recibidos:', data);

        if (data.ok) {
            userAppointments = data.appointments || [];
            console.log('Citas cargadas:', userAppointments.length);
            renderUserAppointments();
        } else {
            console.error('Error del servidor:', data.message);
            userAppointmentsList.innerHTML = `<p class="text-danger text-center">${data.message || 'Error al cargar citas'}</p>`;
        }
    } catch (error) {
        console.error('Error cargando citas:', error);
        userAppointmentsList.innerHTML = '<p class="text-danger text-center">Error al cargar las citas</p>';
    }
}

function renderUserAppointments() {
    if (!userAppointments || userAppointments.length === 0) {
        userAppointmentsList.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted fs-5">No tienes citas agendadas</p>
                <button class="btn btn-primary mt-3" id="btnAgendar">
                    📅 Agendar mi primera cita
                </button>
            </div>
        `;
        
        document.getElementById('btnAgendar')?.addEventListener('click', () => {
            btnNuevaCita.click();
        });
        return;
    }

    const sorted = [...userAppointments].sort((a, b) => {
        if (a.appointment_date === b.appointment_date) {
            return b.appointment_time.localeCompare(a.appointment_time);
        }
        return b.appointment_date.localeCompare(a.appointment_date);
    });

    userAppointmentsList.innerHTML = sorted.map(apt => {
        const isPast = isPastAppointment(apt.appointment_date, apt.appointment_time);
        const canCancel = apt.status !== 'cancelada' && !isPast;
        
        return `
            <div class="user-appointment-card">
                <div class="appointment-header">
                    <div>
                        <h5 class="mb-1">Cita de Belleza</h5>
                        <small class="text-muted">Con ${apt.employee_name || 'Especialista'}</small>
                    </div>
                    <span class="appointment-status status-${apt.status}">
                        ${apt.status === 'pendiente' ? '⏳ Pendiente' : 
                          apt.status === 'confirmada' ? '✓ Confirmada' : 
                          '✗ Cancelada'}
                    </span>
                </div>
                
                <div class="appointment-details">
                    <div class="appointment-detail">
                        <strong>📅</strong>
                        <span>${formatDateLong(apt.appointment_date)}</span>
                    </div>
                    <div class="appointment-detail">
                        <strong>🕐</strong>
                        <span>${apt.appointment_time.slice(0, 5)}</span>
                    </div>
                    ${apt.notes ? `
                        <div class="appointment-detail">
                            <strong>📝</strong>
                            <span>${apt.notes}</span>
                        </div>
                    ` : ''}
                </div>

                ${canCancel ? `
                    <div class="appointment-actions">
                        <button 
                            class="btn-cancel-appointment" 
                            onclick="window.cancelUserAppointment(${apt.id})">
                            Cancelar cita
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function isPastAppointment(date, time) {
    try {
        const appointmentDateTime = new Date(`${date}T${time}`);
        return appointmentDateTime < new Date();
    } catch (error) {
        return false;
    }
}

window.cancelUserAppointment = async function(appointmentId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) return;

    try {
        const res = await fetch(`${API_BASE}/citas/${appointmentId}/cancel`, {
            method: 'PATCH',
            credentials: 'include'
        });
        const data = await res.json();

        if (data.ok) {
            showFeedback('Cita cancelada exitosamente', 'success');
            await loadUserAppointments();
        } else {
            alert(data.message || 'Error al cancelar cita');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cancelar cita');
    }
};

function initCalendar() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderCalendar(currentYear, currentMonth);
}

function renderCalendar(year, month) {
    userMonthYear.textContent = `${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month))} ${year}`;
    userCalendarDays.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const startWeekDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < startWeekDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day inactive';
        userCalendarDays.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = day;

        const dateStr = formatDateYYYYMMDD(year, month, day);
        const cellDate = new Date(year, month, day);

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            cell.classList.add('today');
        }

        if (cellDate < today) {
            cell.classList.add('past');
        } else {
            cell.addEventListener('click', () => {
                selectedDate = dateStr;
                userSelectedDateText.textContent = formatDateLong(dateStr);

                document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');

                if (userEmployeeSelect.value) {
                    populateTimeOptions(dateStr);
                }
            });
        }

        if (selectedDate === dateStr) {
            cell.classList.add('selected');
        }

        userCalendarDays.appendChild(cell);
    }
}

async function populateTimeOptions(dateStr) {
    userTimeSelect.innerHTML = '<option value="">Cargando horarios...</option>';

    const employeeId = parseInt(userEmployeeSelect.value);
    if (!employeeId) {
        userTimeSelect.innerHTML = '<option value="">Primero selecciona un especialista</option>';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/citas/by-date?date=${dateStr}`, {
            credentials: 'include'
        });
        const data = await res.json();

        const bookedTimes = data.ok ? data.appointments
            .filter(a => a.employee_id === employeeId && a.status !== 'cancelada')
            .map(a => a.appointment_time.slice(0, 5)) : [];

        userTimeSelect.innerHTML = '';

        for (let h = 8; h <= 18; h++) {
            const timeStr = `${String(h).padStart(2, '0')}:00`;
            const isBooked = bookedTimes.includes(timeStr);

            const option = document.createElement('option');
            option.value = timeStr;
            option.textContent = isBooked ? `${timeStr} (ocupado)` : timeStr;
            option.disabled = isBooked;

            userTimeSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error:', error);
        userTimeSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
    }
}

async function handleCreateAppointment(e) {
    e.preventDefault();

    if (!selectedDate) {
        showFeedback('Por favor selecciona una fecha', 'error');
        return;
    }

    const employeeId = parseInt(userEmployeeSelect.value);
    const time = userTimeSelect.value;
    const notes = userNotes.value.trim();

    if (!employeeId || !time) {
        showFeedback('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/citas/user-create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                employee_id: employeeId,
                appointment_date: selectedDate,
                appointment_time: time,
                notes: notes
            })
        });

        const data = await res.json();

        if (data.ok) {
            showFeedback('¡Cita agendada exitosamente!', 'success');
            formNuevaCita.reset();
            selectedDate = null;
            userSelectedDateText.textContent = 'Ninguna';
            
            setTimeout(() => {
                panelNuevaCita.style.display = 'none';
                btnNuevaCita.style.display = 'block';
                userBookingFeedback.textContent = '';
                userBookingFeedback.className = '';
                loadUserAppointments();
            }, 1500);
        } else {
            showFeedback(data.message || 'Error al agendar cita', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showFeedback('Error de conexión al servidor', 'error');
    }
}

function formatDateYYYYMMDD(y, mZeroBased, d) {
    const mm = String(mZeroBased + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
}

function formatDateLong(dateStrYYYYMMDD) {
    if (!dateStrYYYYMMDD) return 'Fecha inválida';
    try {
        const parts = dateStrYYYYMMDD.split('-');
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function showFeedback(message, type) {
    userBookingFeedback.textContent = message;
    userBookingFeedback.className = type === 'error' ? 'alert alert-danger' : 'alert alert-success';

    if (type !== 'info') {
        setTimeout(() => {
            userBookingFeedback.textContent = '';
            userBookingFeedback.className = '';
        }, 5000);
    }
}

// Función para verificar si hay sesión activa
async function checkUserSession() {
    try {
        const res = await fetch(`${API_BASE}/citas/check-session`, {
            credentials: 'include'
        });
        
        if (res.status === 401) {
            return false;
        }
        
        const data = await res.json();
        return data.ok && data.authenticated;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const btnMisCitas = document.getElementById('btnMisCitas');
    
    btnMisCitas?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        console.log('Click en Mis Citas');
        
        // Verificar sesión con el servidor
        const isAuthenticated = await checkUserSession();
        
        if (!isAuthenticated) {
            alert('Debes iniciar sesión para ver tus citas');
            document.getElementById('openLoginBtn')?.click();
            return;
        }

        // Ocultar todas las secciones
        document.querySelectorAll('.pagina-section, section').forEach(section => {
            if (section.id !== 'seccionCitas') {
                section.classList.add('hidden');
            }
        });
        
        // Mostrar sección de citas
        const seccionCitas = document.getElementById('seccionCitas');
        if (seccionCitas) {
            seccionCitas.classList.remove('hidden');
            initUserAppointments();
        }
    });
});