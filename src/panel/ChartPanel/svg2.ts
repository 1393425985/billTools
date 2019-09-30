import * as d3 from 'd3';
import _ from 'lodash';

const groupWidth = 100;
const deviceWidth = 10;
const tempW = Math.sqrt((5 / 4) * Math.pow(deviceWidth, 2));
interface SVGManageOption {
  data: {
    nodes: {
      id: string;
      group: string;
      type: 'device' | 'param' | 'group';
      parent?: string;
    }[];
    links: { source: string; target: string }[];
  };
}
type NodeData = d3.SimulationNodeDatum & SVGManageOption['data']['nodes'][0];
export default class SVGManage2 {
  private contain: HTMLDivElement;
  private option: SVGManageOption;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private createColor: (k: any) => string;
  private forceManyBody: d3.ForceManyBody<d3.SimulationNodeDatum>;
  private forceCollide: d3.ForceCollide<NodeData>;
  private forceLink: d3.ForceLink<NodeData, d3.SimulationLinkDatum<NodeData>>;
  private forceCenter:d3.ForceCenter<NodeData>;
  private simulation: d3.Simulation<NodeData, undefined>;
  constructor(contain: HTMLDivElement, option: SVGManageOption) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.init();
  }
  private init() {
    const scale = d3.scaleOrdinal(d3.schemeCategory10);
    this.createColor = d => scale(d.group);
    this.forceManyBody = d3.forceManyBody();
    this.forceCollide = d3.forceCollide<NodeData>(d =>
      d.type === 'group' ? groupWidth : deviceWidth,
    );
    this.forceCenter = d3.forceCenter(this.contain.offsetWidth / 2, this.contain.offsetHeight / 2);
    this.forceLink = d3
      .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>([])
      .id(d => d.id);

    this.initSVG();
  }
  private createDrag: (
    k: d3.Simulation<NodeData, undefined>,
  ) => d3.DragBehavior<Element, unknown, unknown> = simulation => {
    function dragstarted(d) {
      if (!d3.event.active) simulation && simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) simulation && simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };
  private initSVG() {
    const { data } = this.option;

    const width = this.contain.offsetWidth;
    const height = this.contain.offsetHeight;

    const groupMap = {};
    const deviceMap = {};
    data.nodes.forEach(v => {
      const { group, type, parent } = v;
      if (type === 'device') {
        groupMap[group] = groupMap[group] || [];
        groupMap[group].push(v);
      } else {
        deviceMap[parent] = deviceMap[parent] || [];
        deviceMap[parent].push(v);
      }
    });
    const linksData = data.links.map(d => Object.create(d));
    const nodesData = [
      ...Object.keys(groupMap).map(k => ({ id: k, group: k, type: 'group' })),
      ...data.nodes,
    ].map(d => Object.create(d));
    const groupNodes = nodesData.filter(v => v.type === 'group');
    const deviceNodes = nodesData.filter(v => v.type === 'device');

    
    this.simulation = d3
      .forceSimulation<NodeData>(groupNodes)
      .force('link', this.forceLink)
      .force('charge', this.forceManyBody)
      .force('center', this.forceCenter)
      .force('collision', this.forceCollide);

    const svg = d3
      .select(this.contain)
      .append('svg')
      .attr('width', +width)
      .attr('height', +height)
      .call(d3.zoom().on('zoom', zoom_actions));
    const g = svg.append('g').attr('class', 'everythingWrap');
    function zoom_actions() {
      g.attr('transform', d3.event.transform);
    }

    const linksGroup = g
      .append('g')
      .attr('class', 'linksGroupWrap')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data([]) as d3.Selection<SVGLineElement, any, SVGGElement, unknown>;
    const linksDevice = g
      .append('g')
      .attr('class', 'linksDeviceWrap')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('stroke-width', 1) as d3.Selection<
      SVGLineElement,
      any,
      SVGGElement,
      unknown
    >;
    const nodesGroup = g
      .append('g')
      .attr('class', 'nodesGroupWrap')
      .selectAll('g')
      .data(groupNodes)
      .join('g')
      .attr('class', 'group')
      .attr('transform', function(d) {
        return `translate(${d.x},${d.y})`;
      })
      .call(this.createDrag(this.simulation)) as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    nodesGroup
      .append('circle')
      .attr('class', 'group-c')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('r', groupWidth)
      .attr('fill', this.createColor);
    const nodesDevice = g
      .append('g')
      .attr('class', 'nodesDeviceWrap')
      .selectAll('g')
      .call(this.createDrag(this.simulation)) as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
      const _this = this;
    nodesGroup
      .on('click', function(d, i) {
        _this.simulation.nodes([]);
        const forceManyBody = d3.forceManyBody();
        const forceCollide = d3.forceCollide<NodeData>(d =>
          d.type === 'group' ? groupWidth : deviceWidth,
        );
        const target = d3.select(this);
        const { event } = d3;
        nodesGroup.dispatch('unactive');
        if (target.classed('active')) {
          nodesGroup.dispatch('unactive');
          forceCollide.radius(d2 => {
            return d2.type === 'group' ? groupWidth : deviceWidth;
          });
        } else {
          nodesGroup.dispatch('unactive');
          target.dispatch('active');
          forceCollide.radius(d2 => {
            return d2 === d
              ? 1
              : d2.type === 'group'
              ? groupWidth
              : deviceWidth;
          });
        }
        const targetDevices = deviceNodes.filter(v => v.group === d.id);
        const targetLinks = targetDevices.map(v =>
          Object.create({ id: `${d.id}_${v.id}`, source: d.id, target: v.id }),
        );

        const forceLink = d3
          .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>([])
          .id(d => d.id);
        const simulation = d3
          .forceSimulation<NodeData>([...groupNodes, ...targetDevices])
          .force('link', forceLink)
          .force('charge', forceManyBody)
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', forceCollide);
        // simulation.stop();
        // simulation.nodes([
        //   ...groupNodes,
        //   ...targetDevices,
        // ]);
        // forceLink.distance(100);
        // forceLink.links(targetLinks).id(d => d.id);

        // // simulation.force('link', forceLink);
        // simulation.restart();

        // const linksGroup = svg
        //   .select('.linksGroupWrap')
        //   .selectAll('line')
        //   .data(targetLinks)
        //   .join('line')
        //   .attr('stroke-width', 1)
        //   .attr('x1', d => d.source.x)
        //   .attr('y1', d => d.source.y)
        //   .attr('x2', d => d.target.x)
        //   .attr('y2', d => d.target.y) as d3.Selection<
        //   SVGLineElement,
        //   any,
        //   SVGGElement,
        //   unknown
        // >;
        const nodesDevice = svg
          .select('.nodesDeviceWrap')
          .selectAll('g')
          .data(targetDevices)
          .join('g')
          .attr('class', 'device')
          .attr('transform', function(d) {
            return `translate(${d.x},${d.y})`;
          })
          .call(_this.createDrag(simulation)) as d3.Selection<
          SVGGElement,
          NodeData,
          null,
          undefined
        >;
        nodesDevice
          //   .enter()
          .append('path')
          .attr('class', 'device')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('fill', _this.createColor)
          .attr('d', d => {
            return `m 0 -${deviceWidth} l ${tempW} ${deviceWidth /
              2} l 0 ${deviceWidth} l -${tempW} ${deviceWidth /
              2} l -${tempW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`;
          });
        nodesDevice.merge(nodesDevice);
        nodesDevice.exit().remove();
        attachEvents(linksGroup, linksDevice, nodesGroup, nodesDevice);
      })
      .on('active', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        target
          .classed('active', true)
          .select('.group-c')
          .attr('opacity', 0);
      })
      .on('unactive', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        if (target.classed('active')) {
          target
            .classed('active', false)
            .select('.group-c')
            .attr('opacity', 1);
        }
      });
    function attachEvents(linksGroup, linksDevice, nodesGroup, nodesDevice) {
      _this.simulation &&
      _this.simulation.on('tick', () => {
          linksGroup
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
          linksDevice
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
          nodesGroup.attr('transform', function(d) {
            return `translate(${d.x},${d.y})`;
          });
          nodesDevice.attr('transform', function(d) {
            return `translate(${d.x},${d.y})`;
          });
        });
    }
    attachEvents(linksGroup, linksDevice, nodesGroup, nodesDevice);
  }

  public destroy() {}
}
