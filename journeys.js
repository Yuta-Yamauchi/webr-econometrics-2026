// 各段階では，比較相手の設定から一つの項目だけを変更する。
export const journeys = {
  survey: {
    start: '300人に所得調査を依頼する。地域A・Bの回答確率はともに60％とし，調査を500回繰り返す。',
    startTitle: '二つの地域の所得調査', view: 'means',
    next: '教育年数が分かれば，個人の所得をどこまで予測できるか？',
    steps: [
      {title:'片方の地域から回答が集まらなければ？', text:'地域Bの回答確率を下げ，回答者の平均所得を計算する。', key:'r1', value:.2, reference:0, view:'means'},
      {title:'依頼する人数を増やせば十分か？', text:'地域Bの回答確率は低いまま，調査を依頼する人数を増やす。', key:'N', value:3000, reference:1, view:'means'},
      {title:'回答の集まり方をそろえたら？', text:'依頼する人数はそのままに，地域Bの回答確率を地域Aと同じ水準に戻す。', key:'r1', value:.6, reference:2, view:'means'}
    ]
  },
  prediction: {
    start: '240人の教育年数と所得から，予測に使う直線を求める。教育年数別の平均所得と並べて表示する。',
    startTitle: '教育年数からの所得予測', view:'prediction',
    next:'教育年数も所得も異なる地域を，一緒に分析するとどうなるか？',
    steps:[
      {title:'調査人数を増やせば直線で十分か？', text:'所得と教育年数の関係はそのままに，調査人数を増やして直線を引き直す。', key:'N', value:2000, reference:0, view:'prediction'},
      {title:'教育年数の長い人が多い地域では？', text:'教育年数が14年・16年の人の割合を増やす。教育年数別の平均所得は変えずに，予測の直線を引き直す。', key:'p', value:.8, reference:1, view:'prediction'},
      {title:'平均所得と教育年数が直線の関係なら？', text:'平均関数の二次項を0にする。教育年数が1年増えるごとの平均所得の差を一定にする。', key:'curvature', value:0, reference:2, view:'prediction'}
    ]
  },
  auxiliary: {
    start:'二つの地域から80人ずつ調べる。地域Bは平均教育年数が2年長く，同じ教育年数でも平均所得が80万円高い。',
    startTitle:'地域をまとめた教育年数と所得', view:'raw',
    next:'似た動きをする説明変数を，一緒に使うとどうなるか？',
    steps:[
      {title:'全体と地域内で傾きが逆になるか？', text:'教育年数が長い地域Bで，同じ教育年数の人の所得が低くなる設定に変える。所得差を負の値にする。', key:'gamma', value:-120, reference:0, view:'raw', extraView:'centered'},
      {title:'教育年数の地域差がなければ？', text:'所得の地域差を残し，両地域の平均教育年数をそろえる。', key:'delta', value:0, reference:1, view:'raw'},
      {title:'同じ地域の人の教育年数が近ければ？', text:'02の地域差がある設定に戻り，地域内の教育年数のばらつきを小さくする。', key:'sigma_v', value:.25, reference:1, view:'coefficients'}
    ]
  },
  precision: {
    start:'80人の経験年数と勤続年数を使い，所得の回帰係数を求める。この80人の説明変数を固定し，所得の誤差を500回生成する。',
    startTitle:'経験年数と勤続年数の係数', view:'beta1',
    next:'調査人数と推定値のばらつきの関係を，標本平均でも調べる。',
    steps:[
      {title:'経験が長い人ほど勤続も長ければ？', text:'経験の長い人ほど勤続年数も長い標本を作る。二つの説明変数の相関を高くする。', key:'rho', value:.95, reference:0, view:'beta1', extraView:'predictors'},
      {title:'同じ傾向の人を多く集めたら？', text:'前の相関を保って人数を増やす。経験年数と勤続年数の係数を推定する。', key:'N', value:320, reference:1, view:'beta1'},
      {title:'経験と勤続の組合せが多様なら？', text:'人数はそのままに，経験年数と勤続年数の相関を下げる。', key:'rho', value:.3, reference:2, view:'beta1'}
    ]
  },
  sampling: {
    start:'平均400万円の母集団から25人を抽出し，平均所得を計算する。これを1,000回繰り返す。',
    startTitle:'25人で調べる平均所得', view:'means',
    next:'人数を増やすと，回帰係数や係数比の分布はどう変わるか？',
    steps:[
      {title:'調査の予算を増やせたら？', text:'1回に調べる人数を増やす。母集団の所得分布は同じまま，平均所得を繰り返し計算する。', key:'N', value:100, reference:0, view:'means'},
      {title:'さらに人数を増やす価値はあるか？', text:'調べる人数をさらに増やす。変更前と同じ目盛りで，標本平均の分布を表示する。', key:'N', value:400, reference:1, view:'means'},
      {title:'所得分布が左右対称なら？', text:'最初の25人の調査に戻る。母平均と母分散をそろえたまま，所得分布を正規分布に変える。', key:'distribution', value:'normal', reference:0, view:'standardized', extraView:'sample'}
    ]
  },
  asymptotic: {
    start:'100人と400人の調査で，経験年数と勤続年数の係数を推定する。各調査では説明変数と所得を新しく生成し，500回繰り返す。',
    startTitle:'調査人数と回帰係数の分布', view:'coefficients',
    next:'人数・回答確率・説明変数の関係を，自分の設定でも試せる。',
    steps:[
      {title:'大規模な調査なら近似はどうなるか？', text:'二つの調査の人数を増やす。下の人数Nと，その4倍の人数を比較する。', key:'N', value:400, reference:0, view:'coefficients', extraView:'standardized'},
      {title:'経験1年分の所得差は勤続何年分か？', text:'この換算を係数比β₁/β₂で表す。勤続年数の係数β₂を小さくし，係数比とその一次近似を計算する。', key:'beta2', value:3, reference:1, view:'ratio'},
      {title:'少人数でも係数比を近似できるか？', text:'勤続年数の係数が小さいまま，調査人数を減らす。係数比の推定誤差と一次近似を表示する。', key:'N', value:100, reference:2, view:'ratio'}
    ]
  }
};

export function journeyParameters(lesson, index, records, value) {
  if (index === 0) return Object.fromEntries(lesson.fields.map(field => [field.key, field.value]));
  const step = journeys[lesson.id].steps[index - 1];
  const reference = records[step.reference];
  if (!reference?.params) throw new Error('比較相手の実行結果がない。');
  return {...reference.params, [step.key]:value ?? step.value};
}
