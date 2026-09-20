# Storage & Content Architecture

**Source:** SRS §14 (Teacher Storage), §15 (Content Publishing), §16 (Content Protection), STR-001..023, STR-IMP-001..013, STR-EXP-001..005, CNT-001..031, GEN-014, GEN-016, GEN-022

## 1. Three layers, one principle (§14.1, GEN-014)

"Upload once → store once → reference everywhere → version when changed → export without unnecessary duplication → import with deduplication." Architecturally this is three separable entities, each with its own identity and ownership, matching `database.md` §5's entity list exactly — this document adds no new entities, only the operational architecture around them:

| Layer | Identity | Owned by | Architectural role |
|---|---|---|---|
| `StorageObject` | SHA-256 content hash | the platform | physical encrypted bytes, private, never publicly addressable; the unit the `ObjectStore` adapter (`backend.md` §5) operates on |
| `File`/`FileVersion` | file id + version no. | the Teacher/Organization | the logical file identity a Teacher names, organizes, and versions; copy-on-write per DB-006 |
| `FileReference` | reference id | the educational entity using it | where a file is *used* (a Course, Topic, Session, Homework, Quiz), each with its own visibility and content policy |

Deduplication is possible specifically because these three are separate: two Teachers uploading byte-identical files share one `StorageObject` (even across tenants, invisibly — STR-IMP-011/012), while each keeps an independent `File` record, ownership, and reference set. Deleting one Teacher's `File` never deletes the shared object while another reference exists (STR-023, DB-006).

## 2. Storage module boundaries (`storage` vs `content-gateway`, README.md §5)

Two modules, deliberately separate, because they answer different questions and have different trust levels:

