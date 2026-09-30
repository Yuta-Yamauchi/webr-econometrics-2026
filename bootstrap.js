import { preparation } from './startup.js';

preparation.begin('materials', {fromNavigation: true});
try {
  await import('./app.js?v=20260930-loading');
} catch (error) {
  preparation.fail(error);
}
