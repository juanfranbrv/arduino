# Groups And Mobile Teacher Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add teacher group management plus a mobile-first teacher flow that fixes a unit, switches between students in that group, and only allows marking the current activity in order.

**Architecture:** Extend the existing Convex groups and classroom APIs instead of introducing a new session model. Move sequence logic into shared helpers so the teacher panel, student worksheet, and backend mutation all use the same rule for "current activity" and future-step locking.

**Tech Stack:** Next.js App Router, React, Convex, TypeScript, Vitest, Testing Library

---

### Task 1: Shared sequencing helpers

**Files:**
- Create: `F:/ARDUINO/PUBLICO/web/src/lib/teacher-progress.ts`
- Create: `F:/ARDUINO/PUBLICO/web/src/lib/teacher-progress.test.ts`

- [ ] Define helpers for deriving per-student activity states and the current markable activity.
- [ ] Cover ordered, completed, omitted, and blocked states with unit tests.
- [ ] Run: `npm test -- src/lib/teacher-progress.test.ts`

### Task 2: Convex group management

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/convex/groups.ts`
- Modify: `F:/ARDUINO/PUBLICO/web/src/lib/convex-api.ts`

- [ ] Add a teacher query that returns groups with their students.
- [ ] Add a teacher mutation that moves one student to another group.
- [ ] Keep permissions teacher-only and reject moving to the same group.

### Task 3: Mobile-first groups panel

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/src/components/teacher-groups-panel.tsx`
- Modify: `F:/ARDUINO/PUBLICO/web/src/app/globals.css`

- [ ] Keep the existing create-group flow.
- [ ] Add origin/destination selectors and the origin student list.
- [ ] Add one-tap move actions and clear empty/error states.
- [ ] Optimize layout for a single mobile column first.

### Task 4: Teacher dashboard data shape

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/convex/classroom.ts`
- Modify: `F:/ARDUINO/PUBLICO/web/src/lib/convex-api.ts`

- [ ] Extend the teacher dashboard query to expose available groups and worksheets with enough metadata for the new flow.
- [ ] Keep backwards-compatible defaults for first group / first worksheet when args are omitted.

### Task 5: Mobile-first teacher progress panel

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/src/components/teacher-progress-convex-panel.tsx`
- Modify: `F:/ARDUINO/PUBLICO/web/src/app/globals.css`

- [ ] Replace the current all-activities view with:
- [ ] Group selector
- [ ] Unit selector
- [ ] Student list for the selected group
- [ ] Student detail panel showing ordered activities for the selected worksheet
- [ ] Only show actions on the current activity; render later ones as blocked.

### Task 6: Backend enforcement for ordered progress

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/convex/progress.ts`
- Modify: `F:/ARDUINO/PUBLICO/web/src/lib/teacher-progress.ts`

- [ ] Reuse the sequencing logic concept in the mutation path.
- [ ] Reject attempts to mark a future activity as completed or omitted.
- [ ] Preserve reset-to-pending only for the current resolved entry when correction is allowed.

### Task 7: Student worksheet consistency

**Files:**
- Modify: `F:/ARDUINO/PUBLICO/web/src/components/student-worksheet-shell.tsx`
- Modify: `F:/ARDUINO/PUBLICO/web/src/components/activity-completion-highlighter.tsx`
- Modify: `F:/ARDUINO/PUBLICO/web/src/lib/worksheet-status.ts`

- [ ] Align the student worksheet state derivation with the shared sequencing rules.
- [ ] Ensure there is only one current activity and later ones stay blocked.

### Task 8: Verification

**Files:**
- Test: `F:/ARDUINO/PUBLICO/web/src/lib/teacher-progress.test.ts`
- Test: existing vitest suite

- [ ] Run: `npm test`
- [ ] Review the teacher-facing copy for mobile clarity.
- [ ] Summarize any residual risks if browser verification is not run.
