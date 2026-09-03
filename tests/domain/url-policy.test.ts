import { describe, expect, it } from 'vitest';

import { assertPublicHttpUrl, assertPublicIpAddress } from '@guild/protocol';

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

  it('rejects private resolved IPv4, IPv6, and IPv4-mapped addresses', () => {
    expect(assertPublicIpAddress('93.184.216.34')).toBe('93.184.216.34');
    expect(assertPublicIpAddress('2606:4700:4700::1111')).toBe('2606:4700:4700::1111');
    for (const address of [
      '10.0.0.1',
      '127.0.0.1',
      '169.254.169.254',
      '192.168.1.2',
      '::',
      '::1',
      'fc00::1',
      'fd00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ]) {
      expect(() => assertPublicIpAddress(address)).toThrow('unsafe_url');
    }
  });
});
