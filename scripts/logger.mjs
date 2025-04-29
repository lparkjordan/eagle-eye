/* Code used with permission:
 *  Copyright (c) 2020-2021 DnD5e Helpers Team and Contributors
 *  Full License at "scripts/licenses/DnD5e-Helpers-LICENSE"
 */

import { EagleEyeConfig } from './config.mjs'

export class logger {
  static NAME = this.name;

  static info(...args) {
    console.log(`${EagleEyeConfig?.MODULE?.NAME || "" } | `, ...args);
  }

  static debug(...args) {
    if (EagleEyeConfig.setting('debug'))
      this.info("DEBUG | ", ...args);
  }

  static error(notify, ...args) {
    console.error(`${EagleEyeConfig?.MODULE?.NAME || "" } | ERROR | `, ...args);

    if(notify) {
      ui.notifications.error(`${EagleEyeConfig?.MODULE?.NAME || "" } | ERROR | ${args[0]}`);
    }
  }

  static warning(notify, ...args) {
    console.warn(`${EagleEyeConfig?.MODULE?.NAME || "" } | WARNING | `, ...args);
    if(notify) this.warn(...args)
  }

  static notify(...args) {
    ui.notifications.notify(`${args[0]}`);
  }

  static warn(...args) {
    ui.notifications.warn(`${args[0]}`);
  }

  static register(){
    return
  }
}
