import { describe, expect, it } from 'vitest';

import { assertPublicHttpUrl } from '@guild/protocol';

describe('URL policy', () => {
  it('accepts public HTTPS and rejects private, credentialed, and unsafe URLs', () => {
    expect(assertPublicHttpUrl('https://preview.example.com/home').origin).toBe(
      'https://preview.example.com',
    );
    expect(() => assertPublicHttpUrl('https://user:pass@example.com')).toThrow('unsafe_url');
    expect(() => assertPublicHttpUrl('javascript:alert(1)')).toThrow('unsafe_url');
    expect(() => assertPublicHttpUrl('https://127.0.0.1/admin')).toThrow('unsafe_url');
    expect(() => assertPublicHttpUrl('https://169.254.169.254/latest')).toThrow('unsafe_url');
    expect(() => assertPublicHttpUrl('https://192.168.1.10/app')).toThrow('unsafe_url');
    expect(() => assertPublicHttpUrl('http://localhost:3000/')).toThrow('unsafe_url');
    expect(assertPublicHttpUrl('http://127.0.0.1:4173/', { allowLoopback: true }).port).toBe(
      '4173',
    );
  });
});
