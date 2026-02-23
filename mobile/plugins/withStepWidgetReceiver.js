// NOTE: This plugin must be added to the plugins array in app.config.js as:
// './plugins/withStepWidgetReceiver'

const { withAndroidManifest } = require('@expo/config-plugins');

function withStepWidgetReceiver(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) return config;

    if (!application.receiver) {
      application.receiver = [];
    }

    // Check if already added
    const exists = application.receiver.some(
      (r) => r.$?.['android:name'] === '.step.StepWidgetUpdateReceiver'
    );

    if (!exists) {
      application.receiver.push({
        $: {
          'android:name': '.step.StepWidgetUpdateReceiver',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.intent.action.USER_PRESENT',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
}

module.exports = withStepWidgetReceiver;
