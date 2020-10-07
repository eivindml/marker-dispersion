import Map from "./Map";
import Simulation from "./Simulation";
import { features } from "./mockData.json";

let map = new Map(features);
map.onLoad(onLoad);

function onLoad() {
  const simulation = new Simulation(map, features);

  setTimeout(() => {
    const features = map.getVisibleFeatures();
    const nodes = simulation.getUpdatedNodes(features);
    map.updateFeaturePointLocations(nodes);
  }, 1450);
  map.map.on("moveend", () => {
    const features = map.getVisibleFeatures();
    const nodes = simulation.getUpdatedNodes(features);
    map.updateFeaturePointLocations(nodes);
  });
}



