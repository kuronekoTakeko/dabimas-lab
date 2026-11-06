ダビマス配合研究所 v3.9｜GitHub Pages 更新用（2026-11-07）

【更新前の保護】現行PWAでJSONバックアップを取得してください。
現在の保存プラン・自家製馬・ゲノム記録・所持設定を初期化しません。
所持315頭の初期化JSONは同梱しません。再インポートしないでください。

v3.9追加
・research-transmission.js（新規）: 父母から産駒に継承される5代31枠の祖先名・判明因子・因名を照合。
・異なる親祖先、因子の多重集合の不一致、因名の不一致を矛盾として検出。
・未収録情報は不成立/因子なしと扱わず「未確認」。5代外の親祖先を産駒の血統に加算しない。
・直接配合チェック画面に親子継承の確認結果を表示。
・本気型の追加仕込みと9工程生成時に、判明した親子継承矛盾がある場合は候補を採用しない。
・至高成立・全兄弟姉妹・ニトロ・SP/STの保証は追加していません。
・v3.8までの保存形式・所持頭数・探索形式は変更しません。
・キャッシュ名 dbms-v39-1 に変更、アプリの表示バージョンをv3.9へ。

公開研究の参考（2026-11-07閲覧）：
https://note.com/huh_ds/n/n0eb8a439d3f3
https://note.com/huh_ds/n/nda77b134971b
https://www.dabimasu.work/entry/2025/11/09/124311
https://github.com/dabimastools/dabimasFactor
https://github.com/Okuyuki30cm/dbms-pd-maker
今回は第三者のソース・CSVをコピーせず、独自の親子継承検査を追加。
至高の成立条件・兄弟姉妹阻害はプレイヤー研究でありゲーム公式と同一視しません。

チェック:
・node --check（全JS）
・node tests/v38-validation.test.js /path/to/315.json
・node tests/v39-transmission.test.js /path/to/315.json
・ZIP CRC

未実施:
・GitHub Pages上のブラウザE2E、Service Worker実機更新確認
・ダビふぁくCSVと実馬全件照合、ゲーム内での至高成立確認
・旧JSONのブラウザインポート/エクスポート実機検証
・全兄弟姉妹の系譜IDによる成立阻害条件検証
・クロス/ニトロ効果や能力値のゲーム実測照合

GitHub更新: ZIP内のファイルを既存リポジトリのルートへ上書きアップロード。
追加 research-transmission.js も必ずアップロードしてください。
index.htmlのヘッダーが v3.9 になっているかを確認してください。
