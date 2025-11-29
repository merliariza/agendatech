document.addEventListener("DOMContentLoaded", cargarUsuarios);

function cargarUsuarios() {
  fetch("http://localhost:3000/api/admin-usuarios", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(usuarios => {

      if (!Array.isArray(usuarios)) {
        console.error("⚠ Error del servidor:", usuarios);
        return;
      }

      const tabla = document.querySelector("#tablaUsuarios tbody");
      tabla.innerHTML = "";

      usuarios.forEach(u => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
          <td>${u.user_id}</td>
          <td>${u.name} ${u.surname}</td>
          <td>${u.phone || "—"}</td>
          <td>
            <select data-id="${u.user_id}" class="cambiarRol">
              <option value="cliente" ${u.role === "cliente" ? "selected" : ""}>Cliente</option>
              <option value="administrador" ${u.role === "administrador" ? "selected" : ""}>Administrador</option>
            </select>
          </td>
          <td>
            <button class="btn-secondary" data-id="${u.user_id}">Eliminar</button>
          </td>
        `;

        tabla.appendChild(fila);
      });

      agregarEventos();
    });
}

function agregarEventos() {
  document.querySelectorAll(".btnDelete").forEach(btn => {
    btn.addEventListener("click", eliminarUsuario);
  });

  document.querySelectorAll(".cambiarRol").forEach(sel => {
    sel.addEventListener("change", cambiarRol);
  });
}

function eliminarUsuario(e) {
  const id = e.target.dataset.id;

  if (!confirm("¿Seguro que desea eliminar este usuario?")) return;

  fetch(`http://localhost:3000/api/admin-usuarios/${id}`, {
    method: "DELETE",
    credentials: "include"
  })
    .then(res => res.json())
    .then(() => cargarUsuarios());
}

function cambiarRol(e) {
  const id = e.target.dataset.id;
  const role = e.target.value;

  fetch(`http://localhost:3000/api/admin-usuarios/rol/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role })
  })
    .then(res => res.json())
    .then(() => alert("Rol actualizado"));
}
