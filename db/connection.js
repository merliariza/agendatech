const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",      
  password: "root123",      
  database: "agendatech" 
});

module.exports = pool;
