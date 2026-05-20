# VPS Deployment Notes

Target deployment shape for BarberFlow:

- Nginx serves the static React build from `apps/web/dist`.
- Nginx reverse-proxies API requests to the Fastify backend.
- PM2 keeps the backend process running.
- PostgreSQL runs on the VPS or in an external managed database.
- Certbot configures HTTPS with Let's Encrypt.

This document is intentionally high level for the initial setup. Add concrete commands once the production domain, server user, paths and database location are defined.
