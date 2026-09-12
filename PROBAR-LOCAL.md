# Probar Juzel sin PostgreSQL

El modo provisional utiliza SQLite: una base local persistente, con los mismos formularios y API del sistema. No necesita instalar un servidor de base de datos.

## Acceso

Abre **http://localhost:5173**.
También se admite **http://127.0.0.1:5173** en modo local. Si actualizas el código del backend, detén su terminal con Ctrl+C y vuelve a ejecutar `npm.cmd run local` para cargar los cambios.

- Usuario: **demo**
- Contraseña inicial: **JuzelDemo2026!**

La cuenta es exclusiva de la demostración. Los dos pacientes iniciales son ficticios. Puedes crear pacientes adicionales, actualizar anamnesis, registrar atenciones, modificar odontogramas, crear tratamientos y cuotas, registrar pagos, gestionar citas y descargar PDF/Excel.

## Volver a iniciarlo

Abre dos terminales en `juzel-sistema`:

```powershell
cd backend
npm.cmd run local
```

```powershell
cd frontend
npm.cmd run dev
```

Usa `local` en el backend para este modo: `dev` conserva la conexión PostgreSQL original. Solo puede haber un backend utilizando el puerto 4000; detén el anterior con Ctrl+C antes de cambiar de modo.

Los cambios se conservan en `backend/.local/juzel.db` al cerrar o reiniciar. El inicio no restablece la contraseña ni duplica los datos iniciales. La carpeta `.local` y el cliente generado están excluidos de Git.

## Qué probar primero

En **Pacientes → Nuevo paciente**, selecciona DNI, escribe sus ocho dígitos y pulsa **Consultar DNI**. Se envía el número a eldni.com y se completan nombres y apellidos para revisarlos. La consulta requiere internet incluso en modo local; si falla, puedes completar los campos manualmente. Cambiar el documento limpia los nombres obtenidos de la consulta anterior.

1. Abre la ficha **Lucía Torres · Demo** y comprueba su alerta médica.
2. Cambia un hallazgo del odontograma y guarda una nueva versión.
3. Registra una atención y vincúlala a una sesión pendiente de su tratamiento.
4. Registra un pago parcial y comprueba el saldo restante.
5. Crea o reprograma una cita y comprueba la validación de horario.
   Si ya terminó y el paciente no llegó, abre su detalle y elige **Marcar como no asistió → Confirmar inasistencia**. El estado queda en la agenda y en las citas del paciente; no registra atenciones ni modifica sesiones o pagos. Para una nueva visita se crea otra cita.
6. Exporta su historia clínica en PDF y un reporte en Excel.

## Regresar a PostgreSQL

Detén el backend local, configura `backend/.env`, ejecuta las migraciones y el seed según el README y usa `npm.cmd run dev`. El esquema original `schema.prisma` se mantiene intacto. Los datos de prueba SQLite **no se copian automáticamente** a PostgreSQL.

SQLite usa una cola de transacciones para las escrituras del único proceso local. Es un modo provisional para probar con datos ficticios, no un despliegue multiusuario. Las pruebas específicas de PostgreSQL siguen siendo independientes.
