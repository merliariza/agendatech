
INSERT INTO person (id, name, surname, email, role) VALUES 
(1, 'admin', 'admin', 'admin_test@gmail.com', 'administrador'),
(2, 'cliente', 'cliente', 'cliente_test@gmail.com', 'cliente'),
(3, 'empleado', 'empleado', 'empleado_test@gmail.com', 'empleado');

INSERT INTO user (id, username, password, person_id, created_at) VALUES 
(1, 'admin_test', '$2b$10$tgvmcBtwvXVVGALgq0wAouoKc4ftHTCyqT3BEm2s39EeTySPqrVsu', 1, NOW()),
(2, 'cliente_test', '$2b$10$65U5B2FpNfR359hc/IOg3eS9CsHJkXyXAVC7k2T3B.G.xC..5J3RO', 2, NOW()),
(3, 'empleado_test', '$2b$10$l4YV4iSkk5mMGei7ULD7TeInjf6mTDQgzC7C62IlFHYSmFR./9ZeO', 3, NOW());

/*CREDENCIALES PARA INGRESAR:
Rol              Username         Correo                     Contraseña
Administrador,   admin_test,      admin_test@gmail.com,      admin
Cliente,         cliente_test,    cliente_test@gmail.com,    cliente
Empleado,        empleado_test,   empleado_test@gmail.com,   empleado
*/