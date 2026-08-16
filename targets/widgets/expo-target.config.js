/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'widget',
  name: 'MonthlyPlanningWidgets',
  // must match the app's own group so the widgets can read the shared snapshot
  entitlements: {
    'com.apple.security.application-groups': ['group.com.owaiskhan.monthlyplanning'],
  },
};
