// 各段階で指定した項目を変更し，ほかの設定は比較相手から引き継ぐ。
export const journeys = {
  survey: {
    start: '300人に所得調査を依頼する。地域A・Bの回答確率はともに60％とし，調査を500回繰り返す。',
    startTitle: '二つの地域の所得調査', view: 'means',
    next: '全体の平均から，気温に応じた電力使用量の予測へ進む。',
    steps: [
      {title:'片方の地域から回答が集まらなければ？', text:'地域Bの回答確率を下げ，回答者の平均所得を計算する。', key:'r1', value:.2, reference:0, view:'means'},
      {title:'依頼する人数を増やせば十分か？', text:'地域Bの回答確率は低いまま，調査を依頼する人数を増やす。', key:'N', value:3000, reference:1, view:'means'},
      {title:'回答の集まり方をそろえたら？', text:'依頼する人数はそのままに，地域Bの回答確率を地域Aと同じ水準に戻す。', key:'r1', value:.6, reference:2, view:'means'}
    ]
  },
  prediction: {
    start:'建物の明日の使用量を，毎日同じ値で予測する。まず予測値を入力し，全体の平均を使う場合と比べる。誤差は「実際の使用量−予測値」の二乗で測る。',
    startTitle:'気温が分からない日の予測', view:'constant',
    startKeys:['constant'], startExtraView:'constant_risk', startExtraInline:true,
    startMetrics:['population_mean','mse_chosen_constant','mse_mean'], runLabel:'この予測で計算', recordName:'計算',
    next:'次は，教育年数に地域の情報も加え，二つの説明変数を使う回帰へ進む。',
    steps:[
      {title:'明日の気温が分かれば？', text:'天気予報で明日の気温が分かった。その気温の日を選び，使用量の分布と平均を表示する。気温別の平均が条件付き期待値（conditional expectation）である。', key:'temperature', value:'35', reference:0, view:'conditional', single:true, metrics:['selected_mean','selected_mse_mean','mse_conditional']},
      {title:'二つの係数だけで予測するには？', text:'管理システムに登録する予測ルールを，切片と傾きで決まる直線a+b(t−20)とする。20℃での予測値と，1℃ごとの差を入力する。母集団の平均二乗誤差が最小となる直線も表示する。この直線が，定数項と気温を使う線形射影（linear projection）である。', keys:['intercept','slope'], values:{intercept:110,slope:1}, reference:1, view:'manual_line', single:true, metrics:['mse_manual','mse_linear']},
      {title:'暑い日の多い気候なら？', text:'同じ建物を，暑い日の多い気候で使う場合を考える。気温の構成だけを変え，最適な直線を求め直す。各気温での使用量の平均とばらつきは保つ。', key:'climate',value:'warm',reference:2,view:'projection',extraView:'climate',extraInline:true,metrics:['mse_linear']},
      {title:'気温の二乗も使えば？', text:'寒さと暑さの両方に対応するため，気温の二乗を加える。z=t−20として，説明変数をxᵢ=(1,zᵢ)からxᵢ=(1,zᵢ,zᵢ²)へ増やす。係数に関して線形な予測の中で，母集団の平均二乗誤差を最小にする。',key:'degree',value:'2',reference:3,view:'projection',metrics:['mse_projection','mse_conditional']},
      {title:'観測データだけで予測式を作るには？',text:'ここからは，記録した気温と使用量から係数を求める。まず30日分を観測し，標本の残差平方和を最小にする最小二乗法（ordinary least squares，OLS）で予測式を作る。',key:'N',value:30,reference:4,view:'ols',single:true},
      {title:'記録を長く続けたら？',text:'同じ建物の観測日数を増やし，OLSで予測式を求め直す。先ほどの観測データを残し，続きのデータを加える。',key:'N',value:300,reference:5,view:'ols'}
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

export function journeyStep(id, index) {
  const config = journeys[id];
  return index ? config.steps[index-1] : {title:config.startTitle,text:config.start,view:config.view,
    keys:config.startKeys || [], extraView:config.startExtraView, extraInline:config.startExtraInline, metrics:config.startMetrics};
}
export function journeyKeys(step) { return step.keys || (step.key ? [step.key] : []); }
export function journeyParameters(lesson, index, records, value) {
  const defaults = Object.fromEntries(lesson.fields.map(field => [field.key, field.value]));
  const step = journeyStep(lesson.id,index);
  const reference = index ? records[step.reference] : {params:defaults};
  if (!reference?.params) throw new Error('比較相手の実行結果がない。');
  const proposed = step.values || (step.key ? {[step.key]:step.value} : {});
  const chosen = value !== undefined && typeof value !== 'object' ? {[step.key]:value} : value || {};
  return {...reference.params,...proposed,...chosen};
}
