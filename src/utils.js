// Consider as "available area" the area of a disc defined by two concentric circles.
// This function returns the radius of a third circle that contains a given percentage of that total disc area.
export function getSectorRadius (percentage, innerDiscRadius, outerDiscRadius) {
  return Math.sqrt(percentage*outerDiscRadius*outerDiscRadius + (1-percentage)*innerDiscRadius*innerDiscRadius)
}

export function getSectorPath(outerRadius, a1, a2, innerRadius = 0, x = 0, y = 0) {
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