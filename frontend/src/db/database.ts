import { DBShape, loadDB } from "./store";

// Kept for API compatibility with existing imports. Initializes (and seeds on
// first launch) the local JSON store.
export function getDb(): Promise<DBShape> {
  return loadDB();
}
