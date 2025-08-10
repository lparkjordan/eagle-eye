import { EagleEyeConfig } from '../config.mjs'
import { logger } from '../logger.mjs'

export class EagleEyeToken {

  static NAME = "EagleEyeToken";

  static register() {
    this.patch();
  }

  static _super = {};

  static patch() {
    libWrapper.register("eagle-eye", "Token.prototype.isVisible", this.isVisible, "OVERRIDE");
    libWrapper.register("eagle-eye", "Token.prototype.initializeVisionSource", this.initializeVisionSource, "OVERRIDE");
    libWrapper.register("eagle-eye", "Token.prototype._destroy", function (wrapped, ...args) {
      logger.debug("token _destroy called");
      this.vision2?.visionMode?.deactivate(this.vision2);
      this.vision2?.destroy();
      this.vision2 = undefined;
      this.vision3?.visionMode?.deactivate(this.vision3);
      this.vision3?.destroy();
      this.vision3 = undefined;
      this.vision4?.visionMode?.deactivate(this.vision4);
      this.vision4?.destroy();
      this.vision4 = undefined;
      let result = wrapped(...args);
      return result;
    }, "WRAPPER");
  }


  static isVisible() {
    logger.debug("isVisible called")
    // Clear the detection filter
    this.detectionFilter = null;

    // Only GM users can see hidden tokens
    const gm = game.user.isGM;
    if ( this.document.hidden ) return gm;

    // Some tokens are always visible
    if ( !canvas.visibility.tokenVision ) return true;
    if ( this.controlled ) return true;
    if ( this.vision?.active) return true;

    // Otherwise, test visibility against current sight polygons
    // Use wider tolerance if enabled
    const tolerance = EagleEyeConfig.setting('increaseDetectionTolerance') ? (canvas.grid.size / 2) - 2 : 2;
    return canvas.visibility.testVisibility(this.center, {tolerance, object: this});
  }

  static initializeVisionSource({deleted=false}={}) {
    logger.debug("initializeVisionSource called")
    // Remove a deleted vision source from the active collection
    if ( deleted || !this._isVisionSource() ) {
      if ( !this.vision ) return;
      if ( this.vision.active ) canvas.perception.update({
        initializeVisionModes: true,
        refreshVision: true,
        refreshLighting: true
      });
      this.vision?.visionMode?.deactivate(this.vision);
      this.vision?.destroy();
      this.vision = undefined;
      this.vision2?.visionMode?.deactivate(this.vision2);
      this.vision2?.destroy();
      this.vision2 = undefined;
      this.vision3?.visionMode?.deactivate(this.vision3);
      this.vision3?.destroy();
      this.vision3 = undefined;
      this.vision4?.visionMode?.deactivate(this.vision4);
      this.vision4?.destroy();
      this.vision4 = undefined;
      return;
    }

    // Create a vision source if necessary
    const wasVision = !!this.vision;
    // Having four separate variables is a bit gross, but I don't want to mess with the base vision member 
    this.vision ??= new CONFIG.Canvas.visionSourceClass({sourceId: this.sourceId, object: this});
    this.vision2 ??= new CONFIG.Canvas.visionSourceClass({sourceId: this.sourceId + "_2", object: this});
    this.vision3 ??= new CONFIG.Canvas.visionSourceClass({sourceId: this.sourceId + "_3", object: this});
    this.vision4 ??= new CONFIG.Canvas.visionSourceClass({sourceId: this.sourceId + "_4", object: this});

    // Re-initialize source data
    const previousActive = this.vision.active;
    const previousVisionMode = this.vision.visionMode;
    const blindedStates = this._getVisionBlindedStates();
    for ( const state in blindedStates ) {
      this.vision.blinded[state] = blindedStates[state];
      this.vision2.blinded[state] = blindedStates[state];
      this.vision3.blinded[state] = blindedStates[state];
      this.vision4.blinded[state] = blindedStates[state];
    }

    const baseData = this._getVisionSourceData();
    const sightRadiusUnadjusted = this.document.sight.range * canvas.dimensions.distancePixels;
    logger.debug(baseData);

    const visionColors = EagleEyeConfig.setting('debug') ? [0xFF0000, 0xFFE119, 0x00FF00, 0x0000FF] : [baseData.color, baseData.color, baseData.color, baseData.color];

    if (EagleEyeConfig.setting('visionLocation') == 1) {
      // Corner vision
      this.vision.initialize({...baseData,  radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y + this.h/2 - 2, color: visionColors[0]});
      this.vision2.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y - this.h/2 + 2, color: visionColors[1]});
      this.vision3.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y - this.h/2 + 2, color: visionColors[2]});
      this.vision4.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y + this.h/2 - 2, color: visionColors[3]});

      this.vision2.add();
      this.vision3.add();
      this.vision4.add();
    } else if (EagleEyeConfig.setting('visionLocation') == 2) {
      // Edge vision
      this.vision.initialize({...baseData,  radius: sightRadiusUnadjusted, y: baseData.y + this.h/2 - 2, color: visionColors[0]});
      this.vision2.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 + 2, color: visionColors[1]});
      this.vision3.initialize({...baseData, radius: sightRadiusUnadjusted, y: baseData.y - this.h/2 - 2, color: visionColors[2]});
      this.vision4.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 - 2, color: visionColors[3]});

      this.vision2.add();
      this.vision3.add();
      this.vision4.add();
    } else {
      // Default (Center) vision
      this.vision.initialize(baseData);
    }

    this.vision.add();

    canvas.perception.update({
      initializeVisionModes: !wasVision
        || (this.vision.active !== previousActive)
        || (this.vision.visionMode !== previousVisionMode),
      refreshVision: true,
      refreshLighting: true
    });
  }

}
