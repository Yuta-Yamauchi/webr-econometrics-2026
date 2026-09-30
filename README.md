# WebR教材・確率モデルの実験室

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

1. 上部でシミュレーションを選びます。
2. 設定メニューを選び，必要に応じて数値を変更します。
3. Rの準備完了後に「実行」を押します。「乱数を変えて実行」はシードだけを変更します。

「Rコードを編集」では，生成式・推定式・図を含むコード全体を変更できます。「設定をコードへ反映」は，編集欄全体を現在の設定に対応するコードで置き換えます。設定メニューを選ぶと，他の設定値もそのメニューの初期値へ戻ります。

図はPNG，標本・反復結果・計算結果はCSV，実行コードはRファイルとして保存できます。第2回は一つの標本と母集団の計算を扱うため，反復結果CSVはありません。比較履歴には直近8回の設定と数値を表示します。

設定・編集コードはブラウザーに保存されます。図・結果・比較履歴は再読み込みで消えます。設定値だけを変えた場合，結果欄には直前の実行結果が残ります。結果に対応する値は「実行した設定・コード」で確認できます。

## ファイル

| ファイル | 内容 |
|---|---|
| `index.html`・`app.css`・`app.js` | 画面・WebR実行・ファイル保存 |
| `lessons.js`・`simulation_settings.json` | 設定項目・26の設定例 |
| `r/01_income_survey.R` | 母集団・招待者・回答者 |
| `r/02_income_prediction.R` | 条件付き期待値・線形射影 |
| `r/03_auxiliary_regression.R` | 二地域の補助回帰 |
| `r/03_ols_precision.R` | 固定したXの下でのOLS・残差分散 |
| `r/01_sampling.R` | 第4回の標本平均・極限定理 |
| `r/04_ols_asymptotics.R` | OLSの漸近近似・係数比のデルタ法 |
| `teacher_notes.md` | モデル・設定一覧・参照範囲 |
| `validation.md`・`validation_results/` | 実行確認・保存済み計算値 |
| `tests/` | 数値検証・設定ファイル生成 |
| `serve.py`・`start.ps1` | ローカル配信 |

Rファイルは追加パッケージなしで通常のR・RStudioでも実行できます。`01_sampling.R`のファイル名は従来教材との対応のため維持しています。

通常のRで図の日本語フォントを指定する場合は，実行前に `options(econometrics.font = "Yu Gothic")` のように，利用できるフォント名を設定します。

`simulation_settings.json`を編集した後，`webr`フォルダから `python tests/prepare_cases.py` を実行すると，画面用の `lessons.js` と検証用設定を更新します。数値検証は `Rscript tests/verify_models.R validation_results` で実行します。

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
