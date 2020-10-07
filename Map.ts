import { Map } from "mapbox-gl";
import { uniqBy } from "lodash";
import Node from "./Node";
import Feature from "./Feature";
import { getTween } from "./utils";

class MapController {
  sourceId = "source-id";
  accessToken =
    "pk.eyJ1IjoiZWl2aW5kbWlrYWVsIiwiYSI6ImNrZjU1ODVkcTBqbXoydG1kZ2xxb3R4bmcifQ.26VfVPKXEJh3L2ndo9VvPw";
  map: Map;
  features: Array<Feature>;
  callback: () => void;

  constructor(features: Array<Feature>) {
    this.features = features;
    this.map = new Map({
      accessToken: this.accessToken,
      container: "map",
      style: "mapbox://styles/mapbox/bright-v8",
      center: [features[0].lng, features[0].lat],
      zoom: 6,
    });
  }

  onLoad(callback: () => void) {
    this.callback = callback;
    let self = this;
    this.map.on("load", () => {
      console.log("onLoaded");
      self.callback();
      self.initFeatures();
    });
  }

  initFeatures() {
    console.log("Init featues");
    this.map.addSource(this.sourceId, this.getSource(this.features));
    this.map.addLayer(this.getLayer(this.sourceId));
  }

  project(lng: number, lat: number) {
    return this.map.project([lng, lat]);
  }

  getSource(nodes: Array<Feature>): any {
    return {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: nodes.map((node) => {
          return {
            type: "Feature",
            properties: {
              title: node.title,
              id: `${node.id}`,
            },
            geometry: {
              type: "Point",
              coordinates: [node.lng, node.lat],
            },
          };
        }),
      },
    };
  }

  getLayer(sourceId: string): any {
    return {
      id: "ports",
      type: "symbol",
      source: sourceId,
      paint: {
        "text-color": "orangered",
        "text-opacity": 0,
        "text-opacity-transition": {
          duration: 300,
          delay: 200,
        },
        "icon-opacity": 0,
        "icon-opacity-transition": {
          duration: 300,
          delay: 200,
        },
      },
      layout: {
        "icon-allow-overlap": true,
        "text-allow-overlap": true,
        "icon-image": "marker-15",
        "text-field": "{title}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "icon-offset": [0, 0],
        "text-size": 14,
        "icon-size": 1,
        "text-anchor": "top",
      },
    };
  }

  updateFeaturePointLocations(nodes: Array<Node>) {
    if (nodes.length === 0) return;

    var textSize = this.map.getLayoutProperty("ports", "text-size");
    const iconSize = this.map.getLayoutProperty("ports", "icon-size");
    const textOffsets = this.map.getLayoutProperty("ports", "text-offset");
    const iconOffsets = this.map.getLayoutProperty("ports", "icon-offset");

    let start;
    let self = this;
    function animateMarker(timestamp: number) {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;

      self.map.setLayoutProperty("ports", "text-offset", {
        property: "id",
        type: "categorical",
        stops: nodes.map((node: Node) => {
          const yDelta = (node.y - node.previousY) / textSize;
          const xDelta = (node.x - node.previousX) / textSize;
          const offset = textOffsets?.stops?.find((stop) => {
            return stop[0] === node.id;
          });
          if (offset) {
            const o = offset[1];
            const x = getTween(o[0], xDelta, elapsed);
            const y = getTween(o[1], yDelta, elapsed);
            return [node.id, [x, y]];
          }
          return [node.id, [xDelta, yDelta]];
        }),
        default: [0, 0],
      });

      self.map.setLayoutProperty("ports", "icon-offset", {
        property: "id",
        type: "categorical",
        stops: nodes.map((node) => {
          const yDelta = (node.y - node.previousY) / iconSize;
          const xDelta = (node.x - node.previousX) / iconSize;
          const offset = iconOffsets?.stops?.find((stop) => {
            return stop[0] === node.id;
          });
          if (offset) {
            const o = offset[1];
            const x = getTween(o[0], xDelta, elapsed);
            const y = getTween(o[1], yDelta, elapsed);
            return [node.id, [x, y]];
          }
          return [node.id, [xDelta, yDelta]];
        }),
        default: [0, 0],
      });

      // Request the next frame of the animation.
      if (elapsed < 200) {
        // Stop the animation after 2 seconds
        requestAnimationFrame(animateMarker);
      }
    }

    // Start the animation.
    requestAnimationFrame(animateMarker);

    this.map.setPaintProperty("ports", "text-opacity", 1);
    this.map.setPaintProperty("ports", "icon-opacity", 1);
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
