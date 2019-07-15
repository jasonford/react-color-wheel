import { getSectorRadius, getSectorPath, HSLToHex } from './utils';

// flatten an array, depth 1
const flat = (array) => [].concat.apply([], array);
//  check if the fields on a given 2 objects have any differences
const isDifferent = (a, b, fields) => fields.filter( f => a[f] !== b[f]).length > 0;

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
      hue: hue || null,
      saturation: saturation || 100,
      lightness: lightness || 100,
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
        const angle = 360/numSegs * i;
        return {
          innerRadius: innerRadius,
          outerRadius: outerRadius,
          lightnessSaturationSectors: [],
          hue: angle,
          saturation: 100,
          lightness: 50,
          angle,
          sweep: 360/numSegs,
          pathData: getSectorPath(
            innerRadius,
            -angle-360/numSegs/2,
            -angle+360/numSegs/2,
            outerRadius,
            outerRadius,
            outerRadius
          )
        }
      }),
      numSaturationSegments: saturationSegments || 9,
      numLightnessSegments: lightnessSegments || 9
    };

    this.previewHandlers = [];
    this.selectHandlers = [];

    this.canvasUpdates = 0;
    this.renderedFrames = 0;
    this.pendingUpdates = {};

    this.setState = (newState) => {
      const oldState = this.state;
      this.state = {...oldState, ...newState};
      if (this.canvas) {
        this.updateCanvas({
          all: this.canvasUpdates === 0,
          preview: isDifferent(this.state, oldState, ['previewHue', 'previewSaturation', 'previewLightness', 'previewAngle']),
          hue: this.state.hue !== oldState.hue
        });
      }
    }

    window.addEventListener('touchmove', this.disableTouchScroll, {passive: false});
  }

  disableTouchScroll = (e) => {
    if ( this.canvas ) {
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const d = this.canvas.getBoundingClientRect();
      if (this.state.outerRadius > Math.sqrt(Math.pow(x-(d.left+d.width/2),2)+Math.pow(y-(d.top+d.height/2),2))) {
        e.preventDefault();
        e.returnValue = false;
        return false;
      }
    }
  }

  updateCanvas(shouldUpdate) {
    this.canvasUpdates += 1;
    this.pendingUpdates = { ...this.pendingUpdates };
    Object.keys(shouldUpdate).forEach( key => {
      // Don't overwrite old pendingUpdate[key] = true
      if (!this.pendingUpdates[key]) this.pendingUpdates[key] = shouldUpdate[key];
    })
    //  TODO: if frame gets dropped, want to batch the shouldUpdates
    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(() => {
      const ctx = this.canvas.getContext('2d', { alpha: false });
      // Scale all drawing operations by the dpr, so you
      // don't have to worry about the difference.
      if (this.pendingUpdates.all || this.pendingUpdates.hue) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.getSegments().forEach( segment => {
          const path = new Path2D();
          ctx.fillStyle = this.getSegmentColor(segment);
          path.addPath(new Path2D(segment.pathData));
          ctx.fill(path);
        });
      }
      if (this.pendingUpdates.all || this.pendingUpdates.hue || this.pendingUpdates.preview) {
        ctx.fillStyle = this.selectedColor();
        ctx.strokeStyle = this.selectedColor();
        ctx.fill(
          ctx.arc(
            this.state.outerRadius,
            this.state.outerRadius,
            this.state.innerRadius,
            0,
            2 * Math.PI
          )
        );
      }
      if (this.pendingUpdates.all || this.pendingUpdates.preview) {
        if (this.state.previewHue !== null) {
          ctx.fillStyle = this.previewColor();
          ctx.fill(new Path2D(this.state.previewPath));
          ctx.strokeStyle = this.previewColor();
        }
      }
      this.pendingUpdates = {};
      this.renderedFrames += 1;
    });
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

  getSegmentColor = ({hue, saturation, lightness}) => `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  onPreview = (handler) => this.previewHandlers.push(handler);
  onSelect = (handler) => this.selectHandlers.push(handler);

  selectedColor = () => {
    let {hue, saturation, lightness} = this.state;
    if (hue === null) {
      return 'hsl(0,100%,100%)';
    }
    else {
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
    const newState = {}
    newState.previewAngle = Math.round(90 - Math.atan2(x - this.state.outerRadius, y - this.state.outerRadius) * 180 / Math.PI);
    newState.previewPath = getSectorPath(
      0,
      -90 - newState.previewAngle,
      90 - newState.previewAngle,
      this.state.innerRadius,
      this.state.outerRadius,
      this.state.outerRadius
    )
    const segment = this.getSegmentAtCoord(x, y);
    if (segment) {
      newState.previewHue = segment.hue;
      newState.previewSaturation = segment.saturation;
      newState.previewLightness = segment.lightness;
    }
    this.setState(newState);
    segment && this.previewHandlers.forEach( handler => handler(this.colorExport(segment)));
  }

  selectColorAtCoord = (x, y) => {
    const r = Math.sqrt(Math.pow(x-this.state.outerRadius, 2) + Math.pow(y-this.state.outerRadius, 2))
    if (r < this.state.innerRadius && this.state.previewHue === null) {
      this.selectHandlers.forEach( handler => handler(this.colorExport(this.state)) );
    }
    else {
      const segment = this.getSegmentAtCoord(x, y);
      if (segment) this.selectColor(segment.hue, segment.saturation, segment.lightness);
      else if (this.state.previewHue !== null) {
        this.selectColor(this.state.previewHue, this.state.previewSaturation, this.state.previewLightness);
      }
    }
  }

  colorExport = ({hue, saturation, lightness}) => {
    return {
      hsl: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      hex: HSLToHex(hue, saturation, lightness)
    };
  }

  shouldOptimizeHueSectors = () => this.state.hueSectors.length > 36;
  shouldOptimizeSaturationSegments = () => this.state.numSaturationSegments * this.state.numLightnessSegments > 36 * 36;

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
            -segment.angle-selectedSweep/2,
            -segment.angle+selectedSweep/2,
            this.state.innerRadius,
            this.state.outerRadius,
            this.state.outerRadius,
            this.shouldOptimizeHueSectors()
          )

          //  create saturation and lightness segments and insert into sectors
          segment.lightnessSaturationSectors = [];
          for (let l=0; l<this.state.numLightnessSegments; l++) {
            const lightness = l/(this.state.numLightnessSegments-1) * 100;
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
              lightnessSaturationSector.saturationSegments.push(
                {
                  angle: lightnessSaturationSector.angle,
                  sweep: lightnessSaturationSector.sweep,
                  pathData: getSectorPath(
                    outerRadius*1.005, // adjust to cover gaps where stroke should be
                    -lightnessSaturationSector.angle - lightnessSaturationSector.sweep/2*1.005,
                    -lightnessSaturationSector.angle + lightnessSaturationSector.sweep/2*1.005,
                    innerRadius,
                    this.state.outerRadius,
                    this.state.outerRadius,
                    this.shouldOptimizeSaturationSegments()
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
            otherSegment.innerRadius = this.state.innerRadius;
            otherSegment.outerRadius = this.state.outerRadius;
            otherSegment.pathData = getSectorPath(
              this.state.outerRadius*1.005,
              -otherSegment.angle - otherSegmentSweep/2*1.005,
              -otherSegment.angle + otherSegmentSweep/2*1.005,
              this.state.innerRadius,
              this.state.outerRadius,
              this.state.outerRadius,
              this.shouldOptimizeHueSectors()
            )
            nextAngle += otherSegmentSweep;
          })
        }
      });
      this.setState({
        hueSectors: [...this.state.hueSectors],
        saturation: 100,
        lightness: 50,
        previewHue: null,
        previewSaturation: null,
        previewLigntness: null,
        hue
      });
    }
    this.previewHandlers.forEach( handler => handler(this.colorExport(this.state)));
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
    let coord;
    if (e.touches) {
      coord = e.touches[0];
    }
    else if (e.changedTouches) {
      coord = e.changedTouches[0];
    }
    else {
      if (!this.mouseIsDown) return;
      coord = e;
    }

    const dimensions = e.currentTarget.getBoundingClientRect();
    this.previewColorAtCoord(coord.clientX - dimensions.left, coord.clientY - dimensions.top);
  }

  select = e => {
    if (e.changedTouches && e.changedTouches.length === 0) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const dimensions = e.currentTarget.getBoundingClientRect();
    this.selectColorAtCoord(x - dimensions.left, y - dimensions.top);
  }

  insertCanvas = (el) => {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1;
    // initialize canvas and insert in DOM
    const c = document.createElement('canvas');
    c.width = 2*this.state.outerRadius * dpr;
    c.height = 2*this.state.outerRadius * dpr;
    c.style.transformOrigin = '0 0';
    c.style.width = this.state.outerRadius * 2 + 'px';
    c.style.height = this.state.outerRadius * 2 + 'px';

    c.addEventListener('mousedown', (e) => { this.mouseIsDown = true; this.focus(e); })
    c.addEventListener('mousemove', this.focus);
    c.addEventListener('mouseup', (e) => { this.mouseIsDown = false; this.select(e); });
    c.addEventListener('touchstart', this.focus);
    c.addEventListener('touchmove', this.focus);
    c.addEventListener('touchend', this.select);

    this.canvas = c;

    c.getContext('2d').scale(
      window.devicePixelRatio || 1,
      window.devicePixelRatio || 1
    );

    // first render
    this.updateCanvas({all:true});

    el.appendChild(c);
  }

  exit = () => {}
}
