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


router.get('/employees', requireAuth, async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, name, surname, email 
      FROM Person 
      WHERE role = 'administrador' 
      ORDER BY name ASC
    `);
    res.json({ ok: true, employees: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al obtener empleados' });
  }
});

router.get('/customers', requireAuth, async (req, res) => {
  const queryParam = req.query.q;
  if (!queryParam) return res.json({ ok: true, customers: [] });
  
  try {
    const rows = await query(`
      SELECT id, name, surname, email 
      FROM Person 
      WHERE role = 'cliente' 
      AND (email LIKE ? OR name LIKE ? OR surname LIKE ?)
      LIMIT 10
    `, [`%${queryParam}%`, `%${queryParam}%`, `%${queryParam}%`]);
    
    res.json({ ok: true, customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Error al buscar clientes' });
  }
});

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
      [employee_id, appointment_date, timeNormalized]
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
        appointment_date,     
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

router.put('/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const { 
    employee_id, 
    appointment_date, 
    appointment_time, 
    status, 
    notes, 
    payment_status 
  } = req.body;

  if (!id) {
    return res.status(400).json({ ok: false, message: 'Falta id' });
  }

  try {
    if (employee_id && appointment_date && appointment_time) {
      const timeNormalized = appointment_time.length === 5 
        ? `${appointment_time}:00` 
        : appointment_time;
        
      const conflict = await query(
        `SELECT id FROM Appointment 
         WHERE employee_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ? 
         AND id != ? 
         AND status != 'cancelada'`,
        [employee_id, appointment_date, timeNormalized, id]
      );

      if (conflict.length > 0) {
        return res.status(409).json({ 
          ok: false, 
          message: 'Conflicto: hora ocupada' 
        });
      }
    }

    const updates = [];
    const params = [];

    if (employee_id !== undefined) { 
      updates.push('employee_id = ?'); 
      params.push(employee_id); 
    }
    if (appointment_date !== undefined) { 
      updates.push('appointment_date = ?'); 
      params.push(appointment_date); 
    }
    if (appointment_time !== undefined) { 
      const timeNormalized = appointment_time.length === 5 
        ? `${appointment_time}:00` 
        : appointment_time;
      updates.push('appointment_time = ?'); 
      params.push(timeNormalized); 
    }
    if (status !== undefined) { 
      updates.push('status = ?'); 
      params.push(status); 
    }
    if (notes !== undefined) { 
      updates.push('notes = ?'); 
      params.push(notes); 
    }
    if (payment_status !== undefined) { 
      updates.push('payment_status = ?'); 
      params.push(payment_status); 
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Nada para actualizar' 
      });
    }

    params.push(id);
    const sql = `UPDATE Appointment SET ${updates.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const rows = await query('SELECT * FROM Appointment WHERE id = ?', [id]);
    res.json({ ok: true, appointment: rows[0] });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al actualizar cita' 
    });
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const id = req.params.id;
  
  try {
    await query(
      'UPDATE Appointment SET status = ? WHERE id = ?', 
      ['cancelada', id]
    );
    
    res.json({ ok: true, message: 'Cita cancelada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al cancelar' 
    });
  }
});

module.exports = router;