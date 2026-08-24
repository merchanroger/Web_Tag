# tapgo.com.ec

Tienda estática premium construida con React, TypeScript y Vite. No requiere backend: el catálogo vive en `src/data`, el carrito se persiste en `localStorage` y `/admin` sirve como editor local para preparar los archivos antes de hacer commit.

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm run preview
```

También puedes ejecutar `npm run lint` y `npm run typecheck`.

## CMS local

Entra en `http://localhost:5173/admin` con `rmerchan / 12345678` para ver métricas, crear productos, eliminar productos e importar/exportar `products.json`. Desde el panel puedes cambiar las credenciales. Se guardan en el navegador para el CMS local.

Importante: al ser un sitio 100% estático, este login no es autenticación de servidor ni protege secretos reales. Para una autenticación verdaderamente segura habría que añadir un backend o un proveedor externo de identidad. No uses esta credencial para datos sensibles.

## GitHub Pages

1. Crea un repositorio y sube el proyecto a la rama `main`.
2. En **Settings → Pages**, selecciona **GitHub Actions** como source.
3. El workflow `.github/workflows/deploy.yml` instalará, compilará y publicará el contenido de `dist` en cada push a `main`.

Vite usa `base: './'`, por lo que el build funciona cuando GitHub Pages lo sirve desde `https://usuario.github.io/nombre-repositorio/`. El enrutamiento funciona en navegación cliente; si se requiere recarga profunda con hosting estático, usa la navegación desde el sitio o configura una regla de fallback del proveedor.
