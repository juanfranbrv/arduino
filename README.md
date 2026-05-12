# Portal de Clase Arduino

Repositorio publico del portal de clase. Solo esta carpeta debe publicarse en GitHub o desplegarse en Vercel.

## Estructura

- `web/`: aplicacion Next.js para Vercel.
- `contenido/fichas/`: fichas MDX publicadas.
- `contenido/borradores/`: borradores generados por IA antes de publicar.
- `contenido/imagenes/`: imagenes propias asociadas a fichas.
- `contenido/presentaciones/`: materiales futuros.
- `contenido/cuestionarios/`: cuestionarios futuros.

La carpeta `../PRIVADO/` queda fuera de este repositorio y no debe publicarse.

## Desarrollo

```bash
cd web
npm install
npm run dev
```

## Verificacion

```bash
cd web
npm test
npm run lint
npm run build
```

## Convex y BetterAuth

El esquema inicial vive en `web/convex`. Para conectar el backend:

```bash
cd web
npx convex dev
npx convex env set SITE_URL http://localhost:3000
npx convex env set BETTER_AUTH_SECRET <secret>
npx convex env set GOOGLE_CLIENT_ID <google oauth client id>
npx convex env set GOOGLE_CLIENT_SECRET <google oauth client secret>
npx convex env set SETUP_TEACHER_SECRET <secret>
npx convex env set SEED_SECRET <secret>
npx auth generate --config ./convex/betterAuth/auth.ts --output ./convex/betterAuth/schema.ts
```

Despues, configura `NEXT_PUBLIC_CONVEX_URL` y `NEXT_PUBLIC_CONVEX_SITE_URL` en `.env.local` y en Vercel.

Para cargar las fichas MDX publicadas en Convex:

```bash
cd web
$env:NEXT_PUBLIC_CONVEX_URL="<convex url>"
$env:SEED_SECRET="<same seed secret>"
npm run seed:worksheets
```

Flujo inicial recomendado:

1. Crear el despliegue con `npx convex dev`.
2. Generar el schema de BetterAuth.
3. Configurar OAuth de Google y guardar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Convex.
4. Definir `SETUP_TEACHER_SECRET` y `SEED_SECRET` en Convex.
5. Abrir `/setup-profesor`, entrar con Google y activar la cuenta docente con el secreto.
6. Crear grupos desde funciones/panel docente.
7. Abrir `/registro` para que alumnos entren con Google y se unan con codigo de grupo.
