# Financial Metrics Dashboard

<!-- hide -->

By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) at [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_Estas instrucciones están [disponibles en español](./README.es.md)._

**Before you start**: 📗 [Read the instructions](https://4geeks.com/lesson/how-to-start-a-project) on how to start a coding project.

<!-- endhide -->

---

_Financial metrics dashboard with a React + TypeScript frontend and a FastAPI backend._

## Recommended steps

1. Fork this repository to your account.
2. Open your fork in GitHub Codespaces or clone it and run it in your local environment.
3. Run your AI agent to inspect both frontend and backend.
4. Document the proposed rules and memory bank in your fork.
5. Refine and validate the rules until they fit the project's real workflow.

## Expected agents directory structure

```text
agents/
  rules/
    01-arquitectura-contratos.md
    ...
```

[AGENTS.md](AGENTS.md) loads rules from `agents/rules` according to their scope. Legacy `.agents/rules`, optional `.agents/skills` and `memory-bank` are consulted if they exist.

## How to run locally

```bash
docker compose up --build -d
docker compose ps
```

With Docker Compose, Vite forwards `/api` to the backend through `host.docker.internal:8000`; Compose supplies the host alias and Codespaces variables. Running Vite outside Docker requires an accessible backend origin or an adapted proxy.
To target another backend origin, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` without appending `/api`. Restart Vite after changing this file.

When Docker runs on your local machine and the configured ports are available:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs

In Codespaces, obtain the current links instead of assuming localhost:

```bash
gh codespace ports --codespace "$CODESPACE_NAME"
```

Open port 5173 from VS Code's Ports view. Private ports require an authorized GitHub session; an internal HTTP 200 does not verify external access. The backend owns `/health` and `/docs`; Vite only proxies `/api`. Port 5678 is a debugger, not an HTTP page.

Inspect logs with `docker compose logs --tail=50 frontend backend`; stop services with `docker compose down` (without `-v`). These are development servers, not a production deployment. See [verification.md](verification.md) for dated checks and their limits.

---

This and many other projects are built by students as part of the [Career Programs](https://4geeksacademy.com/compare-programs) at [4Geeks Academy](https://4geeksacademy.com). By [@marcogonzalo](https://github.com/marcogonzalo) and [other contributors](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors). Find out more about [AI Engineering](https://4geeksacademy.com/en/coding-bootcamps/ai-engineering), [Data Science & Machine Learning](https://4geeksacademy.com/en/coding-bootcamps/data-science-ml), [Cybersecurity](https://4geeksacademy.com/en/coding-bootcamps/cybersecurity) and [Full-Stack Software Developer with AI](https://4geeksacademy.com/en/coding-bootcamps/full-stack-developer).
