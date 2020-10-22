import Node from "./Node";
import { quadtree, QuadtreeLeaf } from "d3";
import {getOffsets} from "./utils";
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
      const r1 = node.x + node.size.width;
      const t1 = node.y;
      const b1 = node.y + node.size.height;

      /**
       * visit each squares in the quadtree x1 y1 x2 y2
       * constitutes the coordinates of the square want
       * to check if each square is a leaf node (has data prop)
       */
      q.visit((visitedNode, x1, y1, x2, y2) => {
        /** Is not a leaf node or is checking against itself */
        if (!isLeafNode(visitedNode) || visitedNode.data.id === node.id) {
          return;
        }

        const visited: Node = visitedNode.data;
        const l2 = visited.x;
        const r2 = visited.x + visited.size.width;
        const t2 = visited.y;
        const b2 = visited.y + node.size.height;

        /** We don't have a collision */
        if (l2 >= r1 || l1 >= r2 || t1 >= b2 || t2 >= b1) {
          return;
        }

        /** Move the rectangles apart, so that they don't overlap anymore. 🙅🏼 */
        const { dx, dy } = getOffsets(
            { l: l1, t: t1, r: r1, b: b1 },
            { l: l2, t: t2, r: r2, b: b2 }
        );
        node.x -= dx;
        visited.x += dx;

        node.y -= dy;
        visited.y += dy;

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
