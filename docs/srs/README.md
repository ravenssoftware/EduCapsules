# SRS reference

`EduCapsules_Master_SRS_v1.1.docx` is the canonical source of truth for this project (per the user's decision, session of 2026-09-11).

It is v1.1, an audited pass over the originally supplied v1.0: no CONFIRMED decision was reversed. The audit resolved a small number of internal defects that v1.0 had (contradictions between two CONFIRMED sections, a duplicate requirement ID, four requirements that were cited but never defined, and several mis-wired cross-references). Every change is itemised in the document's own Appendix E (§52.5) and in its §1.7 amendment summary.

`EduCapsules_Master_SRS_v1.1.md` is a plain-text/Markdown mirror of the same content (pandoc-extracted), kept for fast grep/search during implementation — it is not a separate source of truth, just a convenience copy of the .docx.

Requirement IDs referenced throughout the codebase (e.g. in code comments, test names, or the traceability matrix once it exists) should point at IDs in this document.
