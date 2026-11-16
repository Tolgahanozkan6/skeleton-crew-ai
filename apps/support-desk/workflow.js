import { runCrew } from '../../src/crew.js';
import { runWorkflow } from '../../src/runtime.js';

export function runSupport(request) {
  return runWorkflow(request, [
    { name: 'triage', run: text => runCrew(text).triage },
    { name: 'reply', run: text => runCrew(text).reply },
    { name: 'operations', run: text => runCrew(text).operations }
  ]);
}
