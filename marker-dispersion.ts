import { uniqBy } from "lodash";
import { locations } from "./mockData.json";
import { Map } from "mapbox-gl";
import * as d3 from "d3";

interface Node {
  title: string;
  id: number;
  lng: number;
  lat: number;
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  r: number;
  size: Array<number>;
}

var nodes: Array<Node>;

var map = initMap();
map.on("load", onLoad);

function onLoad() {
  nodes = locations.map((location) => {
    const coordinates = map.project([location.lng, location.lat]);
    return {
      ...location,
      x: coordinates.x,
      y: coordinates.y,
      previousX: coordinates.x,
      previousY: coordinates.y,
      r: 20,
      size: [150, 160],
    };
  });
  console.log(nodes);

  const simulation = initSimulation();
  simulation.nodes(nodes);
  // simulation.nodes(nodes);
  // console.log("after", nodes);
  for (var i = 0; i < 120; i++) {
    // if (i % 20 === 0) {
    // console.log('update')
    //}
    simulation.tick();
  }
  const sourceId = "source-id";
  map.addSource(sourceId, getSource(nodes));
  map.addLayer(getLayer(sourceId));

  // console.log(map.project([nodes[0].lng, nodes[0].lat]));

  setTimeout(() => {
    updateNodes(simulation);
  }, 1450);
  map.on("moveend", () => {
    // console.log(event)
    updateNodes(simulation);
  });
}

function initMap(): Map {
  return new Map({
    accessToken:
      "pk.eyJ1IjoiZWl2aW5kbWlrYWVsIiwiYSI6ImNrZjU1ODVkcTBqbXoydG1kZ2xxb3R4bmcifQ.26VfVPKXEJh3L2ndo9VvPw",
    container: "map",
    style: "mapbox://styles/mapbox/bright-v8",
    center: [locations[0].lng, locations[0].lat],
    zoom: 6,
  });
}

function initSimulation() {
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
            console.log("D", d);
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
      // .force(
      //   "collision",
      //   d3
      //     .forceCollide()
      //     .radius(function (d) {
      //       return getNodeRadius(d);
      //     })
      //     .strength(0.5)
      // )
      .stop()
  );
}

