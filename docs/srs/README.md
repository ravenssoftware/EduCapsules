# SRS reference

`EduCapsules_Master_SRS_v1.2.docx` is the canonical source of truth for this project.

**v1.0** was the originally supplied specification. **v1.1** was an audit pass over v1.0: no CONFIRMED decision was reversed; it resolved internal defects v1.0 had (contradictions between two CONFIRMED sections, a duplicate requirement ID, four requirements that were cited but never defined, and several mis-wired cross-references). **v1.2** resolves D-08 (grading scale) per an explicit Project Owner decision: grade scales are configurable per Organization, never a single global scale, with the scale and criteria in force at grade creation/release permanently preserved. It adds GRD-013...020, the GradingScale/GradingScaleVersion entities, the GRADING_SCALE_MANAGE permission, and the `/grading-scales` API resource group.

Every change across all three versions is itemised in the document's own Appendix E (§52.5); v1.1's amendment summary is also in §1.7.

`EduCapsules_Master_SRS_v1.2.md` is a plain-text/Markdown mirror of the same content (pandoc-extracted), kept for fast grep/search during implementation — it is not a separate source of truth, just a convenience copy of the .docx.

Requirement IDs referenced throughout the codebase (e.g. in code comments, test names, or the traceability matrix) should point at IDs in this document.
