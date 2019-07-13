import React from 'react';
import { getSectorRadius } from './utils';

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
    innerRadius: 15,
    outerRadius: 50,
    hueSegments: [...Array(this.props.hueSegments || 18)].map((_, i) => {
      const numSegs = this.props.hueSegments || 18;
      return {
        hue: 360/numSegs * i,
        angle: 360/numSegs * i,
        sweep: 360/numSegs,
        ref: React.createRef()
      }
    }),
    numSaturationSegments: this.props.saturationSegments || 9,
    numLightnessSegments: this.props.lightnessSegments || 18
  }

  componentWillMount = () => {
    this.svg = React.createRef();
    window.addEventListener('touchmove', this.preventDefault, {passive: false});
  }

  componentWillUnmount = () => {
    window.removeEventListener('touchmove', this.preventDefault, {passive: false});
  }

  preventDefault = (e) => {
    if (this.state.dragging) {
      e.preventDefault();
      e.returnValue = false;
      return false;
    }
  }

  focusElement = e => {
    const x = e.touches[0].pageX;
    const y = e.touches[0].pageY;
    const el = document.elementFromPoint(x, y);
    e.stopPropagation();
    e.preventDefault();
    if (el && el.preview) {
      this.lastFocusedElement = el;
      let centerX = this.svg.offsetLeft + this.svg.offsetWidth / 2;
      let centerY = this.svg.offsetTop + this.svg.offsetHeight / 2;
      this.setState({
        previewAngle: 90 - Math.atan2(x - window.innerWidth/2, y - window.innerHeight/2) * 180 / Math.PI 
      });
      el.preview();
    }
  }

  selectElement = e => {
    const x = e.changedTouches[0].pageX;
    const y = e.changedTouches[0].pageY;
    const el = document.elementFromPoint(x, y);
    if (el && el.select) {
      el.select();
    }
    else {
      this.lastFocusedElement.select();
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
            ({hue, sweep, angle, selected, ref}) => {
              if (selected) {
                let slSegments = []
                let segmentSweep = sweep/this.state.numLightnessSegments;
                for (let s=0; s<this.state.numSaturationSegments; s++) {
                  // set segment inner and outer arcs (now inside saturation for-loop, changes for each saturation "row")
                  const segmentOuterArcRadius = getSectorRadius((s+1)/this.state.numSaturationSegments,this.state.innerRadius, this.state.outerRadius)
                  const segmentInnerArcRadius = getSectorRadius(s/this.state.numSaturationSegments, this.state.innerRadius, this.state.outerRadius)

                  for (let l=0; l<this.state.numLightnessSegments; l++) {
                    // ensure saturations of 100 and 0 are available
                     let saturation = (this.state.numSaturationSegments-1-s)/(this.state.numSaturationSegments-1) * 100;
                    // disallow lightness of 0 or 100 since those are just black and white
                    let lightness = (l+1)/(this.state.numLightnessSegments+1) * 100;
                    slSegments.push(
                      <path
                        ref={
                          current => {
                            if (current === null) return;
                            current.preview = () => {
                              this.setState({
                                previewHue: hue,
                                previewSaturation: saturation,
                                previewLightness: lightness
                              });
                            }
                            current.select = () => {
                              this.setState({
                                previewHue: null,
                                previewSaturation: null,
                                previewLigntness: null,
                                hue,
                                saturation,
                                lightness
                              });
                            }
                          }
                        }
                        key={`${s},${l}`}
                        d={
                          this.getSectorPath(
                            0,
                            0,
                            segmentOuterArcRadius,
                            -sweep/2 + segmentSweep * l,
                            -sweep/2 + segmentSweep * (l+1),
                            segmentInnerArcRadius
                          )
                        }
                        transform={`rotate(${angle})`}
                        fill={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
                        stroke={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
                        strokeWidth='0.1'
                      />
                    )
                  }
                }

                return (
                  <g key="slsegments">
                    {slSegments}
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
                    d={
                      this.getSectorPath(
                        0,
                        0,
                        this.state.outerRadius,
                        -sweep/2,
                        sweep/2,
                        this.state.innerRadius
                      )
                    }
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
            d={this.getSectorPath(0, 0, this.state.innerRadius, -90, 90, 0)}
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
    this.state.hueSegments.forEach((segment, index) => {
      const selected = segment.hue === hue;
      segment.selected = selected;
      if (selected) {
        segment.sweep = this.state.selectedSweep; // set a larger sweep angle
        // get other segments in their order after our selected segment
        const otherSegments = [
          ...this.state.hueSegments.slice(index+1),
          ...this.state.hueSegments.slice(0, index)
        ];
        let otherSegmentSweep = (360 - segment.sweep) / otherSegments.length;
        let nextAngle = segment.angle + segment.sweep/2 + otherSegmentSweep/2;
        otherSegments.forEach( otherSegment => {
          otherSegment.sweep = otherSegmentSweep;
          otherSegment.angle = nextAngle%360;
          nextAngle += otherSegmentSweep;
        })
      }
    })
    this.setState({
      hueSegments: [...this.state.hueSegments],
      previewHue: null,
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

  colorForAngle = ( angle ) => {
    return
  }

  getSectorPath(x, y, outerRadius, a1, a2, innerRadius = 0) {
    const degtorad = Math.PI / 180;
    const x1 = (Math.cos(degtorad * a2) * innerRadius) + x;
    const y1 = (-Math.sin(degtorad * a2) * innerRadius) + y;
    const x2 = (Math.cos(degtorad * a1) * innerRadius) + x;
    const y2 = (-Math.sin(degtorad * a1) * innerRadius) + y;
    const x3 = (Math.cos(degtorad * a1) * outerRadius) + x;
    const y3 = (-Math.sin(degtorad * a1) * outerRadius) + y;
    const x4 = (Math.cos(degtorad * a2) * outerRadius) + x;
    const y4 = (-Math.sin(degtorad * a2) * outerRadius) + y;
    return `
      M ${x1} ${y1}
      A ${innerRadius} ${innerRadius} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${outerRadius} ${outerRadius} 0 0 0 ${x4} ${y4}
      Z
    `;
  }
}