function getSource(nodes: Array<Node>): any {
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

function rectCollide() {
  var nodes, sizes, masses;
  var size = constant([0, 0]);
  var strength = 1;
  var iterations = 1;

  function force() {
    var node, size, mass, xi, yi;
    var i = -1;
    while (++i < iterations) {
      iterate();
    }

    function iterate() {
      var j = -1;
      var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare);

      while (++j < nodes.length) {
        node = nodes[j];
        size = sizes[j];
        mass = masses[j];
        xi = xCenter(node);
        yi = yCenter(node);

        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data;
      var xSize = (size[0] + quad.size[0]) / 2;
      var ySize = (size[1] + quad.size[1]) / 2;
      if (data) {
        if (data.index <= node.index) {
          return;
        }

        var x = xi - xCenter(data);
        var y = yi - yCenter(data);
        var xd = Math.abs(x) - xSize;
        var yd = Math.abs(y) - ySize;

        if (xd < 0 && yd < 0) {
          var l = Math.sqrt(x * x + y * y);
          var m = masses[data.index] / (mass + masses[data.index]);

          if (Math.abs(xd) < Math.abs(yd)) {
            node.vx -= (x *= (xd / l) * strength) * m;
            data.vx += x * (1 - m);
          } else {
            node.vy -= (y *= (yd / l) * strength) * m;
            data.vy += y * (1 - m);
          }
        }
      }

      return (
        x0 > xi + xSize || y0 > yi + ySize || x1 < xi - xSize || y1 < yi - ySize
      );
    }

    function prepare(quad) {
      if (quad.data) {
        quad.size = sizes[quad.data.index];
      } else {
        quad.size = [0, 0];
        var i = -1;
        while (++i < 4) {
          if (quad[i] && quad[i].size) {
            quad.size[0] = Math.max(quad.size[0], quad[i].size[0]);
            quad.size[1] = Math.max(quad.size[1], quad[i].size[1]);
          }
        }
      }
    }
  }

  function xCenter(d) {
    return d.x + d.vx + sizes[d.index][0] / 2;
  }
  function yCenter(d) {
    return d.y + d.vy + sizes[d.index][1] / 2;
  }

  force.initialize = function (_) {
    sizes = (nodes = _).map(size);
    masses = sizes.map(function (d) {
      return d[0] * d[1];
    });
  };

  force.size = function (_) {
    return arguments.length
      ? ((size = typeof _ === "function" ? _ : constant(_)), force)
      : size;
  };

  force.strength = function (_) {
    return arguments.length ? ((strength = +_), force) : strength;
  };

  force.iterations = function (_) {
    return arguments.length ? ((iterations = +_), force) : iterations;
  };

  return force;
}

function constant(_) {
  return function () {
    return _;
  };
}

var collisionForce = rectCollide().size(function (d) {
  console.log(d);
  return d.size;
});

function updateNodes(simulation) {
  const features = getVisibleFeatures();
  const nodes = features.map((feature) => {
    console.log(feature.geometry);
    const geometry: any = feature.geometry;
    const coordinates = map.project(geometry.coordinates);
    return {
      id: feature.properties.id,
      title: feature.properties.title,
      x: coordinates.x,
      y: coordinates.y,
      previousX: coordinates.x,
      previousY: coordinates.y,
      size: [feature.properties.title.length * 10, 30],
    };
  });

  console.log(nodes);

  simulation.nodes(nodes);
  console.log("after", nodes);
  for (var i = 0; i < 120; i++) {
    // if (i % 20 === 0) {
    // console.log('update')
    //}
    simulation.tick();
  }
  console.log("after after", nodes);
  updateFeaturePointLocations(nodes);
}

function updateFeaturePointLocations(nodes) {
  if (nodes.length === 0) return;

  var textSize = map.getLayoutProperty("ports", "text-size");
  const iconSize = map.getLayoutProperty("ports", "icon-size");
  const textOffsets = map.getLayoutProperty("ports", "text-offset");
  const iconOffsets = map.getLayoutProperty("ports", "icon-offset");

  // b - beginning position
  // e - ending position
  // i - your current value (0-99)
  function getTween(b, e, i) {
    return b + (i / 200) * (e - b);
  }

  // console.log(iconOffsets, textOffsets);

  let start;
  function animateMarker(timestamp: number) {
    if (start === undefined) start = timestamp;
    const elapsed = timestamp - start;

    console.log("animate marker", elapsed);

    map.setLayoutProperty("ports", "text-offset", {
      property: "id",
      type: "categorical",
      stops: nodes.map((node: Node) => {
        console.log("node", node.id, node);
        const yDelta = (node.y - node.previousY) / textSize;
        const xDelta = (node.x - node.previousX) / textSize;
        // console.log("offsets", textOffsets);
        const offset = textOffsets?.stops?.find((stop) => {
          return stop[0] === node.id;
        });
        // console.log("offset", offset);
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

    map.setLayoutProperty("ports", "icon-offset", {
      property: "id",
      type: "categorical",
      stops: nodes.map((node) => {
        const yDelta = (node.y - node.previousY) / iconSize;
        const xDelta = (node.x - node.previousX) / iconSize;
        // console.log("offsets", textOffsets);
        const offset = iconOffsets?.stops?.find((stop) => {
          return stop[0] === node.id;
        });
        // console.log("offset", offset);
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

  map.setPaintProperty("ports", "text-opacity", 1);
  map.setPaintProperty("ports", "icon-opacity", 1);
}

/**
 * Must return unique features, because of multiple world copies.
 */
function getVisibleFeatures() {
  const features = map.queryRenderedFeatures(null, { layers: ["ports"] });
  return uniqBy(features, (f) => f.properties.id);
}
