import * as d3 from 'd3';
type NodeData = d3.SimulationNodeDatum & {
  id: string;
  type?: 'device' | 'param' | 'group';
  scale?:number;
};
const ctx: Worker = self as any;
ctx.addEventListener('message', event => {
  const { nodes, links, width, height, d3Option = {} } = event.data;
  const {
    alpha,
    alphaMin,
    alphaDecay,
    velocityDecay,
    collideRadius,
    collideStrength,
    collideIterations,
    linkDistance,
    linkIterations,
    manyBodyStrength,
    manyBodyTheta,
    manyBodyDistanceMin,
    manyBodydistanceMax,
  } = d3Option;
  const simulation = d3
    .forceSimulation(nodes)
    .alpha(alpha)
    .alphaMin(alphaMin)
    .alphaDecay(alphaDecay)
    .velocityDecay(velocityDecay)
    .force(
      'charge',
      d3
        .forceManyBody()
        .strength(manyBodyStrength)
        .theta(manyBodyTheta)
        .distanceMin(manyBodyDistanceMin)
        .distanceMax(manyBodydistanceMax),
    )
    .force(
      'link',
      d3
        .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>(links)
        .id(d => d.id)
        .distance(linkDistance)
        .iterations(linkIterations),
    )
    .force('x', d3.forceX())
    .force('y', d3.forceY())
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3
        .forceCollide<NodeData>(d => collideRadius * (d.scale||1))
        .strength(collideStrength)
        .iterations(collideIterations),
    )
    .stop();

  for (
    let i = 0,
      n = Math.ceil(
        Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()),
      );
    i < n;
    i += 1
  ) {
    ctx.postMessage({ type: 'tick', progress: i / n });
    simulation.tick();
  }
  ctx.postMessage({ type: 'end', nodes, links });
});
