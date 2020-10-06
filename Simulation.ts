import rectCollide from "./rectCollide";
import * as d3 from "d3";

var collisionForce = rectCollide().size(function (d) {
  return d.size;
});

class Simulation {
  sim: d3.Simulation<
    d3.SimulationNodeDatum,
    d3.SimulationLinkDatum<d3.SimulationNodeDatum>
  >;

  constructor() {
    this.sim = d3
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
      .stop();
  }
}

export default Simulation;
