import React from 'react';
import JavascriptColorWheel from './javascript-color-wheel';

export default class ReactColorWheel extends React.Component {
  componentWillMount = () => {
    this.container = React.createRef();
    this.colorWheel = new JavascriptColorWheel({
      hueSegments: this.props.hueSegments || 12,
      lightnessSegments: this.props.lightnessSegments || 11,
      saturationSegments: this.props.saturationSegments || 11,
      outerRadius: this.getOuterRadius(),
      innerRadius: this.getInnerRadius()
    });
    this.colorWheel.onPreview((color)=>{
      this.setState({});
      this.props.onPreview && this.props.onPreview(color);
    }); // force a render pass
    this.colorWheel.onSelect((color)=>{
      this.props.onSelect && this.props.onSelect(color);
    });
  }

  componentDidMount = () => {
    this.canvasContainer && this.colorWheel.insertCanvas(this.canvasContainer);
  }

  componentWillUnmount = () => {
    this.colorWheel.exit();
  }

  getInnerRadius = () => this.props.innerRadius || this.getOuterRadius() / Math.PI;
  getOuterRadius = () => this.props.radius || 500;

  renderCanvas = () => {
    return <div ref={el => this.canvasContainer = el } />;
  }

  renderSvg = () => {
    return (
      <svg
        ref={this.container}
        {...this.colorWheel.svgUtils.svgProps()}
      >
        {
          this
            .colorWheel
            .getSegments()
            .map(
              (segment) => (
                <path
                  key={`${segment.angle},${segment.hue},${segment.saturation},${segment.lightness}`}
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

  render = () => {
    return this.renderCanvas();
  }
}
