const express = require("express");
const router = express.Router();
const db = require("../db/connection.js");

function requireAuth(req, res, next) {
  if (!req.session.user && !req.session.userId) {
    return res.status(401).json({ ok: false, message: 'No autenticado' });
  }
  next();
}

function query(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

// Obtener empleados
router.get('/employees', requireAuth, async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, name, surname, email 
      FROM Person 
      WHERE role = 'empleado' 
      ORDER BY name ASC
    `);
    res.json({ ok: true, employees: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener empleados' });
  }
});

// Buscar clientes
router.get('/customers', requireAuth, async (req, res) => {
  const queryParam = req.query.q;
  
  try {
    let rows;
    if (!queryParam) {
      // Si no hay query, devolver todos los clientes
      rows = await query(`
        SELECT id, name, surname, email 
        FROM Person 
        WHERE role = 'cliente' 
        ORDER BY name ASC
        LIMIT 100
      `);
    } else {
      // Si hay query, buscar por coincidencia
      rows = await query(`
        SELECT id, name, surname, email 
        FROM Person 
        WHERE role = 'cliente' 
        AND (email LIKE ? OR name LIKE ? OR surname LIKE ?)
        ORDER BY name ASC
        LIMIT 20
      `, [`%${queryParam}%`, `%${queryParam}%`, `%${queryParam}%`]);
    }
    
    res.json({ ok: true, customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al buscar clientes' });
  }
});

// Obtener todas las citas
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        a.*,
        c.email AS customer_email, 
        CONCAT(c.name,' ',c.surname) AS customer_name,
        e.id AS employee_id, 
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person c ON a.customer_id = c.id
      JOIN Person e ON a.employee_id = e.id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `);
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener citas' });
  }
});

// Obtener citas por fecha
router.get('/by-date', requireAuth, async (req, res) => {
  const date = req.query.date;
  if (!date) {
    return res.status(400).json({ 
      ok: false, 
      message: 'Falta fecha (date) en formato YYYY-MM-DD' 
    });
  }
  
  try {
    const rows = await query(`
      SELECT 
        a.*,
        c.email AS customer_email, 
        CONCAT(c.name,' ',c.surname) AS customer_name,
        e.id AS employee_id, 
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person c ON a.customer_id = c.id
      JOIN Person e ON a.employee_id = e.id
      WHERE a.appointment_date = ?
      ORDER BY a.appointment_time ASC
    `, [date]);
    
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener citas' });
  }
});

// Crear nueva cita
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      customer_email,
      customer_name,
      employee_id,
      appointment_date,
      appointment_time,
      payment_method = null,
      notes = null
    } = req.body;

    if (!customer_email || !customer_name || !employee_id || 
        !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Faltan datos requeridos' 
      });
    }

    let formattedDate = appointment_date;
    if (appointment_date.includes('T')) {
      formattedDate = appointment_date.split('T')[0];
    }

    const timeNormalized = appointment_time.length === 5 
      ? `${appointment_time}:00` 
      : appointment_time;

    const existingPerson = await query(
      'SELECT id FROM Person WHERE email = ?', 
      [customer_email]
    );
    
    let customerId;
    
    if (existingPerson.length > 0) {
      customerId = existingPerson[0].id;
      
      const names = customer_name.trim().split(/\s+/);
      const firstName = names.shift() || customer_name;
      const lastName = names.join(' ') || '';
      
      await query(
        'UPDATE Person SET name = ?, surname = ? WHERE id = ?', 
        [firstName, lastName, customerId]
      );
    } else {
      const names = customer_name.trim().split(/\s+/);
      const firstName = names.shift() || customer_name;
      const lastName = names.join(' ') || '';
      
      const insertResult = await query(
        'INSERT INTO Person (name, surname, email, role) VALUES (?, ?, ?, ?)', 
        [firstName, lastName, customer_email, 'cliente']
      );
      customerId = insertResult.insertId;
    }

    const conflict = await query(
      `SELECT id FROM Appointment 
       WHERE employee_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ? 
       AND status != 'cancelada'`,
      [employee_id, formattedDate, timeNormalized]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ 
        ok: false, 
        message: 'Conflicto: hora ocupada para este empleado' 
      });
    }

    const insertAppointment = await query(
      `INSERT INTO Appointment (
        customer_id, employee_id, 
        appointment_date, appointment_time, 
        status, payment_method, 
        payment_status, amount_paid, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,          
        employee_id,         
        formattedDate,       
        timeNormalized,       
        'pendiente',          
        payment_method,       
        'pendiente',         
        0,                    
        notes               
      ]
    );

    const createdAppointment = await query(`
      SELECT 
        a.*,
        c.email AS customer_email, 
        CONCAT(c.name,' ',c.surname) AS customer_name,
        e.id AS employee_id, 
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person c ON a.customer_id = c.id
      JOIN Person e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [insertAppointment.insertId]);

    res.status(201).json({ 
      ok: true, 
      appointment: createdAppointment[0] 
    });
    
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al crear cita: ' + err.message
    });
  }
});

