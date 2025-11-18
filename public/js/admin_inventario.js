const API_URL = "http://localhost:3000/api/productos";

const productTableBody = document.getElementById("productTableBody");
const productForm = document.getElementById("productForm");
const previewImage = document.getElementById("previewImage");
const cancelEdit = document.getElementById("cancelEdit");

let products = [];
let editing = false;

// =============================
// CARGAR PRODUCTOS DESDE LA API
// =============================
async function loadProducts() {
    const res = await fetch(API_URL);
    products = await res.json();
    renderProducts();
}

loadProducts();

// =============================
// PREVISUALIZAR IMAGEN
// =============================
document.getElementById("productImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});

// =============================
// CREAR O EDITAR PRODUCTO 
// =============================
productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const product = {
        name: document.getElementById("name").value,
        description: document.getElementById("description").value,
        price: parseFloat(document.getElementById("price").value),
        stock: parseInt(document.getElementById("stock").value),
        min_stock: parseInt(document.getElementById("min_stock").value),
        category: document.getElementById("category").value,
        active: document.getElementById("active").value === "1",
        image: previewImage.src || ""
    };

    // EDITAR
    if (editing) {
        const id = document.getElementById("product_id").value;

        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });

        if (!res.ok) {
            console.error("Error al actualizar producto");
            return;
        }

        editing = false;
        cancelEdit.classList.add("hidden");
        document.getElementById("formTitle").innerText = "Agregar Producto";

    } else {
        // CREAR
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });

        if (!res.ok) {
            console.error("Error al crear producto");
            return;
        }
    }

    productForm.reset();
    previewImage.classList.add("hidden");
    previewImage.src = "";

    await loadProducts();
});

// =============================
// PINTAR TABLA
// =============================
function renderProducts() {
    productTableBody.innerHTML = "";

    products.forEach(p => {
        productTableBody.innerHTML += `
        <tr>
            <td><img src="${p.image}" width="60"></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>$${p.price}</td>
            <td>${p.stock}</td>
            <td>${p.min_stock}</td>
            <td>${p.active ? "Sí" : "No"}</td>
            <td>
                <button onclick="editProduct(${p.id})">Editar</button>
                <button onclick="deleteProduct(${p.id})">Eliminar</button>
            </td>
        </tr>`;
    });
}

// =============================
// EDITAR PRODUCTO
// =============================
function editProduct(id) {
    const p = products.find(x => x.id === id);

    document.getElementById("name").value = p.name;
    description.value = p.description;
    price.value = p.price;
    stock.value = p.stock;
    min_stock.value = p.min_stock;
    category.value = p.category;
    active.value = p.active ? "1" : "0";

    previewImage.src = p.image;
    previewImage.classList.remove("hidden");

    product_id.value = p.id;

    editing = true;
    cancelEdit.classList.remove("hidden");
    document.getElementById("formTitle").innerText = "Editar Producto";
}

// =============================
// ELIMINAR PRODUCTO
// =============================
async function deleteProduct(id) {
    if (!confirm("¿Eliminar producto?")) return;

    await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    await loadProducts();
}

// =============================
// CANCELAR EDICIÓN
// =============================
cancelEdit.addEventListener("click", () => {
    editing = false;
    productForm.reset();
    previewImage.classList.add("hidden");
    previewImage.src = "";
    cancelEdit.classList.add("hidden");
    document.getElementById("formTitle").innerText = "Agregar Producto";
});



document.getElementById("productImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;  // Base64
        previewImage.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});
