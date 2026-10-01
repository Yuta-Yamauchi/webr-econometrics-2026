import { figureTitle } from './figures.js?v=20261001-energy';

// 比較図の順序は r/compare_runs.R の出力順序と対応する。
export const guidance = {
  survey: {
    views: [
      {id:'composition'},
      {id:'means'}
    ],
    metrics:['sample_response_share','respondent_mean','mc_respondent']
  },
  prediction: {
    views: [
      {id:'constant'}, {id:'constant_risk'}, {id:'conditional'}, {id:'manual_line'},
      {id:'projection'}, {id:'climate'}, {id:'ols'}
    ],
    metrics:['mse_chosen_constant','mse_linear','mse_projection']
  },
  auxiliary: {
    views: [
      {id:'raw'},
      {id:'centered'},
      {id:'coefficients'}
    ],
    metrics:['raw','full','auxiliary']
  },
  precision: {
    views: [
      {id:'predictors'},
      {id:'beta1'},
      {id:'beta2'},
      {id:'variance'}
    ],
    metrics:['sample_correlation','theory_sd1','mc_sd1']
  },
  sampling: {
    views: [
      {id:'sample'},
      {id:'means'},
      {id:'standardized'}
    ],
    metrics:['observed_mean','theory_sd','mc_sd']
  },
  asymptotic: {
    views: [
      {id:'coefficients'},
      {id:'standardized'},
      {id:'influence'},
      {id:'ratio'}
    ],
    metrics:['ratio_target','delta_sd_large','delta_median_error_large']
  }
};

for (const [kind, config] of Object.entries(guidance)) {
  for (const view of config.views) view.title = figureTitle(kind, view.id);
}

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
