import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/track-element.ts', 'src/react/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
})
