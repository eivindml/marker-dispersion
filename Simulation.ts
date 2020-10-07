import rectCollide from "./rectCollide";
import * as d3 from "d3";
import Feature from "./Feature";
import Node from "./Node";
import Map from "./Map";
import { MapboxGeoJSONFeature } from "mapbox-gl";

var collisionForce = rectCollide().size(function (d: Node) {
  return d.size;
});

class Simulation {
  nodes: Array<Node>;
  sim: d3.Simulation<
    d3.SimulationNodeDatum,
    d3.SimulationLinkDatum<d3.SimulationNodeDatum>
  >;
  map: Map;

  constructor(map: Map, features: Array<Feature>) {
    this.map = map;
    this.nodes = this.getNodes(features);
    this.sim = this.getSimulation();
    this.sim.nodes(this.nodes);
  }

  getNodes(features: Array<Feature>): Array<Node> {
    return features.map((feature) => {
      const coordinates = this.map.project(feature.lng, feature.lat);
      return {
        ...feature,
        x: coordinates.x,
        y: coordinates.y,
        previousX: coordinates.x,
        previousY: coordinates.y,
        size: [150, 160],
      };
    });
  }

  getSimulation() {
    return (
      d3
        // Setup a physics based simulation
        .forceSimulation()
        // Add a collision detection force to the simulation.
        // The nodes won't overlap with the given radius
        .force(
          "x",
          d3
            .forceX()
            .x(function (d: any) {
              return d.previousX;
            })
            .strength(1)
        )
        .force(
          "y",
          d3
            .forceY()
            .y(function (d: any) {
              return d.previousY;
            })
            .strength(1)
        )
        .force("collision", collisionForce)
        .stop()
    );
  }

  getUpdatedNodes(features: Array<MapboxGeoJSONFeature>) {
    this.nodes = features.map((feature) => {
      const geometry: any = feature.geometry;
      const coordinates = this.map.project(
        geometry.coordinates[0],
        geometry.coordinates[1]
      );
      return {
        lng: coordinates.x,
        lat: coordinates.y,
        id: feature.properties.id,
        title: feature.properties.title,
        x: coordinates.x,
        y: coordinates.y,
        previousX: coordinates.x,
        previousY: coordinates.y,
        size: [feature.properties.title.length * 10, 30],
      };
    });

    this.sim.nodes(this.nodes);
    for (var i = 0; i < 120; i++) {
      this.sim.tick();
    }

    return this.nodes;
  }
}

export default Simulation;
