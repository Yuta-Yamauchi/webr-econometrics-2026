import { preparation } from './startup.js?v=20261001-energy';

preparation.begin('materials', {fromNavigation: true});
try {
  await import('./app.js?v=20261001-energy');
} catch (error) {
  preparation.fail(error);
}
