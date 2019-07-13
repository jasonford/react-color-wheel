import React from 'react';
import { getSectorRadius, getSectorPath } from './utils';

const DEFAULTS = {
  OUTER_RADIUS: 50,
  INNER_RADIUS: 15
}

export default class ColorWheel extends React.Component {
  state = {
    hue: this.props.hue,
    saturation: this.props.saturation || 100,
    lightness: this.props.lightness || 50,
    previewHue: null,
    previewSaturation: null,
    previewLightness: null,
    selectedSweep: 180,
    dragging: false,
    innerRadius: DEFAULTS.INNER_RADIUS,
    outerRadius: DEFAULTS.OUTER_RADIUS,
    hueSegments: [...Array(this.props.hueSegments || 9)].map((_, i) => {
      const numSegs = this.props.hueSegments || 9;
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
    numSaturationSegments: this.props.saturationSegments || 9,
    numLightnessSegments: this.props.lightnessSegments || 9
  }

  componentWillMount = () => {
    this.svg = React.createRef();
    window.addEventListener('touchmove', this.preventDefault, {passive: false});
  }

  componentWillUnmount = () => {
    window.removeEventListener('touchmove', this.preventDefault, {passive: false});
  }

  preventDefault = (e) => {
    if (this.svg.current && this.svg.current.contains(e.target) && this.svg.current !== e.target) {
      e.preventDefault();
      e.returnValue = false;
      return false;
    }
  }

  focusElement = e => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const el = document.elementFromPoint(x, y);
    if (el && el.preview) {
      this.lastFocusedElement = el;
      let dimensions = this.svg.current.getBoundingClientRect();
      let centerX = dimensions.left + dimensions.width / 2;
      let centerY = dimensions.top + dimensions.height / 2;
      this.setState({
        previewAngle: 90 - Math.atan2(x - centerX, y - centerY) * 180 / Math.PI
      });
      el.preview();
    }
  }

  selectElement = e => {
    if (e.touches.length > 0) return;
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    const el = document.elementFromPoint(x, y);
    if (el && el.select) {
      el.select();
    }
    else {
      this.lastFocusedElement && this.lastFocusedElement.select();
    }
  }

  render = () => {
    return (
      <svg
        ref={this.svg}
        style={{touchAction: 'none'}}
        viewBox="-50, -50, 100, 100"
        width="100%"
        height="100%"
        onTouchStart={this.focusElement} // avoids touch event capture on element touched
        onTouchMove={this.focusElement}
        onTouchEnd={this.selectElement}
      >
        {
          this.state.hueSegments.map(
            ({hue, pathData, sweep, angle, selected, lightnessSaturationSectors, ref}) => {
              if (selected) {
                return (
                  <g key="slsegments">
                    {
                      lightnessSaturationSectors.map(
                        sector => (
                          sector.saturationSegments.map(
                            saturationSegment => (
                              <path
                                key={`${saturationSegment.angle},${saturationSegment.hue},${saturationSegment.saturation},${saturationSegment.lightness}`}
                                ref={
                                  current => {
                                    if (current === null) return;
                                    current.preview = () => {
                                      this.setState({
                                        previewHue: saturationSegment.hue,
                                        previewSaturation: saturationSegment.saturation,
                                        previewLightness: saturationSegment.lightness
                                      });
                                    }
                                    current.select = () => {
                                      this.setState({
                                        previewHue: null,
                                        previewSaturation: null,
                                        previewLigntness: null,
                                        hue: saturationSegment.hue,
                                        saturation: saturationSegment.saturation,
                                        lightness: saturationSegment.lightness
                                      });
                                    }
                                  }
                                }
                                d={ saturationSegment.pathData }
                                transform={`rotate(${saturationSegment.angle})`}
                                fill={`hsl(${saturationSegment.hue}, ${saturationSegment.saturation}%, ${saturationSegment.lightness}%)`}
                                stroke={`hsl(${saturationSegment.hue}, ${saturationSegment.saturation}%, ${saturationSegment.lightness}%)`}
                                strokeWidth='0.1'
                              />
                            )
                          )
                        )
                      )
                    }
                  </g>
                );
              }
              else {
                return (
                  <path
                    ref={
                      current => {
                        if (current === null) return;
                        current.preview = () => {
                          this.setState({
                            previewHue: hue,
                            previewSaturation: 100,
                            previewLightness: 50
                          });
                        }
                        current.select = () => {
                          this.selectHue(hue);
                        }
                      }
                    }
                    key={ hue }
                    d={ pathData }
                    transform={`rotate(${angle})`}
                    fill={`hsl(${hue}, 100%, 50%)`}
                    stroke={`hsl(${hue}, 100%, 50%)`}
                    strokeWidth={0.1}
                  />
                );
              }
            }
          )
        }
        <circle
          cx={0}
          cy={0}
          r={this.state.innerRadius}
          fill={this.selectedColor() || '#FFFFFF'}
        />
        {
          this.state.previewHue !== null
          &&
          <path
            d={getSectorPath(this.state.innerRadius, -90, 90)}
            fill={this.previewColor() || 'none'}
            transform={`rotate(${this.state.previewAngle})`}
          />
        }
      </svg>
    );
  }

  previewHue(hue) {
    this.setState({ previewHue: hue })
  }

  selectHue(hue) {
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

  selectSaturationLightness = (saturation, lightness) => {
    this.setState({
      saturation,
      lightness
    });
  }

  previewColor = () => {
    if (this.state.previewHue !== null) {
      return `hsl(${this.state.previewHue}, ${this.state.previewSaturation}%, ${this.state.previewLightness}%)`
    }
  }

  selectedColor = () => {
    if (this.state.hue !== undefined) {
      return `hsl(${this.state.hue}, ${this.state.saturation}%, ${this.state.lightness}%)`
    }
  }
}
