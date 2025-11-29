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
            await loadAllCustomers();

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
    let clientesDatalist = document.createElement('datalist');
    clientesDatalist.id = 'clientesList';
    document.body.appendChild(clientesDatalist);
    customerNameInput.setAttribute('list', 'clientesList');
    
    async function loadAllCustomers() {
        try {
            const res = await fetch(`${API_BASE}/citas/customers`, {
                credentials: 'include'
            });
            const data = await res.json();
            
            if (data.ok && data.customers.length > 0) {
                clientesCache = data.customers;
                updateCustomerDatalist();
            }
        } catch (error) {
            console.error("Error cargando clientes:", error);
        }
    }

    function updateCustomerDatalist() {
        clientesDatalist.innerHTML = '';
        clientesCache.forEach(c => {
            const option = document.createElement('option');
            option.value = `${c.name} ${c.surname}`;
            option.setAttribute('data-email', c.email);
            clientesDatalist.appendChild(option);
        });
    }

    customerNameInput.addEventListener("input", function() {
        const selectedName = this.value;
        const cliente = clientesCache.find(c => 
            `${c.name} ${c.surname}` === selectedName
        );
        if (cliente) {
            customerEmailInput.value = cliente.email;
        }
    });
    
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
                updateCustomerDatalist();
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
        if (!dateStrYYYYMMDD || dateStrYYYYMMDD === 'Invalid Date') {
            return 'Fecha inválida';
        }
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

    function populateTimeOptionsForDate(dateStr) {
        timeSelect.innerHTML = "";
        const startHour = 8;
        const endHour = 18;
        const selectedEmployeeId = parseInt(employeeSelect.value) || null;
        const editingId = bookingForm.dataset.editingId;

        const bookedForDate = appointments.filter(a => 
            a.appointment_date === dateStr && 
            a.status !== 'cancelada' &&
            (!editingId || a.id != editingId)
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

        const editingId = bookingForm.dataset.editingId;

        try {
            const url = editingId ? `${API_BASE}/citas/${editingId}` : `${API_BASE}/citas`;
            const method = editingId ? 'PUT' : 'POST';
            
            console.log('Enviando solicitud:', method, url);
            console.log('Datos:', {
                customer_email: customerEmail,
                customer_name: customerName,
                employee_id: employeeId,
                appointment_date: selectedDate,
                appointment_time: appointmentTime,
                payment_method: paymentMethod,
                notes: notes
            });
            
            const res = await fetch(url, {
                method: method,
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

            console.log('Respuesta HTTP:', res.status);
            const data = await res.json();
            console.log('Datos respuesta:', data);

            if (data.ok) {
                showFeedback(editingId ? "¡Cita actualizada correctamente!" : "¡Cita agendada correctamente!", "success");
                bookingForm.reset();
                delete bookingForm.dataset.editingId;
                document.querySelector('button[type="submit"]').textContent = "Agendar Cita";
                await loadAppointments();
                if (selectedDate) {
                    populateTimeOptionsForDate(selectedDate);
                }
            } else {
                showFeedback(data.message || `Error al ${editingId ? 'actualizar' : 'agendar'} cita`, "error");
            }
        } catch (error) {
            console.error("Error:", error);
            showFeedback("Error de conexión al servidor", "error");
        }
    });

    document.getElementById("resetBooking")?.addEventListener("click", () => {
        bookingForm.reset();
        bookingFeedback.textContent = "";
        delete bookingForm.dataset.editingId;
        document.querySelector('button[type="submit"]').textContent = "Agendar Cita";
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
                <div class="appointment-meta">Email: ${a.customer_email || 'N/A'}</div>
                <div class="appointment-meta">Estado: <strong>${a.status}</strong></div>
                ${a.notes ? `<div class="appointment-meta">Notas: ${a.notes}</div>` : ''}
            `;

            const right = document.createElement("div");
            right.className = "appointment-actions";
            right.style.display = "flex";
            right.style.gap = "8px";
            right.style.flexWrap = "wrap";

            if (a.status !== 'cancelada') {
                const btnEdit = document.createElement("button");
                btnEdit.className = "btn-secondary";
                btnEdit.textContent = "Editar";
                
                btnEdit.addEventListener("click", async () => {
                    console.log('Editando cita:', a);
                    
                    selectedDate = a.appointment_date;
                    selectedDateText.innerHTML = formatDateLong(a.appointment_date);
                    
                    const [year, month, day] = a.appointment_date.split('-').map(Number);
                    currentYear = year;
                    currentMonth = month - 1;
                    renderCalendar(currentYear, currentMonth);
                    
                    customerEmailInput.value = a.customer_email || '';
                    customerNameInput.value = a.customer_name || '';
                    employeeSelect.value = a.employee_id;
                    document.getElementById("paymentMethod").value = a.payment_method || 'efectivo';
                    document.getElementById("notes").value = a.notes || '';
                    
                    bookingForm.dataset.editingId = a.id;
                    
                    populateTimeOptionsForDate(a.appointment_date);
                    
                    setTimeout(() => {
                        timeSelect.value = a.appointment_time.slice(0,5);
                        document.querySelector('button[type="submit"]').textContent = "Actualizar Cita";
                    }, 100);
                    
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });

                right.appendChild(btnEdit);
            }

            const btnCancel = document.createElement("button");
            btnCancel.className = "btn-primary";
            btnCancel.textContent = a.status === 'cancelada' ? "Cancelada" : "Cancelar";
            btnCancel.disabled = a.status === 'cancelada';
            
            btnCancel.addEventListener("click", async () => {
                if (!confirm("¿Estás segura de cancelar esta cita?")) return;
                
                try {
                    console.log('Cancelando cita:', a.id);
                    const res = await fetch(`${API_BASE}/citas/${a.id}/cancel`, {
                        method: 'PATCH',
                        credentials: 'include'
                    });
                    
                    console.log('Respuesta cancelación:', res.status);
                    const data = await res.json();
                    console.log('Datos cancelación:', data);
                    
                    if (data.ok) {
                        showFeedback("Cita cancelada", "success");
                        await loadAppointments();
                        if (selectedDate) populateTimeOptionsForDate(selectedDate);
                    } else {
                        showFeedback(data.message || "Error al cancelar cita", "error");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    showFeedback("Error al cancelar cita", "error");
                }
            });

            const btnDelete = document.createElement("button");
            btnDelete.className = "btnDelete";
            btnDelete.textContent = "Eliminar";
            
            btnDelete.addEventListener("click", async () => {
                if (!confirm("¿Estás segura de eliminar esta cita permanentemente?")) return;
                
                try {
                    console.log('Eliminando cita:', a.id);
                    const res = await fetch(`${API_BASE}/citas/${a.id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    
                    console.log('Respuesta eliminación:', res.status);
                    const data = await res.json();
                    console.log('Datos eliminación:', data);
                    
                    if (data.ok) {
                        showFeedback("Cita eliminada correctamente", "success");
                        await loadAppointments();
                        if (selectedDate) populateTimeOptionsForDate(selectedDate);
                    } else {
                        showFeedback(data.message || "Error al eliminar cita", "error");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    showFeedback("Error al eliminar cita", "error");
                }
            });

            right.appendChild(btnCancel);
            right.appendChild(btnDelete);
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