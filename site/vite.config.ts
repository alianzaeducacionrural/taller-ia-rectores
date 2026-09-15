import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Salvaguarda: "local" empaqueta src/data/instituciones/*.json —datos con
  // nombres reales de estudiantes— dentro del JS público. Bloquea cualquier
  // `vite build` (lo que alimenta el deploy a GitHub Pages) que no declare
  // explícitamente VITE_DATA_SOURCE=sheets, para que ese build nunca salga a
  // producción por accidente. `npm run dev` no se ve afectado.
  if (command === 'build' && env.VITE_DATA_SOURCE !== 'sheets' && env.VITE_ALLOW_LOCAL_BUILD !== 'true') {
    throw new Error(
      'Build bloqueado: VITE_DATA_SOURCE no es "sheets". Un build en modo "local" empaqueta ' +
        'src/data/instituciones/*.json (nombres reales de estudiantes) en el JS público — nunca debe ' +
        'publicarse así. Define VITE_DATA_SOURCE=sheets cuando los 13 Google Sheets ya existan, o ' +
        'VITE_ALLOW_LOCAL_BUILD=true solo para una build local de prueba que no se va a publicar.',
    )
  }

  return {
    // GitHub Pages sirve este proyecto desde
    // alianzaeducacionrural.github.io/taller-ia-rectores/ — sin este base,
    // los assets del build se pedirían desde la raíz del dominio y darían 404.
    base: '/taller-ia-rectores/',
    plugins: [react()],
  }
})
