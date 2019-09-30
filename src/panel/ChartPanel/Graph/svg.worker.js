"use strict";
exports.__esModule = true;
var d3 = require("d3");
var ctx = self;
ctx.addEventListener('message', function (event) {
    var _a = event.data, nodes = _a.nodes, links = _a.links, width = _a.width, height = _a.height, _b = _a.d3Option, d3Option = _b === void 0 ? {} : _b;
    var alpha = d3Option.alpha, alphaMin = d3Option.alphaMin, alphaDecay = d3Option.alphaDecay, velocityDecay = d3Option.velocityDecay, collideRadius = d3Option.collideRadius, collideStrength = d3Option.collideStrength, collideIterations = d3Option.collideIterations, linkDistance = d3Option.linkDistance, linkIterations = d3Option.linkIterations, manyBodyStrength = d3Option.manyBodyStrength, manyBodyTheta = d3Option.manyBodyTheta, manyBodyDistanceMin = d3Option.manyBodyDistanceMin, manyBodydistanceMax = d3Option.manyBodydistanceMax, nodeSize = d3Option.nodeSize;
    var simulation = d3
        .forceSimulation(nodes)
        .alpha(alpha)
        .alphaMin(alphaMin)
        .alphaDecay(alphaDecay)
        .velocityDecay(velocityDecay)
        .force('charge', d3
        .forceManyBody()
        .strength(manyBodyStrength)
        .theta(manyBodyTheta)
        .distanceMin(manyBodyDistanceMin)
        .distanceMax(manyBodydistanceMax))
        .force('link', d3
        .forceLink(links)
        .id(function (d) { return d.id; })
        .distance(linkDistance)
        .iterations(linkIterations))
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3
        .forceCollide(function (d) { return collideRadius * nodeSize * (d.scale || 1); })
        .strength(collideStrength)
        .iterations(collideIterations))
        .stop();
    for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; i += 1) {
        ctx.postMessage({ type: 'tick', progress: i / n });
        simulation.tick();
    }
    ctx.postMessage({ type: 'end', nodes: nodes, links: links });
});
