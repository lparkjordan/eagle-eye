import { EagleEyeConfig } from '../config.mjs'
import { logger } from '../logger.mjs'

export class EagleEyeToken {

  static NAME = "EagleEyeToken";

  static register() {
    this.patch();
  }

  static _super = {};

  static patch() {
    libWrapper.register("eagle-eye", "foundry.canvas.placeables.Token.prototype.isVisible", this.isVisible, "OVERRIDE");
    libWrapper.register("eagle-eye", "foundry.canvas.placeables.Token.prototype.initializeVisionSource", this.initializeVisionSource, "OVERRIDE");
    libWrapper.register("eagle-eye", "foundry.canvas.placeables.Token.prototype.initializeLightSource", this.initializeLightSource, "OVERRIDE");
    libWrapper.register("eagle-eye", "foundry.canvas.placeables.Token.prototype._destroy", function (wrapped, ...args) {
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

      this.light2?.destroy();
      this.light2 = undefined;
      this.light3?.destroy();
      this.light3 = undefined;
      this.light4?.destroy();
      this.light4 = undefined;

      let result = wrapped(...args);
      return result;
    }, "WRAPPER");
    libWrapper.register("eagle-eye", "foundry.canvas.placeables.Token.prototype.checkCollision", function(wrapped, ...args) {
      console.log("Checking collision with args:");
      console.log(args);
      let result = wrapped(...args);
      return result;
    }, "WRAPPER")
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

    const visionColors = EagleEyeConfig.setting('colorVision') ? [0xFF0000, 0xFFE119, 0x00FF00, 0x0000FF] : [baseData.color, baseData.color, baseData.color, baseData.color];

    const level = this.scene.levels.get(this.document._source.level);

    if (EagleEyeConfig.setting('visionLocation') == 1) {
      // Corner vision
      this.vision.initialize({...baseData,  radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y + this.h/2 - 2, color: visionColors[0]});
      this.vision2.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y - this.h/2 + 2, color: visionColors[1]});
      this.vision3.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y - this.h/2 + 2, color: visionColors[2]});
      this.vision4.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y + this.h/2 - 2, color: visionColors[3]});

      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision.origin, {type: "sight", mode: "any", source: this.vision, level: level})) {
        this.vision.add();
      } else {
        console.log("Collision!")
        this.vision?.visionMode?.deactivate(this.vision);
        this.vision?.destroy();
        this.vision = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision2.origin, {type: "sight", mode: "any", source: this.vision2, level: level})) {
        this.vision2.add();
      } else {
        console.log("Collision!")
        this.vision2?.visionMode?.deactivate(this.vision2);
        this.vision2?.destroy();
        this.vision2 = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision3.origin, {type: "sight", mode: "any", source: this.vision3, level: level})) {
        this.vision3.add();
      } else {
        console.log("Collision!")
        this.vision3?.visionMode?.deactivate(this.vision3);
        this.vision3?.destroy();
        this.vision3 = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision4.origin, {type: "sight", mode: "any", source: this.vision4, level: level})) {
        this.vision4.add();
      } else {
        console.log("Collision!")
        this.vision4?.visionMode?.deactivate(this.vision4);
        this.vision4?.destroy();
        this.vision4 = undefined;
      }
    } else if (EagleEyeConfig.setting('visionLocation') == 2) {
      // Edge vision
      this.vision.initialize({...baseData,  radius: sightRadiusUnadjusted, y: baseData.y + this.h/2 - 2, color: visionColors[0]});
      this.vision2.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, color: visionColors[1]});
      this.vision3.initialize({...baseData, radius: sightRadiusUnadjusted, y: baseData.y - this.h/2 + 2, color: visionColors[2]});
      this.vision4.initialize({...baseData, radius: sightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, color: visionColors[3]});

      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision.origin, {type: "sight", mode: "any", source: this.vision, level: level})) {
        this.vision.add();
      } else {
        console.log("Collision!")
        this.vision?.visionMode?.deactivate(this.vision);
        this.vision?.destroy();
        this.vision = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision2.origin, {type: "sight", mode: "any", source: this.vision2, level: level})) {
        this.vision2.add();
      } else {
        console.log("Collision!")
        this.vision2?.visionMode?.deactivate(this.vision2);
        this.vision2?.destroy();
        this.vision2 = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision3.origin, {type: "sight", mode: "any", source: this.vision3, level: level})) {
        this.vision3.add();
      } else {
        console.log("Collision!")
        this.vision3?.visionMode?.deactivate(this.vision3);
        this.vision3?.destroy();
        this.vision3 = undefined;
      }
      if (!CONFIG.Canvas.polygonBackends["sight"].testCollision(this.center, this.vision4.origin, {type: "sight", mode: "any", source: this.vision4, level: level})) {
        this.vision4.add();
      } else {
        console.log("Collision!")
        this.vision4?.visionMode?.deactivate(this.vision4);
        this.vision4?.destroy();
        this.vision4 = undefined;
      }
    } else {
      // Default (Center) vision
      this.vision.initialize(baseData);
      this.vision.add();
    }

    canvas.perception.update({
      initializeVisionModes: !wasVision
        || (this.vision.active !== previousActive)
        || (this.vision.visionMode !== previousVisionMode),
      refreshVision: true,
      refreshLighting: true
    });
  }

  static initializeLightSource({deleted=false}={}) {
    logger.debug("initializeLightSource called")
    const sourceId = this.sourceId;
    const wasLight = canvas.effects.lightSources.has(sourceId);
    const wasDarkness = canvas.effects.darknessSources.has(sourceId);
    const isDarkness = this.document.light.negative;
    const perceptionFlags = {
      refreshEdges: wasDarkness || isDarkness,
      initializeVision: wasDarkness || isDarkness,
      initializeLighting: wasDarkness || isDarkness,
      refreshLighting: true,
      refreshVision: true
    };

    // Remove the light source from the active collection
    if ( deleted || !this._isLightSource() ) {
      if ( !this.light ) return;
      if ( this.light.active ) canvas.perception.update(perceptionFlags);
      this.light?.destroy();
      this.light = undefined;
      this.light2?.destroy();
      this.light2 = undefined;
      this.light3?.destroy();
      this.light3 = undefined;
      this.light4?.destroy();
      this.light4 = undefined;
      return;
    }

    // Re-create the source if it switches darkness state
    if ( (wasLight && isDarkness) || (wasDarkness && !isDarkness) ) {
      this.light?.destroy();
      this.light = undefined;
      this.light2?.destroy();
      this.light2 = undefined;
      this.light3?.destroy();
      this.light3 = undefined;
      this.light4?.destroy();
      this.light4 = undefined;
    }

    // Create light sources if necessary
    const lightSourceClass = this.document.light.negative ? CONFIG.Canvas.darknessSourceClass : CONFIG.Canvas.lightSourceClass;
    this.light ??= new lightSourceClass({sourceId: this.sourceId, object: this});
    this.light2 ??= new lightSourceClass({sourceId: this.sourceId + "_2", object: this});
    this.light3 ??= new lightSourceClass({sourceId: this.sourceId + "_3", object: this});
    this.light4 ??= new lightSourceClass({sourceId: this.sourceId + "_4", object: this});

    // Re-initialize source data and add to the active collection
    const baseData = this._getLightSourceData();
    const dimRadiusUnadjusted = this.document.light.dim * canvas.dimensions.distancePixels;
    const brightRadiusUnadjusted = this.document.light.bright * canvas.dimensions.distancePixels;
    logger.debug(baseData);

    const lightColors = EagleEyeConfig.setting('colorLight') ? [0xFF0000, 0xFFE119, 0x00FF00, 0x0000FF] : [baseData.color, baseData.color, baseData.color, baseData.color];

    // TODO using vision location config for light location as well.
    if (EagleEyeConfig.setting('visionLocation') == 1) {
      // Corner light
      this.light.initialize({...baseData,  dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y + this.h/2 - 2, color: lightColors[0]});
      this.light2.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, y: baseData.y - this.h/2 + 2, color: lightColors[1]});
      this.light3.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y - this.h/2 + 2, color: lightColors[2]});
      this.light4.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, y: baseData.y + this.h/2 - 2, color: lightColors[3]});

      this.light2.add();
      this.light3.add();
      this.light4.add();
    } else if (EagleEyeConfig.setting('visionLocation') == 2) {
      // Edge light
      this.light.initialize({...baseData,  dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, y: baseData.y + this.h/2 - 2, color: lightColors[0]});
      this.light2.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x + this.w/2 - 2, color: lightColors[1]});
      this.light3.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, y: baseData.y - this.h/2 + 2, color: lightColors[2]});
      this.light4.initialize({...baseData, dim: dimRadiusUnadjusted, bright: brightRadiusUnadjusted, x: baseData.x - this.w/2 + 2, color: lightColors[3]});

      this.light2.add();
      this.light3.add();
      this.light4.add();
    } else {
      // Default (Center) vision
      this.light.initialize(baseData);
    }
    this.light.add();

    canvas.perception.update(perceptionFlags);
  }

}
