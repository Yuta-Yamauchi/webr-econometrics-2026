// 操作のヒント。ボタンは指定した一項目だけを変更し，実行は学生が行う。
export const guidance = {
  survey: {
    question: '地域によって回答の集まり方が違うと，所得調査の結果はどう変わるか？',
    actions: [
      {key:'r1', value:.2, label:'地域Bの回答確率を0.2にする', view:'composition'},
      {key:'N', value:3000, label:'招待する人数を3000人にする', view:'means'},
      {key:'gap', value:0, label:'地域の所得差を0にする', view:'means'}
    ],
    views: [
      {id:'composition', title:'地域の構成', focus:'回答者に占める地域A・地域Bの割合を見比べる。'},
      {id:'means', title:'平均所得の標本分布', focus:'分布の位置・広がりと，平均を示す縦線を見比べる。'}
    ],
    metrics:['sample_response_share','respondent_mean','mc_respondent']
  },
  prediction: {
    question: '教育年数と平均所得の関係が直線から曲がると，直線による予測はどう変わるか？',
    actions: [
      {key:'curvature', value:0, label:'平均関数の曲がりを0にする', view:'prediction'},
      {key:'p', value:.8, label:'教育年数14・16年の人口比率を0.8にする', view:'prediction'},
      {key:'N', value:2000, label:'標本数を2000人にする', view:'prediction'}
    ],
    views: [
      {id:'prediction', title:'教育年数・所得の予測', focus:'条件付き期待値・母集団の線形射影・標本のOLSを見比べる。'},
      {id:'mse', title:'三つの予測の二乗誤差', focus:'三つの予測方法について，棒の高さと内訳を見比べる。'},
      {id:'projection_error', title:'条件付き平均・線形射影の差', focus:'同じ教育年数の棒を，0の線を基準に見比べる。'}
    ],
    metrics:['population_slope','sample_slope','mse_linear']
  },
  auxiliary: {
    question: '教育年数の地域差を残して所得の地域差をなくすと，回帰直線はどう変わるか？',
    actions: [
      {key:'gamma', value:0, label:'所得の地域差 γを0にする', view:'raw'},
      {key:'delta', value:0, label:'教育年数の地域差 δを0にする', view:'raw'},
      {key:'sigma_v', value:.25, label:'地域内の教育年数の標準偏差を0.25にする', view:'coefficients'}
    ],
    views: [
      {id:'raw', title:'地域差を含む比較', focus:'地域別の点の位置と，全体の単回帰の傾きを見比べる。'},
      {id:'centered', title:'地域平均との差・補助回帰', focus:'地域平均との差をとった点と，補助回帰の傾きを見比べる。'},
      {id:'coefficients', title:'係数の標本分布', focus:'単回帰・重回帰それぞれの分布の位置と広がりを見比べる。'}
    ],
    metrics:['raw','full','auxiliary']
  },
  precision: {
    question: '経験年数と勤続年数が似た動きをすると，それぞれの係数はどの程度ばらつくか？',
    actions: [
      {key:'rho', value:.95, label:'説明変数の相関 ρを0.95にする', view:'beta1'},
      {key:'N', value:320, label:'標本数を320人にする', view:'beta1'},
      {key:'N', value:12, label:'標本数を12人にする', view:'variance'}
    ],
    views: [
      {id:'predictors', title:'説明変数の組合せ', focus:'経験年数・勤続年数の組合せが平面のどこに集まるかを見比べる。'},
      {id:'beta1', title:'経験年数係数の標本分布', focus:'係数の分布の広がりと，生成式の係数を示す縦線を見比べる。'},
      {id:'beta2', title:'勤続年数係数の標本分布', focus:'係数の分布の広がりと，生成式の係数を示す縦線を見比べる。'},
      {id:'variance', title:'残差分散の標本分布', focus:'二つの分散推定値の分布を，誤差の分散を示す縦線と見比べる。'}
    ],
    metrics:['sample_correlation','theory_sd1','mc_sd1']
  },
  sampling: {
    question: '所得調査の人数を増やすと，平均所得のばらつきはどう変わるか？',
    actions: [
      {key:'N', value:100, label:'標本数 Nを100人にする', view:'means'},
      {key:'N', value:400, label:'標本数 Nを400人にする', view:'means'},
      {key:'distribution', value:'normal', label:'所得分布を正規分布にする', view:'standardized'}
    ],
    views: [
      {id:'sample', title:'母集団・一つの標本', focus:'母集団の密度と，今回の標本から作った棒を見比べる。'},
      {id:'means', title:'標本平均の標本分布', focus:'同じ横軸の上で，標本平均の分布の広がりを見比べる。'},
      {id:'standardized', title:'中心化・拡大と正規近似', focus:'中心化・拡大した分布の形を，標準正規密度と見比べる。'}
    ],
    metrics:['observed_mean','theory_sd','mc_sd']
  },
  asymptotic: {
    question: '係数比の分母になる係数が小さいと，一次近似との対応はどう変わるか？',
    actions: [
      {key:'beta2', value:3, label:'分母の係数 β₂を3にする', view:'ratio'},
      {key:'error_dist', value:'normal', label:'所得の誤差を正規分布にする', view:'standardized'},
      {key:'rho', value:.9, label:'説明変数の相関 ρを0.9にする', view:'coefficients'}
    ],
    views: [
      {id:'coefficients', title:'標本数・係数の分布', focus:'N人・4N人それぞれの係数の分布を見比べる。'},
      {id:'standardized', title:'中心化・標準化した係数・4N人', focus:'標準化した係数の分布と標準正規密度を見比べる。'},
      {id:'influence', title:'OLSの一次近似・4N人', focus:'推定誤差と一次近似の点が，両者の等しい破線からどれだけ離れるかを見る。'},
      {id:'ratio', title:'係数比の一次近似・4N人', focus:'係数比の推定誤差と一次近似の点を，同じ目盛りで見比べる。'}
    ],
    metrics:['ratio_target','delta_sd_large','delta_median_error_large']
  }
};

export function parameterChanges(fields, before, after) {
  if (!before || !after) return [];
  return fields.filter(f => String(before[f.key]) !== String(after[f.key]))
    .map(f => ({field:f, before:before[f.key], after:after[f.key]}));
}

export function changeKind(fields, before, after) {
  if (!before) return '最初の実行';
  const changes = parameterChanges(fields, before, after);
  if (!changes.length) return '同じ設定・同じシード';
  if (changes.every(c => c.field.key === 'seed')) return '乱数シードのみ変更';
  return changes.some(c => c.field.key === 'seed') ? '設定・乱数シードを変更' : '設定を変更・同じシード';
}
