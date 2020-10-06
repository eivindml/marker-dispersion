import { Map } from "mapbox-gl";
import { uniqBy } from "lodash";

class MapController {
  map: Map;

  constructor() {
    this.map = new Map({
      accessToken:
        "pk.eyJ1IjoiZWl2aW5kbWlrYWVsIiwiYSI6ImNrZjU1ODVkcTBqbXoydG1kZ2xxb3R4bmcifQ.26VfVPKXEJh3L2ndo9VvPw",
      container: "map",
      style: "mapbox://styles/mapbox/bright-v8",
      //center: [locations[0].lng, locations[0].lat],
      zoom: 6,
    });
  }

  onLoad(callback: () => void) {
    this.map.on("load", callback);
  }

  /**
   * Must return unique features, because of multiple world copies.
   */
  getVisibleFeatures() {
    const features = this.map.queryRenderedFeatures(null, {
      layers: ["ports"],
    });
    return uniqBy(features, (f) => f.properties.id);
  }
}

export default MapController;
