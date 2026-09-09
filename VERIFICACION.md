# Verificación de la entrega

## Ejecutado en este equipo

- Modo provisional SQLite: esquema aplicado, datos ficticios cargados y backend iniciado.
- Prueba integral `scripts/smoke-api.mjs` aprobada contra SQLite: autenticación, duplicados, anamnesis, versiones inmutables, sesiones, cuotas, pagos parciales/sobrepagos, citas y cinco reportes.
- Descargas PDF clínico, PDF de reporte y Excel verificadas mediante sus firmas binarias. Se corrigió un fallo de escritura doble al iniciar la respuesta PDF.
- Navegador: acceso con la cuenta demo, carga del panel, listado de pacientes, ficha clínica con alerta médica e indicación de modo de prueba comprobados. Los datos se conservaron al reiniciar el servicio local.

- Revisión sintáctica de 65 archivos TypeScript/TSX con el analizador Babel disponible localmente: sin errores.
- Pruebas unitarias puras: 4 aprobadas de 4 (distribución exacta de céntimos, vencimiento mensual al final de mes, quincenas y límites de horarios peruanos).
- Revisión de rutas, formularios y correspondencia con los requisitos.
- Comprobación de 254 importaciones locales y existencia de las 14 entidades solicitadas: sin errores.

- Instalación de dependencias en ambos proyectos y generación de sus `package-lock.json`.
- Backend: `prisma generate`, `prisma validate`, `npm run build` y `npm test` completados correctamente.
- Frontend: `npm run build` completado correctamente (TypeScript y Vite).
- bcrypt: creación y comparación de un hash de prueba completadas correctamente.

Estas comprobaciones no sustituyen las pruebas de integración con PostgreSQL ni la revisión visual en navegador.

## Pendiente de PostgreSQL y validación de integración

- `prisma migrate dev` y creación del usuario inicial.
- Prueba API completa `node scripts/smoke-api.mjs` contra una base de prueba.
- Prueba de concurrencia real: dos citas simultáneas y dos pagos simultáneos sobre la misma cuota.
- Revisión visual en laptop y celular, navegación por teclado, cambios de contraseña, sesión inactiva durante 15 minutos y pestañas múltiples.
- Apertura y revisión de los PDF y Excel generados con datos reales de prueba.

## Advertencias de las herramientas

- `npm audit` detecta 8 avisos en backend (4 moderados y 4 altos, contando dependencias afectadas) y 2 moderados en frontend. Las cadenas afectadas incluyen Prisma/configuración, Express/qs, ExcelJS/uuid y React Router. `npm audit fix` sin cambios incompatibles no los resolvió. Queda pendiente evaluar actualizaciones y volver a probar antes de un despliegue con datos reales; no se aplicaron las degradaciones o cambios de versión mayor sugeridos por `--force`.
- Vite informa de un paquete JavaScript de aproximadamente 793 kB sin comprimir (234 kB gzip). La compilación termina; la división del código puede optimizar la carga inicial.
- Prisma 6.19 avisa que la configuración en `package.json` deberá migrarse si se actualiza a una versión mayor. La configuración actual funciona con la versión fijada.

## Matriz de trazabilidad

| Requisito | Implementación |
|---|---|
| RF-01 | JWT, bcrypt, middleware, login, cambio de contraseña, temporizador de inactividad |
| RF-02 | Endpoint de PDF consolidado y descarga desde ficha |
| RF-03 | Filiación validada, documento único y correlativo de historia |
| RF-04 | Búsqueda con debounce y consulta por nombres, documento y teléfono |
| RF-05 | Antecedentes con control, alergias editables, medicación y derivación |
| RF-06 | Banner persistente sin botón de cierre y señal en listado |
| RF-07 | Historial cronológico con diagnóstico, procedimiento y sesión vinculada |
| RF-08 | Formulario de atención con fecha, piezas FDI, anestésico e indicaciones |
| RF-09 | SVG de 32 piezas, cinco superficies, snapshots y consulta histórica |
| RF-10 | Calendario día/semana/mes, validación de turnos y solapamiento al guardar |
| RF-11 | Enlace WhatsApp con teléfono peruano y mensaje codificado |
| RF-12 | Plan, sesiones, progreso, detalle, suspensión y finalización automática |
| RF-13 | Cuotas mensuales/quincenales y pagos con fecha y medio |
| RF-14 | Saldos, pagos parciales, vencimientos y días de atraso |
| RF-15 | KPIs, gráfico de seis meses, cinco reportes y exportación PDF/Excel |
| RNF-01 | Autenticación, bcrypt, revocación por versión, borrado lógico y preparación HTTPS |
| RNF-02 | Español, soles, fechas locales, acceso a ficha desde menú o citas |
| RNF-03 | PostgreSQL centralizado y diseño documentado para respaldo diario |
| RNF-04 | React Query, carga diferida por pestaña, indicadores de carga y escrituras asíncronas |
| RNF-05 | Features, capas backend, configuración independiente, Git y CSS responsive |

## Criterio de aceptación manual

1. Un login inválido no revela qué credencial falló y una ruta privada no abre sin sesión.
2. Registrar DNI repetido ofrece la ficha existente. Un teléfono inválido no se guarda.
3. Alergias o antecedentes no controlados mantienen visible la alerta al cambiar de pestaña.
4. Guardar dos odontogramas conserva la primera versión; no se puede editar al consultarla.
5. Completar una sesión una segunda vez se rechaza y la última sesión finaliza el plan.
6. Dos citas que se tocan en el límite son válidas; una cita que cruza el descanso no lo es.
7. Cancelar una cita libera su horario y conserva el registro en la ficha.
8. Un pago parcial conserva el saldo y un sobrepago se rechaza sin alterar ningún registro.
9. Exportar aplica exactamente los filtros de la vista previa; ambos archivos abren correctamente.
10. Archivar oculta la ficha y conserva sus datos en PostgreSQL.
