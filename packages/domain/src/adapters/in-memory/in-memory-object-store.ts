import type { ObjectMetadata, ObjectStore, ObjectStoreKey } from "../../ports/object-store.js";

/**
 * A dependency-free `ObjectStore` implementation for unit tests and local
 * development. Not a production adapter — it holds bytes in process memory.
 * Its purpose here is to prove the port's shape is implementable by more
 * than one backend before the R2/S3 adapters exist (BE-008).
 */
export class InMemoryObjectStore implements ObjectStore {
  private readonly objects = new Map<string, { body: Uint8Array; contentType: string }>();

  async put(key: ObjectStoreKey, body: Uint8Array, contentType: string): Promise<ObjectMetadata> {
    this.objects.set(key.key, { body, contentType });
    return this.metadataFor(key, body, contentType);
  }

  async get(key: ObjectStoreKey): Promise<Uint8Array | null> {
    return this.objects.get(key.key)?.body ?? null;
  }

  async head(key: ObjectStoreKey): Promise<ObjectMetadata | null> {
    const entry = this.objects.get(key.key);
    return entry ? this.metadataFor(key, entry.body, entry.contentType) : null;
  }

  async signedUrl(key: ObjectStoreKey, expiresInSeconds: number): Promise<string> {
    const expires = Date.now() + expiresInSeconds * 1000;
    return `memory://${encodeURIComponent(key.key)}?expires=${expires}`;
  }

  async delete(key: ObjectStoreKey): Promise<void> {
    this.objects.delete(key.key);
  }

  async copy(from: ObjectStoreKey, to: ObjectStoreKey): Promise<ObjectMetadata> {
    const entry = this.objects.get(from.key);
    if (!entry) {
      throw new Error(`Object not found: ${from.key}`);
    }
    this.objects.set(to.key, entry);
    return this.metadataFor(to, entry.body, entry.contentType);
  }

  private metadataFor(key: ObjectStoreKey, body: Uint8Array, contentType: string): ObjectMetadata {
    return { size: body.byteLength, contentType, etag: `${key.key}:${body.byteLength}` };
  }
}
