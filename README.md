# Pizza Teria

A dark, red-accented pizza concept built with Next.js, JavaScript, Tailwind CSS, Motion, React Three Fiber and Three.js. Fire. Flour. Obsession.

## Develop

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Node.js 20.9 or newer is required; Node.js 22 is recommended.

## Build

```sh
npm run build
```

The site exports to `out/` and can be hosted as static files. Run `npm start` to preview the production export at http://127.0.0.1:3001. No API keys or remote 3D assets are required.

## Experience

- Reversible scroll-driven 3D dough, ingredients, baking, hinged packaging and scooter delivery.
- A doubled scroll journey, shared frame-based smoothing, continuous camera transitions and a posed delivery rider with anchored hands and feet.
- Original generated pizza and kitchen photography, optimized as WebP.
- Pizza category filtering, persistent shopping bag, quantity controls and accessible checkout drawer.
- Responsive layouts, local fonts and reduced-motion support.

The checkout is a clearly labelled demonstration. It does not process payments, send orders or arrange delivery. Menu, pricing and restaurant copy are illustrative concept content.

## Browser verification

`npm run verify` checks the desktop and mobile layouts, filters, shopping bag, demo checkout and forward/reverse 3D stages. It uses installed Microsoft Edge via Playwright and writes screenshots to `artifacts/`.

With the development server running, `node scripts/verify-hydration.mjs` simulates the extension-injected `cz-shortcut-listen` body attribute and checks normal and reduced-motion hydration. Only the body attribute warning is suppressed; descendant hydration checks remain enabled.

With the production preview running, `node --test scripts/verify-motion.mjs` checks easing after forward/reverse scroll input, idle settling, visible embers and paused offscreen rendering.
