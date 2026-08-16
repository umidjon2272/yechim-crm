/**
 * Automation architecture — REFERENCE ONLY, not executed anywhere.
 *
 * Phase 3 doesn't build a rules engine. What it does build is a set of real,
 * conditional UI actions that already behave like the trigger → action pairs
 * below (e.g. DealDetailPage really does hide "Create Installation" until
 * `stage === 'WON'`). This file exists so a future automation engine (or a
 * backend-side implementation of the same rules) has one canonical list to
 * build against, instead of re-deriving it from scattered components.
 *
 * `uiEntryPoint` names the file+condition that already implements the
 * "can happen" half of each rule by hand, today.
 */
export const AUTOMATION_RULES = [
  {
    trigger: 'Deal becomes WON',
    suggestedAction: 'Installation can be created',
    uiEntryPoint: "DealDetailPage.jsx — 'Create Installation' button, shown when deal.stage === 'WON'",
  },
  {
    trigger: 'Payment becomes PARTIAL',
    suggestedAction: 'Remaining amount is shown',
    uiEntryPoint: 'DealDetailPage.jsx — PaymentsSummary card (Total/Paid/Remaining)',
  },
  {
    trigger: 'Installation becomes COMPLETED',
    suggestedAction: 'Follow-up task can be created',
    uiEntryPoint: "InstallationDetailPage.jsx — 'Schedule Follow-up' button, shown when installation.status === 'COMPLETED'",
  },
  {
    trigger: 'Follow-up date arrives',
    suggestedAction: 'Employee gets a task/notification',
    uiEntryPoint:
      'Not yet real-time — follow-ups are created as ordinary due-dated Tasks (see ScheduleFollowUpButton.jsx); a scheduled backend job would need to turn "due today" into a notification via POST /notifications.',
  },
  {
    trigger: 'Subscription/maintenance expires',
    suggestedAction: 'A future lead is created',
    uiEntryPoint:
      'No subscription/maintenance concept exists yet in Phase 1-3 — flagged here as a known Phase 4+ candidate, not built.',
  },
]
