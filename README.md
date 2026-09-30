# WebR教材・確率モデルのシミュレーション

第1〜4回に対応する6つのシミュレーションと26の設定例です。所得調査・教育年数・経験年数・勤続年数を題材に，設定やRコードを変えて実行できます。数値と生成式は教材用の仮想設定です。

| 講義 | シミュレーション | 主な変更設定 |
|---|---|---|
| 第1回 | 所得調査・母集団と標本 | 地域別の回答確率・依頼人数・地域の所得差 |
| 第2回 | 条件付き期待値・線形射影 | 平均関数の曲がり・教育年数の構成・標本数 |
| 第3回 | 補助回帰 | 所得・教育年数の地域差・地域内の変動・人数 |
| 第3回 | OLSの精度 | 説明変数の相関・人数・所得の誤差 |
| 第4回 | 標本平均の分布 | 25人・100人・400人・分布の形・反復回数 |
| 第4回 | OLS・デルタ法 | 誤差分布・係数比の分母・説明変数の相関 |

## 起動

ZIPを展開し，`webr`フォルダで次を実行します。Python 3の標準ライブラリだけを使用します。

```powershell
python serve.py
```

Windowsでは `py -3 serve.py` または同梱の `start.ps1`，macOS・Linuxでは `python3 serve.py` でも起動できます。

