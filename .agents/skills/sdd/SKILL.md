---
name: sdd
description: >-
  Spec-driven deliverable pipeline under {workspace}/spec/.
  Use when defining requirements, building from a Spec, or verifying against Specs.
  Concept chain:  PRD → AC → (ADR | Direct Input) → ASR → Spec → review → implement → verify (→ feedback).
  Spec is grounded in user-approved decisions: identify what the user must decide (AC), review alternatives (ADR)
  or take Direct Input, fold approvals into ASR, then write Spec.
  Pair with the todo(scrum) skill, and use the adr skill when a concern needs option analysis and user approval.
---

# SDD: Spec-Driven Development Skill

Stage-gated pipeline under `{workspace}`. Load **this file first**, then load the matching `workflow/*.md` before writing that stage’s artifacts. Advance only after the stage’s **explicit user approval** (gate).

Concrete procedures live only in `workflow/*.md`. This file: concepts → stages → artifacts (paths) → Readiness Gate → scrum mapping.

---

## 1. Core concepts

### Spec is grounded in what the user decided

A Spec is **not** invented from agent preference or chat improvisation. It is written from **decisions the user has made** (plus PRD must-haves that need no further design choice).

The pipeline **identifies → decides → consolidates → encodes** those decisions:

```
PRD → AC → (ADR | Direct Input) → ASR → Spec → ⑥ review → ⑦ implement → ⑧ verify → ⑨ if needed
```

| Step | Role in the decision chain |
|------|----------------------------|
| **PRD** | Product definition the user owns (goals, constraints, success criteria, deliverable form). |
| **AC** | **Identify** structural questions the user **must settle** before Spec is complete. |
| **ADR \| Direct Input** | **Decide** each AC: **adr** skill when trade-offs need recorded options; otherwise Direct Input on the AC (straightforward default, clear preference, or fails adr “When to Create an ADR”). |
| **ASR** | **Integrate** user-approved outcomes (PRD must-haves + designed AC results). Skeleton for Spec writing — not SSOT in ⑦⑧. |
| **Spec** | **Encode** those outcomes as self-contained `R-NNN` / `C-NNN` (design substance included; optional ASR/AC/ADR provenance). **SSOT** for ⑦⑧. |
| **⑥ → ⑨** | Approve Spec → implement → verify; **⑨** remediates via Spec-first alignment. |

### Do not let the user miss consequential decisions

AC stages are **decision-coverage**, not paperwork:

1. **Surface** every blocking structural concern (②) before Spec writing.
2. **Force a settle path** per concern (③): ADR or explicit Direct Input — never silent agent defaults for consequential trade-offs.
3. **Consolidate** only what the user approved (④), then write Spec from that basis (⑤⑥).

If a consequential design question is still open, Spec readiness is **not** complete. Prefer an explicit AC (and ADR when warranted) over burying the choice in draft Spec prose.

### Operating principles

1. **Spec is SSOT** for build and verify. Not the chat prompt, not AC/ASR/ADR, not `docs/` or `AGENTS.md`.
2. User **approves Spec** (⑥) before implementation.
3. **Implement / verify** only against the approved Spec (and current sprint Scope when scrum is active).
4. **Changes** → update Spec → user **re-confirms** → then implement / re-verify.
5. Spec **deep-copies** structurally important decisions into `R-NNN` / `C-NNN` (not link-only pointers). Optional `←` provenance to ASR/AC/ADR is allowed for tracing.
6. **Sprint state** → scrum skill. **Option analysis** → adr skill (③). Boards and ADR files are not implementation SSOT.

---

## 2. Workflow stages

| Stage | Workflow | Gate artifact(s) |
|-------|----------|------------------|
| — | *(this file)* | Readiness Gate (§4) |
| ① PRD | [`01-prd.md`](workflow/01-prd.md) | PRD |
| ② AC identification | [`02-ac-identification.md`](workflow/02-ac-identification.md) | AC |
| ③ AC review (ADR \| Direct Input) | [`03-ac-review.md`](workflow/03-ac-review.md) | AC; optional ADR |
| ④ ASR consolidation | [`04-asr-consolidation.md`](workflow/04-asr-consolidation.md) | ASR |
| ⑤ Spec writing | [`05-spec-writing.md`](workflow/05-spec-writing.md) | Spec draft (formal approval is ⑥) |
| ⑥ Spec review | [`06-spec-review.md`](workflow/06-spec-review.md) | Spec as SSOT + review record |
| ⑦ Implementation | [`07-implementation.md`](workflow/07-implementation.md) | Deliverable(s); `AGENTS.md` |
| ⑧ Verification | [`08-verification.md`](workflow/08-verification.md) | Verification record |
| ⑨ Feedback | [`09-feedback-loop.md`](workflow/09-feedback-loop.md) | Spec + deliverable aligned |

①–⑥ establish user-approved inputs; ⑦⑧ consume the approved Spec only; ⑨ remediates via Spec-first alignment (edit Spec → user re-confirms → implement / re-verify) when Spec and deliverable diverge.

---

## 3. Artifacts (paths & conventions)

