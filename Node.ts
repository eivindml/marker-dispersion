export interface NodeSize {
  width: number;
  height: number;
}

interface Node {
  title: string;
  id: number;
  lng: number;
  lat: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  size: NodeSize;
}

export default Node;