[教材を開く](http://127.0.0.1:8765/)からブラウザーで開きます。終了はサーバーのターミナルで `Ctrl+C`，ポートの変更は `python serve.py --port 8766` です。

WebR本体は公式CDNから読み込むため，起動時にインターネット接続を使います。計算はブラウザー内で実行し，学生側のRのインストールは不要です。HTMLはHTTP・HTTPSで開きます。

## 操作

各テーマを4段階のノートブックとして表示します。

1. シミュレーションを選び，「最初の調査を実行」を押します。
2. 表示された図の下へ進むと，次の状況と変更する項目が現れます。
3. 提案された値をそのまま使うか，自分で書き換え，「この条件で実行」を押します。
4. 変更前後の図を見て，さらに下の段階へ進みます。

実行するたびに次の段階が現れます。通常の画面では，進行中の段階だけに実行ボタンを表示します。最初の調査は各テーマの初期設定を使います。以降は表示された比較相手から1項目だけを変え，他の設定と乱数シードを引き継ぎます。比較相手は各段階に明記します。学生が編集した値も引き継ぎます。

| テーマ | 条件変更の流れ |
|---|---|
| 所得調査 | 地域Bの回答確率を下げる → 依頼人数を増やす → 回答確率をそろえる |
| 所得予測 | 調査人数を増やす → 教育年数の構成を変える → 平均関数を直線にする |
| 補助回帰 | 所得の地域差の向きを変える → 教育年数の地域差をなくす → 地域差がある設定で地域内の教育年数を近づける |
| 係数の精度 | 経験年数と勤続年数の相関を上げる → 人数を増やす → 相関を下げる |
| 平均の分布 | 人数を増やす → さらに増やす → 最初の人数で所得分布を変える |
| OLS・デルタ法 | 人数を増やす → 勤続年数の係数を小さくする → 人数を減らす |

比較図は横軸・縦軸の目盛りをそろえ，ヒストグラムでは区間もそろえます。横幅に余裕があれば左右，狭い画面では上下に並べます。結果の解説や回答欄は設けていません。

図の前に，個人のデータを描いた図か，調査を繰り返した推定値の分布かを示します。図の下には，点・棒・線の意味を表示します。人数と反復回数は各図を作成した実行結果に対応し，入力欄を変更しただけでは変わりません。ヒストグラムでは，縦軸の密度と棒の面積の関係も示します。

各段階の「設定・数値・保存」から，実行した設定，計算値，Rコード，CSV，表示中の図のPNGを確認・保存できます。第2回は一つの標本と母集団の計算を扱うため，反復結果CSVはありません。

「自分で設定する・Rコードを編集する」を開くと，全設定項目，26の設定例，Rコード編集を使えます。設定例を選ぶと全項目が切り替わり，その後に各値を編集できます。コード編集では，欄の下にある「このコードで実行」を使います。「現在の設定からコードを作り直す」は編集欄全体を置き換えます。

自由設定の図の下では，標本の取り直しと比較相手の変更も選べます。標本の取り直しは乱数シードだけを変更します。数値欄に未実行の変更がある間は無効になります。編集したRコードは，そのコードが生成した図を表示します。

項目名・入力欄・「?」にマウスを重ねると説明が出ます。キーボードのフォーカスや「?」のクリックでも開けます。数値を入力すると閉じ，Escキーでも閉じられます。数式は同梱のKaTeXで表示します。

設定と編集コードはブラウザーに保存されます。実行結果と各段階の図はテーマを切り替えても残り，ページの再読み込みで消えます。実行エラー時は成功済みの結果が残ります。

## ファイル

| ファイル | 内容 |
|---|---|
| `index.html`・`app.css`・`app.js` | 画面・WebR実行・ファイル保存 |
| `tooltips.js` | マウス・キーボード・タッチによる説明表示 |
| `math.js`・`vendor/katex/` | TeX形式の数式表示・同梱フォント |
| `journeys.js` | 6テーマ・24段階の状況設定・18の条件変更 |
| `guidance.js` | 19種類の比較図と数値の定義 |
| `figures.js` | 図の集計対象・軸・描画記号の説明と実行時の人数表示 |
| `lessons.js`・`simulation_settings.json` | 設定項目・26の設定例 |
| `r/01_income_survey.R` | 母集団・依頼対象者・回答者 |
| `r/02_income_prediction.R` | 条件付き期待値・線形射影 |
| `r/03_auxiliary_regression.R` | 二地域の補助回帰 |
| `r/03_ols_precision.R` | 固定したXの下でのOLS・残差分散 |
| `r/01_sampling.R` | 第4回の標本平均・極限定理 |
| `r/04_ols_asymptotics.R` | OLSの漸近近似・係数比のデルタ法 |
| `r/compare_runs.R` | 保存済みの計算結果から共通の軸・区間で比較図を描画 |
| `teacher_notes.md` | モデル・設定一覧・参照範囲 |
| `validation.md`・`validation_results/` | 実行確認・保存済み計算値 |
| `tests/` | 数値検証・設定ファイル生成 |
| `serve.py`・`start.ps1` | ローカル配信 |

Rファイルは追加パッケージなしで通常のR・RStudioでも実行できます。`01_sampling.R`のファイル名は従来教材との対応のため維持しています。

通常のRで図の日本語フォントを指定する場合は，実行前に `options(econometrics.font = "Yu Gothic")` のように，利用できるフォント名を設定します。

`simulation_settings.json`を編集した後，`webr`フォルダから `python tests/prepare_cases.py` を実行すると，画面用の `lessons.js` と検証用設定を更新します。数値検証は `Rscript tests/verify_models.R validation_results` で実行します。

設定項目の説明文は，`simulation_settings.json`の各項目の `help` に記載しています。

状況設定と変更項目は `journeys.js` で変更できます。`node tests/verify_journeys.mjs` で値の範囲，1項目ずつの変更，入力値の引継ぎを確認できます。比較描画は `Rscript tests/verify_comparisons.R validation_results/comparisons` で確認できます。`r/compare_runs.R` の `econometrics_compare()` は，シミュレーションIDと，基準・今回それぞれの `result` リストを受け取ります。比較のための標本生成・再推定は行いません。

生成モデルの `model` はTeX数式の配列です。JSONではバックスラッシュを `\\` と記述します。本文中の数式と記号の対応は `math.js` に記載しています。

## 配信

`webr`フォルダの構成を保って静的Webサーバーへ置くと，学生はそのURLで実行できます。使用するWebRは0.6.0です。サーバーに以下のヘッダーを設定するとSharedArrayBufferを利用し，ヘッダーがない場合はPostMessageを利用します。同梱サーバーは既定でヘッダーを付けます。

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 参照文献・参照範囲

- 講義・計量経済学・分析場面の文献と参照範囲は [モデル・設定一覧](teacher_notes.md) の末尾に集約しています。
- [WebR 0.6.0公式リリース](https://github.com/r-wasm/webr/releases/tag/v0.6.0)：使用バージョン。
- [Serving Pages with WebR](https://docs.r-wasm.org/webr/latest/serving.html)：配信ヘッダー・通信方式。
- [Plotting](https://docs.r-wasm.org/webr/latest/plotting.html)：canvasからの図の取得。
- [Shelter API](https://docs.r-wasm.org/webr/latest/api/js/classes/WebR.Shelter.html)：`captureR()`・`evalR()`・`purge()`。
- [WebR API](https://docs.r-wasm.org/webr/latest/api/js/classes/WebR.WebR.html)：Rの初期化・値の取得・終了。
- [WAI-ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)・[Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)：説明と入力欄の関連付け，キーボード表示，Escでの終了，説明上へマウスを移した場合の表示維持。
- [KaTeX Browser](https://katex.org/docs/browser.html)・[API](https://katex.org/docs/api.html)・[Options](https://katex.org/docs/options.html)：数式のHTML・MathMLへの変換，ローカルフォント，文中数式の改行。使用バージョンは0.18.9です。ライセンスは `vendor/katex/LICENSE` に同梱しています。