// Actualizar cita completa (PUT)
router.put('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { 
    customer_email,
    customer_name,
    employee_id, 
    appointment_date, 
    appointment_time, 
    payment_method,
    notes
  } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: 'Falta id' });
  }

  try {
    let formattedDate = appointment_date;
    if (appointment_date && appointment_date.includes('T')) {
      formattedDate = appointment_date.split('T')[0];
    }

    const timeNormalized = appointment_time && appointment_time.length === 5 
      ? `${appointment_time}:00` 
      : appointment_time;

    // Verificar si existe la cita
    const existingAppointment = await query(
      'SELECT * FROM Appointment WHERE id = ?', 
      [id]
    );

    if (existingAppointment.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Cita no encontrada' 
      });
    }

    // Actualizar o crear cliente
    let customerId = existingAppointment[0].customer_id;

    if (customer_email && customer_name) {
      const existingPerson = await query(
        'SELECT id FROM Person WHERE email = ?', 
        [customer_email]
      );
      
      if (existingPerson.length > 0) {
        customerId = existingPerson[0].id;
        
        const names = customer_name.trim().split(/\s+/);
        const firstName = names.shift() || customer_name;
        const lastName = names.join(' ') || '';
        
        await query(
          'UPDATE Person SET name = ?, surname = ? WHERE id = ?', 
          [firstName, lastName, customerId]
        );
      } else {
        const names = customer_name.trim().split(/\s+/);
        const firstName = names.shift() || customer_name;
        const lastName = names.join(' ') || '';
        
        const insertResult = await query(
          'INSERT INTO Person (name, surname, email, role) VALUES (?, ?, ?, ?)', 
          [firstName, lastName, customer_email, 'cliente']
        );
        customerId = insertResult.insertId;
      }
    }

    // Verificar conflictos de horario
    if (employee_id && formattedDate && timeNormalized) {
      const conflict = await query(
        `SELECT id FROM Appointment 
         WHERE employee_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ? 
         AND id != ? 
         AND status != 'cancelada'`,
        [employee_id, formattedDate, timeNormalized, id]
      );

      if (conflict.length > 0) {
        return res.status(409).json({ 
          ok: false, 
          message: 'Conflicto: hora ocupada para este empleado' 
        });
      }
    }

    // Actualizar la cita
    await query(
      `UPDATE Appointment 
       SET customer_id = ?,
           employee_id = ?, 
           appointment_date = ?, 
           appointment_time = ?,
           payment_method = ?,
           notes = ?
       WHERE id = ?`,
      [
        customerId,
        employee_id, 
        formattedDate, 
        timeNormalized,
        payment_method || 'efectivo',
        notes || '',
        id
      ]
    );

    // Obtener la cita actualizada con todos los datos
    const updatedAppointment = await query(`
      SELECT 
        a.*,
        c.email AS customer_email, 
        CONCAT(c.name,' ',c.surname) AS customer_name,
        e.id AS employee_id, 
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person c ON a.customer_id = c.id
      JOIN Person e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [id]);

    res.json({ 
      ok: true, 
      message: 'Cita actualizada correctamente',
      appointment: updatedAppointment[0] 
    });
    
  } catch (err) {
    console.error('Error al actualizar cita:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al actualizar cita: ' + err.message
    });
  }
});

// Eliminar cita (DELETE)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si la cita existe
    const existing = await query(
      'SELECT id FROM Appointment WHERE id = ?', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    // Eliminar la cita
    await query('DELETE FROM Appointment WHERE id = ?', [id]);
    
    res.json({ 
      ok: true, 
      message: 'Cita eliminada correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al eliminar cita: ' + error.message 
    });
  }
});

// Cancelar cita (PATCH)
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const id = req.params.id;
  
  try {
    // Verificar si la cita existe
    const existing = await query(
      'SELECT id, status FROM Appointment WHERE id = ?', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Cita no encontrada' 
      });
    }
    
    if (existing[0].status === 'cancelada') {
      return res.status(400).json({ 
        ok: false, 
        message: 'La cita ya está cancelada' 
      });
    }
    
    // Cancelar la cita
    await query(
      'UPDATE Appointment SET status = ? WHERE id = ?', 
      ['cancelada', id]
    );
    
    res.json({ 
      ok: true, 
      message: 'Cita cancelada correctamente' 
    });
  } catch (err) {
    console.error('Error al cancelar cita:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al cancelar: ' + err.message
    });
  }
});

// Obtener citas del user actual
router.get('/my-appointments', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId || req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        message: 'user no autenticado' 
      });
    }

    const rows = await query(`
      SELECT 
        a.*,
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person e ON a.employee_id = e.id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [userId]);
    
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al obtener citas' 
    });
  }
});

