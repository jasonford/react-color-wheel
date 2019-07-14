import React from 'react';
import JavascriptColorWheel from './javascript-color-wheel';

export default class ReactColorWheel extends React.Component {
  componentWillMount = () => {
    this.container = React.createRef();
    this.colorWheel = new JavascriptColorWheel({
      outerRadius: this.getOuterRadius(),
      innerRadius: this.getInnerRadius()
    });
    this.colorWheel.onChange(()=>this.setState({}));
    this.colorWheel.onSelect((color)=>this.props.onChange && this.props.onChange(color));
    window.addEventListener('touchmove', this.preventDefault, {passive: false});
  }

  preventDefault = (e) => {
    if ( this.container.current
    &&   this.container.current.contains(e.target)
    &&   this.container.current !== e.target) {
      e.preventDefault();
      e.returnValue = false;
      return false;
    }
  }

  getInnerRadius = () => this.props.innerRadius || this.getOuterRadius() / Math.PI;
  getOuterRadius = () => this.props.radius || 500;

  focusElement = e => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const el = document.elementFromPoint(x, y);
    if (el && el.preview) {
      this.lastFocusedElement = el;
      let dimensions = this.container.current.getBoundingClientRect();
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
        ref={this.container}
        style={{touchAction: 'none'}}
        viewBox={`${-r}, ${-r}, ${2*r}, ${2*r}`}
        width={2*r}
        height={2*r}
        onTouchStart={this.focusElement} // avoids touch event capture on element touched
        onTouchMove={this.focusElement}
        onTouchEnd={this.selectElement}
      >
        {
          this
            .colorWheel
            .getSegments()
            .map(
              (segment) => (
                <path
                  key={`${segment.angle},${segment.hue},${segment.saturation},${segment.lightness}`}
                  ref={
                    current => {
                      if (current === null) return;
                      current.preview = () => {
                        this.colorWheel.setState({
                          previewHue: segment.hue,
                          previewSaturation: segment.saturation,
                          previewLightness: segment.lightness
                        });
                      }
                      current.select = () => this.colorWheel.selectColor(segment.hue, segment.saturation, segment.lightness);
                    }
                  }
                  {...this.colorWheel.svgUtils.segmentPathProps(segment)}
                />
              )
            )
          }
        <circle {...this.colorWheel.svgUtils.innerCircleProps()}/>
        <path {...this.colorWheel.svgUtils.previewPathProps()}/>
      </svg>
    );
  }
}
