import { getSectorRadius, getSectorPath } from './utils';

const flat = (array) => [].concat.apply([], array);


//  copy and paste from https://www.xarg.org/2010/06/is-an-angle-between-two-other-angles/
//  looks hacky.. should probably use something better.
function angle_between(n, a, b) {
  n = (360 + (n % 360)) % 360;
  a = (3600000 + a) % 360;
  b = (3600000 + b) % 360;

  if (a < b)
    return a <= n && n <= b;
  return a <= n || n <= b;
}

export default class JavascriptColorWheel {
  constructor({hue, saturation, lightness, hueSegments, saturationSegments, lightnessSegments, innerRadius, outerRadius}) {
    innerRadius = innerRadius || 50;
    outerRadius = outerRadius || 15;

    this.state = {
      hue: hue,
      saturation: saturation || 100,
      lightness: lightness || 50,
      previewHue: null,
      previewSaturation: null,
      previewLightness: null,
      previewPath: getSectorPath(innerRadius, -90, 90),
      previewAngle: 0,
      selectedSweep: 180,
      innerRadius: innerRadius,
      outerRadius: outerRadius,
      hueSectors: [...Array(hueSegments || 9)].map((_, i) => {
        const numSegs = hueSegments || 9;
        return {
          lightnessSaturationSectors: [],
          hue: 360/numSegs * i,
          saturation: 100,
          lightness: 50,
          angle: 360/numSegs * i,
          sweep: 360/numSegs,
          pathData: getSectorPath(
            innerRadius,
            -360/numSegs/2,
            360/numSegs/2,
            outerRadius
          )
        }
      }),
      numSaturationSegments: saturationSegments || 9,
      numLightnessSegments: lightnessSegments || 9
    };

    this.changeHandlers = [];
    this.selectHandlers = [];

    this.setState = (newState) => {
      this.state = {...this.state, ...newState};
      this.changeHandlers.forEach(handler => handler());
    }
  }

  getSegments = () => {
    const hueSectors = this.state.hueSectors;
    let ret = (
      //  ignore the selected one since lightness and saturation variations will cover it
      hueSectors.filter( s => !s.selected ).concat(
        flat(
          hueSectors.map(
            hueSector => (
              flat(
                hueSector
                  .lightnessSaturationSectors
                  .map(sector => sector.saturationSegments)
              )
            )
          )
        )
      )
    );
    return ret;
  }

  onChange = (handler) => this.changeHandlers.push(handler);
  onSelect = (handler) => this.selectHandlers.push(handler);

