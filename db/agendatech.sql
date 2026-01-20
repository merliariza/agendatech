DROP DATABASE agendatech;
CREATE DATABASE agendatech;
USE agendatech;

CREATE TABLE Person (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(200),
    city VARCHAR(50),
    region VARCHAR(50),
    country VARCHAR(50),
    company VARCHAR(50),
    role ENUM('administrador', 'cliente', 'empleado') NOT NULL
);

CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    person_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (person_id) REFERENCES Person(id)
);

CREATE TABLE Service (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INT DEFAULT 60
);

CREATE TABLE EmployeeService (
    person_id INT NOT NULL,
    service_id INT NOT NULL,
    PRIMARY KEY (person_id, service_id),
    FOREIGN KEY (person_id) REFERENCES Person(id),
    FOREIGN KEY (service_id) REFERENCES Service(id)
);

CREATE TABLE Appointment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    employee_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pendiente', 'confirmada', 'completada', 'cancelada') NOT NULL,
    final_price DECIMAL(10, 2),
    payment_method ENUM('efectivo', 'tarjeta', 'transferencia', 'paypal', 'otro'),
    payment_status ENUM('pendiente', 'pagado', 'fallido', 'reembolsado'),
    amount_paid DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Person(id),
    FOREIGN KEY (employee_id) REFERENCES Person(id),
    FOREIGN KEY (service_id) REFERENCES Service(id)
);

CREATE TABLE Product (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    min_stock INT DEFAULT 5,
    active BOOLEAN DEFAULT TRUE,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    image LONGTEXT
);

CREATE TABLE ShoppingCart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES Person(id),
    FOREIGN KEY (product_id) REFERENCES Product(id),
    UNIQUE KEY unique_cart_item (customer_id, product_id)
);

CREATE TABLE ProductOrder (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    payment_method ENUM('efectivo', 'tarjeta', 'transferencia', 'paypal', 'stripe', 'otro'),
    payment_status ENUM('pendiente', 'pagado', 'fallido', 'reembolsado'),
    shipping_address VARCHAR(200),
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES Person(id)
);

CREATE TABLE ProductOrderDetail (
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES ProductOrder(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(id)
);

CREATE TABLE StockMovement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    movement_type ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    quantity INT NOT NULL,
    previous_stock INT NOT NULL,
    updated_stock INT NOT NULL,
    reason VARCHAR(50),
    reference_type ENUM('orden', 'ajuste', 'devolución', 'daño') NOT NULL,
    reference_id INT,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(id),
    FOREIGN KEY (user_id) REFERENCES User(id)
);

use agendatech;
ALTER TABLE Product ADD COLUMN image LONGTEXT;
ALTER TABLE User MODIFY password VARCHAR(200) NOT NULL;
ALTER TABLE Appointment DROP FOREIGN KEY appointment_ibfk_3;
ALTER TABLE Appointment DROP COLUMN service_id;
