# COEIROINK v2 bridge

COEIROINK v2 を VOICEVOX のマルチエンジンで読み込めるようにするためのブリッジ。

## 使い方

1. [Releases](https://github.com/sevenc-nanashi/coeiroink-v2-bridge/releases) から最新の `coeiroink-v2-v0.0.0.vvpp` をダウンロードする
2. vvpp を VOICEVOX に読み込ませる
3. COEIROINK v2 を起動する

## TODO

- [ ] COEIROINK v2 の自動起動（ポートからプロセスを割り出す？）

## 開発

### 実行

```
deno task start

# 監視モード
deno task watch
```

### ビルド

```
deno task compile
```

## ライセンス

MIT License で公開しています。
