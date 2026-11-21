import { afterEach, describe, expect, it, vi } from 'vitest';
import { uuid } from './uuid';

describe('uuid', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('работает без crypto.randomUUID (http на телефоне)', () => {
    const real = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    expect(globalThis.crypto.randomUUID).toBeUndefined();
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid()).not.toBe(id);
  });
});
