# openapi-react-query

## 0.5.5

### Patch Changes

- [#1950](https://github.com/openapi-ts/openapi-typescript/pull/1950) [`ac9d082`](https://github.com/openapi-ts/openapi-typescript/commit/ac9d0821aba779b8effc6cf71efb0583cfaaaad6) Thanks [@freshgiammi](https://github.com/freshgiammi)! - Tag generated querykeys with `DataTag`, allowing us to infer the return type (data/error) associated with a given queryKey, making methods like `queryClient.setQueryData()` type-safe.

- Updated dependencies [[`b775891`](https://github.com/openapi-ts/openapi-typescript/commit/b775891e2ac748aeab4cb3106c1df44a0b7ddf30)]:
  - openapi-fetch@0.17.1

## 0.5.4

### Patch Changes

- Updated dependencies [[`9350ddf`](https://github.com/openapi-ts/openapi-typescript/commit/9350ddfcd44b661a5288667ebfcf298868dd9784), [`a690e52`](https://github.com/openapi-ts/openapi-typescript/commit/a690e526b7693479bc2f2f002d71a020fa5e4e16)]:
  - openapi-fetch@0.17.0
  - openapi-typescript-helpers@0.1.0

## 0.5.3

### Patch Changes

- Updated dependencies [[`9002418`](https://github.com/openapi-ts/openapi-typescript/commit/90024185c7a251b5dbedd148e4eb5d15b95409c8)]:
  - openapi-fetch@0.16.0

## 0.5.2

### Patch Changes

- [#2519](https://github.com/openapi-ts/openapi-typescript/pull/2519) [`681ac87`](https://github.com/openapi-ts/openapi-typescript/commit/681ac876c4c5c20ad27c43b0960aabdbc247c59a) Thanks [@sacha-c](https://github.com/sacha-c)! - fixes mutation results type

## 0.5.1

### Patch Changes

- Updated dependencies [[`8f96eb5`](https://github.com/openapi-ts/openapi-typescript/commit/8f96eb50f5ec060e2e9100e9a43d3fe98e9795c5)]:
  - openapi-fetch@0.15.0

## 0.5.0

### Minor Changes

- [#2310](https://github.com/openapi-ts/openapi-typescript/pull/2310) [`e66b5ce`](https://github.com/openapi-ts/openapi-typescript/commit/e66b5ce63bfcdc57c6ee942e5ed4e7667e64c290) Thanks [@drwpow](https://github.com/drwpow)! - Build package with unbuild to improve CJS support

### Patch Changes

- Updated dependencies [[`e66b5ce`](https://github.com/openapi-ts/openapi-typescript/commit/e66b5ce63bfcdc57c6ee942e5ed4e7667e64c290)]:
  - openapi-fetch@0.14.0

## 0.4.2

### Patch Changes

- [#2235](https://github.com/openapi-ts/openapi-typescript/pull/2235) [`694522a`](https://github.com/openapi-ts/openapi-typescript/commit/694522a7ccf90767e9de29c786794f8ddcbc08bd) Thanks [@wheelebin](https://github.com/wheelebin)! - React query handle 204 or zero content length
- Updated dependencies [[`81c031d`](https://github.com/openapi-ts/openapi-typescript/commit/81c031da8584ed49b033ebfc67bbb3e1ca258699)]:
  - openapi-fetch@0.13.8

## 0.4.1

### Patch Changes

- Updated dependencies [[`30c6da8`](https://github.com/openapi-ts/openapi-typescript/commit/30c6da800a00bda87da66dea6d04807e1379f06a)]:
  - openapi-fetch@0.13.7

## 0.4.0

### Minor Changes

- [#2169](https://github.com/openapi-ts/openapi-typescript/pull/2169) [`a76801c`](https://github.com/openapi-ts/openapi-typescript/commit/a76801cdc04fe9d2c28756a050861c6e673aa325) Thanks [@awmichel](https://github.com/awmichel)! - [#2169](https://github.com/openapi-ts/openapi-typescript/pull/2169): Infer returned `data` type from `select` option when used with the `useInfiniteQuery` method.

## 0.3.2

### Patch Changes

- Updated dependencies [[`4966560`](https://github.com/openapi-ts/openapi-typescript/commit/4966560790ad49fabb06d718115a82a779a5b74a)]:
  - openapi-fetch@0.13.6

## 0.3.1

### Patch Changes

- Updated dependencies [[`ebe56f3`](https://github.com/openapi-ts/openapi-typescript/commit/ebe56f337561bfdd1bf1abdc56ba3d2f48c4d393)]:
  - openapi-fetch@0.13.5

## 0.3.0

### Minor Changes

- [#1881](https://github.com/openapi-ts/openapi-typescript/pull/1881) [`ccbc2e3`](https://github.com/openapi-ts/openapi-typescript/commit/ccbc2e3f68ced4d3038b9003064fe449925b55dc), [#2117](https://github.com/openapi-ts/openapi-typescript/pull/2117) [`3ef38b8`](https://github.com/openapi-ts/openapi-typescript/commit/3ef38b8b9371bc2a2ade202a6dc864b765446305) Thanks [@jungwoo3490](https://github.com/jungwoo3490), [@lukasedw](https://github.com/lukasedw)! - Implements useInfiniteQuery() in openapi-react-query

### Patch Changes

- [#2120](https://github.com/openapi-ts/openapi-typescript/pull/2120) [`efea325`](https://github.com/openapi-ts/openapi-typescript/commit/efea32521ffa1557547a0000051cc73157be5a61) Thanks [@drwpow](https://github.com/drwpow)! - Fix minor type error with latest version of TanStack Query

- [#2061](https://github.com/openapi-ts/openapi-typescript/pull/2061) [`6871e73`](https://github.com/openapi-ts/openapi-typescript/commit/6871e73b4c004560ba514d19c0f1f948ba63f5c8) Thanks [@kevmo314](https://github.com/kevmo314)! - Drop init argument when not needed in query key

- [#2114](https://github.com/openapi-ts/openapi-typescript/pull/2114) [`0c35b32`](https://github.com/openapi-ts/openapi-typescript/commit/0c35b321778afe0705d7fd7a8375c4e10d5f95c2) Thanks [@kerwanp](https://github.com/kerwanp)! - [#2098](https://github.com/openapi-ts/openapi-typescript/pull/2098): Fix CJS type issues by pointing to proper d.ts file

- [#1945](https://github.com/openapi-ts/openapi-typescript/pull/1945) [`248195d`](https://github.com/openapi-ts/openapi-typescript/commit/248195df11f186e379005d487ad9113c3bdd32a9) Thanks [@freshgiammi](https://github.com/freshgiammi)! - Add MethodResponse to get the return type of an endpoint from an `OpenapiQueryClient` client.

- Updated dependencies []:
  - openapi-fetch@0.13.4

## 0.2.10

### Patch Changes

- [#2105](https://github.com/openapi-ts/openapi-typescript/pull/2105) [`af0e72f`](https://github.com/openapi-ts/openapi-typescript/commit/af0e72f16f1515f2953a719d7f58c76ec27637ea) Thanks [@HagenMorano](https://github.com/HagenMorano)! - [#1845](https://github.com/openapi-ts/openapi-typescript/pull/2105): The return value of the `select` property is now considered when inferring the `data` type.

## 0.2.9

### Patch Changes

- Updated dependencies [[`5935cd2`](https://github.com/openapi-ts/openapi-typescript/commit/5935cd25a05d3ec1f4c8bf222d65395a0b9ae5b4)]:
  - openapi-fetch@0.13.4

## 0.2.8

### Patch Changes

Refresh of 0.2.7; corrupted package

## 0.2.7

### Patch Changes

- Updated dependencies [[`7081842`](https://github.com/openapi-ts/openapi-typescript/commit/70818420c1cd6ca2ad2529bf2d7936bd01f3ef42)]:
  - openapi-fetch@0.13.2

## 0.2.6

### Patch Changes

- Updated dependencies [[`35c576c`](https://github.com/openapi-ts/openapi-typescript/commit/35c576c8b2852f66e641014d13ffcfdeb21e98a1)]:
  - openapi-fetch@0.13.1

## 0.2.5

### Patch Changes

- [#1975](https://github.com/openapi-ts/openapi-typescript/pull/1975) [`621792f`](https://github.com/openapi-ts/openapi-typescript/commit/621792f23b0b8830949f3c1e25fe480557016b9a) Thanks [@HugeLetters](https://github.com/HugeLetters)! - - Fixed empty value check in queryFn: only throws error for undefined, other falsy values are allowed
  - Fixed empty value check in mutationFn: allow falsy values

## 0.2.4

### Patch Changes

- [#1952](https://github.com/openapi-ts/openapi-typescript/pull/1952) [`455b735`](https://github.com/openapi-ts/openapi-typescript/commit/455b73527c788918d665a3d607e8ac240a4e5e52) Thanks [@zsugabubus](https://github.com/zsugabubus)! - Fix return type inference for `queryOptions()` when used inside `useQuery` or `useSuspenseQuery`.

- [#1952](https://github.com/openapi-ts/openapi-typescript/pull/1952) [`455b735`](https://github.com/openapi-ts/openapi-typescript/commit/455b73527c788918d665a3d607e8ac240a4e5e52) Thanks [@zsugabubus](https://github.com/zsugabubus)! - Narrow `queryFn` returned by `queryOptions()` to be a function.

## 0.2.3

### Patch Changes

- Updated dependencies [[`06163a2`](https://github.com/openapi-ts/openapi-typescript/commit/06163a2030eaf8d0579f624d86481e1205aef396)]:
  - openapi-typescript-helpers@0.0.15
  - openapi-fetch@0.12.5

## 0.2.2

### Patch Changes

- Updated dependencies [[`abfad56`](https://github.com/openapi-ts/openapi-typescript/commit/abfad5659183f95f705598dc52ae2dfe7a18ec04)]:
  - openapi-typescript-helpers@0.0.14
  - openapi-fetch@0.12.4

## 0.2.1

### Patch Changes

- Updated dependencies [[`d14aa65`](https://github.com/openapi-ts/openapi-typescript/commit/d14aa65207b8abd1f369965bbd32ebb581e8d741)]:
  - openapi-fetch@0.12.3

## 0.2.0

### Minor Changes

- [#1858](https://github.com/openapi-ts/openapi-typescript/pull/1858) [`29bd162`](https://github.com/openapi-ts/openapi-typescript/commit/29bd162dccf441abbb33f07c6158410fd81a85d7) Thanks [@zsugabubus](https://github.com/zsugabubus)! - Introduce `queryOptions` that can be used as a building block to integrate with `useQueries`/`fetchQueries`/`prefetchQueries`… etc.

## 0.1.7

### Patch Changes

- Updated dependencies [[`e39d11e`](https://github.com/openapi-ts/openapi-typescript/commit/e39d11e5ac4e7f5fc2ce81e8a6d7792f91a6551a)]:
  - openapi-fetch@0.12.2

## 0.1.6

### Patch Changes

- Updated dependencies [[`efaa1e2`](https://github.com/openapi-ts/openapi-typescript/commit/efaa1e23b9cb0901fe026e48fbb4b347f0c95507)]:
  - openapi-fetch@0.12.1

## 0.1.5

### Patch Changes

- [#1864](https://github.com/openapi-ts/openapi-typescript/pull/1864) [`899b157`](https://github.com/openapi-ts/openapi-typescript/commit/899b1575968334bc55aa402ea1419bc5db801391) Thanks [@zsugabubus](https://github.com/zsugabubus)! - Pass down signal to fetch function this way `useQuery` and `useSuspenseQuery` can cancel queries.

- Updated dependencies []:
  - openapi-fetch@0.12.0

## 0.1.4

### Patch Changes

- Updated dependencies [[`b893c44`](https://github.com/openapi-ts/openapi-typescript/commit/b893c44f4290917f24c2ef7cda106c540df9cb3d)]:
  - openapi-fetch@0.12.0

## 0.1.3

### Patch Changes

- Updated dependencies [[`2a4b067`](https://github.com/openapi-ts/openapi-typescript/commit/2a4b067f43f7e0b75aecbf5c2fb3013a4e96e591), [`0e42cbb`](https://github.com/openapi-ts/openapi-typescript/commit/0e42cbb98e2a023c33685de65ab0b8dbf82cc4b3)]:
  - openapi-fetch@0.11.2

## 0.1.2

### Patch Changes

- [#1833](https://github.com/openapi-ts/openapi-typescript/pull/1833) [`cec023d`](https://github.com/openapi-ts/openapi-typescript/commit/cec023d3461c79ca355a88366949d0f6382e4e2a) Thanks [@ngraef](https://github.com/ngraef)! - Fix identification of required properties when `strictNullChecks` is disabled

- Updated dependencies [[`091e71a`](https://github.com/openapi-ts/openapi-typescript/commit/091e71ad4bf805be32261a53524f320c2fa42690), [`cec023d`](https://github.com/openapi-ts/openapi-typescript/commit/cec023d3461c79ca355a88366949d0f6382e4e2a)]:
  - openapi-fetch@0.11.1
  - openapi-typescript-helpers@0.0.12

## 0.1.1

### Patch Changes

- Updated dependencies [[`a956d5d`](https://github.com/openapi-ts/openapi-typescript/commit/a956d5d8480834402536283ee2f24ce8086698dc)]:
  - openapi-fetch@0.11.0

## 0.1.0

### Minor Changes

- [#1814](https://github.com/openapi-ts/openapi-typescript/pull/1814) [`2a044d0`](https://github.com/openapi-ts/openapi-typescript/commit/2a044d029ec089e391703a4cdc1340f3b5c1b543) Thanks [@yoshi2no](https://github.com/yoshi2no)! - feat: Allow passing a queryClient as an argument to the `useQuery`, `useMutation`, and `useSuspenseQuery` methods

### Patch Changes

- Updated dependencies [[`f21c05b`](https://github.com/openapi-ts/openapi-typescript/commit/f21c05b9afcc89ee6ef73edab4045620b410eb01), [`ba0d595`](https://github.com/openapi-ts/openapi-typescript/commit/ba0d595556661053b5ef310afafec4fcc116e206)]:
  - openapi-fetch@0.10.6

## 0.0.3

### Patch Changes

- Updated dependencies [[`7698546`](https://github.com/openapi-ts/openapi-typescript/commit/76985467402dc52d705902c21159387ddaff3519)]:
  - openapi-fetch@0.10.5

## 0.0.2

### Patch Changes

- Updated dependencies [[`bcc9222`](https://github.com/openapi-ts/openapi-typescript/commit/bcc92223c83ba074316e17534a173fee8da9cd41)]:
  - openapi-typescript-helpers@0.0.11
  - openapi-fetch@0.10.4

## 0.0.1

### Patch Changes

- [#1717](https://github.com/openapi-ts/openapi-typescript/pull/1717) [`335530c`](https://github.com/openapi-ts/openapi-typescript/commit/335530c4f8f966d0154f19504585c462f5f5a409) Thanks [@kerwanp](https://github.com/kerwanp)! - Initial release

- Updated dependencies [[`335530c`](https://github.com/openapi-ts/openapi-typescript/commit/335530c4f8f966d0154f19504585c462f5f5a409), [`335530c`](https://github.com/openapi-ts/openapi-typescript/commit/335530c4f8f966d0154f19504585c462f5f5a409)]:
  - openapi-fetch@0.10.3
  - openapi-typescript-helpers@0.0.10