  selectedColor = () => {
    let {hue, saturation, lightness} = this.state;
    if (hue !== undefined) {
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  }

  previewColor = () => {
    let {previewHue, previewSaturation, previewLightness} = this.state;
    if (previewHue !== null) {
      return `hsl(${previewHue}, ${previewSaturation}%, ${previewLightness}%)`;
    }
  }

  getSegmentAtCoord = (x, y) => {
    const angle = Math.round(90 - Math.atan2(x - this.state.outerRadius, y - this.state.outerRadius) * 180 / Math.PI);
    const r = Math.sqrt(Math.pow(x-this.state.outerRadius, 2) + Math.pow(y-this.state.outerRadius, 2))
    let sector = this.getSegments().find(
      s => {
        return (
          angle_between(s.angle + s.sweep/2, angle, s.angle - s.sweep/2)
          && (!s.innerRadius || s.innerRadius <= r)
          && (!s.outerRadius || s.outerRadius >= r)
        )
      }
    );
    return sector;
  }

  previewColorAtCoord = (x, y) => {
    this.state.previewAngle = Math.round(90 - Math.atan2(x - this.state.outerRadius, y - this.state.outerRadius) * 180 / Math.PI);
    const segment = this.getSegmentAtCoord(x, y);
    if (segment) {
      this.state.previewHue = segment.hue;
      this.state.previewSaturation = segment.saturation;
      this.state.previewLightness = segment.lightness;
    }
    this.setState({});
  }

  selectColorAtCoord = (x, y) => {
    const segment = this.getSegmentAtCoord(x, y);
    segment && this.selectColor(segment.hue, segment.saturation, segment.lightness);
  }

  selectColor = (hue, saturation, lightness) => {
    if (hue === this.state.hue) {
    // Don't need to update the lightness saturation segments in this case
      this.setState({
        previewHue: null,
        previewSaturation: null,
        previewLigntness: null,
        hue: hue,
        saturation: saturation,
        lightness: lightness
      });
    }
    else {
      //  this function handles all dimension calculations
      //  for the layout of necessary sectors
      this.state.hueSectors.forEach((segment, index) => {
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
            const sweep = selectedSweep/this.state.numLightnessSegments;
            const angle = segment.angle - selectedSweep/2 + sweep*l +sweep/2;
            const lightnessSaturationSector = {
              hue: segment.hue,
              angle,
              sweep,
              saturationSegments: []
            }
            segment.lightnessSaturationSectors.push(lightnessSaturationSector);
            for (let s=0; s<this.state.numSaturationSegments; s++) {
              // set segment inner and outer arcs (now inside saturation for-loop, changes for each saturation "row")
              const outerRadius = getSectorRadius((s+1)/this.state.numSaturationSegments,this.state.innerRadius, this.state.outerRadius)
              const innerRadius = getSectorRadius(s/this.state.numSaturationSegments, this.state.innerRadius, this.state.outerRadius)

              const saturation = (this.state.numSaturationSegments-1-s)/(this.state.numSaturationSegments-1) * 100;
              // ensure saturations of 100 and 0 are available
              // disallow lightness of 0 or 100 since those are just black and white
              lightnessSaturationSector.saturationSegments.push(
                {
                  angle: lightnessSaturationSector.angle,
                  sweep: lightnessSaturationSector.sweep,
                  pathData: getSectorPath(
                    outerRadius,
                    -lightnessSaturationSector.sweep/2,
                    lightnessSaturationSector.sweep/2,
                    innerRadius
                  ),
                  innerRadius,
                  outerRadius,
                  hue,
                  saturation,
                  lightness
                }
              )
            }
          }

          // get other segments in their order after our selected segment
          const otherSegments = [
            ...this.state.hueSectors.slice(index+1),
            ...this.state.hueSectors.slice(0, index)
          ];
          let otherSegmentSweep = (360 - this.state.selectedSweep) / otherSegments.length;
          let nextAngle = segment.angle + this.state.selectedSweep/2 + otherSegmentSweep/2;
          otherSegments.forEach( otherSegment => {
            otherSegment.lightnessSaturationSectors = [];
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
      });
      this.setState({
        hueSectors: [...this.state.hueSectors],
        previewHue: null,
        saturation: 100,
        lightness: 50,
        hue
      });
    }
    this.selectHandlers.forEach( handler => handler(this.selectedColor()));
  }

  svgUtils = {
    innerCircleProps: () => ({
      cx: 0,
      cy: 0,
      r: this.state.innerRadius,
      fill: this.selectedColor() || '#FFFFFF',
      stroke: this.selectedColor() || '#FFFFFF',
      strokeWidth: this.state.outerRadius/50
    }),
    previewPathProps: () => (this.state.previewHue !== null && {
      d: this.state.previewPath,
      transform: `rotate(${this.state.previewAngle})`,
      fill: this.previewColor() || 'none',
      stroke: this.previewColor() || 'none',
      strokeWidth: this.state.outerRadius/50
    }),
    segmentPathProps: ({hue, saturation, lightness, angle, pathData}) => ({
      d: pathData,
      transform: `rotate(${angle})`,
      fill: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      stroke: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      strokeWidth: this.state.outerRadius/50
    }),
    svgProps: () => ({
        style: {touchAction: 'none'},
        viewBox: `${-this.state.outerRadius}, ${-this.state.outerRadius}, ${2*this.state.outerRadius}, ${2*this.state.outerRadius}`,
        width: 2*this.state.outerRadius,
        height: 2*this.state.outerRadius,
        onMouseMove: this.focus,
        onMouseUp: this.select,
        onTouchStart: this.focus,
        onTouchMove: this.focus,
        onTouchEnd: this.select
    })
  }

  //  touch event handlers
  focus = e => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dimensions = e.currentTarget.getBoundingClientRect();
    this.previewColorAtCoord(x - dimensions.left, y - dimensions.top);
  }

  select = e => {
    if (e.changedTouches && e.changedTouches.length === 0) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const dimensions = e.currentTarget.getBoundingClientRect();
    this.selectColorAtCoord(x - dimensions.left, y - dimensions.top);
  }
}