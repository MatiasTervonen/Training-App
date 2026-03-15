const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withApplicationId(config) {
  return withAppBuildGradle(config, (config) => {
    const packageName =
      config.android?.package || "com.layer100crypto.MyTrack";
    config.modResults.contents = config.modResults.contents
      .replace(/applicationId '.*'/, `applicationId '${packageName}'`)
      .replace(/namespace '.*'/, `namespace 'com.layer100crypto.MyTrack'`);
    return config;
  });
};
