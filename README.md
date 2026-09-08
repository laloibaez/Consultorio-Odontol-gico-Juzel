# Juzel · Sistema de gestión clínica y administrativa

MVP para el Consultorio Odontológico Juzel, Chiclayo, Perú. Una única usuaria: la odontóloga. Frontend React 18 y backend Express independientes, con PostgreSQL y Prisma. Interfaz en español, moneda en soles y horario de Perú.

## Estado de la entrega

Las dependencias ya están instaladas y **frontend y backend compilan correctamente**. Prisma generó su cliente y validó el esquema. La base de datos todavía no está disponible, por lo que las migraciones y las pruebas de integración siguen pendientes. No se ha sustituido PostgreSQL por datos de demostración ni por almacenamiento del navegador.

Las cuatro pruebas de cálculo de cuotas y horarios pasaron, y bcrypt se comprobó con un hash y su verificación. Se incluyen los archivos `package-lock.json` de ambos proyectos. Consulta [VERIFICACION.md](VERIFICACION.md) para los controles realizados, las advertencias de dependencias y los pendientes.

## Requisitos

- Node.js 22.13 o superior y npm.
- PostgreSQL 15 o superior, una base vacía llamada `juzel` y un usuario autorizado para crear tablas. `prisma migrate dev` también necesita permiso para crear la base temporal de migración (shadow database), o `SHADOW_DATABASE_URL` configurada en Prisma.
- Conexión de red autorizada con acceso al registro público de npm y a los motores de Prisma.
- Git para versionar el código.

## Arquitectura

```text
Cliente React 18 / Vite  ↔  API REST Express  ↔  PostgreSQL
localhost:5173             localhost:4000       Prisma ORM
                          /api/v1

Frontend: app → features → shared
Backend: routes → controllers → services → repositories → modelos Prisma
```

Las transacciones financieras y de sesiones son serializables. La agenda usa un bloqueo transaccional de PostgreSQL para que dos solicitudes simultáneas no creen citas superpuestas. El servidor vuelve a validar cada escritura aunque la interfaz ya haya validado sus campos.

## Backend

Desde `juzel-sistema`:

```bash
cd backend
npm install
cp .env.example .env
```

En Windows PowerShell, el equivalente de la copia es:

```powershell
Copy-Item .env.example .env
```

Edita `backend/.env` localmente:

```dotenv
DATABASE_URL=postgresql://USUARIO:CONTRASENA@localhost:5432/juzel?schema=public
JWT_SECRET=UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
PORT=4000
FRONTEND_URL=http://localhost:5173
SEED_USERNAME=odontologa
SEED_PASSWORD=UNA_CONTRASENA_PROPIA_DE_AL_MENOS_12_CARACTERES
```

Si la contraseña de PostgreSQL contiene caracteres especiales, codifícalos para URL. No subas `.env` al repositorio. Puedes generar el secreto JWT con:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Después de crear la base de datos:

