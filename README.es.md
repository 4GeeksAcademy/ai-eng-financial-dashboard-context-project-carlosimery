# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
agents/
  rules/
    01-arquitectura-contratos.md
    ...
```

[AGENTS.md](AGENTS.md) dirige a `agents/rules` segun el alcance de cada regla. La ruta antigua `.agents/rules`, las skills opcionales en `.agents/skills` y `memory-bank` se consultan si existen.

## Cómo ejecutar en local

```bash
docker compose up --build -d
docker compose ps
```

Con Docker Compose, Vite reenvia `/api` al backend mediante `host.docker.internal:8000`; Compose aporta el alias del host y las variables de Codespaces. Ejecutar Vite fuera de Docker requiere un origen de backend accesible o adaptar el proxy.
Para apuntar a otro origen de backend, copia `frontend/.env.example` a `frontend/.env` y define `VITE_API_BASE_URL` sin agregar `/api`. Reinicia Vite despues de cambiar este archivo.

Si Docker se ejecuta en tu maquina local y los puertos configurados estan disponibles:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

En Codespaces, consulta los enlaces actuales en vez de asumir localhost:

```bash
gh codespace ports --codespace "$CODESPACE_NAME"
```

Abre el puerto 5173 desde la vista Ports de VS Code. Los puertos privados requieren una sesion autorizada de GitHub; un HTTP 200 interno no verifica acceso externo. `/health` y `/docs` pertenecen al backend; Vite solo reenvia `/api`. El puerto 5678 es del depurador, no una pagina HTTP.

Consulta logs con `docker compose logs --tail=50 frontend backend`; detiene los servicios con `docker compose down` (sin `-v`). Son servidores de desarrollo, no un despliegue de produccion. [verification.md](verification.md) contiene comprobaciones fechadas y sus limites.

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
