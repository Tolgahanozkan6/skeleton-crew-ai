/**
 * Job Planner test fixtures — three representative requests.
 */

export const fixtures = {
  /** Normal: repair with enough detail to identify service type. */
  normal: {
    input: 'Please repair our broken shop door at 14 High Street — it cannot close properly.',
    expect: {
      service: 'repair-assessment',
      urgency: 'normal',
      bookingConfirmed: false,
      quoteIsNull: true,
      hasMissingFacts: false, // location present; size still missing → questions raised
    },
  },

  /** Missing facts: no location, no scope detail. */
  missingFacts: {
    input: 'We need some work done on our premises.',
    expect: {
      service: 'general-assessment',
      urgency: 'normal',
      bookingConfirmed: false,
      quoteIsNull: true,
      hasMissingFacts: true,
    },
  },

  /** Urgent / ambiguous: emergency framing with limited detail. */
  urgent: {
    input: 'Emergency — the roof is leaking urgently and we need someone ASAP.',
    expect: {
      service: 'repair-assessment',
      urgency: 'high',
      bookingConfirmed: false,
      quoteIsNull: true,
      hasMissingFacts: true,
    },
  },
};
