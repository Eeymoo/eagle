Vitest config for @eagle/core (ESM NodeNext, src only, coverage optional).

- environment: node  → core must stay platform-agnostic; no jsdom/browsers here.
- include: src/**/*.test.ts → tests live next to sources, run in `pnpm test`.
