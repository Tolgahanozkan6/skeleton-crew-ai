import test from 'node:test';
import assert from 'node:assert/strict';
import { runSupport } from '../apps/support-desk/workflow.js';
import { runPlanner } from '../apps/job-planner/workflow.js';

test('Turkish refund and order reference are recognized without approving a refund', () => {
 const run = runSupport('Sipariş numaram 1234. Ürün kırık, İADE istiyorum.');
 assert.equal(run.outputs.triage.category, 'returns');
 assert.equal(run.outputs.triage.urgency, 'normal');
 assert.equal(run.outputs.triage.missingFacts.length, 0);
 assert.equal(run.status, 'awaiting_human_review');
});
test('Turkish urgent repair and installation use distinct job types', () => {
 const repair = runPlanner('Dükkan kapısı bozuldu, acil tamir gerekiyor.');
 assert.equal(repair.outputs.scope.service, 'repair-assessment');
 assert.equal(repair.outputs.scope.urgency, 'high');
 assert.equal(repair.outputs.planner.bookingConfirmed, false);
 assert.equal(runPlanner('Montaj ve kurulum gerekiyor.').outputs.scope.service, 'installation-assessment');
});
