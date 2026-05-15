# Portal de Clase Arduino

Repositorio publico del portal de clase. Solo esta carpeta debe publicarse en GitHub o desplegarse en Vercel.

## Estructura

- `web/`: aplicacion Next.js para Vercel.
- `contenido/fichas/`: unidades MDX publicadas.
- `contenido/borradores/`: borradores generados por IA antes de publicar.
- `contenido/imagenes/`: imagenes propias asociadas a unidades.
- `contenido/presentaciones/`: materiales futuros.
- `contenido/cuestionarios/`: cuestionarios futuros.

La carpeta `../PRIVADO/` queda fuera de este repositorio y no debe publicarse.

## Skill De Autor

El skill unico para crear contenido didactico se llama `creador-de-unidades` y vive en `../.agents/skills/creador-de-unidades`.

Sirve para crear, revisar o publicar unidades de Arduino en `contenido/fichas/`. Aunque la carpeta siga llamandose `fichas` por compatibilidad tecnica, a nivel editorial trabajamos con `unidades`.

### Como invocarlo

Si ya tienes un guion de actividades:

```text
Usa el skill creador-de-unidades.
Quiero una unidad nueva sobre [tema].
Slug: [slug]
Nivel: [nivel]
Duracion: [duracion]
Materiales: [materiales]
Guion de actividades:
1. ...
2. ...
3. ...
```

Si no tienes guion:

```text
Usa el skill creador-de-unidades.
Quiero una unidad nueva sobre [tema].
No tengo guion: generalo tu primero.
```

### Flujo Esperado

1. Si no queda claro si hay guion, el skill debe preguntar si ya existe o si debe generarlo.
2. Si no hay guion, primero propone un borrador corto de actividades.
3. Cada actividad del borrador debe incluir titulo, objetivo, foco tecnico o de montaje, y que comprobaria el profesor.
4. Solo despues de revisar ese borrador se redacta la unidad completa en MDX.

### Fuentes Prioritarias

El skill debe consultar las fuentes privadas en este orden:

1. `../PRIVADO/REFERENCIA`
2. El PDF principal de ELEGOO dentro de `../PRIVADO/ELEGOO`
3. `../PRIVADO/LIBROS` como apoyo secundario, sin saturar la unidad final

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

Para cargar las unidades MDX publicadas en Convex:

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