// Crear cita desde el user
router.post('/user-create', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId || req.session.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        ok: false, 
        message: 'user no autenticado' 
      });
    }

    const {
      service_type,
      employee_id,
      appointment_date,
      appointment_time,
      notes = null
    } = req.body;

    if (!service_type || !employee_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Faltan datos requeridos' 
      });
    }

    // Normalizar fecha
    let formattedDate = appointment_date;
    if (appointment_date.includes('T')) {
      formattedDate = appointment_date.split('T')[0];
    }

    const timeNormalized = appointment_time.length === 5 
      ? `${appointment_time}:00` 
      : appointment_time;

    // Verificar conflictos
    const conflict = await query(
      `SELECT id FROM Appointment 
       WHERE employee_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ? 
       AND status != 'cancelada'`,
      [employee_id, formattedDate, timeNormalized]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ 
        ok: false, 
        message: 'Este horario ya está ocupado' 
      });
    }

    // Crear la cita
    const insertAppointment = await query(
      `INSERT INTO Appointment (
        customer_id, employee_id, 
        appointment_date, appointment_time, 
        service_type, status, 
        payment_method, payment_status, 
        amount_paid, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        employee_id,
        formattedDate,
        timeNormalized,
        service_type,
        'pendiente',
        'efectivo',
        'pendiente',
        0,
        notes
      ]
    );

    const createdAppointment = await query(`
      SELECT 
        a.*,
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [insertAppointment.insertId]);

    res.status(201).json({ 
      ok: true, 
      message: 'Cita creada exitosamente',
      appointment: createdAppointment[0] 
    });
    
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al crear cita: ' + err.message
    });
  }
});

// Obtener citas del user actual
router.get('/my-appointments', requireAuth, async (req, res) => {
  try {
    // Obtener el person_id desde la sesión
    let customerId = null;
    
    // Verificar diferentes formas en que puede estar guardado
    if (req.session.userId) {
      customerId = req.session.userId;
    } else if (req.session.user && req.session.user.id) {
      customerId = req.session.user.id;
    } else if (req.session.user && req.session.user.person_id) {
      customerId = req.session.user.person_id;
    }
    
    console.log('Sesión completa:', req.session);
    console.log('Customer ID detectado:', customerId);
    
    if (!customerId) {
      return res.status(401).json({ 
        ok: false, 
        message: 'user no autenticado correctamente' 
      });
    }

    const rows = await query(`
      SELECT 
        a.*,
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person e ON a.employee_id = e.id
      WHERE a.customer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [customerId]);
    
    console.log('Citas encontradas:', rows.length);
    res.json({ ok: true, appointments: rows });
  } catch (err) {
    console.error('Error al obtener citas del user:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al obtener citas' 
    });
  }
});

// Crear cita desde el user
router.post('/user-create', requireAuth, async (req, res) => {
  try {
    // Obtener el person_id desde la sesión
    let customerId = null;
    
    if (req.session.userId) {
      customerId = req.session.userId;
    } else if (req.session.user && req.session.user.id) {
      customerId = req.session.user.id;
    } else if (req.session.user && req.session.user.person_id) {
      customerId = req.session.user.person_id;
    }
    
    console.log('Creando cita para customer_id:', customerId);
    
    if (!customerId) {
      return res.status(401).json({ 
        ok: false, 
        message: 'user no autenticado' 
      });
    }

    const {
      employee_id,
      appointment_date,
      appointment_time,
      notes = null
    } = req.body;

    if (!employee_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Faltan datos requeridos' 
      });
    }

    // Normalizar fecha
    let formattedDate = appointment_date;
    if (appointment_date.includes('T')) {
      formattedDate = appointment_date.split('T')[0];
    }

    const timeNormalized = appointment_time.length === 5 
      ? `${appointment_time}:00` 
      : appointment_time;

    // Verificar conflictos
    const conflict = await query(
      `SELECT id FROM Appointment 
       WHERE employee_id = ? 
       AND appointment_date = ? 
       AND appointment_time = ? 
       AND status != 'cancelada'`,
      [employee_id, formattedDate, timeNormalized]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ 
        ok: false, 
        message: 'Este horario ya está ocupado' 
      });
    }

    // Crear la cita
    const insertAppointment = await query(
      `INSERT INTO Appointment (
        customer_id, employee_id, 
        appointment_date, appointment_time, 
        status, payment_method, 
        payment_status, amount_paid, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        employee_id,
        formattedDate,
        timeNormalized,
        'pendiente',
        'efectivo',
        'pendiente',
        0,
        notes
      ]
    );

    const createdAppointment = await query(`
      SELECT 
        a.*,
        CONCAT(e.name,' ',e.surname) AS employee_name
      FROM Appointment a
      JOIN Person e ON a.employee_id = e.id
      WHERE a.id = ?
    `, [insertAppointment.insertId]);

    res.status(201).json({ 
      ok: true, 
      message: 'Cita creada exitosamente',
      appointment: createdAppointment[0] 
    });
    
  } catch (err) {
    console.error('Error al crear cita:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al crear cita: ' + err.message
    });
  }
});

module.exports = router;