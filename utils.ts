import Node, {NodeSize} from "./Node";

// b - beginning position
// e - ending position
// i - your current value (0-99)
function getTween(b: number, e: number, i: number) {
  return b + (i / 200) * (e - b);
}

type TNodeBounds = {
  t: number,
  r: number,
  b: number,
  l: number
}

function getOffsets(node1: TNodeBounds, node2: TNodeBounds): { dx: number, dy: number } {
  /** Calculate intersecting rectangle */
  const xLeft = Math.max(node1.l, node2.l);
  const yTop = Math.max(node1.t, node2.t);
  const xRight = Math.min(node1.r, node2.r);
  const yBottom = Math.min(node1.b, node2.b);
  const xCenter = (xLeft + xRight) / 2;
  const yCenter = (yTop + yBottom) / 2;

  let dx = 0, dy = 0;
  if((node1.l <= node2.l && node1.r >= node2.r)
      || (node2.l <= node1.l && node2.r >= node1.r)) {
    // The larger node completely spans the smaller node, don't move sideways, since it won't matter
  } else if(node1.l <= node2.l) {
    // Node 1 is left of node 2
    dx = xCenter - xLeft;
  } else {
    // Node 1 is right of node 2
    dx = -(xCenter - xLeft);
  }

  if((node1.t <= node2.t && node1.b >= node2.b)
      || (node2.t <= node1.t && node2.b >= node1.b)) {
    // The taller node completely spans the smaller node, don't move up/down, since it won't matter
  } else if(node1.t <= node2.t) {
    // Node 1 is above node 2
    dy = yCenter - yTop;
  } else {
    // Node 1 is below node 2
    dy = -(yCenter - yTop);
  }
  return { dx, dy };
}

/**
 * Measure the width of a text were it to be rendered using a given font.
 *
 * @param {string} text the text to be measured
 * @param {string} font a valid css font value
 *
 * @returns {number} the width of the rendered text in pixels.
 */
function getTextSize(text: string, font = "14px \"Open Sans Semibold\""): NodeSize {
  const element = document.createElement("canvas");
  const context = element.getContext("2d") as CanvasRenderingContext2D;
  context.font = font;

  const textSize = context.measureText(text);
  return {
    width: textSize.width,
    height: textSize.actualBoundingBoxAscent + textSize.actualBoundingBoxDescent,
  };
}

export { getTween, getOffsets, getTextSize };