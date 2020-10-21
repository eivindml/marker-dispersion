import Node from "./Node";
import { quadtree, QuadtreeLeaf } from "d3";
/** Collision detection with quadtree.
 *
 * Will compare node to other nodes, using a quadtree,
 * and move them apart of the overlap. If biggest overlap
 * is in x direction, move apart in y direction, or visa versa.
 */
function forceCollide() {
  let nodes: Array<Node>;

  function force() {
    // for (var i = 0; i < 10; i++) {
    const q = quadtree<Node>()
      .x((d) => d.x)
      .y((d) => d.y)
      .addAll(nodes);
    for (const node of nodes) {
      const l1 = node.x;
      const r1 = node.x + node.size[0];
      const t1 = node.y;
      const b1 = node.y + node.size[1];

      /**
       * visit each squares in the quadtree x1 y1 x2 y2
       * constitutes the coordinates of the square want
       * to check if each square is a leaf node (has data prop)
       */
      q.visit((visited, x1, y1, x2, y2) => {
        /** Is a leaf node, and is not checking against itself */
        if (isLeafNode(visited) && visited.data.id !== node.id) {
          const l2 = visited.data.x;
          const r2 = visited.data.x + visited.data.size[0];
          const t2 = visited.data.y;
          const b2 = visited.data.y + node.size[1];

          /** We have a collision */
          if (l2 < r1 && l1 < r2 && t1 < b2 && t2 < b1) {
            /** Calculate intersecting rectangle */
            const xLeft = Math.max(l1, l2);
            const yTop = Math.max(t1, t2);
            const xRight = Math.min(r1, r2);
            const yBottom = Math.min(b1, b2);

            /** Move the rectangles apart, so that they don't overlap anymore. 🙅🏼 */

            /* Find which direction has biggest overlap */
            if (xRight - xLeft > yBottom - yTop) {
              /** Biggest in x direction (move y) */
              const dy = (yBottom - yTop) / 2;
              node.y -= dy;
              visited.data.y += dy;
            } else {
              /** Biggest in y direction (move x) */
              const dx = (xRight - xLeft) / 2;
              node.x -= dx;
              visited.data.x += dx;
            }
          }
        }
        return x1 > r1 || x2 < l1 || y1 > b1 || y2 < t1;
      });
    }
  }

  force.initialize = (_: any) => (nodes = _);

  return force;
}

/**
 * Type Guard!
 */
function isLeafNode(arg: any): arg is QuadtreeLeaf<Node> {
  return arg.data !== undefined;
}

export default forceCollide;
