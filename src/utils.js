// Consider as "available area" the area of a disc defined by two concentric circles.
// This function returns the radius of a third circle that contains a given percentage of that total disc area.
export function getSectorRadius (percentage, innerDiscRadius, outerDiscRadius) {
  return Math.sqrt(percentage*outerDiscRadius*outerDiscRadius + (1-percentage)*innerDiscRadius*innerDiscRadius)
}

export function getSectorPath(outerRadius, a1, a2, innerRadius = 0, x = 0, y = 0, linearApproximation = false) {
  const degtorad = Math.PI / 180;
  const x1 = (Math.cos(degtorad * a2) * innerRadius) + x;
  const y1 = (-Math.sin(degtorad * a2) * innerRadius) + y;
  const x2 = (Math.cos(degtorad * a1) * innerRadius) + x;
  const y2 = (-Math.sin(degtorad * a1) * innerRadius) + y;
  const x3 = (Math.cos(degtorad * a1) * outerRadius) + x;
  const y3 = (-Math.sin(degtorad * a1) * outerRadius) + y;
  const x4 = (Math.cos(degtorad * a2) * outerRadius) + x;
  const y4 = (-Math.sin(degtorad * a2) * outerRadius) + y;

  if (linearApproximation) {
    return `
      M ${x1} ${y1}
      L ${x2} ${y2}
      L ${x3} ${y3}
      L ${x4} ${y4}
      Z
    `;
  }

  return `
    M ${x1} ${y1}
    A ${innerRadius} ${innerRadius} 0 0 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${outerRadius} ${outerRadius} 0 0 0 ${x4} ${y4}
    Z
  `;
}

export function HSLToHex(h,s,l) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c/2,
      r = 0,
      g = 0,
      b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  // Having obtained RGB, convert channels to hex
  r = Math.round((r + m) * 255).toString(16);
  g = Math.round((g + m) * 255).toString(16);
  b = Math.round((b + m) * 255).toString(16);

  // Prepend 0s, if necessary
  if (r.length == 1)
    r = "0" + r;
  if (g.length == 1)
    g = "0" + g;
  if (b.length == 1)
    b = "0" + b;

  return "#" + r + g + b;
}