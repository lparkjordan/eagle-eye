
/**
 * Main Module Organizational Tools
 */
import { logger } from './logger.mjs';
import { CONFIG } from './config.mjs'
import { EagleEyeToken } from './modules/token.mjs'


export class MODULE {

  static SUB_MODULES = {
    logger,
    CONFIG,
    EagleEyeToken,
  }

  static SUB_APPS = {

  }

  static build({debug = false} = {}) {

    /* all startup tasks needed before sub module initialization */
    // Check for presence of libWrapper
    Hooks.once('ready', () => {
    if(!game.modules.get('lib-wrapper')?.active && game.user.isGM)
        ui.notifications.error("Module " + CONFIG.MODULE.NAME + " requires the 'libWrapper' module. Please install and activate it.");
    });


    /* sub module init */
    this._initModules(debug);
  }

  static _initModules({debug = false} = {}) {

    /* Initialize all Sub Modules on setup */
    Hooks.on(`setup`, () => {

      Object.values(this.SUB_MODULES).forEach(cl => cl.register());

      if (debug) {
        //GlobalTesting (adds all imports to global scope)
//        Object.entries(this.SUB_MODULES).forEach(([key, cl])=> window[key] = cl);
//        Object.entries(this.SUB_APPS).forEach(([key, cl])=> window[key] = cl);
      }
    });
  }

  /* --------------- */
  static localize(...args) {
    return game.i18n.format(...args);
  }
}

MODULE.build();

/*****Example Sub-Module Class******

export class MyClass {

  static register() {
    //all initialization tasks
  }
}

*/

