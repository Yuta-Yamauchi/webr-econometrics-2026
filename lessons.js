// Generated from simulation_settings.json by tests/prepare_cases.py
export const lessons = [
  {
    "id": "survey",
    "short": "第1回 所得調査",
    "title": "回答者の平均は地域全体の平均か？",
    "course": "第1回・母集団と標本",
    "file": "r/01_income_survey.R",
    "intro": "地域全体の平均所得を，調査への回答から推定する。母集団（population）と標本（sample）を，回答の集まり方を変えて比べる。",
    "model": [
      "y_i=\\mu_0+\\gamma a_i+u_i",
      "\\Pr(a_i=1)=p",
      "\\Pr(R_i=1\\mid a_i=g)=r_g"
    ],
    "assumptions": "aは地域Aで0・地域Bで1，Rは回答した場合に1となる。年間所得yの単位は万円である。u = σ(e − 1)，e ∼ Exp(1) とし，地域・回答の抽選から独立に生成する。N人を母集団から独立に抽出して調査を依頼する。",
    "fields": [
      {
        "key": "N",
        "label": "調査を依頼する人数 N",
        "value": 300,
        "min": 50,
        "max": 5000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "1回の調査を依頼する人数。各人が回答するかどうかを別に抽選するため，回答者はN人以下となる。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "人数Nの調査を繰り返す回数（Monte Carlo replications）。毎回，所得と回答の有無を生成する。"
      },
      {
        "key": "p",
        "label": "地域Bの人口比率 p",
        "value": 0.4,
        "min": 0.05,
        "max": 0.95,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "母集団で地域Bに住む人の割合。0.4なら地域Bが40％，地域Aが60％となる。"
      },
      {
        "key": "mu0",
        "label": "地域Aの平均所得 μ₀",
        "value": 300,
        "min": 150,
        "max": 1000,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "地域Aの平均年間所得。地域Bの平均所得は，この値にγを加えた額となる。単位は万円。"
      },
      {
        "key": "gap",
        "label": "地域BとAの所得差 γ",
        "value": 120,
        "min": 0,
        "max": 400,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "地域Bの平均所得から地域Aの平均所得を引いた額。γ=120なら，地域Bが120万円高い。"
      },
      {
        "key": "sigma",
        "label": "地域内の標準偏差 σ",
        "value": 100,
        "min": 10,
        "max": 140,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "同じ地域の所得の標準偏差（standard deviation）。生成式u=σ(e−1)のσに当たり，単位は万円。"
      },
      {
        "key": "r0",
        "label": "地域Aの回答確率 r₀",
        "value": 0.6,
        "min": 0.1,
        "max": 1,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "調査を依頼された地域Aの人が回答する確率。0.6なら60％となる。"
      },
      {
        "key": "r1",
        "label": "地域Bの回答確率 r₁",
        "value": 0.6,
        "min": 0.1,
        "max": 1,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "調査を依頼された地域Bの人が回答する確率。同じ地域では，回答の有無と所得の誤差を独立に生成する。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 101,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "乱数シード（random seed）を指定する。同じコード・設定・シードなら，同じデータを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "同じ回答確率",
        "description": "両地域の回答確率を0.6にそろえる。",
        "params": {}
      },
      {
        "id": "response",
        "name": "地域Bの回答が少ない調査",
        "description": "地域Bの回答確率だけを0.2へ変更する。",
        "params": {
          "r1": 0.2
        }
      },
      {
        "id": "large",
        "name": "回答確率の違い・多い調査依頼",
        "description": "回答確率の違いを保ち，調査を依頼する人数を3000人にする。",
        "params": {
          "r1": 0.2,
          "N": 3000
        }
      },
      {
        "id": "no_gap",
        "name": "回答確率の違い・所得差なし",
        "description": "地域Bの回答確率を0.2，地域の所得差を0にする。",
        "params": {
          "r1": 0.2,
          "gap": 0
        }
      }
    ],
    "comparisons": [
      "population_mean",
      "response_target",
      "respondent_mean"
    ],
    "comparisonLabels": [
      "母平均",
      "回答者集団の平均",
      "今回の回答者平均"
    ]
  },
  {
    "id": "prediction",
    "revision": 2,
    "short": "第2回 電力使用量の予測",
    "title": "明日の電力使用量をどう予測するか？",
    "course": "第2回・条件付き期待値と線形射影",
    "file": "r/02_energy_prediction.R",
    "intro": "一つの建物の電力使用量を予測する。暖房や冷房を使う日を想定し，寒い日と暑い日に使用量が増える仮想モデルを試す。気温を使わない予測から始め，気温別の平均，直線・二次式，観測データからの推定へ進む。",
    "model": [
      "y_i=m(t_i)+\\varepsilon_i",
      "m(t)=80+0.45(t-20)^2",
      "t_i\\in\\{5,10,15,20,25,30,35\\}",
      "\\varepsilon_i\\sim U(-\\sqrt{3}\\sigma,\\sqrt{3}\\sigma)"
    ],
    "assumptions": "tは気温（℃），yは1日の電力使用量（kWh）である。各日の気温と誤差を独立に生成する。同じ気温での使用量の標準偏差はσとなる。寒い日（5・10・15℃）と暑い日（25・30・35℃）の割合を変更し，各組の中では3種類の気温を同じ確率とする。20℃の日の割合は20％に固定する。生成式・数値は教材用の仮想設定である。",
    "fields": [
      {
        "key": "constant",
        "label": "毎日同じ予測値",
        "value": 140,
        "min": 40,
        "max": 240,
        "step": "any",
        "integer": false,
        "hint": "kWh",
        "help": "気温を使わず，毎日の使用量をこの値で予測する。全体の平均と，母集団の平均二乗誤差（mean squared error，MSE）を比較する。"
      },
      {
        "key": "temperature",
        "label": "明日の気温",
        "value": "20",
        "options": [
          [
            "5",
            "5℃"
          ],
          [
            "10",
            "10℃"
          ],
          [
            "15",
            "15℃"
          ],
          [
            "20",
            "20℃"
          ],
          [
            "25",
            "25℃"
          ],
          [
            "30",
            "30℃"
          ],
          [
            "35",
            "35℃"
          ]
        ],
        "hint": "",
        "help": "この気温の日の使用量と，条件付き期待値（conditional expectation）を表示する。"
      },
      {
        "key": "intercept",
        "label": "20℃での予測値 a",
        "value": 100,
        "min": 40,
        "max": 220,
        "step": "any",
        "integer": false,
        "hint": "kWh",
        "help": "予測式a+b(t−20)の切片。気温20℃での予測値となる。"
      },
      {
        "key": "slope",
        "label": "1℃上がるごとの予測値の差 b",
        "value": 3,
        "min": -10,
        "max": 10,
        "step": "any",
        "integer": false,
        "hint": "kWh／℃",
        "help": "予測式a+b(t−20)の傾き。気温が1℃上がるごとに予測値を何kWh増減させるかを指定する。"
      },
      {
        "key": "climate",
        "label": "気温の構成",
        "value": "balanced",
        "options": [
          [
            "balanced",
            "寒い日40％・穏やかな日20％・暑い日40％"
          ],
          [
            "warm",
            "寒い日20％・穏やかな日20％・暑い日60％"
          ],
          [
            "cold",
            "寒い日60％・穏やかな日20％・暑い日20％"
          ]
        ],
        "hint": "",
        "help": "気温が現れる確率だけを変更する。各気温の平均使用量と，平均からのばらつきは固定する。"
      },
      {
        "key": "degree",
        "label": "予測に使う説明変数",
        "value": "1",
        "options": [
          [
            "1",
            "気温・定数項"
          ],
          [
            "2",
            "気温・気温の二乗・定数項"
          ]
        ],
        "hint": "",
        "help": "z=t−20として，行ベクトルxᵢ=(1,zᵢ)またはxᵢ=(1,zᵢ,zᵢ²)を使う。選んだ説明変数の線形結合で，母集団MSEが最小となる係数を求める。"
      },
      {
        "key": "N",
        "label": "観測日数 N",
        "value": 120,
        "min": 30,
        "max": 3000,
        "step": 1,
        "integer": true,
        "hint": "日",
        "help": "OLS（ordinary least squares）に使う観測日数。同じ気温の構成・標準偏差・シードで日数を増やすと，既存のデータに続きの観測を加える。"
      },
      {
        "key": "sigma",
        "label": "同じ気温での標準偏差 σ",
        "value": 12,
        "min": 1,
        "max": 35,
        "step": "any",
        "integer": false,
        "hint": "kWh",
        "help": "同じ気温の日に見られる使用量のばらつき。平均0・分散σ²の一様分布から誤差を生成する。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 202,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "同じ設定・シードで同じ観測データを生成する。母集団の理論値はシードによらない。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "寒い日と暑い日が同じ割合",
        "description": "気温の構成を40％・20％・40％とし，直線で予測する。",
        "params": {}
      },
      {
        "id": "warm",
        "name": "暑い日の多い気候",
        "description": "気温ごとの使用量の分布を保ち，暑い日の割合を60％にする。",
        "params": {
          "climate": "warm"
        }
      },
      {
        "id": "quadratic",
        "name": "気温の二乗を追加",
        "description": "暑い日の多い気候で，二次項を含む線形射影を求める。",
        "params": {
          "climate": "warm",
          "degree": "2"
        }
      },
      {
        "id": "large",
        "name": "観測データを追加",
        "description": "二次項を使い，300日分のデータからOLSを求める。",
        "params": {
          "climate": "warm",
          "degree": "2",
          "N": 300
        }
      }
    ],
    "comparisons": [
      "mse_chosen_constant",
      "mse_linear",
      "mse_projection"
    ],
    "comparisonLabels": [
      "一定値での予測のMSE",
      "直線での予測のMSE",
      "選んだ説明変数での射影のMSE"
    ]
  },
  {
    "id": "auxiliary",
    "short": "第3回 補助回帰",
    "title": "全体と地域内で関係は同じか？",
    "course": "第3回・二地域の教育年数と所得",
    "file": "r/03_auxiliary_regression.R",
    "intro": "教育年数と所得の関係を，二つの地域で調べる。全体の単回帰（simple regression）と，地域平均との差を使う補助回帰（auxiliary regression）を比べる。",
    "model": [
      "d_i=12+\\delta a_i+v_i",
      "y_i=100+\\beta d_i+\\gamma a_i+u_i"
    ],
    "assumptions": "aは地域Aで0・地域Bで1となる。各地域から同数を抽出する。v ∼ N(0, σᵥ²)，u ∼ N(0, σᵤ²) とし，個人間・誤差間で独立に生成する。dは教育年数（年），yは年間所得（万円）である。",
    "fields": [
      {
        "key": "n_group",
        "label": "各地域の人数",
        "value": 80,
        "min": 3,
        "max": 1000,
        "step": 1,
        "integer": true,
        "hint": "総標本数はこの2倍",
        "help": "地域A・Bからそれぞれ調べる人数。80なら合計160人となる。"
      },
      {
        "key": "delta",
        "label": "教育年数の地域差 δ",
        "value": 2,
        "min": -6,
        "max": 6,
        "step": "any",
        "integer": false,
        "hint": "年",
        "help": "地域Bの平均教育年数から地域Aの平均教育年数を引いた値。δ=2なら，地域Bが2年長い。"
      },
      {
        "key": "beta",
        "label": "地域内の係数 β",
        "value": 20,
        "min": -100,
        "max": 100,
        "step": "any",
        "integer": false,
        "hint": "万円／年",
        "help": "同じ地域で教育年数が1年異なるときの平均所得の差。生成式y=100+βd+γa+uのβに当たり，単位は万円／年。"
      },
      {
        "key": "gamma",
        "label": "所得の地域差 γ",
        "value": 80,
        "min": -300,
        "max": 300,
        "step": "any",
        "integer": false,
        "hint": "教育年数が同じときの所得差（万円）",
        "help": "教育年数が同じときの，地域Bと地域Aの平均所得の差。正なら地域Bが高く，負なら低い。単位は万円。"
      },
      {
        "key": "sigma_v",
        "label": "地域内の教育年数の標準偏差 σᵥ",
        "value": 1,
        "min": 0.05,
        "max": 5,
        "step": "any",
        "integer": false,
        "hint": "年",
        "help": "同じ地域の教育年数の標準偏差。生成式d=12+δa+vのvの標準偏差で，単位は年。"
      },
      {
        "key": "sigma_u",
        "label": "所得の誤差の標準偏差 σᵤ",
        "value": 15,
        "min": 0,
        "max": 100,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "教育年数と地域が同じ人の所得の標準偏差。所得の誤差uの標準偏差で，単位は万円。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 300,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "回帰係数を計算する回数。各地域の人数を固定し，教育年数の誤差vと所得の誤差uを毎回生成する。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 102,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "乱数シード（random seed）を指定する。同じコード・設定・シードなら，同じデータを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "講義と同じ二地域",
        "description": "教育年数と所得の両方に地域差がある。",
        "params": {}
      },
      {
        "id": "no_income_gap",
        "name": "教育年数が同じなら所得差なし",
        "description": "教育年数をそろえたときの地域間の所得差γを0にする。",
        "params": {
          "gamma": 0
        }
      },
      {
        "id": "no_education_gap",
        "name": "教育年数の地域差なし",
        "description": "δだけを0にする。",
        "params": {
          "delta": 0
        }
      },
      {
        "id": "large",
        "name": "同じ地域差・多い標本",
        "description": "各地域の人数を320人にする。",
        "params": {
          "n_group": 320
        }
      },
      {
        "id": "little_variation",
        "name": "地域内の教育年数が近い標本",
        "description": "地域内の教育年数の標準偏差だけを0.25年にする。",
        "params": {
          "sigma_v": 0.25
        }
      }
    ],
    "comparisons": [
      "raw",
      "full",
      "auxiliary"
    ],
    "comparisonLabels": [
      "単回帰",
      "重回帰",
      "補助回帰"
    ]
  },
  {
    "id": "precision",
    "short": "第3回 係数の精度",
    "title": "二つの説明変数の係数を分けて推定できるか？",
    "course": "第3回・行列OLSと固定した説明変数",
    "file": "r/03_ols_precision.R",
    "intro": "経験年数と勤続年数を使って所得を説明する。二つの年数の関係と調査人数を変え，最小二乗法（ordinary least squares，OLS）で係数を求める。",
    "model": [
      "y_i=200+\\beta_1x_{i1}+\\beta_2x_{i2}+u_i",
      "\\hat{\\boldsymbol{\\beta}}=(\\mathbf{X}^{\\prime}\\mathbf{X})^{-1}\\mathbf{X}^{\\prime}\\mathbf{y}"
    ],
    "assumptions": "x₁は経験年数，x₂は勤続年数，yは年間所得（万円）である。独立な平均0・分散1の一様乱数v・wから，x₁ = 20 + 6v，x₂ = 5 + 1.5(ρv + √(1 − ρ²)w)を作る。説明変数を固定し，u ∼ N(0, σ²)だけを反復生成する。",
    "fields": [
      {
        "key": "N",
        "label": "標本数 N",
        "value": 80,
        "min": 8,
        "max": 1000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "調査する人数。反復中は，このN人の経験年数と勤続年数を固定する。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "回帰係数を計算する回数。説明変数Xを固定し，所得の誤差uを毎回生成する。"
      },
      {
        "key": "rho",
        "label": "説明変数の相関 ρ",
        "value": 0.3,
        "min": 0,
        "max": 0.995,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "経験年数と勤続年数の母相関（population correlation）。値が1に近いほど，二つの年数は強い正の相関を持つ。標本の相関は抽出ごとに異なる。"
      },
      {
        "key": "beta1",
        "label": "経験年数の係数 β₁",
        "value": 8,
        "min": -20,
        "max": 30,
        "step": "any",
        "integer": false,
        "hint": "万円／年",
        "help": "勤続年数が同じ人の間で，経験年数が1年異なるときの平均所得の差。単位は万円／年。"
      },
      {
        "key": "beta2",
        "label": "勤続年数の係数 β₂",
        "value": 12,
        "min": -20,
        "max": 40,
        "step": "any",
        "integer": false,
        "hint": "万円／年",
        "help": "経験年数が同じ人の間で，勤続年数が1年異なるときの平均所得の差。単位は万円／年。"
      },
      {
        "key": "sigma",
        "label": "所得の誤差の標準偏差 σ",
        "value": 60,
        "min": 1,
        "max": 150,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "経験年数と勤続年数が同じ人の所得の標準偏差。正規誤差uの標準偏差で，単位は万円。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 305,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "乱数シード（random seed）を指定する。同じコード・設定・シードなら，同じデータを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "経験と勤続に違いがある標本",
        "description": "相関ρ = 0.3。説明変数を固定して所得を取り直す。",
        "params": {}
      },
      {
        "id": "correlated",
        "name": "経験と勤続が似ている標本",
        "description": "相関だけを0.95にする。",
        "params": {
          "rho": 0.95
        }
      },
      {
        "id": "large",
        "name": "高い相関・多い標本",
        "description": "ρ = 0.95を保ち，人数を320にする。",
        "params": {
          "rho": 0.95,
          "N": 320
        }
      },
      {
        "id": "small",
        "name": "少人数の賃金データ",
        "description": "人数を12にする。推定する係数は定数項を含め3個である。",
        "params": {
          "N": 12
        }
      }
    ],
    "comparisons": [
      "theory_sd1",
      "mc_sd1",
      "variance_corrected"
    ],
    "comparisonLabels": [
      "係数の理論SD",
      "係数の反復SD",
      "RSS/(N−3)の平均"
    ]
  },
  {
    "id": "sampling",
    "short": "第4回 平均の分布",
    "title": "平均所得の推定は何人で安定するか？",
    "course": "第4回・大数の法則と中心極限定理",
    "file": "r/01_sampling.R",
    "intro": "同じ母集団から調査を繰り返し，標本平均の分布を調べる。人数を変え，大数の法則（law of large numbers）と中心極限定理（central limit theorem）に対応する分布を表示する。",
    "model": [
      "y_i=\\mu+\\sigma z_i",
      "E[z_i]=0",
      "\\operatorname{Var}(z_i)=1"
    ],
    "assumptions": "年間所得yの単位は万円である。各観測を独立に生成する。指数分布ではz = e − 1，e ∼ Exp(1)，一様分布ではz ∼ U(−√3, √3)，正規分布ではz ∼ N(0, 1)とする。母平均と母分散をそろえて分布の形を変更する。",
    "fields": [
      {
        "key": "distribution",
        "label": "所得分布の形",
        "value": "exponential",
        "options": [
          [
            "exponential",
            "右に長い裾・指数分布"
          ],
          [
            "normal",
            "正規分布"
          ],
          [
            "uniform",
            "一様分布"
          ]
        ],
        "help": "所得y=μ+σzの分布を選ぶ。どの分布でもzの平均は0，分散は1とする。"
      },
      {
        "key": "N",
        "label": "標本数 N",
        "value": 25,
        "min": 2,
        "max": 5000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "1回の調査で抽出する人数，標本数（sample size）。このN人の所得から平均を計算する。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 1000,
        "min": 20,
        "max": 5000,
        "step": 1,
        "integer": true,
        "hint": "N人の抽出と平均の計算を繰り返す回数",
        "help": "調査を繰り返す回数。N人を抽出して平均を求め，B個の標本平均をヒストグラムにする。"
      },
      {
        "key": "mu",
        "label": "母平均 μ",
        "value": 400,
        "min": 100,
        "max": 1000,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "母集団の平均所得（population mean）。単位は万円。"
      },
      {
        "key": "sigma",
        "label": "母標準偏差 σ",
        "value": 100,
        "min": 1,
        "max": 300,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "母集団の所得の標準偏差（population standard deviation）。単位は万円で，母分散はσ²となる。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 2026,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "乱数シード（random seed）を指定する。同じコード・設定・シードなら，同じデータを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "25人の所得調査",
        "description": "母平均400万円・標準偏差100万円の仮想の所得分布。",
        "params": {}
      },
      {
        "id": "N100",
        "name": "100人の所得調査",
        "description": "標本数Nだけを100にする。",
        "params": {
          "N": 100
        }
      },
      {
        "id": "N400",
        "name": "400人の所得調査",
        "description": "標本数Nだけを400にする。",
        "params": {
          "N": 400
        }
      },
      {
        "id": "normal",
        "name": "同じ平均・分散の正規分布",
        "description": "所得分布の形だけを正規分布にする。",
        "params": {
          "distribution": "normal"
        }
      },
      {
        "id": "more_repetitions",
        "name": "同じ25人・反復回数を増やした調査",
        "description": "Nを25に保ち，反復回数Bを4000にする。",
        "params": {
          "B": 4000
        }
      }
    ],
    "comparisons": [
      "observed_mean",
      "theory_sd",
      "mc_sd"
    ],
    "comparisonLabels": [
      "今回の平均",
      "理論SD",
      "反復SD"
    ]
  },
  {
    "id": "asymptotic",
    "short": "第4回 OLS・デルタ法",
    "title": "回帰係数と係数比の分布を近似できるか？",
    "course": "第4回・OLSの漸近理論とデルタ法",
    "file": "r/04_ols_asymptotics.R",
    "intro": "経験年数と勤続年数の係数を繰り返し推定する。係数には漸近近似（asymptotic approximation），係数比にはデルタ法（delta method）を使う。",
    "model": [
      "y_i=200+\\beta_1x_{i1}+\\beta_2x_{i2}+u_i",
      "h(\\boldsymbol{\\beta})=\\frac{\\beta_1}{\\beta_2}"
    ],
    "assumptions": "経験年数と勤続年数は，第3回の係数の精度と同じ生成式を使う。各反復で説明変数と誤差を両方生成する。u = σeとし，eは標準正規乱数，または平均1の指数乱数から1を引いた値とする。説明変数と誤差，各個人の観測は独立とする。係数比ではβ₂ > 0とする。",
    "fields": [
      {
        "key": "N",
        "label": "小さい標本の人数 N",
        "value": 100,
        "min": 20,
        "max": 500,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "二つの調査のうち，小さい方の人数。N人と4N人の調査を比べる。N=100なら100人と400人となる。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "N人と4N人の各調査を繰り返す回数。毎回，説明変数Xと所得の誤差uを両方生成する。"
      },
      {
        "key": "rho",
        "label": "説明変数の相関 ρ",
        "value": 0.3,
        "min": 0,
        "max": 0.95,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "経験年数と勤続年数の母相関（population correlation）。標本の相関は抽出ごとに異なる。"
      },
      {
        "key": "beta1",
        "label": "経験年数の係数 β₁",
        "value": 8,
        "min": 1,
        "max": 30,
        "step": "any",
        "integer": false,
        "hint": "万円／年",
        "help": "勤続年数が同じ人の間で，経験年数が1年異なるときの平均所得の差。単位は万円／年。"
      },
      {
        "key": "beta2",
        "label": "勤続年数の係数 β₂",
        "value": 12,
        "min": 1,
        "max": 40,
        "step": "any",
        "integer": false,
        "hint": "万円／年",
        "help": "経験年数が同じ人の間で，勤続年数が1年異なるときの平均所得の差。単位は万円／年。"
      },
      {
        "key": "sigma",
        "label": "所得の誤差の標準偏差 σ",
        "value": 40,
        "min": 1,
        "max": 100,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "経験年数と勤続年数が同じ人の所得の標準偏差。どちらの誤差分布でもσを使う。単位は万円。"
      },
      {
        "key": "error_dist",
        "label": "所得の誤差の分布",
        "value": "exponential",
        "options": [
          [
            "exponential",
            "右に長い裾・指数分布"
          ],
          [
            "normal",
            "正規分布"
          ]
        ],
        "help": "所得の誤差u=σeの分布を選ぶ。eは標準正規乱数，または平均1の指数乱数から1を引いた値とする。どちらも平均0・分散1となる。"
      },
      {
        "key": "seed",
        "label": "乱数シード",
        "value": 406,
        "min": 0,
        "max": 2147483646,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "乱数シード（random seed）を指定する。同じコード・設定・シードなら，同じデータを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "右に長い裾の誤差",
        "description": "N = 100と400を比較する。",
        "params": {}
      },
      {
        "id": "normal",
        "name": "正規分布の誤差",
        "description": "誤差分布だけを正規分布にする。",
        "params": {
          "error_dist": "normal"
        }
      },
      {
        "id": "small_denominator",
        "name": "分母の係数が小さい場合",
        "description": "勤続年数の係数β₂だけを3にする。",
        "params": {
          "beta2": 3
        }
      },
      {
        "id": "correlated",
        "name": "相関の高い説明変数",
        "description": "説明変数の相関だけを0.9にする。",
        "params": {
          "rho": 0.9
        }
      }
    ],
    "comparisons": [
      "sd_small",
      "sd_large",
      "delta_sd_large"
    ],
    "comparisonLabels": [
      "Nの係数SD",
      "4Nの係数SD",
      "4Nの比の近似SD"
    ]
  }
];