- **`storage`** owns the Teacher's private workspace: upload, organize, version, share-with-assistant, trash/restore, import/export. It never serves a student. STR-004/STR-005 make this an architectural boundary, not a UI convenience: students and parents have no route into the `storage` module at all, direct or indirect.
- **`content-gateway`** owns delivery of *published* content to authorized consumers (mainly students). It depends on `storage` (for the underlying bytes) and `authz` (for the full §7 pipeline plus entitlement), but is a distinct service boundary — this is what makes "uploading is not publishing" (§15's opening line) an enforced architectural gap, not a checkbox a client could bypass by hitting the wrong endpoint.

## 3. Upload path (STR-007, STR-008, STR-022)

Every upload goes through, in order: size/MIME/extension/signature validation → malware scan → encryption at rest → metadata (hash, owner, size) written to the relational store while bytes go to `ObjectStore`. A file is not "available" (referenceable, shareable, publishable) until the scan clears — this is a state machine per §45, not a best-effort async side process the rest of the system ignores. Large binary content never lands in the relational database (STR-022, DB-007's portable-types principle) — the DB holds metadata and references only, regardless of engine (D1 or Postgres).

## 4. Deduplication mechanics (STR-IMP-001..013, STR-IMP-011/012)

- Duplicate detection is content-based (SHA-256 + size), never filename-based (STR-IMP-004/005) — the `storage` module's upload handler computes the hash before deciding whether to create a new `StorageObject` or reuse an existing one.
- Cross-tenant reuse is invisible by design: the dedup check only ever runs against objects the *requesting user* can already see as candidates for "this looks like a file you have" — it never says "this file already exists" when the match is in another user's storage (STR-IMP-012), because that would leak the existence of a private file across a tenant boundary. Concretely, the equality check on the hash happens at the storage-object layer (tenant-invisible), but the *response to the user* is derived only from that user's own accessible `File` rows — the two lookups are architecturally distinct queries, not one query with a confusing filter bolted on.
- Import/export preserves this: an export package deduplicates within itself (STR-EXP-003 — one physical copy referenced by manifest, never duplicated per reference), and import compares against the importing user's own accessible files before creating new physical copies (STR-IMP-009), never silently overwriting on a filename collision with different content (STR-IMP-010).

## 5. Publishing boundary (§15, CNT-001..007)

Publishing is a distinct, explicit, auditable action that creates or updates a `FileReference` with an explicit visibility and content policy — never an implicit side effect of uploading or attaching. `ContentItem.publish_at`/`status` (`database.md`'s referenced entity catalogue) is the state this action drives. Two invariants the architecture must preserve mechanically:

- **A published reference pins the file version published** (CNT-004, GEN-015) — editing the source `File` after publishing never retroactively changes what a student already sees; this is the same copy-on-write mechanism as `GradingScaleVersion` pinning (`database.md` §5), applied to content.
- **Unpublishing removes access without deleting anything** (CNT-005) — it flips the `ContentItem`/`FileReference` visibility, it never touches `File`/`FileVersion`/`StorageObject`.

## 6. The Content Gateway (§16, GEN-016) — the central protection mechanism

**"Access to a course ≠ access to the original course files."** A student never receives the original stored asset merely by being logged in and enrolled — they receive a protected rendering or encrypted stream, delivered through the Content Gateway after every authorization, entitlement, policy, and abuse check has passed (GEN-016). This is the mechanism the sequence diagram in `README.md` §3 ("Protected content request") already shows structurally; this section is its detailed contract:

1. Client requests a content item through the ordinary API (full §7 pipeline + entitlement check, per `auth-and-authorization.md` §5).
2. On success, the API issues a short-lived, cryptographically random, scoped, revocable gateway ticket — **never a durable URL** (CNT-012, CNT-013).
3. Client presents the ticket to the Content Gateway, a separate service boundary that **independently re-validates** the ticket and authorization (never trusts that "the API already checked") before touching object storage.
4. Gateway fetches bytes from `ObjectStore`, applies protection-level-appropriate transformation (rendering, watermarking, encrypted segmentation), and streams the result.
5. Gateway logs a `ContentAccessEvent` (async anomaly scoring feeds `ContentAbuseSignal`, CNT-020/CNT-024).

Independent re-validation at the gateway (step 3) is deliberate redundancy, not duplication for its own sake: it is what makes a leaked or replayed ticket still subject to a live authorization check rather than a bearer token good until expiry, and it is the same "never cache authorization decisions" discipline SEC-013/SEC-014/SEC-018 already require elsewhere.

## 7. Protection levels (§16.2, Table 16.1)

Protection is set per content reference, not globally — a course may mix levels:

| Level | Applies to | Gateway behavior |
|---|---|---|
| 0 Public | deliberately public material | normal web serving, no gateway ticket needed |
| 1 Standard | authenticated users | login required, no public URL, no additional watermarking |
| 2 Protected | normal course content | gateway ticket, dynamic watermark, access logging, rate limiting |
| 3 Premium | high-value paid content | level 2 + encryption, DRM where applicable, strict entitlement, device/session/concurrent-playback controls, detailed audit |

The gateway's ticket-issuance and re-validation logic (§6 above) is identical across levels; what varies per level is which additional controls (watermark, DRM, concurrency limits) the gateway applies after validating access — this keeps the gateway one code path with configuration, not four separate delivery pipelines.

## 8. Video (CNT-016, CNT-017)

Protected video is delivered as encrypted segmented streams (HLS and/or DASH), never as a direct file URL — this is a materially different delivery shape from documents/images and is why `README.md` §2's component diagram lists "Video processing" as its own Integration-layer concern rather than folding it into `ObjectStore`. Level 3 video should use DRM where the client platform supports it (SHOULD, not MUST — CNT-017 acknowledges DRM isn't universally available). Full video-pipeline design (packaging, transcoding) is out of Phase 1 scope; the architectural commitment here is only that it sits behind the same Content Gateway authorization boundary as every other protected asset.

## 9. What the platform must never claim (§16.4, GEN-022)

Screenshots and screen recording cannot be reliably prevented in an ordinary browser, and no EduCapsules requirement, doc, or marketing claim may say otherwise. Copy-blocking, context-menu suppression, and DevTools-blocking are deterrents, never security boundaries (GEN-003) — the architecture does not budget engineering effort toward them as protection. The enforceable posture (CNT-029) is: OS-level restriction on supported native platforms where available; everywhere else, rely on DRM, watermarking, access control, entitlement, and monitoring to deter, trace, and limit unauthorized capture — never to prevent it outright. This shapes `security-and-trust-boundaries.md`'s threat model directly: content leakage is treated as a detect-and-trace problem, not a prevent-entirely problem.

## 10. Abuse detection (CNT-019, CNT-020, CNT-024, CNT-025)

Rate limiting (per user, per resource, per session) and bulk-extraction/scraping detection sit in the Content Gateway path, feeding `ContentAbuseSignal` on multiple corroborating signals — a single unusual request never blocks a legitimate user (CNT-025). Detected abuse raises a `SecurityEvent` and may trigger token revocation, rate limiting, forced re-authentication, or access restriction (CNT-024) — always a human-reviewable case (per `ContentAbuseSignal.resolution`), never an automatic irreversible punishment, matching CNT-029's "never claim we prevent, only that we detect and trace" posture.

## 11. Assistant access is scoped, never bulk (CNT-026, STR-006)

An Assistant accesses only the Teacher content explicitly shared with them, with the specific operations granted (view/upload/edit/delete/share/publish/download) — never a blanket bulk-download of a Teacher's library. This is enforced the same way every other relationship-based check is (`auth-and-authorization.md` §4): the Content Gateway's authorization stage checks the specific `AssistantAssignment`/share grant for the specific content item, not "is this user an Assistant of this Teacher."

## 12. Quotas never break published content (STR-011, STR-018, STR-019)

Storage quotas are per-plan and configurable. Reaching a quota blocks *new uploads* but must never break students' access to already-published content (STR-018) — architecturally this means quota enforcement lives entirely in the `storage` module's write path and has no coupling to the `content-gateway` module's read path; a Teacher over quota can still have every existing published reference served normally.

## 13. What this document does not decide

The specific rendering technology for the "protected viewer" (CNT-014 — e.g., a canvas-based PDF renderer vs. server-side image tiling), the video packaging/transcoding pipeline, and the concrete watermark payload format (CNT-015, beyond "identifies user, content, session, time where practical") are implementation decisions for the phases that build the `content-gateway` and video pipeline (Phase 9 per `docs/decisions/03-implementation-roadmap.md`), not Phase 1 architecture.
