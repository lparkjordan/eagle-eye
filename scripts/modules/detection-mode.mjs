import { EagleEyeConfig } from '../config.mjs'
import { logger } from '../logger.mjs'

export class EagleEyeDetectionMode {

  static NAME = "EagleEyeDetectionMode";

  static register() {
    this.patch();
  }

  static _super = {};

  static patch() {
    libWrapper.register("eagle-eye", "DetectionMode.prototype._testRange", this.testRange, "OVERRIDE");
  }

  static testRange(visionSource, mode, target, test) {
    if ( mode.range === null ) return true;
    if ( mode.range <= 0 ) return false;
    // If using center vision, extend vision radius by token radius. Otherwise, just use the base radius.
    const radius = (EagleEyeConfig.setting('visionLocation') == 0) ? visionSource.object.getLightRadius(mode.range) : mode.range * canvas.dimensions.distancePixels;
    const dx = test.point.x - visionSource.x;
    const dy = test.point.y - visionSource.y;
    return ((dx * dx) + (dy * dy)) <= (radius * radius);
  }
}