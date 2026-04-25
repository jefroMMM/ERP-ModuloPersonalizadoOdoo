# Odoo local con Docker + Lista de Espera

Este proyecto levanta Odoo localmente con Docker y PostgreSQL con Docker Compose, y agrega un módulo personalizado llamado `restaurant_waitlist`.

## Arquitectura local

- `docker-compose.yml`: define el servicio de Odoo y el servicio de PostgreSQL.
- `addons/`: carpeta montada dentro del contenedor de Odoo para módulos personalizados.
- `odoo_pg_pass`: secreto local con la contraseña de PostgreSQL.
- `backup/`: contiene un compose alterno y un respaldo SQL de Chinook.

## Servicios Docker utilizados

- `web`: contenedor `odoo:19.0`.
- `db`: contenedor `postgres:15`.
- Volúmenes:
  - `odoo-web-data`
  - `odoo-db-data`
- Secreto:
  - `postgresql_password`

## Estructura del módulo personalizado

El módulo se encuentra en:

- `addons/restaurant_waitlist/`

Archivos principales:

- `__manifest__.py`
- `__init__.py`
- `models/__init__.py`
- `models/waitlist.py`
- `security/ir.model.access.csv`
- `views/waitlist_views.xml`

## Funcionalidad implementada

El módulo agrega una **Lista de Espera** para restaurante o punto de venta con estos campos:

- Nombre del cliente
- Número de personas
- Teléfono
- Estado: `En espera`, `Asignado`, `Cancelado`
- Fecha y hora de registro
- Nota opcional

También incluye:

- vista de lista
- vista formulario
- búsqueda y filtros
- acción de ventana
- menú visible en Odoo
- botón visible dentro del POS/restaurante para abrir la lista de espera desde la pantalla de mesas
- la mesa asignada se pinta como ocupada en el plano del POS aunque aún no exista una orden

## Cómo levantar el proyecto

Desde la carpeta raíz del proyecto:

```bash
docker compose up -d
```

## Cómo acceder a Odoo

Abre en el navegador:

```text
http://localhost:8069
```

## Cómo instalar el módulo personalizado

1. Entra a Odoo con tu base de datos.
2. Activa modo desarrollador si hace falta.
3. Actualiza la lista de aplicaciones.
4. Busca `restaurant_waitlist`.
5. Instala el módulo.
6. En el POS de restaurante, recarga la página para ver el botón `Lista de Espera` en la barra superior.

### Alternativa por consola

Si ya conoces el nombre de la base de datos:

```bash
docker compose exec web odoo -d TU_BASE_DE_DATOS -i restaurant_waitlist --stop-after-init
```

## Comandos útiles

### Reiniciar Odoo

```bash
docker compose restart web
```

### Ver logs

```bash
docker compose logs -f web
```

```bash
docker compose logs -f db
```

### Actualizar lista de aplicaciones

Desde la interfaz:

- Activa modo desarrollador
- Ve a `Apps`
- Usa `Actualizar lista de aplicaciones`

Por consola, como alternativa técnica:

```bash
docker compose exec web odoo -d TU_BASE_DE_DATOS -u base --stop-after-init
```

### Instalar el módulo por consola

```bash
docker compose exec web odoo -d TU_BASE_DE_DATOS -i restaurant_waitlist --stop-after-init
```

## Verificación rápida

- El contenedor `web` está arriba.
- El contenedor `db` está arriba.
- Odoo abre en `http://localhost:8069`.
- La carpeta `addons/` está montada en `/mnt/extra-addons`.
- El módulo `restaurant_waitlist` aparece en Apps.
- En `/pos/ui/6/floor` aparece el botón `Lista de Espera` si la configuración tiene `module_pos_restaurant` activa.
- Se puede crear un registro de prueba en la Lista de Espera.

## Notas de compatibilidad

- Este módulo está preparado para Odoo 19.
- Si cambias la versión principal de Odoo, ajusta el campo `version` del `__manifest__.py`.
- Si quieres colgar el menú dentro del menú nativo de Restaurant o POS, debes usar el `external id` real de esa versión de Odoo, porque puede cambiar entre versiones o ediciones.

## Checklist para video de máximo 3 minutos

1. Mostrar que Odoo está corriendo localmente en `http://localhost:8069`.
2. Mostrar los contenedores levantados con `docker compose ps`.
3. Mostrar `docker-compose.yml` y resaltar el montaje `./addons:/mnt/extra-addons`.
4. Entrar a Odoo y mostrar el módulo base de Restaurante o Punto de Venta si ya está disponible.
5. Mostrar el módulo personalizado `restaurant_waitlist` en Apps o en el menú.
6. Abrir la pantalla de **Lista de Espera**.
7. Crear un registro de ejemplo con:
   - nombre
   - número de personas
   - teléfono
   - estado
   - nota opcional
8. Guardar el registro y mostrarlo en la lista.
9. Cerrar mostrando que la funcionalidad quedó operativa.
