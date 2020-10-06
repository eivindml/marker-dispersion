interface Marker {
  title: string;
  id: number;
  lng: number;
  lat: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  size: Array<number>;
}

export default Marker;
