# Report Evidence Traceability Spec

## Purpose

The final report should not behave like a black box.

Every major report section should be able to show:

- what conclusion was reached
- which research analysis questions contributed to that conclusion
- which participant summaries support it
- which transcript references those summaries came from

This gives the user a visible thread from:

`Final report -> research analysis -> participant-level evidence -> transcript reference`

## Product goal

When a user is reading the report, they should be able to click a lightweight control such as:

- `View evidence`
- `See supporting analysis`
- `Why this was concluded`

and open a small evidence block that explains:

- which question-by-question analysis items informed the section
- what patterns were seen in the participant responses
- which transcript references were used

This should increase trust in the report and reduce the feeling that the AI is making unsupported decisions.

## Core principle

This evidence mapping should be generated **during report generation**, not after the report is already written.

Why:

- generating it afterward risks rationalizing a conclusion after the fact
- generating it at the same time forces each section to justify itself from the actual analysis inputs it used
- the report and its supporting evidence remain aligned

## Scope

This applies to the major report sections:

- Executive summary
- Each item in `What the research says`
- Key user needs emerging from the study
- Design recommendations
- Suggested product direction
- Final takeaway

This does **not** need to apply to small decorative UI labels or metadata.

## Required output shape

The report generator should return not only readable section content, but also evidence metadata for each section.

Evidence references should be backed by stable ids, not only display strings.

Why:

- display labels like `Q2` or `user-a.md` are useful for the UI
- but they are not reliable as the system of record
- stable ids make it possible to link a report section back to the actual saved analysis row or transcript reference that supported it

The report payload should support both:

- **stable ids for linking**
- **display labels for rendering**

Each report section should support a structure like:

```ts
type ReportSectionEvidence = {
  evidenceSummary: string
  sourceQuestionIds: string[]
  sourceQuestionLabels: string[]
  sourceParticipantIds: string[]
  sourceParticipantLabels: string[]
  sourceTranscriptIds: string[]
  sourceTranscriptRefs: string[]
}
```

Each report section should support something like:

```ts
type ReportSectionWithEvidence = {
  title?: string
  body: string | string[]
  evidence: ReportSectionEvidence
}
```

## Evidence grounding rules

The report generator should not invent evidence links from raw intuition.

Evidence mapping should be grounded in pre-existing structured analysis artifacts first.

Recommended sequence:

1. build or load the saved research analysis layer
2. identify the relevant analysis questions, participant summaries, and transcript references
3. pass those grounded inputs into report generation
4. let the model write the section and summarize why those sources support it

This avoids a weaker pattern where the report writer is also deciding its own evidence trail from scratch.

## Evidence quality threshold

Not every section should automatically show a `View evidence` control if the supporting evidence is too weak.

Minimum threshold for rendering evidence by default:

- at least 1 linked analysis question
- at least 1 participant-level supporting reference
- at least 1 transcript reference or transcript-backed citation path

If a section does not meet that threshold:

- show `Limited support` instead of normal evidence copy
- or suppress the evidence control entirely

This prevents low-quality or repetitive evidence drawers from reducing trust.

## Section-level expectations

### Executive summary

Needs:

- a short evidence summary describing the dominant themes that drove the summary
- references to the key analysis questions behind those themes
- transcript references from the participants most representative of those patterns

### What the research says

Each theme should include:

- theme title
- body
- implication
- evidence summary
- source questions
- source participants
- source transcript refs

This is likely the most important section for traceability.

Attachment rule:

- evidence should attach **per theme item**, not just once for the whole section

### Key user needs

Each user need should include:

- the user need statement
- a short explanation of which research questions or participant patterns support it

Attachment rule:

- evidence should attach **per user need item**

### Design recommendations

Each recommendation should include:

- recommendation statement
- evidence summary describing the supporting analysis
- references to the questions and transcripts that led to the recommendation

Attachment rule:

- evidence should attach **per recommendation**

### Suggested product direction

This should include:

- the product direction statement
- short evidence support
- the analysis questions most responsible for the direction

Attachment rule:

- evidence can attach at the section level unless the direction is split into multiple distinct directional bullets

### Final takeaway

The final takeaway should include:

- the closing synthesis
- a concise explanation of the strongest supporting analysis behind it

Attachment rule:

- evidence should attach at the section level

## UI behavior

Each supported report section should render a collapsed control by default, such as:

- `View evidence`

When expanded, it should show:

- a short evidence summary in plain language
- `Based on:` followed by analysis question labels like `Q2`, `Q3`, `Q4`
- `Participants referenced:` followed by participant labels
- `Transcript references:` followed by transcript filenames or transcript references

The UI should feel simple and readable, not forensic or overly technical.

Interaction rules:

- paragraph-style sections can have one evidence block for the whole section
- list-style sections should render evidence per item
- if evidence is limited, do not present it with the same visual confidence as strongly-supported sections

## Recommended copy

Preferred button labels:

- `View evidence`
- `See supporting analysis`

Avoid:

- `AI reasoning`
- `Chain of thought`
- `Model thinking`

We want evidence traceability, not raw model internals.

## Source hierarchy

The report should support the following evidence chain:

1. user testing script / research inputs
2. question-by-question research analysis
3. participant-level summaries for each question
4. transcript references

The final report should primarily cite the **research analysis layer**, and that analysis layer should already carry transcript references.

The raw transcript should remain the deepest source of truth.

The report should not normally jump directly from report section to raw transcript without passing through the research analysis layer, unless a future UI explicitly supports that deeper drill-down.

## Implementation approach

### Phase 1

Update the report builder so it returns evidence metadata for each major section.

This means:

- report generation prompt must request section-level evidence mapping
- report builder types must support section evidence
- final report payload must include those fields
- evidence fields must contain stable ids as well as display labels
- evidence fields must be populated from the saved research analysis layer, not only from free-form report generation

### Phase 2

Update the Report tab UI to render collapsible evidence blocks beneath each section or item.

This phase should also:

- distinguish section-level evidence vs item-level evidence
- suppress or soften evidence blocks that do not meet the minimum threshold

### Phase 3

Optionally add deeper links from report evidence blocks back to:

- relevant analysis questions
- transcript modal or transcript references

This can come later. Phase 1 and 2 are the main trust-building improvement.

## Non-goals

This feature is **not** intended to:

- expose raw model reasoning
- expose chain-of-thought
- replace the research analysis tab
- show every transcript quote inline in the report by default

It is meant to show enough evidence to justify the report’s conclusions and make them auditable.

## Definition of done

This feature is complete when:

- each major report section includes evidence metadata
- the Report tab shows a collapsed evidence control per section
- expanding it shows question references, participant references, and transcript references
- those references are backed by stable ids in the payload
- the evidence shown is clearly derived from the research analysis, not invented afterward
- weakly supported sections do not present misleadingly strong evidence blocks
- the report feels more trustworthy and less like unsupported AI synthesis
