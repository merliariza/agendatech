/* ========= AGENDAMIENTOS - JS (CORREGIDO) =========
   - Evita bug de zona horaria usando fechas ISO con hora 12:00 (mediodía).
   - Marcar día seleccionado correctamente al navegar meses.
   - Filtrar horas disponibles por empleado (no mostrar las ya reservadas).
   - Mejor manejo de selects y renderizados.
*/

document.addEventListener("DOMContentLoaded", function () {

    // SIMULACIÓN DE DATOS: servicios y empleados (normalmente vienen de BD)
    const services = [
        { id: 1, name: "Cabello (Corte + Peinado)", description: "Corte y peinado profesional", price: 35000, duration_minutes: 60 },
        { id: 2, name: "Uñas (Manicure)", description: "Manicure clásico", price: 25000, duration_minutes: 45 },
        { id: 3, name: "Cejas y Pestañas", description: "Depilación y diseño", price: 20000, duration_minutes: 40 },
        { id: 4, name: "Maquillaje", description: "Maquillaje social", price: 45000, duration_minutes: 90 }
    ];

    const employees = [
        { id: 101, name: "Andrea" },
        { id: 102, name: "Camila" },
        { id: 103, name: "Lucía" }
    ];

    // Estado local
    let appointments = []; // simulación de tabla Appointment
    let selectedDate = null; // formato YYYY-MM-DD
    let currentYear, currentMonth;

    // DOM references
    const monthYear = document.getElementById("monthYear");
    const calendarDays = document.getElementById("calendarDays");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

    const selectedServicePill = document.getElementById("selectedServicePill");
    const selectedDateText = document.getElementById("selectedDateText");

    const serviceSelect = document.getElementById("serviceSelect");
    const employeeSelect = document.getElementById("employeeSelect");
    const timeSelect = document.getElementById("timeSelect");

    const bookingForm = document.getElementById("bookingForm");
    const bookingFeedback = document.getElementById("bookingFeedback");
    const appointmentsContainer = document.getElementById("appointmentsContainer");

    // ---------- HELPERS PARA FECHAS (evitan timezone bug) ----------
    // Construye una cadena ISO segura (mediodía) para evitar desfases de zona horaria.
    function buildDateISONoTZ(year, monthZeroBased, day) {
        const mm = String(monthZeroBased + 1).padStart(2, "0");
        const dd = String(day).padStart(2, "0");
        // ponemos 12:00:00 para evitar que el Date interprete el día anterior por zonas horarias
        return `${year}-${mm}-${dd}T12:00:00`;
    }

    // Devuelve YYYY-MM-DD a partir de year, month (0-11), day
    function formatDateYYYYMMDD(y, mZeroBased, d) {
        const mm = String(mZeroBased + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
    }

    // Convierte YYYY-MM-DD a texto largo en español usando mediodía para evitar zona horaria
    function formatDateLong(dateStrYYYYMMDD) {
        const d = new Date(dateStrYYYYMMDD + "T12:00:00");
        return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Comparador simple de YYYY-MM-DD
    function isSameDateISO(a, b) {
        if (!a || !b) return false;
        return a === b;
    }

    // ---------- INICIALIZACIÓN DE SELECTS ----------
    function initData() {
        serviceSelect.innerHTML = "";
        services.forEach(s => serviceSelect.innerHTML += `<option value="${s.id}">${s.name} — $${s.price}</option>`);

        employeeSelect.innerHTML = "";
        employees.forEach(e => employeeSelect.innerHTML += `<option value="${e.id}">${e.name}</option>`);
    }

    // ---------- CALENDARIO ----------
    function initCalendar() {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        renderCalendar(currentYear, currentMonth);
    }

    function renderCalendar(year, month) {
        // month is 0-11
        monthYear.textContent = `${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month))} ${year}`;
        calendarDays.innerHTML = "";

        const firstDay = new Date(year, month, 1);
        // Ajustamos para que lunes sea el primer día (0)
        const startWeekDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // placeholders del mes anterior (inactivos)
        for (let i = 0; i < startWeekDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-day inactive";
            calendarDays.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-day";
            cell.textContent = day;
            cell.setAttribute("data-day", String(day));
            cell.setAttribute("data-year", String(year));
            cell.setAttribute("data-month", String(month)); // 0-11

            // marcar hoy
            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                cell.classList.add("today");
            }

            // marcar seleccionado si coincide con selectedDate
            const isoForCell = formatDateYYYYMMDD(year, month, day);
            if (isSameDateISO(selectedDate, isoForCell)) {
                cell.classList.add("selected");
            }

            // click handler estableciendo la fecha con método seguro
            cell.addEventListener("click", (e) => {
                if (cell.classList.contains("inactive")) return;
                const y = parseInt(cell.getAttribute("data-year"));
                const m = parseInt(cell.getAttribute("data-month"));
                const d = parseInt(cell.getAttribute("data-day"));

                // Construir YYYY-MM-DD seguro
                const safeISO = buildDateISONoTZ(y, m, d); // e.g. 2025-11-15T12:00:00
                const safeYMD = safeISO.split("T")[0];

                selectedDate = safeYMD;

                // actualizar visual
                Array.from(calendarDays.children).forEach(c => c.classList.remove("selected"));
                cell.classList.add("selected");

                selectedDateText.innerHTML = formatDateLong(selectedDate);

                // recalcular horas disponibles (según empleado seleccionado)
                populateTimeOptionsForDate(selectedDate);

                // actualizar lista de citas y demás vistas
                renderAppointments();
            });

            calendarDays.appendChild(cell);
        }
    }

    prevMonth.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { currentYear--; currentMonth = 11; }
        renderCalendar(currentYear, currentMonth);
    });

    nextMonth.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { currentYear++; currentMonth = 0; }
        renderCalendar(currentYear, currentMonth);
    });

    // ---------- HORARIOS DISPONIBLES ----------
    // Ahora la función tiene en cuenta el empleado seleccionado. Si no hay empleado, muestra todas las horas.
    function populateTimeOptionsForDate(dateStr) {
        timeSelect.innerHTML = "";
        const startHour = 8;
        const endHour = 18;
        const selectedEmployeeId = parseInt(employeeSelect.value) || null;

        // Citas no canceladas para esa fecha
        const bookedForDate = appointments.filter(a => a.appointment_date === dateStr && a.status !== 'cancelada');

        for (let h = startHour; h <= endHour; h++) {
            const hh = String(h).padStart(2, "0");
            const timeStr = `${hh}:00`;

            // si hay empleado seleccionado, verificar conflicto con ese empleado
            let isBooked = false;
            if (selectedEmployeeId) {
                isBooked = bookedForDate.some(a => a.employee_id === selectedEmployeeId && a.appointment_time.startsWith(timeStr));
            } else {
                // si no hay empleado seleccionado, marcamos como disponible solo si no existe cita para cualquier empleado
                isBooked = bookedForDate.some(a => a.appointment_time.startsWith(timeStr));
            }

            const option = document.createElement("option");
            option.value = timeStr;
            option.textContent = timeStr;

            if (isBooked) {
                option.disabled = true;
                option.textContent = `${timeStr} (ocupado)`;
            }

            timeSelect.appendChild(option);
        }
    }

    // ---------- CREAR CITA (simulación) ----------
    bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!selectedDate) {
            bookingFeedback.style.color = "crimson";
            bookingFeedback.textContent = "Selecciona una fecha en el calendario primero.";
            return;
        }

        const customerEmail = document.getElementById("customerEmail").value.trim();
        const customerName = document.getElementById("customerName").value.trim();
        const serviceId = parseInt(serviceSelect.value);
        const employeeId = parseInt(employeeSelect.value);
        const appointmentTime = timeSelect.value;
        const paymentMethod = document.getElementById("paymentMethod").value;
        const notes = document.getElementById("notes").value.trim();

        // validaciones
        if (!customerEmail || !customerName || !serviceId || !employeeId || !appointmentTime) {
            bookingFeedback.style.color = "crimson";
            bookingFeedback.textContent = "Completa todos los campos requeridos.";
            return;
        }

        // obtener servicio y precio
        const serviceObj = services.find(s => s.id === serviceId);
        const finalPrice = serviceObj ? serviceObj.price : 0;

        // verificar conflicto (mismo employee, misma fecha y hora)
        const conflict = appointments.find(a => a.employee_id === employeeId && a.appointment_date === selectedDate && a.appointment_time.startsWith(appointmentTime) && a.status !== 'cancelada');
        if (conflict) {
            bookingFeedback.style.color = "crimson";
            bookingFeedback.textContent = "La hora ya está ocupada para ese empleado. Elige otro horario o empleado.";
            return;
        }

        // crear cita (simulación - en producción aquí harías POST al backend)
        const appointment = {
            id: Date.now(),
            customer_id: customerEmail,           // -> en producción usarías person.id
            customer_name: customerName,
            employee_id: employeeId,
            service_id: serviceId,
            appointment_date: selectedDate,      // YYYY-MM-DD
            appointment_time: `${appointmentTime}:00`, // HH:MM:SS
            status: "pendiente",
            final_price: finalPrice,
            payment_method: paymentMethod,
            payment_status: "pendiente",
            amount_paid: 0,
            notes: notes,
            created_at: new Date().toISOString()
        };

        appointments.push(appointment);

        bookingFeedback.style.color = "green";
        bookingFeedback.textContent = "Cita agendada correctamente.";
        bookingForm.reset();
        selectedServicePill.textContent = "Seleccione un servicio";

        // limpiar selección de fecha
        selectedDate = null;
        selectedDateText.textContent = "Ninguna fecha seleccionada";

        // actualizar UI
        renderAppointments();
        renderCalendar(currentYear, currentMonth);
    });

    // ---------- RESET FORM ----------
    const resetBtn = document.getElementById("resetBooking");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            bookingForm.reset();
            bookingFeedback.textContent = "";
        });
    }

    // ---------- RENDER LISTA DE CITAS ----------
    function renderAppointments() {
        appointmentsContainer.innerHTML = "";
        if (!appointments || appointments.length === 0) {
            appointmentsContainer.innerHTML = `<p style="color:#777">No hay citas agendadas.</p>`;
            return;
        }

        // Ordenar por fecha y hora
        const sorted = appointments.slice().sort((a,b) => {
            if (a.appointment_date === b.appointment_date) return a.appointment_time.localeCompare(b.appointment_time);
            return a.appointment_date.localeCompare(b.appointment_date);
        });

        sorted.forEach(a => {
            const serviceObj = services.find(s => s.id === a.service_id);
            const employeeObj = employees.find(e => e.id === a.employee_id);

            const item = document.createElement("div");
            item.className = "appointment-item";

            const left = document.createElement("div");
            left.innerHTML = `<div style="font-weight:700">${serviceObj ? serviceObj.name : 'Servicio'}</div>
                              <div class="appointment-meta">${formatDateLong(a.appointment_date)} • ${a.appointment_time.slice(0,5)} • ${employeeObj ? employeeObj.name : ''}</div>
                              <div class="appointment-meta">Estado: <strong>${a.status}</strong></div>`;

            const right = document.createElement("div");
            right.className = "appointment-actions";

            const btnView = document.createElement("button");
            btnView.className = "btn-secondary";
            btnView.textContent = "Ver";
            btnView.addEventListener("click", () => {
                // rellenar formulario con datos de la cita seleccionada
                document.getElementById("customerEmail").value = a.customer_id;
                document.getElementById("customerName").value = a.customer_name;
                serviceSelect.value = a.service_id;
                employeeSelect.value = a.employee_id;

                // seleccionar la fecha en el calendario (si el mes actual no coincide, navegamos)
                const [y, m, d] = a.appointment_date.split("-");
                const yearNum = parseInt(y);
                const monthNumZeroBased = parseInt(m) - 1;
                const dayNum = parseInt(d);

                currentYear = yearNum;
                currentMonth = monthNumZeroBased;
                renderCalendar(currentYear, currentMonth);

                // seleccionar la celda que contiene ese día (se marcará por renderCalendar)
                selectedDate = a.appointment_date;
                selectedDateText.textContent = formatDateLong(selectedDate);

                // poblar horas (con empleado seleccionado)
                populateTimeOptionsForDate(selectedDate);
                setTimeout(() => {
                    Array.from(timeSelect.options).forEach(opt => {
                        if (opt.value === a.appointment_time.slice(0,5)) opt.selected = true;
                    });
                }, 10);

                selectedServicePill.textContent = serviceObj ? serviceObj.name : "Servicio";
                bookingFeedback.textContent = `Viendo cita (estado: ${a.status}). Puedes modificar o cancelar.`;
            });

            const btnCancel = document.createElement("button");
            btnCancel.className = "btn-primary";
            btnCancel.textContent = a.status === 'cancelada' ? "Cancelada" : "Cancelar";
            btnCancel.disabled = a.status === 'cancelada';
            btnCancel.addEventListener("click", () => {
                if (!confirm("¿Estás segura de cancelar esta cita?")) return;
                a.status = 'cancelada';
                // en producción: actualizar en la DB via fetch PUT
                renderAppointments();
                // si el usuario está viendo ese día, volver a poblar horas
                if (selectedDate === a.appointment_date) populateTimeOptionsForDate(selectedDate);
            });

            right.appendChild(btnView);
            right.appendChild(btnCancel);

            item.appendChild(left);
            item.appendChild(right);

            appointmentsContainer.appendChild(item);
        });
    }

    // ---------- EVENTOS: cambios servicio/empleado -----------
    serviceSelect.addEventListener("change", () => {
        const sid = parseInt(serviceSelect.value);
        const s = services.find(x => x.id === sid);
        selectedServicePill.textContent = s ? `${s.name} — $${s.price}` : "Seleccione un servicio";
        // Si quieres filtrar empleados por servicio, aquí podrías llamar a una función que actualice employeeSelect
    });

    employeeSelect.addEventListener("change", () => {
        // si ya hay fecha seleccionada, recalcular horas considerando este empleado
        if (selectedDate) populateTimeOptionsForDate(selectedDate);
    });

    // ---------- INICIALIZAR TODO ----------
    initData();
    initCalendar();
    renderAppointments();

});
