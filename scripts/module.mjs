
/**
 * Main Module Organizational Tools
 */
import { logger } from './logger.mjs';
import { EagleEyeConfig } from './config.mjs'
import { EagleEyeToken } from './modules/token.mjs'

export class MODULE {

  static SUB_MODULES = {
    logger,
    EagleEyeConfig,
    EagleEyeToken,
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
        type: Boolean
      },
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


