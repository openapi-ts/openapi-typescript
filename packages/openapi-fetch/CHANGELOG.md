# openapi-fetch

## 0.9.8

### Patch Changes

- [#1697](https://github.com/openapi-ts/openapi-typescript/pull/1697) [`e77ce50`](https://github.com/openapi-ts/openapi-typescript/commit/e77ce501e479f54fb783c19b99fa7a53a894732c) Thanks [@armandabric](https://github.com/armandabric)! - Expose original request on Middleware.onResponse

## 0.9.7

### Patch Changes

- [#1672](https://github.com/openapi-ts/openapi-typescript/pull/1672) [`64cb619`](https://github.com/openapi-ts/openapi-typescript/commit/64cb6193ddd94523636fd55ba308117f2614a2e2) Thanks [@jaredLunde](https://github.com/jaredLunde)! - Fixes issue where native properties were not excluded from custom properties in the CustomRequest class

## 0.9.6

### Patch Changes

- [#1653](https://github.com/openapi-ts/openapi-typescript/pull/1653) [`4f4253a`](https://github.com/openapi-ts/openapi-typescript/commit/4f4253a031820a664499b9df7ed5c8b192aa98b3) Thanks [@FreeAoi](https://github.com/FreeAoi)! - Let request object have custom properties

## 0.9.5

### Patch Changes

- [#1639](https://github.com/openapi-ts/openapi-typescript/pull/1639) [`645f436`](https://github.com/openapi-ts/openapi-typescript/commit/645f4366d2907b05eee1e6ec33d13edab8614fa1) Thanks [@FreeAoi](https://github.com/FreeAoi)! - fix request option types don't showing optional props correctly

## 0.9.4

### Patch Changes

- [#1597](https://github.com/openapi-ts/openapi-typescript/pull/1597) [`1f7ad9d`](https://github.com/openapi-ts/openapi-typescript/commit/1f7ad9d41f1f1ca7b1195a381c907393f9ef743b) Thanks [@armandabric](https://github.com/armandabric)! - Allow to select the response content type

- [#1585](https://github.com/openapi-ts/openapi-typescript/pull/1585) [`4e06f86`](https://github.com/openapi-ts/openapi-typescript/commit/4e06f86934e11f3dbc3aabee4b4e61dd62680782) Thanks [@mikestopcontinues](https://github.com/mikestopcontinues)! - Update types for path-methods object

- [#1610](https://github.com/openapi-ts/openapi-typescript/pull/1610) [`cc8073b`](https://github.com/openapi-ts/openapi-typescript/commit/cc8073b3ee42e7aaa546a9c6a0553c300d8882de) Thanks [@illright](https://github.com/illright)! - Fix data/error discrimination when there are empty-body errors

- [#1587](https://github.com/openapi-ts/openapi-typescript/pull/1587) [`2a66a64`](https://github.com/openapi-ts/openapi-typescript/commit/2a66a6483d755a090e57a457b22eb99696da098a) Thanks [@JE-lee](https://github.com/JE-lee)! - Fix the custom fetch type

## 0.9.3

### Patch Changes

- [#1580](https://github.com/openapi-ts/openapi-typescript/pull/1580) [`4c0c7fc`](https://github.com/openapi-ts/openapi-typescript/commit/4c0c7fc69dc6416dcf1fea785455bce8b9742704) Thanks [@drwpow](https://github.com/drwpow)! - Fix type errors

## 0.9.2

### Patch Changes

- [#1550](https://github.com/openapi-ts/openapi-typescript/pull/1550) [`a5a9cc7`](https://github.com/openapi-ts/openapi-typescript/commit/a5a9cc766f893fd93500a5a1ff909746194bfdc7) Thanks [@shirish87](https://github.com/shirish87)! - Fix 'Content-Type' header being removed from requests with multipart/form-data body

## 0.9.1

### Patch Changes

- [#1546](https://github.com/openapi-ts/openapi-typescript/pull/1546) [`cc64453`](https://github.com/openapi-ts/openapi-typescript/commit/cc64453c7f92c77c19bc45dc0f701a98ab461b16) Thanks [@drwpow](https://github.com/drwpow)! - Fix JSON consuming body

## 0.9.0

### Minor Changes

- [#1521](https://github.com/openapi-ts/openapi-typescript/pull/1521) [`b174dd6`](https://github.com/openapi-ts/openapi-typescript/commit/b174dd6a7668e2f1f6bf6bd086ba2dabf7fb669e) Thanks [@drwpow](https://github.com/drwpow)! - Add middleware support

- [#1521](https://github.com/openapi-ts/openapi-typescript/pull/1521) [`fc3a468`](https://github.com/openapi-ts/openapi-typescript/commit/fc3a468c4342e17d203712be358b30a3fb82ab1e) Thanks [@drwpow](https://github.com/drwpow)! - ⚠️ Breaking change (internal): fetch() is now called with new Request() to support middleware (which may affect test mocking)

- [#1521](https://github.com/openapi-ts/openapi-typescript/pull/1521) [`2551e4b`](https://github.com/openapi-ts/openapi-typescript/commit/2551e4bde41d5437a76c13bb5ba25ede4f14db10) Thanks [@drwpow](https://github.com/drwpow)! - ⚠️ **Breaking change**: Responses are no longer automatically `.clone()`’d in certain instances. Be sure to `.clone()` yourself if you need to access the raw body!

- [#1534](https://github.com/openapi-ts/openapi-typescript/pull/1534) [`2bbeb92`](https://github.com/openapi-ts/openapi-typescript/commit/2bbeb92244cb82a534abb016ffb5fbd1255d9db5) Thanks [@drwpow](https://github.com/drwpow)! - ⚠️ Breaking change: no longer supports deeply-nested objects/arrays for query & path serialization.

### Patch Changes

- [#1484](https://github.com/openapi-ts/openapi-typescript/pull/1484) [`49bbd72`](https://github.com/openapi-ts/openapi-typescript/commit/49bbd72800f7bc6c460a741c50d11eb216746290) Thanks [@drwpow](https://github.com/drwpow)! - Remove prepare script

- [#1479](https://github.com/openapi-ts/openapi-typescript/pull/1479) [`c6d945b`](https://github.com/openapi-ts/openapi-typescript/commit/c6d945be717bb3999178fb3a77292e41e1b7ab80) Thanks [@darwish](https://github.com/darwish)! - Fixed build of openapi-typescript-helpers for CommonJS environments

- [#1534](https://github.com/openapi-ts/openapi-typescript/pull/1534) [`2bbeb92`](https://github.com/openapi-ts/openapi-typescript/commit/2bbeb92244cb82a534abb016ffb5fbd1255d9db5) Thanks [@drwpow](https://github.com/drwpow)! - Add support for automatic label & matrix path serialization.

- [#1521](https://github.com/openapi-ts/openapi-typescript/pull/1521) [`fd44bd2`](https://github.com/openapi-ts/openapi-typescript/commit/fd44bd28d881715e30f5a71435f05f6bae13859d) Thanks [@drwpow](https://github.com/drwpow)! - Support arrays in headers

- [#1534](https://github.com/openapi-ts/openapi-typescript/pull/1534) [`2bbeb92`](https://github.com/openapi-ts/openapi-typescript/commit/2bbeb92244cb82a534abb016ffb5fbd1255d9db5) Thanks [@drwpow](https://github.com/drwpow)! - Remove leading question marks from querySerializer

- [#1530](https://github.com/openapi-ts/openapi-typescript/pull/1530) [`4765658`](https://github.com/openapi-ts/openapi-typescript/commit/4765658460e0850d005e3f08cd63c4949326349b) Thanks [@wydengyre](https://github.com/wydengyre)! - Exports the ClientMethod utility type.

- Updated dependencies [[`c6d945b`](https://github.com/openapi-ts/openapi-typescript/commit/c6d945be717bb3999178fb3a77292e41e1b7ab80)]:
  - openapi-typescript-helpers@0.0.7

## 0.8.2

### Patch Changes

- [#1424](https://github.com/openapi-ts/openapi-typescript/pull/1424) [`8f5adb3`](https://github.com/openapi-ts/openapi-typescript/commit/8f5adb3700eacff287d8b3f62837cb823503d5a4) Thanks [@drwpow](https://github.com/drwpow)! - Separate TS types to be managed manually

- Updated dependencies [[`5be2082`](https://github.com/openapi-ts/openapi-typescript/commit/5be20827334c60e53222445561b9cfc526f4f6a9)]:
  - openapi-typescript-helpers@0.0.5

## 0.8.1

### Patch Changes

- [#1404](https://github.com/openapi-ts/openapi-typescript/pull/1404) [`93204e4`](https://github.com/openapi-ts/openapi-typescript/commit/93204e4de1b6e0469fdc8b710f5b279671570a9a) Thanks [@drwpow](https://github.com/drwpow)! - Fix behavior for empty arrays and objects in default `querySerializer`

## 0.8.0

### Minor Changes

- [#1399](https://github.com/openapi-ts/openapi-typescript/pull/1399) [`4fca1e4`](https://github.com/openapi-ts/openapi-typescript/commit/4fca1e477f524223fa8921559caef6bb364dc194) Thanks [@drwpow](https://github.com/drwpow)! - ⚠️ **Breaking**: change default querySerializer behavior to produce `style: form`, `explode: true` query params [according to the OpenAPI specification](https://swagger.io/docs/specification/serialization/#query). Also adds support for `deepObject`s (square bracket style).

## 0.7.10

### Patch Changes

- [#1373](https://github.com/openapi-ts/openapi-typescript/pull/1373) [`fd3e96f`](https://github.com/openapi-ts/openapi-typescript/commit/fd3e96fb2e68a0d58b326331264809e76ca89672) Thanks [@HugeLetters](https://github.com/HugeLetters)! - Added the option to provide custom fetch function to individual API calls.

## 0.7.9

### Patch Changes

- [#1366](https://github.com/openapi-ts/openapi-typescript/pull/1366) [`04dbd6d`](https://github.com/openapi-ts/openapi-typescript/commit/04dbd6d84fffd1d88300421bae25e946f1c303da) Thanks [@drwpow](https://github.com/drwpow)! - Fix empty object being required param

- Updated dependencies [[`04dbd6d`](https://github.com/openapi-ts/openapi-typescript/commit/04dbd6d84fffd1d88300421bae25e946f1c303da)]:
  - openapi-typescript-helpers@0.0.4

## 0.7.8

### Patch Changes

- [#1360](https://github.com/openapi-ts/openapi-typescript/pull/1360) [`b59e431`](https://github.com/openapi-ts/openapi-typescript/commit/b59e431d1876d1cc60dda5e9b59b6185b0136437) Thanks [@marcomuser](https://github.com/marcomuser)! - Fix CJS build for TypeScript

## 0.7.7

### Patch Changes

- Updated dependencies [[`996e51e`](https://github.com/openapi-ts/openapi-typescript/commit/996e51e9b475f4818af77301ed5c0ab458736cb9)]:
  - openapi-typescript-helpers@0.0.3

## 0.7.6

### Patch Changes

- [#1332](https://github.com/openapi-ts/openapi-typescript/pull/1332) [`8e8ebfd`](https://github.com/openapi-ts/openapi-typescript/commit/8e8ebfdcd84ff6a3d7b6f5d00695fc11366b436e) Thanks [@drwpow](https://github.com/drwpow)! - Restore original .d.ts module-resolution behavior

## 0.7.5

### Patch Changes

- Updated dependencies [[`e63a345`](https://github.com/openapi-ts/openapi-typescript/commit/e63a34561c8137c4cfdef858a2272be32960ca4f)]:
  - openapi-typescript-helpers@0.0.2

## 0.7.4

### Patch Changes

- [#1314](https://github.com/openapi-ts/openapi-typescript/pull/1314) [`181c4de`](https://github.com/openapi-ts/openapi-typescript/commit/181c4de395e9c337937f61d6dd5e0ba47954d893) Thanks [@drwpow](https://github.com/drwpow)! - Make headers typing friendlier

- [#1314](https://github.com/openapi-ts/openapi-typescript/pull/1314) [`181c4de`](https://github.com/openapi-ts/openapi-typescript/commit/181c4de395e9c337937f61d6dd5e0ba47954d893) Thanks [@drwpow](https://github.com/drwpow)! - Allow unsetting headers

## 0.7.3

### Patch Changes

- [#1300](https://github.com/openapi-ts/openapi-typescript/pull/1300) [`5939e20`](https://github.com/openapi-ts/openapi-typescript/commit/5939e20b86ca3019cbc0a1c7f6de2b15a806cf72) Thanks [@drwpow](https://github.com/drwpow)! - Use openapi-typescript-helpers package for types

## 0.7.2

### Patch Changes

- [#1242](https://github.com/openapi-ts/openapi-typescript/pull/1242) [`8d11701`](https://github.com/openapi-ts/openapi-typescript/commit/8d11701deb22d47bc8ef04b6210ea6722ecb461b) Thanks [@drwpow](https://github.com/drwpow)! - Fix impossible body typing

## 0.7.1

### Patch Changes

- [#1251](https://github.com/openapi-ts/openapi-typescript/pull/1251) [`80717a7`](https://github.com/openapi-ts/openapi-typescript/commit/80717a75ad20f2224a9a61d2a5b3d2b2bbd7c78b) Thanks [@drwpow](https://github.com/drwpow)! - Fix 2XX, 4XX, 5XX responses

## 0.7.0

### Minor Changes

- [#1243](https://github.com/openapi-ts/openapi-typescript/pull/1243) [`541abf4`](https://github.com/openapi-ts/openapi-typescript/commit/541abf4966cf6020de5e4bf4b93cfa9741ec9a00) Thanks [@drwpow](https://github.com/drwpow)! - ⚠️ Breaking: rename all methods to UPPERCASE (`GET()`, `POST()`, etc.)

## 0.6.2

### Patch Changes

- [#1239](https://github.com/openapi-ts/openapi-typescript/pull/1239) [`4c93067`](https://github.com/openapi-ts/openapi-typescript/commit/4c9306720daa65b1c1977030737a52121fd46668) Thanks [@drwpow](https://github.com/drwpow)! - Fix params.header inference

## 0.6.1

### Patch Changes

- [#1192](https://github.com/openapi-ts/openapi-typescript/pull/1192) [`38ee8b4`](https://github.com/openapi-ts/openapi-typescript/commit/38ee8b406ecf07e2dece05c4867a0bc5d27c309d) Thanks [@psychedelicious](https://github.com/psychedelicious)! - Fix header handling for FormData

## 0.6.0

### Minor Changes

- [`0380e9a`](https://github.com/openapi-ts/openapi-typescript/commit/0380e9a572f6edfcc6ca1242b7f11abd8fc24610) Thanks [@drwpow](https://github.com/drwpow)! - Add multipart/form-data request body support

- [`0380e9a`](https://github.com/openapi-ts/openapi-typescript/commit/0380e9a572f6edfcc6ca1242b7f11abd8fc24610) Thanks [@drwpow](https://github.com/drwpow)! - Breaking: openapi-fetch now just takes the first media type it finds rather than preferring JSON. This is because in the case of `multipart/form-data` vs `application/json`, it’s not inherently clear which you’d want. Or if there were multiple JSON-like media types.

## 0.5.0

### Minor Changes

- [#1183](https://github.com/openapi-ts/openapi-typescript/pull/1183) [`431a98f`](https://github.com/openapi-ts/openapi-typescript/commit/431a98f0b6d518aa8e780f063d680d380a8a12dd) Thanks [@psychedelicious](https://github.com/psychedelicious)! - Add global `querySerializer()` option to `createClient()`

### Patch Changes

- [#1186](https://github.com/openapi-ts/openapi-typescript/pull/1186) [`cd0a653`](https://github.com/openapi-ts/openapi-typescript/commit/cd0a65354b03fce8a6e28453b8760ac017205df1) Thanks [@drwpow](https://github.com/drwpow)! - Fix CJS build

## 0.4.0

### Minor Changes

- [#1176](https://github.com/openapi-ts/openapi-typescript/pull/1176) [`21fb484`](https://github.com/openapi-ts/openapi-typescript/pull/1176/commits/21fb4848f1e70e4423a5f20cae330210b5b813b4) Thanks [@kecrily](https://github.com/kecrily)! - Add CommonJS bundle

## 0.3.0

### Minor Changes

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Expose createFinalURL() logic for testing

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Automatically remove `undefined` and `null` query params without requiring querySerializer

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Allow overriding of JSON body parsing

### Patch Changes

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Clone response internally

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Strip trailing slashes from baseUrl

- [#1169](https://github.com/openapi-ts/openapi-typescript/pull/1169) [`74bfc0d`](https://github.com/openapi-ts/openapi-typescript/commit/74bfc0d879747790aed7942e11f4b277b9b0428d) Thanks [@drwpow](https://github.com/drwpow)! - Fix querySerializer typing

## 0.2.1

### Patch Changes

- [#1139](https://github.com/openapi-ts/openapi-typescript/pull/1139) [`30c01fa`](https://github.com/openapi-ts/openapi-typescript/commit/30c01fa3727a9696166a9bf44dd01693cc354a09) Thanks [@drwpow](https://github.com/drwpow)! - Treat `default` response as error

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
