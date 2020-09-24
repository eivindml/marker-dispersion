import { uniqBy } from "lodash";

const locations = [
  {
    title: "Moss",
    id: 0,
    lng: 10.65,
    lat: 59.43,
  },
  {
    title: "Copenhagen",
    id: 1,
    lng: 12.55,
    lat: 55.66,
  },
  {
    title: "Oslo",
    id: 2,
    lng: 10.75,
    lat: 59.9,
  },
];

var nodes = locations.map((location) => {
  return {
    ...location,
    r: 20,
  };
});

var map = initMap();
map.on("load", onLoad);

function onLoad() {
  const simulation = initSimulation(nodes, map);
  //   console.log("on load", map.getStyle().layers);
  //
  //   console.log(map.getLayoutProperty("poi", "text-offset"));
  //
  const sourceId = "source-id";
  map.addSource(sourceId, getSource(nodes));
  map.addLayer(getLayer(sourceId));
  updateNodes(simulation);
  // map.on("idle", () => {
  // });
}

function initMap() {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiZWl2aW5kbWlrYWVsIiwiYSI6ImNrZjU1ODVkcTBqbXoydG1kZ2xxb3R4bmcifQ.26VfVPKXEJh3L2ndo9VvPw";
  return new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/bright-v8",
    center: [locations[0].lng, locations[0].lat],
    zoom: 6,
  });
}

function initSimulation(nodes, map) {
  return (
    d3
      // Setup a physics based simulation
      .forceSimulation()
      // Add a collision detection force to the simulation.
      // The nodes won't overlap with the given radius
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return 20;
        })
      )
      .stop()
  );
}

function getNodeRadius(map, feature) {
  return 100;
}

function getSource(nodes) {
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
            posX: 0,
            posY: 0,
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

function getLayer(sourceId) {
  return {
    id: "ports",
    type: "symbol",
    source: sourceId,
    paint: {
      "text-color": "orangered",
    },
    layout: {
      "icon-allow-overlap": true,
      "text-allow-overlap": true,
      "icon-image": "marker-15",
      "text-field": "{title}",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 0],
      "text-size": 14,
      "icon-size": 1,
      "text-anchor": "top",
      // "text-offset": [
      //   ["number", 1, 0],
      //   ["number", ["feature-state", "posY"], 0],
      // ],
    },
  };
}

function updateNodes(simulation) {
  console.log("hee");
  const features = getVisibleFeatures();
  const nodes = features.map((feature) => {
    const coordinates = map.project(feature.geometry.coordinates);
    return {
      id: feature.properties.id,
      title: feature.properties.title,
      x: coordinates.x,
      y: coordinates.y,
      previousX: coordinates.x,
      previousY: coordinates.y,
    };
  });

  // simulation.nodes(nodes).on("tick", () => {
  //   updateFeaturePointLocations(nodes);
  // });
  // simulation.restart();
  for (var i = 0; i < 120; i++) simulation.tick();
  //
  updateFeaturePointLocations(nodes);
}

function updateFeaturePointLocations(nodes) {
  // console.log("Update location", nodes);
  // Hvordan setter jeg offset indivudelt?

  // console.log(getVisibleFeatures());

  // map.setLayoutProperty("ports", "text-field", [
  //   "concat",
  //   ["feature-state", "posX"],
  //   ["feature-state", "posY"],
  // ]);

  var textSize = map.getLayoutProperty("ports", "text-size", {
    zoom: map.getZoom(),
  });

  const iconSize = map.getLayoutProperty("ports", "icon-size", {
    zoom: map.getZoom(),
  });

  // console.log("icon-size", iconSize);

  map.setLayoutProperty("ports", "text-offset", {
    property: "id",
    type: "categorical",
    stops: nodes.map((node) => {
      // console.log();
      const yDelta = (node.y - node.previousY) / textSize;
      const xDelta = (node.x - node.previousX) / textSize;
      // console.log("yDelta", yDelta);
      return [node.id, [xDelta, yDelta]];
    }),
    default: [0, 0],
  });

  map.setLayoutProperty("ports", "icon-offset", {
    property: "id",
    type: "categorical",
    stops: nodes.map((node) => {
      const yDelta = (node.y - node.previousY) / iconSize;
      const xDelta = (node.x - node.previousX) / iconSize;
      // console.log("yDelta", yDelta);
      return [node.id, [xDelta, yDelta]];
    }),
    default: [0, 0],
  });

  // nodes.map((node) => {
  //   map.setFeatureState(
  //     {
  //       source: "source-id",
  //       // sourceLayer: "ports",
  //       id: node.id,
  //     },
  //     {
  //       posX: node.x,
  //       posY: node.y,
  //       posZ: "test",
  //     }
  //   );
  // });

  // console.log(getVisibleFeatures());

  //map.setPaintProperty("ports", "text-color", "blue");
  // Offset unit: em
  //map.setLayoutProperty("ports", "text-offset", [5, 5]);
  // Offset unit: pixels * icon-size
  //map.setLayoutProperty("ports", "icon-offset", [50, 50]);
}

/**
 * Must return unique features, because of multiple world copies.
 */
function getVisibleFeatures() {
  const features = map.queryRenderedFeatures({ layers: ["ports"] });
  return uniqBy(features, (f) => f.properties.id);
}
