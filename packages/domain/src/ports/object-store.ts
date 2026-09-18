/**
 * The `ObjectStore` port — SRS BE-008's portability contract applied to
 * object storage. No domain or service code may import a storage SDK
 * (R2, S3, etc.) directly; everything goes through this interface. The R2
 * adapter (MVP) and the S3-compatible adapter (production) are added when
 * the `storage` module is built (Phase 8) — see `docs/architecture/backend.md`
 * §5 and `docs/architecture/database.md`'s portability directive (A-13).
 */
export interface ObjectStoreKey {
  readonly key: string;
}

export interface ObjectMetadata {
  readonly size: number;
  readonly contentType: string;
  readonly etag: string;
}

export interface ObjectStore {
  put(key: ObjectStoreKey, body: Uint8Array, contentType: string): Promise<ObjectMetadata>;
  get(key: ObjectStoreKey): Promise<Uint8Array | null>;
  head(key: ObjectStoreKey): Promise<ObjectMetadata | null>;
  /** A short-lived, scoped URL — never a durable public link (SRS CNT-013). */
  signedUrl(key: ObjectStoreKey, expiresInSeconds: number): Promise<string>;
  delete(key: ObjectStoreKey): Promise<void>;
  copy(from: ObjectStoreKey, to: ObjectStoreKey): Promise<ObjectMetadata>;
}
