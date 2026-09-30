// 図に集計した値と描画記号の意味。実行後の設定・計算値から人数を表示する。
const key = (mark, label, text) => ({mark, label, text});
const density = '縦軸は密度（density）。棒の面積が，その区間に入る値の割合を表す。';
const catalog = {
  survey: {
    composition: {
      title:'母集団・依頼対象者・回答者の地域構成',
      summary:'棒1本が一つの集団を表し，地域Aと地域Bの割合を積み上げている。',
      keys:[key('fill blue','青い部分','地域Aの割合。'),key('fill orange','橙の部分','地域Bの割合。')]
    },
    means: {
      title:'調査を繰り返して得た平均所得の分布',
      summary:'1回の調査で平均所得を一つ求め，繰り返した調査の平均を区間ごとに集計した図。', density,
      keys:[key('fill blue','青い棒','依頼対象者全員の平均所得。'),key('fill orange','橙の棒','回答者だけの平均所得。'),key('dash blue','青い縦の破線','母集団全体の平均所得。'),key('dot orange','橙の縦の点線','回答者集団の平均所得の理論値。')]
    }
  },
  prediction: {
    prediction: {
      title:'教育年数と所得・予測に使う線',
      summary:'灰色の点1つが1人の教育年数と所得を表す。点の重なりを避けるため，横位置を少しずらしている。',
      keys:[key('line blue','青い折れ線','生成式で決まる教育年数別の平均所得。'),key('line orange','橙の直線','母集団で求めた最良の直線予測（線形射影）。'),key('dash ink','黒い破線','今回の標本からOLSで求めた直線。'),key('dot green','緑の水平線','教育年数で分けない母集団全体の平均所得。')]
    },
    mse: {
      title:'三つの予測方法の平均二乗誤差',
      summary:'棒1本が一つの予測方法を表す。高さは，母集団で計算した「所得−予測値」の二乗の平均（mean squared error，MSE）。',
      keys:[key('fill blue','青い部分','同じ教育年数の中での所得の分散。'),key('fill orange','橙の部分','教育年数別の平均所得と予測値の差の二乗を，人口比率で平均した量。')]
    },
    projection_error: {
      title:'教育年数別の平均所得と直線予測の差',
      summary:'棒1本が一つの教育年数を表す。高さは「生成式で決まる平均所得−母集団の線形射影による予測値」。',
      keys:[key('fill blue','青い棒','その教育年数での予測のずれ。単位は万円。'),key('line ink','0の水平線','平均所得と直線予測が等しい位置。')]
    }
  },
  auxiliary: {
    raw: {
      title:'1人ずつの教育年数と所得',
      summary:'点1つが1人を表す。横軸は教育年数，縦軸は年間所得。',
      keys:[key('series blue','青い丸・実線','丸は地域Aの1人。実線は地域Aの生成式で決まる平均所得。'),key('series orange triangle','橙の三角・実線','三角は地域Bの1人。実線は地域Bの生成式で決まる平均所得。'),key('dash ink','黒い破線','二つの地域をまとめ，今回の標本から求めた単回帰の直線。')]
    },
    centered: {
      title:'地域平均との差をとった教育年数と所得',
      summary:'点1つが1人を表す。両軸とも「本人の値−本人が属する地域の標本平均」。',
      keys:[key('point blue','青い丸','地域Aの1人の平均との差。'),key('point orange triangle','橙の三角','地域Bの1人の平均との差。'),key('dash ink','黒い破線','所得の平均との差を，教育年数の平均との差に回帰した直線。'),key('dot gray','0の補助線','本人の値が地域の標本平均と等しい位置。')]
    },
    coefficients: {
      title:'調査ごとに推定した教育年数の係数',
      summary:'1回の調査から単回帰と重回帰の係数を一つずつ求め，繰り返した推定値を集計した図。', density,
      keys:[key('fill orange','橙の棒','地域を区別しない単回帰の係数。'),key('fill blue','青い棒','地域を説明変数に加えた重回帰の係数。'),key('dash orange','橙の縦の破線','単回帰の母集団での係数。'),key('dash blue','青い縦の破線','生成式の教育年数の係数β。')]
    }
  },
  precision: {
    predictors: {
      title:'1人ずつの経験年数と勤続年数',
      summary:'点1つが1人を表す。横軸は仕事の経験年数，縦軸は現在の企業での勤続年数。',
      keys:[key('point blue','青い点','所得を繰り返し生成するときに固定する説明変数。')]
    },
    beta1: {
      title:'繰り返し推定した経験年数の係数',
      summary:'同じ人の経験年数・勤続年数を固定し，所得の誤差を生成し直すたびに求めた経験年数の係数。', density,
      keys:[key('fill blue','青い棒','各回の推定値を集計した分布。'),key('line orange','橙の曲線','この説明変数の下での係数の理論上の正規分布。'),key('dash ink','黒い縦の破線','所得の生成式に設定した係数β₁。')]
    },
    beta2: {
      title:'繰り返し推定した勤続年数の係数',
      summary:'同じ人の経験年数・勤続年数を固定し，所得の誤差を生成し直すたびに求めた勤続年数の係数。', density,
      keys:[key('fill blue','青い棒','各回の推定値を集計した分布。'),key('line orange','橙の曲線','この説明変数の下での係数の理論上の正規分布。'),key('dash ink','黒い縦の破線','所得の生成式に設定した係数β₂。')]
    },
    variance: {
      title:'残差から推定した誤差分散の分布',
      summary:'1回の回帰から，残差平方和RSSをNとN−3で割った値を求める。3は定数項を含む係数の数。', density,
      keys:[key('fill orange','橙の棒','RSS/Nを繰り返し計算した分布。'),key('fill blue','青い棒','自由度で補正したRSS/(N−3)の分布。'),key('dash ink','黒い縦の破線','所得の生成式に設定した誤差の分散σ²。')]
    }
  },
  sampling: {
    sample: {
      title:'1回の調査で得た個人の所得',
      summary:'1人につき一つの所得を，金額の区間ごとに集計した図。', density,
      keys:[key('fill blue','青い棒','今回の標本に含まれる人の所得。'),key('line blue','青い曲線','抽出元の母集団の所得分布。'),key('dash ink','黒い縦の破線','母集団の平均所得μ。'),key('line orange','橙の縦線','今回の標本の平均所得。')]
    },
    means: {
      title:'調査を繰り返して得た平均所得の分布',
      summary:'1回の調査で平均所得を一つ求め，繰り返した調査の平均を区間ごとに集計した図。', density,
      keys:[key('fill blue','青い棒','各回の標本平均を集計した分布。'),key('line orange','橙の曲線','標本平均の分布を表す正規近似。'),key('dash ink','黒い縦の破線','母集団の平均所得μ。')]
    },
    standardized: {
      title:'標本平均の推定誤差を標準化した分布',
      summary:'各回の標本平均から母平均μを引き，標本平均の標準偏差σ/√Nで割った値を集計する。', density,
      keys:[key('fill blue','青い棒','標準化した標本平均の分布。'),key('line orange','橙の曲線','平均0・分散1の標準正規分布。')]
    }
  },
  asymptotic: {
    coefficients: {
      title:'調査人数別の経験年数係数の分布',
      summary:'人数の異なる二つの調査を繰り返し，各回で経験年数の係数を求めた図。説明変数と所得を毎回生成する。', density,
      keys:[key('fill orange','橙の棒','N人の調査から推定した係数。'),key('fill blue','青い棒','4N人の調査から推定した係数。'),key('dash ink','黒い縦の破線','所得の生成式に設定した係数β₁。')]
    },
    standardized: {
      title:'経験年数係数の推定誤差を標準化した分布',
      summary:'推定した経験年数の係数から設定値β₁を引き，漸近理論の標準偏差で割った値を集計する。', density,
      keys:[key('fill blue','青い棒','標準化した係数の推定誤差。'),key('line orange','橙の曲線','平均0・分散1の標準正規分布。')]
    },
    influence: {
      title:'OLSの推定誤差と一次近似',
      summary:'1点が1回の調査を表す。同じ調査で求めた「経験年数係数の推定値−設定値」と，その一次近似を組にしている。',
      keys:[key('axis','横軸','母集団の二次モーメントQを使った近似値。'),key('axis vertical','縦軸','実際のOLSの推定誤差。両軸とも√n倍した値。'),key('dash ink','斜めの破線','近似値と推定誤差が同じ値となる位置。')]
    },
    ratio: {
      title:'係数比の推定誤差と一次近似',
      summary:'係数比は「経験年数の係数÷勤続年数の係数」。1点は，同じ調査から得た比の推定誤差と，その近似値の組。',
      keys:[key('axis','横軸','デルタ法による推定誤差の一次近似。'),key('axis vertical','縦軸','推定した係数比−生成式に設定した係数比。'),key('dash ink','斜めの破線','近似値と推定誤差が同じ値となる位置。')]
    }
  }
};

