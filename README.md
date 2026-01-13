# COEIROINK v2 bridge

COEIROINK v2 を VOICEVOX のマルチエンジンで読み込めるようにするためのブリッジ。

> [!WARNING]
> このブリッジの初回起動時は、COEIROINK v2 が起動している必要があります。
> 2回目以降は、COEIROINK v2 が起動していなくても自動で起動します。

## 使い方

1. [Releases](https://github.com/sevenc-nanashi/coeiroink-v2-bridge/releases)
   から最新の `coeiroink-v2-v0.0.0.vvpp` をダウンロードする
2. vvpp を VOICEVOX に読み込ませる
3. COEIROINK v2 を起動する

## TODO

- [ ] v2のピッチ調整機能（中心を0として上下で制御する？）

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
