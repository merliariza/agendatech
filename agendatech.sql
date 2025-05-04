-- Creation of tables for agendatech
CREATE DATABASE agendatech;
\c agendatech;

-- Role Table
CREATE TABLE Role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    role_description VARCHAR(255) NULL
);

-- Permission Table
CREATE TABLE Permission (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(50) NOT NULL,
    permission_description VARCHAR(255) NULL,
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

-- User Table
CREATE TABLE User_Account (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    user_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

-- Country Table
CREATE TABLE Country (
    country_id SERIAL PRIMARY KEY,
    country_name VARCHAR(50) NOT NULL,
    country_code CHAR(2) NOT NULL
);

-- Region Table
CREATE TABLE Region (
    region_id SERIAL PRIMARY KEY,
    country_id INT,
    region_name VARCHAR(50) NOT NULL,
    region_code VARCHAR(10) NULL,
    FOREIGN KEY (country_id) REFERENCES Country(country_id)
);

-- City Table
CREATE TABLE City (
    city_id SERIAL PRIMARY KEY,
    region_id INT,
    city_name VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10) NULL,
    FOREIGN KEY (region_id) REFERENCES Region(region_id)
);

-- Address Table 
CREATE TABLE Address (
    address_id SERIAL PRIMARY KEY,
    city_id INT,
    street_name VARCHAR(100) NOT NULL,
    street_number VARCHAR(20) NOT NULL,
    address_line VARCHAR(200) NOT NULL,
    postal_code VARCHAR(10) NULL,
    address_type VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (city_id) REFERENCES City(city_id)
);

-- Person Table 
CREATE TABLE Person (
    person_id SERIAL PRIMARY KEY,
    address_id INT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    document_type VARCHAR(20) NOT NULL,
    birth_date DATE NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id INT NULL,
    FOREIGN KEY (address_id) REFERENCES Address(address_id),
    FOREIGN KEY (user_id) REFERENCES User_Account(user_id)
);

-- Company Table
CREATE TABLE Company (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR(50) NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    company_phone VARCHAR(20) NOT NULL,
    company_email VARCHAR(100) NOT NULL,
    address_id INT,
    FOREIGN KEY (address_id) REFERENCES Address(address_id)
);

-- Branch Table
CREATE TABLE Branch (
    branch_id SERIAL PRIMARY KEY,
    company_id INT,
    branch_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    address_id INT,
    FOREIGN KEY (company_id) REFERENCES Company(company_id),
    FOREIGN KEY (address_id) REFERENCES Address(address_id)
);

-- Department Table
CREATE TABLE Department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(50) NOT NULL,
    department_description VARCHAR(255) NULL,
    branch_id INT,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);

