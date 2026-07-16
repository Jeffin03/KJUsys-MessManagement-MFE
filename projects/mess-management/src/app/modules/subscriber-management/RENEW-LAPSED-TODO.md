# TODO — Renew / Lapsed Logging Refinement

Status: **PENDING PM CONFIRMATION** — do not implement until requirements are confirmed.

## Context
We refined tap rejections (skip logging `ALREADY_TAPPED`) and are reviewing how subscription
renewal / lapse events are logged and displayed. The renew button feature was prototyped in the
Edit Subscriber modal (lapsed students only) but **reverted** — pending this discussion.

## How renewal is currently logged (as-is behavior)

Renewal is an **explicit admin action** via `POST /students/:roll_number/renew`
(`StudentService.renewSubscription`). It is NOT automatic.

### Important caveats (current backend behavior)
1. The `SUBSCRIPTION_LAPSED` event (BUG-34) **only fires from the renew endpoint**, and **only when
   the gap between old `end_Date` and today is > 1 day**. Renew same-day or next-day → no lapsed event.
2. It does **NOT fire from the update endpoint.** Manually bumping `end_Date` forward via the update
   path logs only `SUBSCRIPTION_MODIFIED` — no lapsed event at all.
3. The **frontend doesn't handle `SUBSCRIPTION_LAPSED` well**:
   - Milestones `switch` has no `SUBSCRIPTION_LAPSED` case → falls to `default` and shows the raw
     action string `SUBSCRIPTION_LAPSED` as the title (no friendly label, no proper details).
   - Activity-timeline color map lacks it → renders with default gray.

## Open question for PM — rule for "renewal"
Current inconsistency: renew endpoint → `SUBSCRIPTION_RENEWED`; update endpoint extending `end_Date`
→ `SUBSCRIPTION_MODIFIED` (same outcome, different log).

Proposed unifying rule: **if update changes `end_Date` to a value > previous `end_Date` ⇒ log as
`SUBSCRIPTION_RENEWED`** (with `previousEndDate`/`newEndDate`/`durationDays`); otherwise `MODIFIED`.
- Covers "few days later, even near expiry" ✓
- Doesn't mislabel a shortening as renewed ✓
- Keeps meal-slot-only edits as `MODIFIED` ✓
- Endpoint-agnostic ✓

### Decision needed: what to do with the LAPSED event?
- **Option A — Keep BUG-34:** renewals after a >1-day gap still produce `LAPSED` + `RENEWED`
  (preserves the "had a gap" signal). Also make the **update endpoint emit `LAPSED`** when someone
  manually extends a lapsed subscription, for consistency across endpoints.
- **Option B — Drop it:** a late extension just shows `RENEWED` — simpler, but loses lapsed-gap visibility.

Recommendation: **keep the LAPSED event only for the genuine gap case** (useful audit info), but make
the update endpoint also emit it when manually extending a lapsed subscription, so behavior is
consistent regardless of endpoint. Then give `SUBSCRIPTION_LAPSED` a proper label/color on the frontend.

## Action items (after PM confirmation)
- [ ] Confirm unifying rule: extend `end_Date` later ⇒ `SUBSCRIPTION_RENEWED`
- [ ] Confirm LAPSED handling: Option A (keep + extend to update endpoint) vs Option B (drop)
- [ ] Backend: update endpoint detects `end_Date` extension → `SUBSCRIPTION_RENEWED`
- [ ] Backend: update endpoint emits `SUBSCRIPTION_LAPSED` on >1-day gap extension (if Option A)
- [ ] Frontend: add `SUBSCRIPTION_LAPSED` case to milestones `switch` (friendly title + details)
- [ ] Frontend: add `SUBSCRIPTION_LAPSED` to activity-timeline color map (proper color, not default gray)
- [ ] Frontend: re-evaluate Renew button in Edit Subscriber modal for lapsed students
      (prototype was reverted; re-add if PM wants in-UI renew)
- [ ] Verify `renewSubscriber()` service method is wired/used or intentionally kept for API completeness
