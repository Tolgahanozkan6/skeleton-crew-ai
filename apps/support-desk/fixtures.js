/**
 * Support Desk test fixtures — three representative requests.
 * None contain order numbers so normal/urgent cases also exercise
 * the missing-facts path naturally; the "with-ref" fixture supplies one.
 */

export const fixtures = {
  /** Normal: a return request with a known order reference. */
  normal: {
    input: 'I would like to return my order #12345 as it arrived damaged.',
    expect: {
      category: 'returns',
      urgency: 'normal',
      hasMissingFacts: false,
      draftContainsNoCommitment: true,
    },
  },

  /** Missing facts: no order number provided. */
  missingFacts: {
    input: 'I want a refund for my recent purchase.',
    expect: {
      category: 'returns',
      urgency: 'normal',
      hasMissingFacts: true,
      draftContainsNoCommitment: true,
    },
  },

  /** Urgent / ambiguous: dissatisfied customer pressing for immediate action. */
  urgent: {
    input: 'This is urgent! I am extremely unhappy and need this resolved ASAP.',
    expect: {
      category: 'complaint',
      urgency: 'high',
      hasMissingFacts: true,
      draftContainsNoCommitment: true,
    },
  },
};
