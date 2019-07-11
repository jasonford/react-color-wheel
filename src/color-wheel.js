import React from 'react';

export default class ColorWheel extends React.Component {
  state = {
    hue: this.props.hue,
    saturation: this.props.saturation || 100,
    lightness: this.props.lightness || 50,
    selectedSweep: 180,
    dragging: false,
    innerRadius: 15,
    outerRadius: 50,
    hueSegments: [...Array(this.props.hueSegments || 18)].map((_, i) => {
      const numSegs = this.props.hueSegments || 18;
      return {
        hue: 360/numSegs * i,
        angle: 360/numSegs * i,
        sweep: 360/numSegs
      }
    }),
    numSaturationSegments: this.props.saturationSegments || 9,
    numLightnessSegments: this.props.lightnessSegments || 9
  }

  componentWillMount = () => {
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

  render = () => {
    return (
      <svg viewBox="-50, -50, 100, 100" width="100%" height="100%">
        {
          this.state.hueSegments.map(
            ({hue, sweep, angle, selected}) => {
              if (selected) {
                let slSegments = []
                let segmentHeight = (this.state.outerRadius - this.state.innerRadius)/this.state.numSaturationSegments;
                let segmentSweep = sweep/this.state.numLightnessSegments;
                for (let s=0; s<this.state.numSaturationSegments; s++) {
                  for (let l=0; l<this.state.numLightnessSegments; l++) {
                    let saturation = s/(this.state.numSaturationSegments-1) * 100;
                    // disallow lightness of 0 or 100 since those are just black and white
                    let lightness = (l+1)/(this.state.numLightnessSegments+1) * 100;
                    slSegments.push(
                      <path
                        key={`${s},${l}`}
                        d={
                          this.getSectorPath(
                            0,
                            0,
                            this.state.innerRadius + (s+1) * segmentHeight,
                            -sweep/2 + segmentSweep * l,
                            -sweep/2 + segmentSweep * (l+1),
                            this.state.innerRadius + s * segmentHeight
                          )
                        }
                        transform={`rotate(${angle})`}
                        fill={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
                        stroke={`hsl(${hue}, ${saturation}%, ${lightness}%)`}
                        strokeWidth='0.1'
                        onClick={ () => this.selectSaturationLightness(saturation, lightness) }
                        onTouchStart={ () => this.selectSaturationLightness(saturation, lightness) }
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
                    onClick={ () => this.selectHue(hue) }
                    onTouchStart={ () => this.selectHue(hue) }
                  />
                );
              }
            }
          )
        }
        <circle
          cx="0"
          cy="0"
          r={this.state.innerRadius}
          fill={this.selectedColor() || '#DDDDDD'}
        />
      </svg>
    );
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
      hue
    });
  }

  selectSaturationLightness = (saturation, lightness) => {
    this.setState({
      saturation,
      lightness
    });
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
