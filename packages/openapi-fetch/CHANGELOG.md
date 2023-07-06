# openapi-fetch

## 0.6.1

### Patch Changes

- [#1192](https://github.com/drwpow/openapi-typescript/pull/1192) [`38ee8b4`](https://github.com/drwpow/openapi-typescript/commit/38ee8b406ecf07e2dece05c4867a0bc5d27c309d) Thanks [@psychedelicious](https://github.com/psychedelicious)! - Fix header handling for FormData

## 0.6.0

### Minor Changes

- [`0380e9a`](https://github.com/drwpow/openapi-typescript/commit/0380e9a572f6edfcc6ca1242b7f11abd8fc24610) Thanks [@drwpow](https://github.com/drwpow)! - Add multipart/form-data request body support

- [`0380e9a`](https://github.com/drwpow/openapi-typescript/commit/0380e9a572f6edfcc6ca1242b7f11abd8fc24610) Thanks [@drwpow](https://github.com/drwpow)! - Breaking: openapi-fetch now just takes the first media type it finds rather than preferring JSON. This is because in the case of `multipart/form-data` vs `application/json`, it’s not inherently clear which you’d want. Or if there were multiple JSON-like media types.

## 0.5.0

### Minor Changes

- [#1183](https://github.com/drwpow/openapi-typescript/pull/1183) [`431a98f`](https://github.com/drwpow/openapi-typescript/commit/431a98f0b6d518aa8e780f063d680d380a8a12dd) Thanks [@psychedelicious](https://github.com/psychedelicious)! - Add global `querySerializer()` option to `createClient()`

### Patch Changes

- [#1186](https://github.com/drwpow/openapi-typescript/pull/1186) [`cd0a653`](https://github.com/drwpow/openapi-typescript/commit/cd0a65354b03fce8a6e28453b8760ac017205df1) Thanks [@drwpow](https://github.com/drwpow)! - Fix CJS build

## 0.4.0

### Minor Changes

- [#1176](https://github.com/drwpow/openapi-typescript/pull/1176) [`21fb484`](https://github.com/drwpow/openapi-typescript/pull/1176/commits/21fb4848f1e70e4423a5f20cae330210b5b813b4) Thanks [@kecrily](https://github.com/kecrily)! - Add CommonJS bundle

## 0.3.0

### Minor Changes

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Expose createFinalURL() logic for testing

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Automatically remove `undefined` and `null` query params without requiring querySerializer

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Allow overriding of JSON body parsing

### Patch Changes

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Clone response internally

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Strip trailing slashes from baseUrl

- [#1169](https://github.com/drwpow/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/drwpow/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Fix querySerializer typing

## 0.2.1

### Patch Changes

- [#1139](https://github.com/drwpow/openapi-typescript/pull/1139) [`30c01fa`](https://github.com/drwpow/openapi-typescript/commit/30c01fa3727a9696166a9bf44dd01693cc354a09) Thanks [@drwpow](https://github.com/drwpow)! - Treat `default` response as error

## 0.2.0

### Minor Changes

- 97c8757: Add custom fetch option (#51). Thanks, [@hd-o](https://github.com/hd-o)!

## 0.1.4

### Patch Changes

- 63ebe48: Fix request body type when optional (#48)

## 0.1.3

### Patch Changes

- 8c01480: Fix querySerializer signature

## 0.1.2

### Patch Changes

- e730cd8: Fix post() and options() types

## 0.1.1

### Patch Changes

- 5d1fb7d: Fix bad HTTP method lookup causing polymorphsim

## 0.1.0

### Minor Changes

- f878cd3: Add querySerializer

### Patch Changes

- 22197a1: Add missing type defs for minified build
- ff3174a: Fix type inference bugs
- 4ce3828: Skip parsing JSON for empty responses (#23)
- ff3ae1b: Skip parsing JSON for 204 responses (#28)

## 0.0.8

### Patch Changes

- 8e7cb46: Fix TypeScript lib error, simplify generated types

## 0.0.7

### Patch Changes

- fce1546: Support "application/json;charset=utf-8" content types (#15). Thanks, [@shinzui](https://github.com/shinzui)!
- 0899e0e: Add minified build (#18)

## 0.0.6

### Patch Changes

- 27c149c: Fix data, error sometimes returning undefined

## 0.0.5

### Patch Changes

- c818e65: Export BaseParams shared type (#8)

## 0.0.4

### Patch Changes

- ce99563: Fix optional requestBody in path

## 0.0.3

### Patch Changes

- b69cb51: Autocomplete URLs by path ([#2](https://github.com/drwpow/openapi-fetch/pull/2)). Thanks, [@mitchell-merry](https://github.com/mitchell-merry)!

## 0.0.2

### Patch Changes

- 5a47464: Fix module entry

## 0.0.1

### Patch Changes

- 55d7013: Encode path params