-- Position Table
CREATE TABLE Position (
    position_id SERIAL PRIMARY KEY,
    department_id INT,
    position_name VARCHAR(50) NOT NULL,
    position_description VARCHAR(255) NULL,
    base_salary DECIMAL(10,2) NULL,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

-- Employee Table 
CREATE TABLE Employee (
    employee_id SERIAL PRIMARY KEY,
    person_id INT,
    position_id INT,
    branch_id INT,
    corporate_email VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (person_id) REFERENCES Person(person_id),
    FOREIGN KEY (position_id) REFERENCES Position(position_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);

-- Specialization Table
CREATE TABLE Specialization (
    specialization_id SERIAL PRIMARY KEY,
    specialization_name VARCHAR(20) NOT NULL,
    specialization_description VARCHAR(255) NULL,
    employee_id INT,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

-- Customer Table (now references Person)
CREATE TABLE Customer (
    customer_id SERIAL PRIMARY KEY,
    person_id INT,
    registration_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- ServiceCategory Table
CREATE TABLE ServiceCategory (
    service_category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_description VARCHAR(255) NULL
);

-- Service Table
CREATE TABLE Service (
    service_id SERIAL PRIMARY KEY,
    service_category_id INT,
    service_name VARCHAR(50) NOT NULL,
    service_description VARCHAR(255) NULL,
    duration_minutes INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (service_category_id) REFERENCES ServiceCategory(service_category_id)
);

-- AppointmentStatus Table
CREATE TABLE AppointmentStatus (
    status_id SERIAL PRIMARY KEY,
    status_name VARCHAR(50) NOT NULL,
    status_description VARCHAR(255) NULL
);

-- Appointment Table
CREATE TABLE Appointment (
    appointment_id SERIAL PRIMARY KEY,
    customer_id INT,
    branch_id INT,
    status_id INT,
    appointment_datetime TIMESTAMP NOT NULL,
    request_datetime TIMESTAMP NOT NULL,
    cancellation_reason VARCHAR(255) NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id),
    FOREIGN KEY (status_id) REFERENCES AppointmentStatus(status_id)
);

-- AppointmentDetail Table
CREATE TABLE AppointmentDetail (
    appointment_detail_id SERIAL PRIMARY KEY,
    appointment_id INT,
    service_id INT,
    employee_id INT,
    applied_price DECIMAL(10,2) NOT NULL,
    actual_duration INT NULL,
    FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id),
    FOREIGN KEY (service_id) REFERENCES Service(service_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

-- ProductCategory Table
CREATE TABLE ProductCategory (
    product_category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL,
    category_description VARCHAR(255) NULL
);

-- Brand Table
CREATE TABLE Brand (
    brand_id SERIAL PRIMARY KEY,
    brand_name VARCHAR(50) NOT NULL,
    brand_description VARCHAR(255) NULL
);

-- UnitOfMeasure Table
CREATE TABLE UnitOfMeasure (
    unit_id SERIAL PRIMARY KEY,
    unit_name VARCHAR(50) NOT NULL,
    unit_abbreviation VARCHAR(10) NOT NULL,
    unit_description VARCHAR(255) NULL
);

-- Product Table
CREATE TABLE Product (
    product_id SERIAL PRIMARY KEY,
    product_category_id INT,
    brand_id INT,
    unit_id INT,
    product_code VARCHAR(20) NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_description TEXT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (product_category_id) REFERENCES ProductCategory(product_category_id),
    FOREIGN KEY (brand_id) REFERENCES Brand(brand_id),
    FOREIGN KEY (unit_id) REFERENCES UnitOfMeasure(unit_id)
);

-- Inventory Table
CREATE TABLE Inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT,
    branch_id INT,
    quantity INT NOT NULL,
    min_stock INT NOT NULL,
    max_stock INT NOT NULL,
    warehouse_location VARCHAR(50) NULL,
    last_updated TIMESTAMP NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Product(product_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
);

-- Supplier Table 
CREATE TABLE Supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(50) NOT NULL,
    tax_id VARCHAR(20) NOT NULL,
    website VARCHAR(80) NULL,
    contact_name VARCHAR(20) NULL,
    contact_phone VARCHAR(20) NULL,
    contact_email VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    person_id INT,
    FOREIGN KEY (person_id) REFERENCES Person(person_id)
);

-- PurchaseOrder Table
CREATE TABLE PurchaseOrder (
    purchase_order_id SERIAL PRIMARY KEY,
    supplier_id INT,
    branch_id INT,
    employee_id INT,
    order_number VARCHAR(20) NOT NULL,
    order_date DATE NOT NULL,
    estimated_delivery_date DATE NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);

-- PurchaseOrderDetail Table
CREATE TABLE PurchaseOrderDetail (
    order_detail_id SERIAL PRIMARY KEY,
    purchase_order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    reception_status VARCHAR(20) NULL,
    received_quantity INT NULL,
    FOREIGN KEY (purchase_order_id) REFERENCES PurchaseOrder(purchase_order_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- Order Table 
CREATE TABLE CustomerOrder (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    branch_id INT,
    employee_id INT,
    order_number VARCHAR(20) NOT NULL,
    order_date TIMESTAMP NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT NULL,
    address_id INT,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id),
    FOREIGN KEY (address_id) REFERENCES Address(address_id)
);

-- OrderDetail Table
CREATE TABLE OrderDetail (
    order_detail_id SERIAL PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES CustomerOrder(order_id),
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
);

-- Invoice Table
CREATE TABLE Invoice (
    invoice_id SERIAL PRIMARY KEY,
    order_id INT,
    invoice_number VARCHAR(20) NOT NULL,
    invoice_date TIMESTAMP NOT NULL,
    due_date DATE NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    invoice_status VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES CustomerOrder(order_id)
);