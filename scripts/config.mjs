import { MODULE } from './module.mjs'

export class EagleEyeConfig {

  static MODULE = {
    NAME: 'eagle-eye',
    PATH: '/modules/eagle-eye',
    TITLE: 'Eagle Eye'
  }

  static register() {

    /* create the container if it doesnt already exist */
    if(!game[EagleEyeConfig.MODULE.NAME]) {
      game[EagleEyeConfig.MODULE.NAME] = {}
    }

    game[EagleEyeConfig.MODULE.NAME].EagleEyeConfig = this.MODULE;
  }

  /* ------------------ */
  static get() {
    return game[this.MODULE.NAME].EagleEyeConfig;
  }

  static applySettings(settingsData) {
    Object.entries(settingsData).forEach(([key, data]) => {
      game.settings.register(
        EagleEyeConfig.MODULE.NAME, key, {
          ...data,
          name: game.i18n.localize(`${EagleEyeConfig.MODULE.NAME}.settings.${key}.name`),
          hint: game.i18n.localize(`${EagleEyeConfig.MODULE.NAME}.settings.${key}.hint`)
        }
      );
    });
  }

  static setting(key) {
    return game.settings.get(EagleEyeConfig.get().NAME, key);
  }
}
