Kiosco Web — Sistema de Punto de Venta (POS)

Proyecto de Metodologías Ágiles. Trabajamos con Scrum y el tablero está en Trello.

Stack
Frontend: React + Js
Backend: Node.js + Express
Base de datos: MySQL
ORM: Sequelize
Auth: JWT + bcrypt
Cómo está el repo

Las carpetas ya están armadas siguiendo una arquitectura por capas (ver abajo). Los archivos .js/.jsx de src/ están vacíos, solo tienen un comentario arriba explicando qué va en cada uno. Eso lo programamos nosotros, repartiendo los archivos según las historias de usuario del backlog.

Estructura
kiosco-web/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/        (Usuario, Producto, Cliente, TurnoCaja, Venta, DetalleVenta, index)
│   │   ├── controllers/   (usuarios, productos, clientes, turnos, ventas)
│   │   ├── routes/        (usuarios, productos, clientes, turnos, ventas)
│   │   ├── middlewares/   (auth, errorHandler)
│   │   └── utils/         (calcularVuelto, formatearFecha)
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/    (BotonDenominacion, CarritoItem, BuscarClienteModal)
│   │   ├── pages/         (Login, Pos, AdminDashboard, CierreCaja)
│   │   ├── services/api.js
│   │   ├── hooks/useAuth.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql
└── docs/
    ├── backlog_kiosco.xlsx
    └── kiosco_erd_corregido.png
Instalar las herramientas (Windows / PowerShell)

Si no tenés nada instalado, corré esto en PowerShell (abrirla como administrador). Usa winget, que ya viene con Windows 10/11.

Git (para clonar y trabajar con el repo):

powershell
winget install --id Git.Git -e --source winget

Node.js (versión LTS, trae npm incluido):

powershell
winget install OpenJS.NodeJS.LTS

MySQL Server:

powershell
winget install Oracle.MySQL


powershell
winget install Oracle.MySQLWorkbench

VS Code (por si a alguien le falta):

powershell
winget install Microsoft.VisualStudioCode

Después de instalar, cerrá y volvé a abrir PowerShell y chequeá que quedó todo bien:

powershell
git --version
node -v
npm -v
mysql --version

Si mysql no lo reconoce, es porque no quedó agregado al PATH — buscá "MySQL Server" en el instalador y fijate que la casilla del path esté tildada, o agregalo a mano desde Variables de Entorno de Windows.

Levantar el proyecto
Clonar el repo y crear la base:
powershell
   git clone <url-del-repo>
   cd kiosco-web
   mysql -u root -p -e "CREATE DATABASE kiosco_db;"
   mysql -u root -p kiosco_db < database/schema.sql
Backend:
powershell
   cd backend
   copy .env.example .env
   npm install
   npm run dev

(npm install te instala Express, Sequelize, mysql2, dotenv, cors, bcryptjs, jsonwebtoken y morgan)

Frontend, en otra terminal:
powershell
   cd frontend
   npm install
   npm run dev

(te instala React, React Router, Axios y Vite)

Reglas del repo
El .env no se sube (ya está en .gitignore) — cada uno crea el suyo copiando .env.example y pone ahí su usuario/contraseña de MySQL.
Un modelo por tabla, un controller y una ruta por recurso. Nada de meter todo en un archivo.
Las ramas se llaman feature/nombre-de-la-HU (ej: feature/HU1.1-scanner-carrito). Se mergea a develop, y de ahí a main. 