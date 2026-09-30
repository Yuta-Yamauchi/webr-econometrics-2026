// Generated from simulation_settings.json by tests/prepare_cases.py
export const lessons = [
  {
    "id": "survey",
    "short": "第1回 所得調査",
    "title": "回答者の平均は誰の所得を表すか",
    "course": "第1回・母集団と標本",
    "file": "r/01_income_survey.R",
    "intro": "地域の就業支援策を検討するため，働く人々の平均年間所得を調べる場面を想定する。調査へ招待した人と回答した人を区別し，母集団（population）の構成と標本（sample）の構成を比較する。",
    "model": [
      "y_i=\\mu_0+\\gamma a_i+u_i",
      "\\Pr(a_i=1)=p",
      "\\Pr(R_i=1\\mid a_i=g)=r_g"
    ],
    "assumptions": "aは地域Aで0・地域Bで1，Rは回答した場合に1となる。年間所得yの単位は万円である。u = σ(e − 1)，e ∼ Exp(1) とし，地域・回答の抽選から独立に生成する。N人を母集団から独立に抽出して調査へ招待する。",
    "fields": [
      {
        "key": "N",
        "label": "招待する人数 N",
        "value": 300,
        "min": 50,
        "max": 5000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "1回の調査へ招待する人数である。各人が回答するかどうかは別に抽選するため，実際の回答者数はN人以下となる。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "標本生成・推定を繰り返す回数",
        "help": "N人を抽出し，所得と回答を生成する調査全体をB回繰り返す。反復回数（Monte Carlo replications）を指定する。"
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
        "help": "母集団（population）で地域Bに住む人の割合である。0.4なら地域Bが40％，地域Aが60％となる。"
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
        "help": "地域Aの平均年間所得である。単位は万円であり，地域Bの平均はこの値に所得差γを加えた値となる。"
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
        "help": "地域Bの平均所得から地域Aの平均所得を引いた値である。γ=120なら，地域Bの平均が120万円高い設定となる。"
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
        "help": "同じ地域の中での所得の標準偏差（standard deviation）である。生成式u=σ(e−1)のσを指定する。単位は万円である。"
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
        "help": "招待された地域Aの人が回答する確率である。0.6は各人が60％の確率で回答する設定である。"
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
        "help": "招待された地域Bの人が回答する確率である。所得の誤差とは，地域を与えた下で独立に回答を抽選する。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
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
        "name": "回答確率の違い・多い招待者",
        "description": "回答確率の違いを保ち，招待者を3000人にする。",
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
    "short": "第2回 所得の予測",
    "title": "教育年数が分かると所得予測はどう変わるか",
    "course": "第2回・条件付き期待値と線形射影",
    "file": "r/02_income_prediction.R",
    "intro": "就業支援の対象者について，教育年数から年間所得を予測する場面を想定する。全員に同じ平均を使う予測，教育年数別の条件付き期待値（conditional expectation），少数の係数を使う線形射影（linear projection）を比較する。",
    "model": [
      "y_i=100+20s_i+\\kappa(s_i-12)^2+\\varepsilon_i",
      "s_i\\in\\{9,12,14,16\\}"
    ],
    "assumptions": "sは教育年数，yは年間所得（万円）である。14・16年の人口比率の合計をpとし，9・12年の各比率を(1 − p)/2，14・16年の各比率をp/2とする。ε ∼ N(0, σ²) を教育年数から独立に生成する。",
    "fields": [
      {
        "key": "N",
        "label": "標本数 N",
        "value": 240,
        "min": 30,
        "max": 3000,
        "step": 1,
        "integer": true,
        "hint": "",
        "help": "母集団から独立に生成する人数である。このN人の教育年数と所得から，OLSの直線を1本求める。"
      },
      {
        "key": "curvature",
        "label": "平均関数の曲がり κ",
        "value": 3,
        "min": 0,
        "max": 6,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "条件付き平均m(s)=100+20s+κ(s−12)²の二次項の係数である。κ=0では平均関数が直線となる。"
      },
      {
        "key": "p",
        "label": "14・16年の人口比率 p",
        "value": 0.4,
        "min": 0.05,
        "max": 0.95,
        "step": "any",
        "integer": false,
        "hint": "",
        "help": "教育年数14年・16年の人の合計比率である。それぞれp/2，9年・12年の人はそれぞれ(1−p)/2とする。"
      },
      {
        "key": "sigma",
        "label": "所得の誤差の標準偏差 σ",
        "value": 35,
        "min": 1,
        "max": 100,
        "step": "any",
        "integer": false,
        "hint": "万円",
        "help": "同じ教育年数の人の所得の標準偏差である。平均関数m(s)に加える正規誤差εの標準偏差を，万円単位で指定する。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "曲線となる平均関数",
        "description": "κ = 3の条件付き平均と，最もよく当てはまる直線を比較する。",
        "params": {}
      },
      {
        "id": "linear",
        "name": "直線となる平均関数",
        "description": "κだけを0にする。",
        "params": {
          "curvature": 0
        }
      },
      {
        "id": "composition",
        "name": "教育年数の構成が異なる地域",
        "description": "平均関数を保ち，14・16年の人口比率を0.8にする。",
        "params": {
          "p": 0.8
        }
      },
      {
        "id": "large",
        "name": "同じ母集団・大きな標本",
        "description": "標本数だけを2000にする。",
        "params": {
          "N": 2000
        }
      }
    ],
    "comparisons": [
      "population_slope",
      "sample_slope",
      "mse_linear"
    ],
    "comparisonLabels": [
      "射影の傾き",
      "OLSの傾き",
      "射影の母集団MSE"
    ]
  },
  {
    "id": "auxiliary",
    "short": "第3回 補助回帰",
    "title": "地域の違いを除くと何が残るか",
    "course": "第3回・二地域の教育年数と所得",
    "file": "r/03_auxiliary_regression.R",
    "intro": "教育年数と所得の関係を，賃金水準の異なる二つの地域をまとめて調べる場面を想定する。全体の単回帰（simple regression）と，地域差を除く補助回帰（auxiliary regression）を比較する。",
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
        "help": "地域A・Bのそれぞれから抽出する人数である。80なら地域Aが80人，地域Bが80人で，総標本数Nは160となる。"
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
        "help": "地域BとAの平均教育年数の差である。生成式d=12+δa+vに入り，δ=2なら地域Bの平均教育年数が2年長い設定となる。"
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
        "help": "同じ地域で教育年数が1年異なる二人の条件付き平均所得の差である。生成式のβを万円／年で指定する。"
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
        "help": "教育年数を同じにしたときの，地域BとAの条件付き平均所得の差である。生成式y=100+βd+γa+uのγを万円単位で指定する。"
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
        "help": "同じ地域内の教育年数の標準偏差である。生成式d=12+δa+vのvの標準偏差を，年単位で指定する。"
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
        "help": "教育年数と地域が同じ人の所得の標準偏差である。所得に加える誤差uの標準偏差を，万円単位で指定する。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 300,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "標本生成・推定を繰り返す回数",
        "help": "各地域の人数を固定し，教育年数の誤差vと所得の誤差uを新しく生成して，回帰係数をB回求める。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
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
        "name": "所得の地域差なし",
        "description": "γだけを0にする。",
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
        "name": "同じ地域差・多い観測",
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
    "title": "経験年数・勤続年数の係数はどの程度安定するか",
    "course": "第3回・行列OLSと固定した説明変数",
    "file": "r/03_ols_precision.R",
    "intro": "賃金データで，経験年数と現在の企業での勤続年数を同時に使う場面を想定する。説明変数の相関と人数を変更し，最小二乗法（ordinary least squares，OLS）による係数の分布を表示する。",
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
        "help": "説明変数を最初に生成する人数である。反復中は，このN人の経験年数と勤続年数を固定する。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "標本生成・推定を繰り返す回数",
        "help": "説明変数Xを固定し，所得の誤差uだけを生成し直して，OLSをB回計算する。"
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
        "help": "経験年数と勤続年数の母相関（population correlation）である。生成式で二つの年数が同じ方向に動く度合いを指定する。一つの標本の相関は乱数によって変わる。"
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
        "help": "勤続年数を同じにしたとき，経験年数が1年異なる二人の条件付き平均所得の差である。単位は万円／年であり，生成式の係数を指定する。"
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
        "help": "経験年数を同じにしたとき，勤続年数が1年異なる二人の条件付き平均所得の差である。単位は万円／年であり，生成式の係数を指定する。"
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
        "help": "経験年数と勤続年数が同じ人の所得の標準偏差である。正規誤差uの標準偏差を，万円単位で指定する。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
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
        "name": "高い相関・多い観測",
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
    "title": "平均所得は標本数を増やすとどう安定するか",
    "course": "第4回・大数の法則と中心極限定理",
    "file": "r/01_sampling.R",
    "intro": "所得調査から平均所得を推定する場面を想定する。所得分布と人数を変更し，大数の法則（law of large numbers）・中心極限定理（central limit theorem）に対応する標本平均の分布を表示する。",
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
        "help": "所得y=μ+σzの分布の形を選ぶ。zはどの選択肢でも平均0・分散1にそろえているため，μとσの意味は共通である。"
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
        "help": "1回の所得調査で抽出する人数，標本数（sample size）である。このN人の所得から標本平均を一つ計算する。"
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
        "help": "N人の所得の生成と標本平均の計算をB回繰り返す。ヒストグラムにはB個の標本平均を使う。"
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
        "help": "所得を生成する母集団の平均（population mean）である。単位は万円であり，y=μ+σzの中心を指定する。"
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
        "help": "所得を生成する母集団の標準偏差（population standard deviation）である。単位は万円であり，母分散はσ²となる。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
      }
    ],
    "scenarios": [
      {
        "id": "base",
        "name": "25人の所得調査",
        "description": "母平均400万円・標準偏差100万円の仮想的な所得分布。",
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
        "name": "同じ25人・多い反復",
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
    "title": "所得の係数・係数比はどう近似できるか",
    "course": "第4回・OLSの漸近理論とデルタ法",
    "file": "r/04_ols_asymptotics.R",
    "intro": "賃金データから，経験年数と勤続年数の係数・係数比を求める場面を想定する。人数と誤差分布を変更し，OLSの漸近近似（asymptotic approximation）とデルタ法（delta method）の一次近似を表示する。",
    "model": [
      "y_i=200+\\beta_1x_{i1}+\\beta_2x_{i2}+u_i",
      "h(\\boldsymbol{\\beta})=\\frac{\\beta_1}{\\beta_2}"
    ],
    "assumptions": "経験年数・勤続年数の生成式は第3回の係数の精度と同じである。今回は説明変数と誤差を両方取り直す。u = σeとし，eは標準正規分布または平均1の指数分布を1だけ中心化した分布から独立に生成する。係数比の設定ではβ₂ > 0とする。",
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
        "help": "比較する小さい標本の人数である。同じ設定でN人と4N人を比較する。N=100なら100人と400人の標本を作る。"
      },
      {
        "key": "B",
        "label": "反復回数 B",
        "value": 500,
        "min": 20,
        "max": 2000,
        "step": 1,
        "integer": true,
        "hint": "標本生成・推定を繰り返す回数",
        "help": "N人と4N人の各設定でB回ずつ反復する。毎回，説明変数Xと所得の誤差uの両方を新しく生成する。"
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
        "help": "経験年数と勤続年数の母相関（population correlation）である。生成式で二つの年数が同じ方向に動く度合いを指定する。一つの標本の相関は乱数によって変わる。"
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
        "help": "勤続年数を同じにしたとき，経験年数が1年異なる二人の条件付き平均所得の差である。単位は万円／年であり，生成式の係数を指定する。"
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
        "help": "経験年数を同じにしたとき，勤続年数が1年異なる二人の条件付き平均所得の差である。単位は万円／年であり，生成式の係数を指定する。"
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
        "help": "説明変数を与えた下での所得の誤差uの標準偏差である。正規誤差と指数誤差で，同じσを万円単位で使う。"
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
        "help": "所得の誤差u=σeの分布を選ぶ。eは標準正規分布，または平均1の指数分布から1を引いた分布であり，どちらも平均0・分散1となる。"
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
        "help": "乱数シード（random seed）は乱数列の開始点を指定する値である。同じコード・設定・シードを使うと，同じ生成データを再現できる。"
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
