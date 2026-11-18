// The app registry. Adding an app = one folder + one line here
// (`npm run new-app <id> "<Title>"` does both).
import { createRegistry } from '../src/registry.js';
import supportDesk from './support-desk/manifest.js';
import jobPlanner from './job-planner/manifest.js';
// new-app:imports

export const registry = createRegistry([
  supportDesk,
  jobPlanner,
  // new-app:entries
]);
