// Consider as "available area" the area of a disc defined by two concentric circles.
// This function returns the radius of a third circle that contains a given percentage of that total disc area.
export function getSectorRadius (percentage, innerDiscRadius, outerDiscRadius) {
  return Math.sqrt(percentage*outerDiscRadius*outerDiscRadius + (1-percentage)*innerDiscRadius*innerDiscRadius)
}
