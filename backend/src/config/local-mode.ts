// El modo provisional siempre se elige explícitamente desde el lanzador local.
export const isLocalDatabase = process.env.JUZEL_LOCAL === '1';
