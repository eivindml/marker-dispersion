import Marker from "./Marker";
import Map from "./Map";
import Simulation from "./Simulation";
import { locations } from "./mockData.json";

var nodes: Array<Marker>;

var map = new Map();
map.onLoad(onLoad);

function onLoad() {
  nodes = locations.map((location) => {
    const coordinates = map.map.project([location.lng, location.lat]);
    return {
      ...location,
      x: coordinates.x,
      y: coordinates.y,
      previousX: coordinates.x,
      previousY: coordinates.y,
      size: [150, 160],
    };
  });

  const simulation = new Simulation();
  simulation.sim.nodes(nodes);
  for (var i = 0; i < 120; i++) {
    simulation.sim.tick();
  }
  const sourceId = "source-id";
  map.map.addSource(sourceId, getSource(nodes));
  map.map.addLayer(getLayer(sourceId));

  setTimeout(() => {
    updateNodes(simulation);
  }, 1450);
  map.map.on("moveend", () => {
    updateNodes(simulation);
  });
}

function getSource(nodes: Array<Marker>): any {
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

function getLayer(sourceId: string): any {
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

function updateNodes(simulation) {
  const features = map.getVisibleFeatures();
  const nodes: Array<Marker> = features.map((feature) => {
    const geometry: any = feature.geometry;
    const coordinates = map.map.project(geometry.coordinates);
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

  simulation.sim.nodes(nodes);
  for (var i = 0; i < 120; i++) {
    simulation.sim.tick();
  }
  updateFeaturePointLocations(nodes);
}

function updateFeaturePointLocations(nodes: Array<Marker>) {
  if (nodes.length === 0) return;

  var textSize = map.map.getLayoutProperty("ports", "text-size");
  const iconSize = map.map.getLayoutProperty("ports", "icon-size");
  const textOffsets = map.map.getLayoutProperty("ports", "text-offset");
  const iconOffsets = map.map.getLayoutProperty("ports", "icon-offset");

  // b - beginning position
  // e - ending position
  // i - your current value (0-99)
  function getTween(b, e, i) {
    return b + (i / 200) * (e - b);
  }

  let start;
  function animateMarker(timestamp: number) {
    if (start === undefined) start = timestamp;
    const elapsed = timestamp - start;

    map.map.setLayoutProperty("ports", "text-offset", {
      property: "id",
      type: "categorical",
      stops: nodes.map((node: Marker) => {
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

    map.map.setLayoutProperty("ports", "icon-offset", {
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

  map.map.setPaintProperty("ports", "text-opacity", 1);
  map.map.setPaintProperty("ports", "icon-opacity", 1);
}

