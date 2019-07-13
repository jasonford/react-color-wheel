import React from 'react';
import JavascriptColorWheel from './javascript-color-wheel';

export default class ReactColorWheel extends React.Component {
  componentWillMount = () => {
    this.svg = React.createRef();
    this.colorWheel = new JavascriptColorWheel({
      outerRadius: this.getOuterRadius(),
      innerRadius: this.getInnerRadius()
    });
    this.colorWheel.onChange(()=>this.setState({}))
    window.addEventListener('touchmove', this.preventDefault, {passive: false});
  }

  preventDefault = (e) => {
    if (this.svg.current && this.svg.current.contains(e.target) && this.svg.current !== e.target) {
      e.preventDefault();
      e.returnValue = false;
      return false;
    }
  }

  getInnerRadius() {
    return this.props.innerRadius || 150
  }

  getOuterRadius() {
    return this.props.outerRadius || 500
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
      const previewAngle = Math.round(90 - Math.atan2(x - centerX, y - centerY) * 180 / Math.PI);
      this.colorWheel.setState({ previewAngle });
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
    const r = this.getOuterRadius();
    return (
      <svg
        ref={this.svg}
        style={{touchAction: 'none'}}
        viewBox={`${-r}, ${-r}, ${2*r}, ${2*r}`}
        width={2*r}
        height={2*r}
        onTouchStart={this.focusElement} // avoids touch event capture on element touched
        onTouchMove={this.focusElement}
        onTouchEnd={this.selectElement}
      >
        {
          this.colorWheel.getState().hueSegments.map(
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
                                      this.colorWheel.setState({
                                        previewHue: saturationSegment.hue,
                                        previewSaturation: saturationSegment.saturation,
                                        previewLightness: saturationSegment.lightness
                                      });
                                    }
                                    current.select = () => {
                                      this.colorWheel.setState({
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
                          this.colorWheel.setState({
                            previewHue: hue,
                            previewSaturation: 100,
                            previewLightness: 50
                          });
                        }
                        current.select = () => this.colorWheel.selectHue(hue)
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
          r={this.colorWheel.getState().innerRadius}
          fill={this.colorWheel.selectedColor() || '#FFFFFF'}
          stroke={this.colorWheel.selectedColor() || '#FFFFFF'}
          strokeWidth={0.1}
        />
        {
          this.colorWheel.getState().previewHue !== null
          &&
          <path
            d={this.colorWheel.getState().previewPath}
            transform={`rotate(${this.colorWheel.getState().previewAngle})`}
            fill={this.colorWheel.previewColor() || 'none'}
            stroke={this.colorWheel.previewColor() || 'none'}
            strokeWidth={0.1}
          />
        }
      </svg>
    );
  }

  selectSaturationLightness = (saturation, lightness) => {
    this.setState({
      saturation,
      lightness
    });
  }
}
