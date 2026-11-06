ダビマス配合研究所 v3.6｜GitHub更新用

v3.5の8ファイルを基準として、配合候補のクロス根拠を表示する診断を追加。
・研究用の父母をまたぐ同名祖先／同じ側だけの重複を分類
・因名未登録・因子未収録の祖先位置を明示
・ゲーム内の有効クロス・至高成立・能力数値を保証しない
・v3.5の探索順位と保存JSONスキーマは変更なし
・所持初期登録（52頭埋込）とユーザーJSONの315頭を保持

アップロード：ZIP内の9ファイルすべてをGitHubリポジトリ直下へアップロード。
新規 research-cross-check.js を必ず追加し、その他は上書き。
まず既存PWAでJSONバックアップを取得してください。

実施テスト（開発環境 Node.js）：
・app.js / research-audit.js / research-quality.js / research-cross-check.js / sw.js 構文チェック合格
・test-v36.js：父母をまたぐ重複、同じ側だけの重複、未確認因名と因子、重複/不正パス、スクリプト読込順を検証し合格
・index.html のv3.5初期SEEDと完全一致
未実施：ブラウザ実操作、公開CSV全件照合、ダビふぁくとの実配合出力比較、旧JSONの実動復元、ゲーム内配合理論確認。

研究観点の出典（ソースの複製はなし）：
https://github.com/dabimastools/dabimasFactor/tree/main/vue/logic/inbreed
https://github.com/dabimastools/dabimasFactor/tree/main/vue/logic/factor
https://github.com/Okuyuki30cm/dbms-pd-maker
確認日：2026-11-06。第三者の実装を根拠にゲーム内仕様の確定とはしません。
