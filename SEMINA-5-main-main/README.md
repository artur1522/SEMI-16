# CloudOps Dashboard

![React](https://img.shields.io/badge/react-18.2.0-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/typescript-5.4.2-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.4.19-06B6D4?logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/vite-5.0.0-646CFF?logo=vite&logoColor=white) ![React Router](https://img.shields.io/badge/react--router-6.18.0-CA4245) ![Recharts](https://img.shields.io/badge/recharts-2.15.4-2F8BFF) ![Lucide](https://img.shields.io/badge/lucide--react-0.268.0-111827)

Descripción
-----------

CloudOps Dashboard es un dashboard completo de planificación y análisis de soluciones Cloud en AWS, totalmente funcional. Integra siete módulos (Dashboard, Planificación, Costos, Infraestructura Global, Seguridad, Arquitectura de Red y Servicios AWS) con un **inventario local en tiempo real** como única fuente de verdad, simuladores interactivos (etiquetados como *Simulación*), y modo oscuro completamente implementado, todo sin necesidad de conectar servicios reales de AWS. Ideal para demostraciones, planeación de migraciones y análisis de arquitecturas cloud.

### Fuente de datos: inventario local en tiempo real

- Los **servidores** (unidades del inventario, cada una con servicio, región y entorno) viven en un store central (`src/store/cloudStore.tsx`) deridado con React Context.
- **Nada está hardcodeado**: la cantidad de servidores por región, los servicios desplegados, el costo total mensual/anual, la distribución por categoría (donut) y el feed de alertas se derivan del store y se recalculan al instante y de forma síncrona cuando se agrega o retira un servidor (desde *Infraestructura Global*).
- El mapa de regiones refleja esas cantidades en sus marcadores y tarjetas.
- Las coordenadas geográficas de las regiones son datos de referencia estáticos (ubicaciones reales de los data centers de AWS), no inventario.

### Datos derivados vs. simulaciones

| Datos derivados del inventario (en tiempo real) | Simulaciones (según práctica didáctica, etiquetadas con badge "Simulación") |
|---|---|
| Servidores y servicios por región | Estimador/cálculo de costos (Costos) |
| Costo mensual/anual y distribución por categoría | Simulador de Saving Plans (Costos) |
| Distribución en el mapa y barras por región | Simulador de carga de tráfico (Dashboard) |
| Feed de alertas y actividad reciente | Arquitectura sugerida automática (Planificación) |
| Histórico de métricas (sparklines) en la sesión | Simulador de caída de CloudFront (Red) |

> **Extensión futura (no implementada):** conexión con una cuenta real de AWS mediante un backend/proxy que consulte EC2, Cost Explorer e IAM con el SDK v3, actualizando el inventario mediante polling cada 10–30 segundos. El store actual está diseñado para intercambiar su fuente de datos por ese conector sin cambios en la UI.

Tecnologías
-----------

- React — 18.2.0
- TypeScript — 5.4.2
- Tailwind CSS — 3.4.19
- Vite — 5.0.0
- React Router — 6.18.0
- Lucide React — 0.268.0
- Recharts — 2.15.4

Instalación
-----------

Clona el repositorio (si aplica) e instala dependencias:

```bash
git clone <REPO_URL>
cd cloudops-dashboard
npm install
```

Ejecución
---------

- Desarrollo (servidor local con hot-reload):

```bash
npm run dev
```

- Build producción:

```bash
npm run build
```

Funcionalidades (módulos)
-------------------------

1. **Dashboard:** Vista principal con indicadores clave, tarjetas con sparklines (tendencia real de la sesión de servidores y costos), feed de alertas y actividad reciente derivado del inventario, un simulador de carga de tráfico etiquetado como *Simulación* que recalcula métricas, distribución de costos por categoría derivada del store y resumen de seguridad.

2. **Planificación Cloud:** Formulario para registrar propuestas de arquitectura con validación, arquitectura sugerida automáticamente según el tipo de app, número de usuarios y nivel de disponibilidad (con estimación de costo mensual, etiquetada como *Simulación*), estados de propuesta (Borrador, En revisión, Aprobada) con filtros por estado, exportación de cada propuesta a un archivo JSON y modo comparador que contrasta dos propuestas lado a lado.

3. **Costos:** Costos base derivados en tiempo real del inventario de servidores, estimación simulada de costos por servicio (cantidad × tarifa × horas) que sobreescribe la línea derivada, simulador de Saving Plans con slider de compromiso (sin compromiso / 1 año / 3 años) y descuentos aplicados al instante, filtros por entorno (Dev, Staging, Producción) y categoría (Compute, Storage, Database, Networking), alerta de presupuesto mensual con barra de consumo y estados de advertencia, tarjetas de costo por servicio y gráfico tipo dona de la distribución mensual.

4. **Infraestructura Global:** Gestión de inventario en tiempo real — se pueden agregar o retirar servidores (servicio, región, entorno) y todo el dashboard se actualiza al instante — más tarjetas por región con latencia simulada codificada por color, estado operativo derivado del inventario, lista de zonas de disponibilidad expandibles/colapsables y sus estados, y resumen de latencia baja/media/alta según los umbrales.

5. **Seguridad (Security Hub):** Security score visual con anillo de progreso (puntaje, amenazas, cobertura MFA y parches pendientes), modelo de responsabilidad compartida (AWS Managed vs Customer Managed), tabla de cumplimiento de buenas prácticas con severidad y estado, y simulador de auditoría IAM que evalúa acceso de cada usuario sobre un recurso concreto, respetando comodines y el precedente del Deny explícito, con salida JSON del policy simulator.

6. **Arquitectura de Red:** Diagrama de flujo de tráfico (Internet → Route 53 → CloudFront → VPC) con animación del flujo de datos, simulador de caída de CloudFront que rompe el enlace, activa la ruta de fallback y muestra el nodo caído, subredes públicas y privadas con recursos, y tabla de grupos de seguridad con puerto, protocolo, origen, recurso y tipo de acceso.

7. **Servicios AWS:** Catálogo de servicios con descripciones y función principal, búsqueda por nombre o descripción, filtros rápidos por categoría (Cómputo, Almacenamiento, Bases de Datos, Redes, Seguridad, DNS, CDN) y modal de inspección profunda por servicio con categoría, estado, cuotas y límites, alternativas en otras nubes y enlace a la documentación oficial.

El modo oscuro está completamente implementado en toda la aplicación: detección automática de la preferencia del sistema, persistencia en `localStorage` y conmutación manual mediante el toggle del header.

Estructura del proyecto
----------------------

```
src/
├─ components/      # Componentes UI (StatCard, RegionCard, ServiceCard, SecurityScore, etc.)
├─ pages/           # Páginas y rutas por módulo
├─ hooks/           # Hooks personalizados (useTheme)
├─ store/           # cloudStore.tsx: proveedor Context del inventario en tiempo real
├─ data/            # Datos de referencia estáticos (awsServices.ts, regions.ts)
├─ types/           # Tipos TypeScript (cloud.ts)
├─ styles/          # CSS / Tailwind entry
└─ main.tsx         # Entrada de la aplicación
```

Capturas
--------

Reemplaza estos placeholders con capturas reales del proyecto cuando estén disponibles.

- Dashboard:

	![Dashboard](./captures/dashboard.png)

- Planificación Cloud:

	![Planificación Cloud](./captures/planning.png)

- Costos:

	![Costos](./captures/costs.png)

- Infraestructura Global:

	![Infraestructura Global](./captures/infrastructure.png)

- Seguridad:

	![Seguridad](./captures/security.png)

- Arquitectura de Red:

	![Arquitectura de Red](./captures/network.png)

- Servicios AWS:

	![Servicios AWS](./captures/services.png)

- Vista móvil:

	![Vista Móvil](./captures/mobile.png)

Contacto
--------

Si necesitas ampliar algún módulo, conectar datos reales o agregar nuevas funcionalidades, dime cuáles y las implemento.