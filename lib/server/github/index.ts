// Punto de entrada (re-exports) para la integración con GitHub.
//
// Intención:
// - Mantener a `app/api/**` con imports simples (`@/lib/server/github`).
// - Separar responsabilidades:
//   - `contents.ts`: operaciones directas sobre un archivo o directorio vía Contents API.
//   - `gitData.ts`: commits atómicos (varios archivos en un solo commit) vía Git Data API.
export type { GitHubPublishConfig } from "./contents"
export {
  getExistingFileSha,
  getFileContentUtf8,
  listDirectory,
  deleteFile,
  createOrUpdateFile,
} from "./contents"

export type { GitFileToCommit } from "./gitData"
export { createSingleCommitWithFiles } from "./gitData"