```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

La API escucha en **http://localhost:4000**. `GET /health` verifica también la conexión real con PostgreSQL. Prisma toma el esquema de `backend/src/prisma/schema.prisma`, configurado en `package.json`.

El seed crea la cuenta `SEED_USERNAME` con `SEED_PASSWORD` y hash bcrypt. Es idempotente: volver a ejecutarlo no cambia la contraseña de una usuaria existente. No existe una contraseña de acceso universal. Tras crear la cuenta, se puede retirar `SEED_PASSWORD` del archivo `.env`.

Si PowerShell restringe `npm.ps1`, utiliza `npm.cmd` y `npx.cmd` en lugar de modificar la política de ejecución del equipo.

### Compilar y verificar backend

```bash
npx prisma generate
npm run build
npm test
```

## Frontend

En otra terminal, desde `juzel-sistema`:

```bash
cd frontend
npm install
npm run dev
```

Ya se incluye `frontend/.env` para el desarrollo local, con:

```dotenv
VITE_API_URL=http://localhost:4000/api/v1
```

Si falta, copia `.env.example` a `.env`. La aplicación abre en **http://localhost:5173**. Inicia sesión con la cuenta creada por el seed. El panel puede estar vacío hasta registrar pacientes, citas y pagos: sus datos se obtienen de la API.

```bash
npm run build
npm run preview
```

## Primer recorrido

1. Inicia sesión y revisa el panel de indicadores.
2. Abre **Pacientes → Nuevo paciente**. El servidor genera una historia `HC-año-correlativo` sin reutilizar números.
3. Registra antecedentes, estado de control, alergias, medicación y derivación. Las alertas aparecen de forma persistente al abrir la ficha.
4. Crea y guarda el odontograma. Las 32 piezas FDI tienen cinco superficies. Cada guardado crea un snapshot; las versiones históricas son de solo lectura.
5. Crea un plan de tratamiento con costo y sesiones. Al registrar una atención, selecciona una sesión pendiente para completarla. La última sesión finaliza el plan.
6. Genera cuotas mensuales o quincenales y registra pagos. Un pago parcial mantiene el saldo restante; un pago superior al saldo de la cuota se rechaza.
7. Programa una cita dentro de 09:00–13:00 o 15:00–20:00. Reprograma, cancela o marca como atendida desde su detalle.
8. El enlace de WhatsApp abre un mensaje preparado; la usuaria decide enviarlo en WhatsApp.
9. Descarga la historia PDF o filtra y exporta reportes PDF/Excel.

## Rutas de la aplicación

| Ruta | Función |
|---|---|
| `/login` | Inicio de sesión y mostrar/ocultar contraseña |
| `/dashboard` | Citas del día, ingresos, saldos y gráfico de seis meses |
| `/pacientes` | Búsqueda por nombres, apellidos, documento y teléfono |
| `/pacientes/nuevo` | Registro y número de historia automático |
| `/pacientes/:id` | Anamnesis, historial, odontograma, tratamientos, pagos y citas |
| `/pacientes/:id/atencion/nueva` | Atención y vinculación opcional de sesión |
| `/pacientes/:id/tratamientos/nuevo` | Plan multisesión |
| `/agenda` | Calendario diario, semanal y mensual |
| `/reportes` | Cinco tipos de reporte y exportaciones |
| `/configuracion` | Cambio de contraseña y cierre de sesión |

Desde el menú, **Pacientes → Ver ficha** requiere dos clics. El panel también ofrece acceso directo a las fichas de las citas del día.

## API y decisiones de datos

Las respuestas JSON usan `{ data, error, message }`. Las descargas PDF y Excel son respuestas binarias con su `Content-Type` y `Content-Disposition`, porque no pueden usar a la vez el sobre JSON. Las rutas y sus controladores están separados por módulo en `backend/src/modules`.

- JWT de 15 minutos, interceptor Axios, rutas privadas y temporizador global. La actividad real permite renovar el JWT; 15 minutos de inactividad cierran la sesión, también al volver a una pestaña suspendida.
- El token se guarda en `localStorage`, la simplificación permitida para este MVP. El cambio de contraseña incrementa la versión de tokens e invalida sesiones anteriores.
- Intentos de login limitados y mensajes que no revelan si falló el usuario o la contraseña.
- Borrado lógico de paciente e historia. No se elimina el registro clínico; no se ofrece borrado físico por API.
- El documento es único incluso en registros archivados. Una ficha activa duplicada ofrece acceso a la ficha existente.
- Citas canceladas permanecen en la historia y liberan el horario. Citas completadas conservan su ocupación histórica.
- Los ingresos se calculan con pagos reales; el saldo incluye el costo de los planes aunque aún no tengan cuotas. Los reportes de saldos muestran el saldo actual de planes creados en el intervalo seleccionado.
- El panel destaca saldos desde S/ 1,000.00 como umbral inicial de atención administrativa; puede ajustarse en el componente Dashboard. Para archivar una historia con citas futuras, primero se deben cancelar esas citas.
- Cuotas calculadas en céntimos para no perder dinero por redondeo. Al partir desde un día 31, un vencimiento mensual se ajusta al último día del mes correspondiente.
- El PDF clínico consolida filiación, antecedentes, alergias, medicación, derivación, atenciones, las superficies de todas las piezas de la versión actual, tratamientos, sesiones, cuotas y pagos.
- El historial de versiones del odontograma es inmutable desde la API. La anamnesis guarda su estado vigente.

## Seguridad de despliegue y respaldo

El MVP escucha en localhost. Para desplegarlo, coloca un proxy inverso con HTTPS delante de la API y del frontend; configura `FRONTEND_URL` y `VITE_API_URL` para el origen publicado. Sirve `index.html` como fallback de las rutas del frontend. Conserva Helmet y limita el acceso directo a PostgreSQL. No se emite un certificado HTTPS local ficticio.

PostgreSQL centraliza todos los datos persistentes; no hay historias guardadas en archivos locales ni blobs clínicos fuera de la base. Esto permite respaldos consistentes mediante `pg_dump -Fc`. El diseño previsto es un respaldo diario cifrado, retención acordada con la responsable del consultorio, copia fuera del equipo y pruebas periódicas de restauración con `pg_restore` en una base separada. El plan de respaldo no está programado automáticamente, conforme al alcance del MVP.

Las migraciones creadas por `prisma migrate dev` deben guardarse en Git junto con `package-lock.json` después de la primera instalación exitosa. Los secretos y respaldos están excluidos por `.gitignore`.

## Pruebas posteriores a la conexión

En una **base de prueba**, con backend activo y credenciales de prueba configuradas, ejecuta desde la raíz:

```powershell
$env:TEST_USERNAME='odontologa'
$env:TEST_PASSWORD='CONTRASENA_DE_LA_CUENTA_DE_PRUEBA'
node scripts/smoke-api.mjs
```

La prueba crea un paciente identificado como prueba, verifica historia, alertas, versiones, sesiones, cuotas, pagos parciales, rechazo de duplicados y sobrepagos, solapamientos, reportes y descargas; finalmente archiva el paciente y cancela su cita. Conserva registros de prueba mediante el mismo borrado lógico que usa el sistema. No debe apuntar a una base con pacientes reales.

Sin dependencias de npm, con Node 22.13+ se pueden ejecutar las pruebas puras:

```bash
node scripts/test-domain.cjs
```
