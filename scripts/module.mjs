
/**
 * Main Module Organizational Tools
 */
import { logger } from './logger.mjs';
import { EagleEyeConfig } from './config.mjs'
import { EagleEyeToken } from './modules/token.mjs'
import { EagleEyeDetectionMode } from './modules/detection-mode.mjs'

export class MODULE {

  static SUB_MODULES = {
    logger,
    EagleEyeConfig,
    EagleEyeToken,
    EagleEyeDetectionMode,
  }

  static SUB_APPS = {

  }

  static build({debug = false} = {}) {

    /* all startup tasks needed before sub module initialization */
    // Check for presence of libWrapper
    Hooks.once('ready', () => {
    if(!game.modules.get('lib-wrapper')?.active && game.user.isGM)
        ui.notifications.error("Module " + EagleEyeConfig.MODULE.NAME + " requires the 'libWrapper' module. Please install and activate it.");
    });

    // Prepare settings
    Hooks.on("init", () => {
      MODULE.settings();
    })

    /* sub module init */
    this._initModules(debug);
  }

  static settings() {
    const config = true;
    const settingsData = {
      debug : {
        scope: "client", 
        config: true,
        default: false, 
        type: Boolean,
        requiresReload: false
      },
      colorVision : {
        scope: "client", 
        config: true,
        default: false, 
        type: Boolean,
        requiresReload: true
      },
      colorLight : {
        scope: "client", 
        config: true,
        default: false, 
        type: Boolean,
        requiresReload: true
      },
      visionLocation : {
        scope: "world",
        config: true,
        default: 2,
        type: Number,
        requiresReload: true, // Would prefer to just trigger a visibility update, but that doesn't regenerate sources from tokens.
        choices: {
          0: `${EagleEyeConfig.MODULE.NAME}.settings.visionLocation.center`,
          1: `${EagleEyeConfig.MODULE.NAME}.settings.visionLocation.corners`,
          2: `${EagleEyeConfig.MODULE.NAME}.settings.visionLocation.edges`
        },
      },
      lightLocation : {
          scope: "world",
          config: true,
          default: 2,
          type: Number,
          requiresReload: true, // Would prefer to just trigger a visibility update, but that doesn't regenerate sources from tokens.
          choices: {
            0: `${EagleEyeConfig.MODULE.NAME}.settings.lightLocation.center`,
            1: `${EagleEyeConfig.MODULE.NAME}.settings.lightLocation.corners`,
            2: `${EagleEyeConfig.MODULE.NAME}.settings.lightLocation.edges`
          }
      },
      increaseDetectionTolerance : {
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        requiresReload: true
      },
      backoffPixels : {
        scope: "world",
        config: true,
        requiresReload: true,
        type: new foundry.data.fields.NumberField({
          min: 0, max: 10, step: 1,
          initial: 2, nullable: false
        })
      }
    };

    EagleEyeConfig.applySettings(settingsData);
  }

  static _initModules({debug = false} = {}) {

    /* Initialize all Sub Modules on setup */
    Hooks.on(`setup`, () => {
      Object.values(this.SUB_MODULES).forEach(cl => cl.register());
    });
  }
}

MODULE.build();


