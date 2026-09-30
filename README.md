# WebR教材・確率モデルのシミュレーション

第1〜4回に対応する6つのシミュレーションと26の設定例です。所得調査・教育年数・経験年数・勤続年数を題材に，設定やRコードを変えて実行できます。数値と生成式は教材用の仮想設定です。

| 講義 | シミュレーション | 主な変更設定 |
|---|---|---|
| 第1回 | 所得調査・母集団と標本 | 地域別の回答確率・招待者数・地域の所得差 |
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

全シミュレーションを，設定・図・Rコードの順に縦に並ぶノートブック形式で表示します。本文と設定項目は18pxを基本とし，計算結果・Rの出力・実行コードは開閉できます。

1. 上部でシミュレーションを選びます。
2. 設定メニューを選び，必要に応じて数値を変更します。
3. Rの準備完了後に「基準を作って実行」を押します。
4. 「試すこと」のボタン，または入力欄で設定を変更し，「比較して実行」を押します。

「試すこと」には，題材に対応する問いと，1項目だけを変更するボタンを表示します。「別の試し方」を開くと，追加の操作例を選べます。ヒントのボタンはシードを変更しません。

変更した入力欄には基準の値を表示し，実行前は「未実行の変更あり」と表示します。比較図は基準と今回で横軸・縦軸をそろえ，ヒストグラムの区間もそろえます。「比較する図」で表示対象を選べます。横幅に余裕がある画面では左右に並べ，狭い画面では上下に配置します。表には基準・今回・差を表示します。

「同じ設定で標本を取り直す」は，表示中の結果と同じ設定でシードだけを変更します。未実行の設定変更がある間は無効です。「今回を基準にする」で基準を更新でき，「基準の設定に戻す」で入力欄とシードを復元できます。各シミュレーションの基準と直近の結果は，シミュレーションを切り替えても保持します。

項目名・入力欄・「?」・操作ボタンにマウスを重ねると，意味や使い方を表示します。Tabキーで入力欄や「?」を選んだ場合にも表示します。説明はEscキーで閉じられます。タッチ操作では「?」を押すと説明を表示し，もう一度押すか外側を押すと閉じます。

生成モデル・設定項目・説明中の数式はKaTeXで表示します。数式用のライブラリとフォントは教材に同梱しています。

「Rコード」を開くと，現在の設定から生成したコードを確認できます。「Rコードを編集」では，生成式・推定式・図を含むコード全体を変更し，編集欄の下の「編集コードを実行」で実行できます。「設定をコードへ反映」は，編集欄全体を現在の設定に対応するコードで置き換えます。設定メニューを選ぶと，他の設定値もそのメニューの初期値へ戻ります。

基準との比較は設定モードで利用できます。編集モードでは，編集したRコードが生成した図を表示します。

図はPNG，標本・反復結果・計算結果はCSV，実行コードはRファイルとして保存できます。第2回は一つの標本と母集団の計算を扱うため，反復結果CSVはありません。比較履歴には直近8回の設定と数値を表示します。

設定・編集コードはブラウザーに保存されます。基準・図・結果・比較履歴は再読み込みで消えます。設定変更後や実行エラー時は，直前の成功した実行の図が残ります。結果に対応する値は「実行した設定・コード」で確認できます。

## ファイル

| ファイル | 内容 |
|---|---|
| `index.html`・`app.css`・`app.js` | 画面・WebR実行・ファイル保存 |
| `tooltips.js` | マウス・キーボード・タッチによる説明表示 |
| `math.js`・`vendor/katex/` | TeX形式の数式表示・同梱フォント |
| `guidance.js` | 6つの問い・18の操作例・19種類の比較図の定義 |
| `lessons.js`・`simulation_settings.json` | 設定項目・26の設定例 |
| `r/01_income_survey.R` | 母集団・招待者・回答者 |
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

操作ヒントは `guidance.js` で変更できます。比較描画は `Rscript tests/verify_comparisons.R validation_results/comparisons` で確認できます。`r/compare_runs.R` の `econometrics_compare()` は，シミュレーションIDと，基準・今回それぞれの `result` リストを受け取ります。比較のための標本生成・再推定は行いません。

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
