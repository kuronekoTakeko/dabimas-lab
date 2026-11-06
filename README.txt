ダビマス配合研究所 v3.8｜GitHub Pages 更新用（2026-11-07）

【重要】更新前に現行PWAの「データ管理」から JSON バックアップを保存してください。
アップロード対象は、このZIP直下の index.html / app.js / *.js / sw.js / manifest.webmanifest / icon.svg 等です。
旧データ・保存プラン・ゲノム記録の初期化や削除は一切実行しません。
所持315頭の別途初期化JSONは、このZIPには含めていません。初期化JSONの再インポートは避けてください。

v3.8変更点
・research-validation.js 新設。3×4×5の指定祖先の同名、登録ID、判明因子総数、因子種類数を独立確認。
・「6種類」と「4種類・総数6個」研究報告を分け、後者は未検証扱いで表示。
・同じ祖先名と同じ因名で因子配列が不一致の場合、データ整合性上の問題を検出。
・本気型の名牝/基礎配合候補の同点付近で、矛盾の少ない根拠を優先する比較を追加。
・既存の3.7までの探索エンジン、保存スキーマ、所持判定、キャッシュ構造は維持。
・キャッシュ名 v38-1 に更新。JSのバージョン付クエリを更新。

研究状況
・ダビマス公式配合理論ガイド: https://dabimas.jp/kouryaku/guide/introduction-to-breeding-theories.html
・プレイヤー報告: https://www.dabimasu.work/entry/2025/11/09/124311
  （3×4×5と6種類に関する報告、および4種類6因子成立例の紹介）
・ダビふぁく公開ソース: https://github.com/dabimastools/dabimasFactor
・血統CSVの候補: https://github.com/Okuyuki30cm/dbms-pd-maker
確認日: 2026-11-07
公開研究の報告はゲーム公式による確認ではありません。
第三者コード・CSVをコピーして同梱していません。

検証済み
・node --check 全JSファイル
・単体テスト 15件（tests/v38-validation.test.js）
・所持JSON 315件、権利数0の所持277件を読み取りで確認
・ZIP内ファイルのCRCを確認

未実施・未検証
・GitHub Pages上の実ブラウザ自動探索・PWA更新後のキャッシュ実機確認
・公開CSVの個別馬照合、ダビふぁくとのゲーム実配合の照合
・実際の保存プラン等が存在するJSONでのインポート/復元のE2E試験
・全兄弟姉妹による至高不成立の完全な排除
・ニトロのゲーム上の効果、SP/ST予測、至高成立のゲーム内確認

更新方法
1. 既存サイトのデータ管理でJSONバックアップを保存
2. ZIP内ファイルを既存GitHub Pagesリポジトリの同じ階層へアップロード（追加ファイルも含む）
3. GitHub Pagesの公開反映後にヘッダー「v3.8 血統根拠・因子整合性検証」を確認
4. 保存済みデータが残っていることを確認

コマンド例:
node tests/v38-validation.test.js '/path/to/dabimas_315_clean_start_v33.json'
