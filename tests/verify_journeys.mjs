import assert from 'node:assert/strict';
import {journeys, journeyParameters, journeyStep, journeyKeys} from '../journeys.js';
import {guidance, parameterChanges} from '../guidance.js';
import {lessons} from '../lessons.js';

const cases = [];
for (const lesson of lessons) {
  const config = journeys[lesson.id], records = [];
  assert.equal(config.steps.length, lesson.id === 'prediction' ? 6 : 3);
  assert(guidance[lesson.id].views.some(v => v.id === config.view));
  for (let index = 0; index <= config.steps.length; index++) {
    const params = journeyParameters(lesson, index, records);
    const step = journeyStep(lesson.id,index);
    if (index) {
      assert(step.reference < index);
      assert(!step.title.includes('，') && !step.title.includes('、'));
      assert(guidance[lesson.id].views.some(v => v.id === step.view));
      if (step.extraView) assert(guidance[lesson.id].views.some(v => v.id === step.extraView));
      const before = records[step.reference].params;
      assert.deepEqual(parameterChanges(lesson.fields, before, params).map(c => c.field.key), journeyKeys(step));
      assert.equal(params.seed, before.seed);
      for (const key of journeyKeys(step)) {
      const field = lesson.fields.find(f => f.key === key);
      assert(field);
      if (field.options) assert(field.options.some(([value]) => value === params[key]));
      else assert(params[key] >= field.min && params[key] <= field.max);
      const saved = JSON.stringify(records);
      const chosen = field.options ? field.options[0][0] : field.min;
      assert.equal(journeyParameters(lesson, index, records, {[key]:chosen})[key], chosen);
      assert.equal(JSON.stringify(records), saved);
      }
    }
    records.push({params});
    cases.push({lesson:lesson.id,index,params,reference:step.reference ?? null});
  }
}

// 入力した値を次の段階へ引き継ぎ，分岐では指定した比較相手へ戻る。
const sampling = lessons.find(x => x.id === 'sampling');
const base = {params:journeyParameters(sampling,0,[])};
const edited = {params:journeyParameters(sampling,1,[base],150)};
assert.equal(journeyParameters(sampling,2,[base,edited]).N,400);
assert.equal(journeyParameters(sampling,3,[base,edited]).N,25);
assert.equal(journeyParameters(sampling,3,[base,edited]).distribution,'normal');
const survey = lessons.find(x => x.id === 'survey');
const initial = {params:journeyParameters(survey,0,[])};
const nonresponse = {params:journeyParameters(survey,1,[initial],.3)};
assert.equal(journeyParameters(survey,2,[initial,nonresponse]).r1,.3);
const energy = lessons.find(x => x.id === 'prediction');
assert.equal(journeyParameters(energy,0,[],{constant:122}).constant,122);
assert.equal(journeyParameters(energy,0,[]).constant,140);

console.log(JSON.stringify({status:'passed',modules:lessons.length,steps:cases.length,cases}));
