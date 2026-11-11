# dev-mock

Local sample data for UI work, so the frontend can run without the live API.

```bash
npm run dev:mock   # mock API on :3003 + Nuxt dev server on :3333
```

- `sample-data.json`: snapshot of the public `GET /api/enduser/core/initialize`
  and `manifest.webmanifest` (taken 2026-11-02, personal fields anonymised).
- `mock-api.js`: serves it, shifting `schedule.activeDays` dates so the first day
  is always today. Auth accepts any mobile with code `12345`. `order/create` is
  not supported.
- Product images: only products with an image in the snapshot get a placeholder;
  the rest 404 deliberately, to exercise the "no photo" state.

Nothing in the app imports this folder, and it is excluded from the Docker build.
It is not the real backend; check changes against the real API before release.
