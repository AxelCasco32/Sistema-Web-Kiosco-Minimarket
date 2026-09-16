// config/db.js
// Configuración de la conexión a MySQL.
// Responsabilidades:
//   - Leer las credenciales desde las variables de entorno (.env): DB_HOST, DB_PORT,
//     DB_NAME, DB_USER, DB_PASSWORD.
//   - Crear y exportar la instancia de conexión/ORM (ej: Sequelize) para que
//     los modelos la importen.
// No es la base de datos en sí, solo el puente de conexión hacia ella.
