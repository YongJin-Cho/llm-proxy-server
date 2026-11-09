# Stage ⑤ — Spec Writing (`spec/{requirement-slug}.md`)

**Prerequisites:** User-approved `{workspace}/spec/ASR.md` (Readiness Gate G5 pass).

**Gate artifact:** Draft `{workspace}/spec/{requirement-slug}.md` ready for stage ⑥ review.

**Next stage:** `06-spec-review.md` (formal Spec approval happens there — not in this stage)

---

## Rules

1. **One File, One Scope:** Each distinct component, feature, or independent deliverable gets its own Spec. Before creating one, search `{workspace}/spec/` (filename, title) for the same scope — **merge**, do not duplicate. Do not put Spec content in `PRD.md`, `AC.md`, or `ASR.md`.
2. **Self-contained SSOT draft:** A reader (or stage ⑦) must get every decided requirement — including design choices (mechanism, parameters, values) — from the Spec alone.
   - Encode every blocking ASR from `ASR.md` by **substance** into **Requirements** (`R-NNN`) or **Constraints** (`C-NNN`). There is **no** `## Decisions` section; fold design outcomes into the R/C statement itself.
   - Deep-copy decided ADR / Direct Input / ASR outcomes **in full** into each R/C bullet (parameters, values, behaviors).
   - **Provenance (optional, encouraged):** After the statement, append `←` sources for change-tracking — `ASR-00x`, `AC-00x`, and/or `adr/{slug}.md`. Provenance never replaces the statement.
   - **Prohibited:** ID- or path-only bullets (e.g. `- R-001: See ASR-003`, `- Auth: See adr/auth.md`).
3. **Section roles:**
   - **Requirements** (`R-NNN`) — Testable must-haves (functional, non-functional, or design choices that the deliverable must satisfy).
   - **Constraints** (`C-NNN`) — Hard limits (technical, legal, time, format, quality) that bound the solution.
4. **Stable IDs:** Within each Spec file, number Requirements `R-001`, `R-002`, … and Constraints `C-001`, `C-002`, …. Append on add; do not renumber existing IDs when editing.

---

## Procedure

1. **Identify scope:** Map the current requirement to `{workspace}/spec/{requirement-slug}.md`. PRD changes belong in stage ① — do not rewrite product scope here.
2. **Resolve ambiguity (Socratic):** Ask when scope, audience, format, or quality bars are unstated. Do not present agent assumptions as Spec facts.
3. **Gather inputs:** Approved `ASR.md` (all blocking ASRs); user goals/non-goals/constraints; approved ADR / Direct Input outcomes (deep-copy only). If resuming after ⑧ failure, pull **Deviations** / **Undocumented ASRs** from `{workspace}/verification/{requirement-slug}.md`.
4. **Write or update:** Bullets over prose. Place each ASR outcome into an `R-NNN` or `C-NNN` with full substance; add `←` provenance when an ASR/AC/ADR applies. Every Requirements line must be **testable** for stage ⑧. Document `## Out of Scope`. On verification-driven edits, change only affected sections; preserve user edits and existing IDs.
5. **Hand off to review:** Report path and summary; advance to ⑥. Do not start implementation from an unreviewed Spec.

---

## File Template

```markdown
# {Requirement Title}
- {One clear statement — deliverable, audience, success in one or two sentences.}

## Context
- {Why this is needed now}
- {Link to parent {workspace}/spec/PRD.md if applicable}

## Requirements
- R-001: {Functional must-have — testable} ← ASR-001
- R-002: {Non-functional must-have — testable} ← ASR-002; AC-001
- R-003: {e.g., Cache layer uses Redis with 60-second TTL and LRU eviction} ← ASR-003; AC-002; adr/cache-layer.md
- R-004: {e.g., Proxy returns upstream status code unchanged on success paths}

## Constraints
- C-001: {Technical, legal, time, format, or quality constraint} ← ASR-004
- C-002: {e.g., Must run without GPU; response JSON must match schema X}

## Out of Scope
- {Explicit non-goals confirmed by the user}

## Open Questions
- {Deferred item — and whether it blocks implementation}

## Related
- {workspace}/adr/{concern-slug}.md — optional file-level audit trail
- {workspace}/spec/PRD.md
- {workspace}/spec/ASR.md — registry / skeleton for writing; item-level tracing uses R/C provenance
```

Omit empty sections except **Requirements**.