| Artifact | Path | Conventions |
|----------|------|-------------|
| **PRD** | `spec/PRD.md` | User-approved product definition. |
| **AC** | `spec/AC.md` | Living registry — **append**; never wholesale replace. Must-haves with no open design question are not ACs (they enter ASR from PRD). |
| **ADR** | `adr/{concern-slug}.md` | One concern; procedure via **adr** skill. Deep-copy into Spec. |
| **Direct Input** | *(on the AC)* | Resolution without an ADR file. |
| **ASR** | `spec/ASR.md` | Consolidation for Spec writing; not SSOT in ⑦⑧. |
| **Spec** | `spec/{requirement-slug}.md` | Implementation/verification SSOT. |
| **Spec review** | `spec-review/{requirement-slug}.md` | Gate record for ⑥. |
| **Verification** | `verification/{requirement-slug}.md` | Gate record for ⑧. |

**Supporting (not requirements SSOT):** `docs/`; `AGENTS.md` (create/update in ⑦); scrum boards (`TODO.md`, `scrum/`).

Filenames for ADR and requirements: English kebab-case. `{workspace}` / project slug may use the user’s language. Templates: each stage’s `workflow/*.md`. Counts are not fixed (one Spec or several; zero or many ACs).

---

## 4. Readiness Gate

Run **once** at session start (or when resuming an open defect). Jump to the first failing gate, then advance **forward**. Do not re-run the full gate until a **new** build request or a **⑨** remediation that needs re-routing. On a **continuation** (requirement add/change), re-evaluate gates for the **delta** only; do not treat missing first-pass sprint-00 as a reason to re-Initialize.

**Before gates:** Ensure `{workspace}/spec/` exists (create `{workspace}` only with user confirmation if missing).

Evaluate **G1 → G7 in order**; stop at the first failure.

| Gate | Pass when | On fail → |
|------|-----------|-----------|
| **G1** | PRD exists and user-approved | ① |
| **G2** | Blocking ACs registered; **Dependency Order** set (`none` if none); user approved the list | ② |
| **G3** | Every blocking AC is `designed` or `deferred` (none `identified` / `reviewing`) | ③ |
| **G4** | No linked ADR remains `proposed` (Direct Input–only ACs need no ADR) | ③ |
| **G5** | ASR lists PRD + designed AC outcomes; user-approved | ④ |
| **G6** | In-scope Spec file(s) encode all blocking ASRs (AC/ASR are not Specs) | ⑤ |
| **G7** | User approved Spec as SSOT; review record exists; no open blocking SSOT/consistency issues | ⑥ |

**All pass →** finish Spec→backlog (`PB-*`) if not done, then Boundary → **⑦** in the next implementation sprint (**§5**).

G2–G5 block Spec writing while consequential user decisions remain open or unapproved.

---

## 5. Scrum mapping

Use the **scrum** skill for every non-trivial deliverable (skip only if the user says so). SDD owns Spec/ADR content; scrum owns board state and when sprints advance.

### Sprint kinds

Every sprint is **exactly one** of:

| Kind | Purpose | Stages | Exit |
|------|---------|--------|------|
| **Spec→backlog** | Approve Spec; encode as `PB-*` | ①–⑥ + backlog setup/update | Spec SSOT + backlog ready; **no** product ⑦ |
| **Backlog→Implementation** | Implement/verify committed `PB-*` | ⑦ (⑧/⑨ as scoped) | Committed Scope done → Boundary → next plan |

Do not mix kinds: no product ⑦ in Spec→backlog; no Spec/AC redesign as main Scope of an implementation sprint (small in-sprint Sync only; large change → new Spec→backlog sprint).

### Lifecycle

```
[no scrum] → sprint-00 Spec→backlog (①–⑥ + PB-*)
         → Boundary → plan sprint-01 Backlog→Implementation
         → (scale) more implementation sprints until backlog drained / Goal met

[new feature / large change] → next sprint Spec→backlog (delta ①–⑥ + append PB-*)
                             → Boundary → plan following implementation sprint(s)
```

| Case | Kind | Notes |
|------|------|-------|
| **First setup** (`sprint-00`) | Spec→backlog | **Initialize**; seed `TODO.md` from ①–⑥ ending with a boundary task. After G7 + backlog-planning approval: split Spec into small `PB-*` (Story / Spec path+section / DoD) in `product-backlog.md`. Optionally draft next `sprint-NN.md`; do not rewrite live `TODO.md` for it until Boundary **and** **Sprint plan approval**. |
| **Implementation** (`sprint-01+`) | Backlog→Implementation | Starts only after a Spec→backlog Boundary. Commit a **subset** of open `PB-*` — never “finish the whole backlog” in one sprint. **Sprint plan approval** before Execute. |
| **Continuation** (existing board) | Spec→backlog for the **delta** | Keep `scrum/` history and continuous `sprint-NN` numbering — do **not** re-Initialize as sprint-00 or wipe Completed. Append `PB-*` (never renumber/reuse); carry unchanged open stories per scrum skill. At Boundary, plan the next implementation scope from the updated backlog. |
