export function runCrew(request) {
  if (typeof request !== 'string' || !request.trim()) {
    throw new TypeError('A non-empty customer request is required');
  }
  const text = request.trim();
  return {
    status: 'awaiting_human_review',
    mode: 'offline-demo',
    triage: { agent: 'triage', category: /refund|return/i.test(text) ? 'returns' : 'general' },
    reply: { agent: 'reply', draft: 'Thank you for contacting us. Our team will review your request and follow up.' },
    operations: { agent: 'operations', tasks: ['Review customer request', 'Verify business policy', 'Approve reply before sending'] }
  };
}
