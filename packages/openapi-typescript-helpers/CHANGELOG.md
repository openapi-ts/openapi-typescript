# openapi-typescript-helpers

## 0.1.0

### Minor Changes

- [#2549](https://github.com/openapi-ts/openapi-typescript/pull/2549) [`a690e52`](https://github.com/openapi-ts/openapi-typescript/commit/a690e526b7693479bc2f2f002d71a020fa5e4e16) Thanks [@abumalick](https://github.com/abumalick)! - Add readOnly/writeOnly support via `--read-write-markers` flag. When enabled, readOnly properties are wrapped with `$Read<T>` and writeOnly properties with `$Write<T>`. openapi-fetch uses `Readable<T>` and `Writable<T>` helpers to exclude these properties from responses and request bodies respectively.

## 0.0.15

### Patch Changes

- [#1937](https://github.com/openapi-ts/openapi-typescript/pull/1937) [`06163a2`](https://github.com/openapi-ts/openapi-typescript/commit/06163a2030eaf8d0579f624d86481e1205aef396) Thanks [@DjordyKoert](https://github.com/DjordyKoert)! - client data & error now return a union of possible types

## 0.0.14

### Patch Changes

- [#1948](https://github.com/openapi-ts/openapi-typescript/pull/1948) [`abfad56`](https://github.com/openapi-ts/openapi-typescript/commit/abfad5659183f95f705598dc52ae2dfe7a18ec04) Thanks [@piousdeer](https://github.com/piousdeer)! - fix SuccessResponseJSON, ErrorResponseJSON and RequestBodyJSON helpers

## 0.0.13

### Patch Changes

- [#1871](https://github.com/openapi-ts/openapi-typescript/pull/1871) [`bd88568`](https://github.com/openapi-ts/openapi-typescript/commit/bd8856854eaaf213b96d04b9eb130db1695bb1f1) Thanks [@brunolca](https://github.com/brunolca)! - fix SuccessResponseJSON and ErrorResponseJSON helpers

## 0.0.12

### Patch Changes

- [#1833](https://github.com/openapi-ts/openapi-typescript/pull/1833) [`cec023d`](https://github.com/openapi-ts/openapi-typescript/commit/cec023d3461c79ca355a88366949d0f6382e4e2a) Thanks [@ngraef](https://github.com/ngraef)! - Fix identification of required properties when `strictNullChecks` is disabled

## 0.0.11

### Patch Changes

- [#1788](https://github.com/openapi-ts/openapi-typescript/pull/1788) [`bcc9222`](https://github.com/openapi-ts/openapi-typescript/commit/bcc92223c83ba074316e17534a173fee8da9cd41) Thanks [@yukukotani](https://github.com/yukukotani)! - keep index.d.cts in npm distribution

## 0.0.10

### Patch Changes

- [#1717](https://github.com/openapi-ts/openapi-typescript/pull/1717) [`335530c`](https://github.com/openapi-ts/openapi-typescript/commit/335530c4f8f966d0154f19504585c462f5f5a409) Thanks [@kerwanp](https://github.com/kerwanp)! - Ignore configuration files in published package

## 0.0.9

### Patch Changes

- Improved handling of `SuccessResponse<T>` and `ErrorResponse<T>`
- Changed handling of `ErrorResponse<T>` to produce one and only one error type (rather than an impossible union)

## 0.0.8

### Patch Changes

- [#1610](https://github.com/openapi-ts/openapi-typescript/pull/1610) [`cc8073b`](https://github.com/openapi-ts/openapi-typescript/commit/cc8073b3ee42e7aaa546a9c6a0553c300d8882de) Thanks [@illright](https://github.com/illright)! - Fix data/error discrimination when there are empty-body errors

- [#1559](https://github.com/openapi-ts/openapi-typescript/pull/1559) [`6fe2c85`](https://github.com/openapi-ts/openapi-typescript/commit/6fe2c856331e910b9c8376fc151d63028dcfba11) Thanks [@drwpow](https://github.com/drwpow)! - Simplify build

## 0.0.7

### Patch Changes

- [#1479](https://github.com/openapi-ts/openapi-typescript/pull/1479) [`c6d945b`](https://github.com/openapi-ts/openapi-typescript/commit/c6d945be717bb3999178fb3a77292e41e1b7ab80) Thanks [@darwish](https://github.com/darwish)! - Fixed build of openapi-typescript-helpers for CommonJS environments

## 0.0.6

### Patch Changes

- [#1458](https://github.com/openapi-ts/openapi-typescript/pull/1458) [`23517a2`](https://github.com/openapi-ts/openapi-typescript/commit/23517a2c2ab94d49085391130cd7d11f4da33cfb) Thanks [@drwpow](https://github.com/drwpow)! - Add RequestBodyJSON helper

## 0.0.5

### Patch Changes

- [#1456](https://github.com/openapi-ts/openapi-typescript/pull/1456) [`5be2082`](https://github.com/openapi-ts/openapi-typescript/commit/5be20827334c60e53222445561b9cfc526f4f6a9) Thanks [@drwpow](https://github.com/drwpow)! - Add SuccessResponseJSON, ErrorResponseJSON helpers

## 0.0.4

### Patch Changes

- [#1366](https://github.com/openapi-ts/openapi-typescript/pull/1366) [`04dbd6d`](https://github.com/openapi-ts/openapi-typescript/commit/04dbd6d84fffd1d88300421bae25e946f1c303da) Thanks [@drwpow](https://github.com/drwpow)! - Add HasRequiredKeys<T> helper

## 0.0.3

### Patch Changes

- [#1357](https://github.com/openapi-ts/openapi-typescript/pull/1357) [`996e51e`](https://github.com/openapi-ts/openapi-typescript/commit/996e51e9b475f4818af77301ed5c0ab458736cb9) Thanks [@muttonchop](https://github.com/muttonchop)! - adds 500-511 error status codes

## 0.0.2

### Patch Changes

- [#1326](https://github.com/openapi-ts/openapi-typescript/pull/1326) [`e63a345`](https://github.com/openapi-ts/openapi-typescript/commit/e63a34561c8137c4cfdef858a2272be32960ca4f) Thanks [@drwpow](https://github.com/drwpow)! - Fix type bug

## 0.0.0

Initial release