const number = value => Number(value).toLocaleString('ja-JP', {maximumFractionDigits:4});

export function figureDescription(kind, view, settings = {}, metrics = {}) {
  const definition = catalog[kind]?.[view];
  if (!definition) throw new Error(`図の定義がない：${kind}/${view}`);
  const result = {...definition, keys:definition.keys.map(item => ({...item}))};
  const n = number(settings.N), b = number(settings.B);
  if (kind === 'survey') {
    result.context = view === 'composition' ? `1回の調査：依頼対象者${n}人・回答者${number(metrics.respondents)}人` : `1回${n}人に依頼・調査を${b}回`;
    if (view === 'means' && Number(metrics.valid_repetitions) !== Number(settings.B)) result.context += `・回答者平均を得た調査${number(metrics.valid_repetitions)}回`;
  } else if (kind === 'prediction') {
    result.context = view === 'prediction' ? `${n}人の標本と母集団の理論値` : '生成式と人口比率から計算した母集団の理論値';
  } else if (kind === 'auxiliary') {
    result.context = `各地域${number(settings.n_group)}人・合計${number(2 * Number(settings.n_group))}人`;
    result.context += view === 'coefficients' ? `の調査を${b}回` : 'の1回の調査';
  } else if (kind === 'precision') {
    result.context = view === 'predictors' ? `1回の標本：${n}人` : `${n}人の説明変数を固定・所得の誤差を${b}回生成`;
  } else if (kind === 'sampling') {
    result.context = view === 'sample' ? `1回の標本：${n}人` : `1回${n}人・調査を${b}回`;
    if (view === 'means' && settings.distribution === 'normal') result.keys[1].text = '標本平均の理論上の正規分布。';
  } else {
    result.context = view === 'coefficients' ? `${n}人・${number(4 * Number(settings.N))}人の調査を各${b}回` : `1回${number(4 * Number(settings.N))}人（4N人）・調査を${b}回`;
  }
  return result;
}

export function figureTitle(kind, view) { return catalog[kind][view].title; }
