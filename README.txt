ダビマス配合研究所 v3.7｜GitHub更新用（2026-11-06）

更新内容：
・v3.6の血統監査・クロス根拠を統合する research-evidence.js を新設
・至高3×4×5の同名、3登録ID、判明6因子という「一次条件の証拠」を可視化
・父母にまたがる同名祖先について因名・因子判明と未収録を区別
・マイルド型：v3.5の構造品質比較の次に証拠の充足を使い、従来探索順位で同点を決定
・本気型：候補間の血統品質比較を優先。研究スコアがほぼ同点の場合に証拠の充足を利用
・既存プランの保存スキーマを維持。新規自動生成プランの autoDesign21 に研究根拠の要約を追加
・新規スクリプトをインデックス・Service Workerキャッシュへ登録

注意：
・ゲームの内部仕様、至高のゲーム内成立、全兄弟成立阻害、独立クロス効果、ニトロ、SP/ST予想は未検証
・公開コードの計算結果の実配合比較は今回未実施。第三者の実装を複製していない
・自動探索は全組み合わせの最適解保証ではない（候補数制限あり）
・スクリプトによる順位付けは研究根拠の多寡であり、強さの保証ではない

更新手順：
1. 更新前にPWAでJSONバックアップを保存
2. ZIPの10ファイルをGitHubリポジトリ直下へ配置（既存ファイルは上書き）
3. 新規 research-evidence.js を忘れずに追加
4. Commit後、GitHub Pages反映を待ち、ページをハード再読込
5. ヘッダーが「v3.7 配合根拠比較探索・所持315頭維持」となることを確認

検証（Node.js）：
・app.js、research-audit.js、research-quality.js、research-cross-check.js、research-evidence.js、sw.js 構文チェック成功
・研究証拠判定テスト12項目成功
・埋込初期SEEDはv3.6と一致
・HTMLスクリプトロード順とService Worker登録確認
・ZIP整合性確認
未実施：ブラウザ操作での全工程実走、公開マスターCSV全件照合、ダビふぁくの実配合出力差分、ゲーム内検証、旧JSONの実動復元

研究資料（考え方の比較、外部ソースは複製しない）：
https://github.com/dabimastools/dabimasFactor/tree/main/vue/logic/inbreed
https://github.com/dabimastools/dabimasFactor/tree/main/vue/logic/pedigree
https://github.com/Okuyuki30cm/dbms-pd-maker
