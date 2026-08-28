# Puesta en producción de tapless.ec

La tienda ya está preparada para catálogo, detalle, carrito, total acumulado, checkout de demostración, opiniones y configuración externa. Para activarla con datos reales:

## Configuración local

```bash
npm install
copy .env.example .env.local
npm run dev
```

Completa `.env.local` con el número real de WhatsApp, la URL y la clave pública de Supabase. Las claves secretas nunca deben comenzar por `VITE_` ni enviarse al navegador.

## Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase/schema.sql` desde SQL Editor.
3. Crea una Edge Function para crear pedidos y verificar pagos.
4. Configura un webhook del proveedor de pagos que cambie el pedido a `paid`.
5. Sustituye el administrador local por Supabase Auth antes de publicar.

## Pagos

`VITE_PAYMENT_PROVIDER=demo` mantiene la prueba local. Para producción se debe conectar el proveedor elegido y su endpoint seguro en `VITE_PAYMENT_CHECKOUT_URL`. Las credenciales privadas deben vivir únicamente en Edge Functions o en el servidor.

## Validación y despliegue en GitHub Pages

```bash
npm run typecheck
npm run lint
npm run build
```

Después configura el dominio `tapless.ec`, DNS, HTTPS, correo transaccional, zonas de envío e imágenes/precios definitivos. El hosting debe tener fallback para `/producto/*`, `/carrito` y `/admin`.

Para publicar gratis en GitHub Pages:

1. Crea un repositorio público en GitHub y sube el proyecto a la rama `main`.
2. En **Settings → Pages**, selecciona **GitHub Actions**.
3. El workflow `.github/workflows/deploy.yml` construirá y publicará la página automáticamente.
4. La URL será `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

GitHub Pages no entrega un dominio `.ec` gratuito. Para usar exactamente `tapless.ec` se necesita comprar ese dominio y conectarlo como dominio personalizado.

## Datos aún necesarios

- Cuenta de Supabase y credenciales públicas.
- Cuenta del proveedor de pagos.
- Número real de WhatsApp Business.
- Datos legales, inventario y costos de envío.
- Hosting y acceso DNS del dominio.
