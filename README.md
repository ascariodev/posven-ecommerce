This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Despliegue

Cada push a `main` corre `.gitea/workflows/deploy.yaml`: compila en modo standalone con el `.env`
de producción y deja el servidor en `/var/www/html/posven-ecommerce/current` (montado en el
runner como `/posven-ecommerce`). PM2 vigila `.deployed` y reinicia el proceso.

Preparación única en el servidor:

1. Crear `/var/www/html/posven-ecommerce/.env` con `MARKETPLACE_MODE=api`,
   `MARKETPLACE_API_URL`, `MARKETPLACE_API_KEY` y `SITE_URL` de producción.
2. Montar esa carpeta en el runner de Gitea como `/posven-ecommerce`, igual que `/posvenapp`.
3. Tras el primer despliegue:
   `pm2 start /var/www/html/posven-ecommerce/ecosystem.config.cjs && pm2 save`.
4. nginx hace proxy a `127.0.0.1:3000` (el puerto se cambia en `deploy/ecosystem.config.cjs`).
