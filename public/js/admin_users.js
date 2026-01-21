console.log("ADMIN userS JS CARGÓ");

function cargarusers() {
  console.log("CARGANDO userS...");

  fetch("http://localhost:3000/api/admin-users", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(users => {

      if (!Array.isArray(users)) {
        console.error("Error del servidor:", users);
        return;
      }

      const tabla = document.querySelector("#tablausers tbody");

      if (!tabla) {
        console.error("No existe la tabla en el DOM");
        return;
      }

      tabla.innerHTML = "";

      users.forEach(u => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
          <td>${u.user_id}</td>
          <td>${u.name} ${u.surname}</td>
          <td>${u.phone || "—"}</td>
          <td>
            <select data-id="${u.user_id}" class="cambiarRol">
              <option value="cliente" ${u.role === "cliente" ? "selected" : ""}>Cliente</option>
              <option value="administrador" ${u.role === "administrador" ? "selected" : ""}>Administrador</option>
              <option value="empleado" ${u.role === "empleado" ? "selected" : ""}>Empleado</option>
            </select>
          </td>
          <td>
            <button class="btnDelete btn-secondary" data-id="${u.user_id}">Eliminar</button>
          </td>
        `;

        tabla.appendChild(fila);
      });

      agregarEventos();
    });
}

function agregarEventos() {
  document.querySelectorAll(".btnDelete").forEach(btn => {
    btn.addEventListener("click", eliminaruser);
  });

  document.querySelectorAll(".cambiarRol").forEach(sel => {
    sel.addEventListener("change", cambiarRol);
  });
}

function eliminaruser(e) {
  const id = e.target.dataset.id;

  if (!confirm("¿Seguro que desea eliminar este user?")) return;

  fetch(`http://localhost:3000/api/admin-users/${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(res => res.json())
    .then(() => cargarusers());
}

function cambiarRol(e) {
  const id = e.target.dataset.id;
  const role = e.target.value;

  fetch(`http://localhost:3000/api/admin-users/rol/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role })
  })
    .then(res => res.json())
    .then(() => alert("Rol actualizado"));
}
