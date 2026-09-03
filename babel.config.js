/**
 * Metro applies babel-preset-expo on its own, so this file exists for the
 * things that don't go through Metro — Jest, mainly, which needs to be told how
 * to read TypeScript.
 */
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};
