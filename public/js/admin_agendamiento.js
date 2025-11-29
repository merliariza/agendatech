document.addEventListener("DOMContentLoaded", async function () {
    const API_BASE = "http://localhost:3000/api";

    let employees = [];
    let appointments = [];
    let selectedDate = null;
    let currentYear, currentMonth;

    const monthYear = document.getElementById("monthYear");
    const calendarDays = document.getElementById("calendarDays");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");
    const selectedDateText = document.getElementById("selectedDateText");
    const employeeSelect = document.getElementById("employeeSelect");
    const timeSelect = document.getElementById("timeSelect");
    const bookingForm = document.getElementById("bookingForm");
    const bookingFeedback = document.getElementById("bookingFeedback");
    const appointmentsContainer = document.getElementById("appointmentsContainer");
    const customerEmailInput = document.getElementById("customerEmail");
    const customerNameInput = document.getElementById("customerName");

    async function loadInitialData() {
        try {
            showFeedback("Cargando datos...", "info");
           
            const employeesRes = await fetch(`${API_BASE}/citas/employees`, {
                credentials: 'include'
            });
            
            if (!employeesRes.ok) {
                throw new Error(`Error HTTP: ${employeesRes.status}`);
            }
            
            const employeesData = await employeesRes.json();
            console.log("Empleados cargados:", employeesData);
            
            if (employeesData.ok) {
                employees = employeesData.employees;
            } else {
                throw new Error(employeesData.message || "Error al cargar empleados");
            }
            
            if (employees.length === 0) {
                showFeedback("⚠️ No hay empleados registrados. Contacta al administrador.", "error");
            }

            await loadAppointments();

            populateSelects();
            
            if (employees.length > 0) {
                bookingFeedback.textContent = "";
            }

        } catch (error) {
            console.error("Error cargando datos:", error);
            showFeedback(`Error: ${error.message}. Verifica la conexión al servidor.`, "error");
        }
    }

    async function loadAppointments(date = null) {
        try {
            const url = date 
                ? `${API_BASE}/citas/by-date?date=${date}`
                : `${API_BASE}/citas`;
            
            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json();
            
            if (data.ok) {
                appointments = data.appointments;
                renderAppointments();
            }
        } catch (error) {
            console.error("Error cargando citas:", error);
        }
    }

    function populateSelects() {
        employeeSelect.innerHTML = '<option value="">Seleccione un empleado</option>';
        employees.forEach(e => {
            employeeSelect.innerHTML += `<option value="${e.id}">${e.name} ${e.surname}</option>`;
        });
    }

    let clientesCache = [];
    
    customerEmailInput.addEventListener("input", async function() {
        const query = this.value.trim();
        if (query.length < 2) return;

        try {
            const res = await fetch(`${API_BASE}/citas/customers?q=${encodeURIComponent(query)}`, {
                credentials: 'include'
            });
            const data = await res.json();
            
            if (data.ok && data.customers.length > 0) {
                clientesCache = data.customers;
                const exactMatch = data.customers.find(c => c.email.toLowerCase() === query.toLowerCase());
                if (exactMatch && !customerNameInput.value) {
                    customerNameInput.value = `${exactMatch.name} ${exactMatch.surname}`;
                }
            }
        } catch (error) {
            console.error("Error buscando clientes:", error);
        }
    });

    function initCalendar() {
        const today = new Date();
        currentYear = today.getFullYear();
        currentMonth = today.getMonth();
        renderCalendar(currentYear, currentMonth);
    }

    function renderCalendar(year, month) {
        monthYear.textContent = `${new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date(year, month))} ${year}`;
        calendarDays.innerHTML = "";

        const firstDay = new Date(year, month, 1);
        const startWeekDay = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < startWeekDay; i++) {
            const empty = document.createElement("div");
            empty.className = "calendar-day inactive";
            calendarDays.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-day";
            cell.textContent = day;

            const dateStr = formatDateYYYYMMDD(year, month, day);
            const today = new Date();
            
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                cell.classList.add("today");
            }

            if (selectedDate === dateStr) {
                cell.classList.add("selected");
            }

            cell.addEventListener("click", () => {
                selectedDate = dateStr;
                selectedDateText.innerHTML = formatDateLong(dateStr);
                
                document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove("selected"));
                cell.classList.add("selected");
                
                populateTimeOptionsForDate(dateStr);
            });

            calendarDays.appendChild(cell);
        }
    }

    prevMonth.addEventListener("click", () => {
        currentMonth--;
        if (currentMonth < 0) { 
            currentYear--; 
            currentMonth = 11; 
        }
        renderCalendar(currentYear, currentMonth);
    });

    nextMonth.addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) { 
            currentYear++; 
            currentMonth = 0; 
        }
        renderCalendar(currentYear, currentMonth);
    });

    function formatDateYYYYMMDD(y, mZeroBased, d) {
        const mm = String(mZeroBased + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${y}-${mm}-${dd}`;
    }

    function formatDateLong(dateStrYYYYMMDD) {
        const d = new Date(dateStrYYYYMMDD + "T12:00:00");
        return d.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    }

    function populateTimeOptionsForDate(dateStr) {
        timeSelect.innerHTML = "";
        const startHour = 8;
        const endHour = 18;
        const selectedEmployeeId = parseInt(employeeSelect.value) || null;

        const bookedForDate = appointments.filter(a => 
            a.appointment_date === dateStr && 
            a.status !== 'cancelada'
        );

        for (let h = startHour; h <= endHour; h++) {
            const hh = String(h).padStart(2, "0");
            const timeStr = `${hh}:00`;

            let isBooked = false;
            
            if (selectedEmployeeId) {
                isBooked = bookedForDate.some(a => 
                    a.employee_id === selectedEmployeeId && 
                    a.appointment_time.startsWith(timeStr)
                );
            }

            const option = document.createElement("option");
            option.value = timeStr;
            option.textContent = isBooked ? `${timeStr} (ocupado)` : timeStr;
            option.disabled = isBooked;

            timeSelect.appendChild(option);
        }
    }

    employeeSelect.addEventListener("change", () => {
        if (selectedDate) {
            populateTimeOptionsForDate(selectedDate);
        }
    });

    bookingForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        if (!selectedDate) {
            showFeedback("Selecciona una fecha en el calendario primero", "error");
            return;
        }

        const customerEmail = customerEmailInput.value.trim();
        const customerName = customerNameInput.value.trim();
        const employeeId = parseInt(employeeSelect.value);
        const appointmentTime = timeSelect.value;
        const paymentMethod = document.getElementById("paymentMethod").value;
        const notes = document.getElementById("notes").value.trim();

        if (!customerEmail || !customerName || !employeeId || !appointmentTime) {
            showFeedback("Completa todos los campos requeridos", "error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/citas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    customer_email: customerEmail,
                    customer_name: customerName,
                    employee_id: employeeId,
                    appointment_date: selectedDate,
                    appointment_time: appointmentTime,
                    payment_method: paymentMethod,
                    notes: notes
                })
            });

            const data = await res.json();

            if (data.ok) {
                showFeedback("¡Cita agendada correctamente!", "success");
                bookingForm.reset();
                await loadAppointments();
                populateTimeOptionsForDate(selectedDate);
            } else {
                showFeedback(data.message || "Error al agendar cita", "error");
            }
        } catch (error) {
            console.error("Error:", error);
            showFeedback("Error de conexión al servidor", "error");
        }
    });

    document.getElementById("resetBooking")?.addEventListener("click", () => {
        bookingForm.reset();
        bookingFeedback.textContent = "";
    });

    function renderAppointments() {
        appointmentsContainer.innerHTML = "";
        
        if (!appointments || appointments.length === 0) {
            appointmentsContainer.innerHTML = `<p style="color:#777">No hay citas agendadas.</p>`;
            return;
        }

        const sorted = appointments.slice().sort((a, b) => {
            if (a.appointment_date === b.appointment_date) {
                return a.appointment_time.localeCompare(b.appointment_time);
            }
            return a.appointment_date.localeCompare(b.appointment_date);
        });

        sorted.forEach(a => {
            const item = document.createElement("div");
            item.className = "appointment-item";

            const left = document.createElement("div");
            left.innerHTML = `
                <div class="appointment-meta">${formatDateLong(a.appointment_date)} • ${a.appointment_time.slice(0,5)} • ${a.employee_name || ''}</div>
                <div class="appointment-meta">Cliente: ${a.customer_name}</div>
                <div class="appointment-meta">Estado: <strong>${a.status}</strong></div>
            `;

            const right = document.createElement("div");
            right.className = "appointment-actions";

            const btnCancel = document.createElement("button");
            btnCancel.className = "btn-primary";
            btnCancel.textContent = a.status === 'cancelada' ? "Cancelada" : "Cancelar";
            btnCancel.disabled = a.status === 'cancelada';
            
            btnCancel.addEventListener("click", async () => {
                if (!confirm("¿Estás segura de cancelar esta cita?")) return;
                
                try {
                    const res = await fetch(`${API_BASE}/citas/${a.id}/cancel`, {
                        method: 'PATCH',
                        credentials: 'include'
                    });
                    
                    const data = await res.json();
                    if (data.ok) {
                        showFeedback("Cita cancelada", "success");
                        await loadAppointments();
                        if (selectedDate) populateTimeOptionsForDate(selectedDate);
                    }
                } catch (error) {
                    console.error("Error:", error);
                    showFeedback("Error al cancelar cita", "error");
                }
            });

            right.appendChild(btnCancel);
            item.appendChild(left);
            item.appendChild(right);
            appointmentsContainer.appendChild(item);
        });
    }

    function showFeedback(message, type) {
        bookingFeedback.textContent = message;
        if (type === "error") {
            bookingFeedback.style.color = "crimson";
            bookingFeedback.style.background = "#fee";
            bookingFeedback.style.padding = "0.75rem";
            bookingFeedback.style.borderRadius = "6px";
        } else if (type === "success") {
            bookingFeedback.style.color = "green";
            bookingFeedback.style.background = "#efe";
            bookingFeedback.style.padding = "0.75rem";
            bookingFeedback.style.borderRadius = "6px";
        } else {
            bookingFeedback.style.color = "#666";
            bookingFeedback.style.background = "#f5f5f5";
            bookingFeedback.style.padding = "0.75rem";
            bookingFeedback.style.borderRadius = "6px";
        }
        
        if (type !== "info") {
            setTimeout(() => {
                bookingFeedback.textContent = "";
                bookingFeedback.style.background = "transparent";
                bookingFeedback.style.padding = "0";
            }, 5000);
        }
    }

    await loadInitialData();
    initCalendar();
});