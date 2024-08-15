---
title: About openapi-react-query
description: openapi-react-query Project Goals and contributors
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from "../../data/contributors.json";
</script>

# 概要

## プロジェクトの目標

1. 型は厳格であり、必要最小限のジェネリクスでOpenAPIスキーマから自動的に推論されるべきです。
2. 元の `@tanstack/react-query` API を尊重しつつ、ボイラープレートを減らします。
3. できるだけ軽量でパフォーマンスが高くなるようにします。

## 貢献者

これらの素晴らしい貢献者がいなければ、このライブラリは存在しなかったでしょう：

<VPTeamMembers size="small" :members="contributors['openapi-react-query']" />
