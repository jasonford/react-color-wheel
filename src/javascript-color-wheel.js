import React from 'react'; // TODO: take this out!! after we deal with the ref we need for now...
import { getSectorRadius, getSectorPath } from './utils';

const DEFAULTS = {
  OUTER_RADIUS: 50,
  INNER_RADIUS: 15
}

export default class JavascriptColorWheel {
  constructor({hue, saturation, lightness, hueSegments, saturationSegments, lightnessSegments}) {
    this.state = {
      hue: hue,
      saturation: saturation || 100,
      lightness: lightness || 50,
      previewHue: null,
      previewSaturation: null,
      previewLightness: null,
      previewPath: getSectorPath(DEFAULTS.INNER_RADIUS, -90, 90),
      previewAngle: 0,
      selectedSweep: 180,
      innerRadius: DEFAULTS.INNER_RADIUS,
      outerRadius: DEFAULTS.OUTER_RADIUS,
      hueSegments: [...Array(hueSegments || 9)].map((_, i) => {
        const numSegs = hueSegments || 9;
        return {
          hue: 360/numSegs * i,
          angle: 360/numSegs * i,
          sweep: 360/numSegs,
          ref: React.createRef(),
          pathData: getSectorPath(
            DEFAULTS.INNER_RADIUS,
            -360/numSegs/2,
            360/numSegs/2,
            DEFAULTS.OUTER_RADIUS
          )
        }
      }),
      numSaturationSegments: saturationSegments || 9,
      numLightnessSegments: lightnessSegments || 9
    };

    this.getState = () => this.state;
    this.setState = (newState) => this.state = {...this.state, ...newState};
  }

  selectedColor = () => {
    let {hue, saturation, lightness} = this.getState();
    if (hue !== undefined) {
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  }

  previewColor = () => {
    let {previewHue, previewSaturation, previewLightness} = this.getState();
    if (previewHue !== null) {
      return `hsl(${previewHue}, ${previewSaturation}%, ${previewLightness}%)`;
    }
  }

  selectHue = (hue) => {
    //  this function handles all dimension calculations
    //  for the layout of necessary sectors
    this.state.hueSegments.forEach((segment, index) => {
      const selected = segment.hue === hue;
      segment.selected = selected;
      if (selected) {
        let selectedSweep = this.state.selectedSweep;
        segment.pathData = getSectorPath(
          this.state.outerRadius,
          -selectedSweep/2,
          selectedSweep/2,
          this.state.innerRadius
        )

        //  create saturation and lightness segments and insert into sectors
        segment.lightnessSaturationSectors = [];
        for (let l=0; l<this.state.numLightnessSegments; l++) {
          const lightness = (l+1)/(this.state.numLightnessSegments+1) * 100;
          const lightnessSaturationSector = {
            hue: segment.hue,
            angle: segment.angle,
            saturationSegments: []
          }
          segment.lightnessSaturationSectors.push(lightnessSaturationSector);
          for (let s=0; s<this.state.numSaturationSegments; s++) {
            // set segment inner and outer arcs (now inside saturation for-loop, changes for each saturation "row")
            const segmentOuterArcRadius = getSectorRadius((s+1)/this.state.numSaturationSegments,this.state.innerRadius, this.state.outerRadius)
            const segmentInnerArcRadius = getSectorRadius(s/this.state.numSaturationSegments, this.state.innerRadius, this.state.outerRadius)

            const saturation = (this.state.numSaturationSegments-1-s)/(this.state.numSaturationSegments-1) * 100;
            // ensure saturations of 100 and 0 are available
            // disallow lightness of 0 or 100 since those are just black and white
            lightnessSaturationSector.saturationSegments.push(
              {
                angle: lightnessSaturationSector.angle,
                pathData: getSectorPath(
                  segmentOuterArcRadius,
                  -selectedSweep/2 + selectedSweep/this.state.numLightnessSegments*l,
                  -selectedSweep/2 + selectedSweep/this.state.numLightnessSegments*(l+1),
                  segmentInnerArcRadius
                ),
                hue,
                saturation,
                lightness
              }
            )
          }
        }

        // get other segments in their order after our selected segment
        const otherSegments = [
          ...this.state.hueSegments.slice(index+1),
          ...this.state.hueSegments.slice(0, index)
        ];
        let otherSegmentSweep = (360 - this.state.selectedSweep) / otherSegments.length;
        let nextAngle = segment.angle + this.state.selectedSweep/2 + otherSegmentSweep/2;
        otherSegments.forEach( otherSegment => {
          otherSegment.sweep = otherSegmentSweep;
          otherSegment.angle = nextAngle%360;
          otherSegment.pathData = getSectorPath(
            this.state.outerRadius,
            -otherSegmentSweep/2,
            otherSegmentSweep/2,
            this.state.innerRadius
          )
          nextAngle += otherSegmentSweep;
        })
      }
    })
    this.setState({
      hueSegments: [...this.state.hueSegments],
      previewHue: null,
      saturation: 100,
      lightness: 50,
      hue
    });
  }
}