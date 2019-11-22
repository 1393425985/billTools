import * as d3 from 'd3';
import _ from 'lodash';

const groupWidth = 100;
const deviceWidth = 10;

export interface SVGManageOption {
  data: {
    nodes: {
      id: string;
      group: string;
      fx?: number;
      fy?: number;
      type: 'device' | 'param' | 'group';
      name?: string;
    }[];
    links: LinkData1[];
  };
  type: 'fixed' | 'auto';
  defaultScale?: number;
  groupColors?: { [group: string]: string };
  events?: {
    onSelectedChange?: (ids: string[]) => {};
  };
  d3Option?: {
    nodeSize?: number;
    alpha?: number;
    alphaMin?: number;
    alphaDecay?: number;
    velocityDecay?: number;
    collideRadius?: number;
    collideStrength?: number;
    collideIterations?: number;
    linkDistance?: number;
    linkIterations?: number;
    manyBodyStrength?: number;
    manyBodyTheta?: number;
    manyBodyDistanceMin?: number;
    manyBodydistanceMax?: number;
  };
}
type NodeData = d3.SimulationNodeDatum & SVGManageOption['data']['nodes'][0];
type LinkData1 = { id?: string; source: string; target: string };
type LinkData2 = {
  source: { id: string; x?: number; y?: number };
  target: { id: string; x?: number; y?: number };
};
export default class SVGManage {
  private contain: HTMLDivElement;
  private option: SVGManageOption;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private createColor: (k: any) => string;
  private forceManyBody: d3.ForceManyBody<d3.SimulationNodeDatum>;
  private forceCollide: d3.ForceCollide<NodeData>;
  private forceLink: d3.ForceLink<NodeData, d3.SimulationLinkDatum<NodeData>>;
  private forceCenter: d3.ForceCenter<NodeData>;
  private simulation: d3.Simulation<NodeData, undefined>;
  private activeNodeIdSet: Set<string>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  constructor(contain: HTMLDivElement, option: SVGManageOption) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.init();
  }
  static D3Option() {
    return {
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
      nodeSize: deviceWidth,
      collideRadius: deviceWidth,
      collideStrength: 0.7,
      collideIterations: 1,
      linkDistance: 30,
      linkIterations: 1,
      manyBodyStrength: -30,
      manyBodyTheta: 0.9,
      manyBodyDistanceMin: 1,
      manyBodydistanceMax: 999999999,
    };
  }
  private init() {
    const {
      collideRadius,
      collideStrength,
      collideIterations,
      linkDistance,
      linkIterations,
      manyBodyStrength,
      manyBodyTheta,
      manyBodyDistanceMin,
      manyBodydistanceMax,
    } = this.getD3Option();
    const scale = d3.scaleOrdinal(d3.schemeCategory10);
    this.createColor = d =>
      this.option.groupColors
        ? this.option.groupColors[d.group]
        : scale(d.group);
    this.forceManyBody = d3
      .forceManyBody()
      .strength(manyBodyStrength)
      .theta(manyBodyTheta)
      .distanceMin(manyBodyDistanceMin)
      .distanceMax(manyBodydistanceMax);
    this.forceCollide = d3
      .forceCollide<NodeData>(d =>
        d.type === 'group' ? groupWidth : collideRadius,
      )
      .strength(collideStrength)
      .iterations(collideIterations);
    this.forceCenter = d3.forceCenter(
      this.contain.offsetWidth / 2,
      this.contain.offsetHeight / 2,
    );
    this.forceLink = d3
      .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>([])
      .id(d => d.id)
      .distance(linkDistance)
      .iterations(linkIterations);
    this.activeNodeIdSet = new Set();
    this.initSVG();
    this.initEvent();
  }
  private createDrag: (
    k: d3.Simulation<NodeData, undefined>,
  ) => d3.DragBehavior<Element, unknown, unknown> = simulation => {
    let couldDrag = true;
    function dragstarted(d) {
      if (!d3.select(d3.event.sourceEvent.target).classed('rect')) {
        couldDrag = false;
        return;
      }
      if (!d3.event.active) simulation && simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      if (couldDrag) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
        if (!simulation) {
          d.x = d.fx;
          d.y = d.fy;
          d3.select(this).attr('transform', function(d: NodeData) {
            return 'translate(' + d.fx + ',' + d.fy + ')';
          });
          d3.selectAll('.linksWrap line')
            .filter((d2: LinkData2) => d2.source.id === d.id)
            .attr('x1', d.fx)
            .attr('y1', d.fy);
          d3.selectAll('.linksWrap line')
            .filter((d2: LinkData2) => d2.target.id === d.id)
            .attr('x2', d.fx)
            .attr('y2', d.fy);
        }
      }
    }

    function dragended(d) {
      if (!couldDrag) {
        couldDrag = true;
        return;
      }
      if (!d3.event.active) simulation && simulation.alphaTarget(0);
      if (simulation) {
        d.fx = null;
        d.fy = null;
      }
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  };
  private initSVG() {
    const { data, type = 'auto', defaultScale = 1 } = this.option;
    const {
      alpha,
      alphaMin,
      alphaDecay,
      velocityDecay,
      nodeSize,
      linkDistance,
      linkIterations,
    } = this.getD3Option();
    const tempW = Math.sqrt((3 / 4) * Math.pow(nodeSize, 2));
    const isFixed = type === 'fixed';

    const width = this.contain.offsetWidth;
    const height = this.contain.offsetHeight;

    const linksData =
      type === 'auto'
        ? data.links.map(d => Object.create(d))
        : data.links.map(d =>
            Object.create(
              Object.assign(d, {
                source: { id: d.source },
                target: { id: d.target },
              }),
            ),
          );
    const nodesData = data.nodes.map(d => Object.create(d));
    const nodeMap = nodesData.reduce(
      (l, v) => Object.assign(l, { [v.id]: v }),
      {},
    ) as { [k: string]: SVGManageOption['data']['nodes'][0] };
    this.forceLink = d3
      .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>(linksData)
      .id(d => d.id)
      .distance(linkDistance)
      .iterations(linkIterations);
    this.simulation =
      !isFixed &&
      d3
        .forceSimulation<NodeData>(nodesData)
        .alpha(alpha)
        .alphaMin(alphaMin)
        .alphaDecay(alphaDecay)
        .velocityDecay(velocityDecay)
        .force('link', this.forceLink)
        .force('charge', this.forceManyBody)
        .force('x', d3.forceX())
        .force('y', d3.forceY())
        .force('center', this.forceCenter)
        .force('collision', this.forceCollide);
    this.zoom = d3.zoom().on('zoom', function zoom_actions() {
      g.attr('transform', d3.event.transform);
    });
    this.svg = d3
      .select(this.contain)
      .append('svg')
      .attr('width', +width)
      .attr('height', +height)
      .call(this.zoom);

    const g = this.svg.append('g').attr('class', 'everythingWrap');
    this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(defaultScale));
    const links = g
      .append('g')
      .attr('class', 'linksWrap')
      .attr('stroke', '#999')
      .attr('opacity', 0.6)
      .selectAll('line')
      .data(linksData)
      .join('line')
      .attr('class', 'link')
      // .attr('class',d=>`line_${d.source} line_${d.target}`)
      .attr('stroke-width', 1) as d3.Selection<
      SVGLineElement,
      LinkData2,
      SVGGElement,
      unknown
    >;
    !this.simulation &&
      links
        .attr('x1', d => nodeMap[d.source.id].fx)
        .attr('y1', d => nodeMap[d.source.id].fy)
        .attr('x2', d => nodeMap[d.target.id].fx)
        .attr('y2', d => nodeMap[d.target.id].fy);

    const nodesParam = g
      .append('g')
      .attr('class', 'nodesParamWrap')
      .selectAll('g')
      .data(nodesData.filter(v => v.type === 'param'))
      .join('g')
      .attr('class', 'param')
      // .attr('id',d=>`device_${d.id}`)
      .attr('transform', function(d) {
        return d.fx ? `translate(${d.fx},${d.fy})` : '';
      })
      .call(this.createDrag(this.simulation)) as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const nodesDevice = g
      .append('g')
      .attr('class', 'nodesDeviceWrap')
      .selectAll('g')
      .data(nodesData.filter(v => v.type === 'device'))
      .join('g')
      .attr('class', 'device')
      // .attr('id',d=>`device_${d.id}`)
      .attr('transform', function(d) {
        return d.fx ? `translate(${d.fx},${d.fy})` : '';
      })
      .call(this.createDrag(this.simulation)) as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    nodesDevice
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', 0.8)
      .attr(
        'd',
        `m 0 -${nodeSize} l ${tempW} ${nodeSize /
          2} l 0 ${nodeSize} l -${tempW} ${nodeSize /
          2} l -${tempW} -${nodeSize / 2} l 0 -${nodeSize}  z`,
      );
    nodesParam
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', 0.6)
      .attr(
        'd',
        `m 0 -${nodeSize} l ${nodeSize} ${nodeSize} l -${nodeSize} ${nodeSize} l -${nodeSize} -${nodeSize} z`,
      );
    // nodes.append('circle').attr('dx',0).attr('dy',0).attr("r", 1).attr('fill', 'green').attr('opacity',0.2)
    const typeBoxMap = {};
    // nodes
    //   .append('text')
    //   .attr('class', 'type')
    //   .attr('dy', '0.35em')
    //   .text(d => (d.group.length < 4 ? d.group : ''))
    //   .attr('dx', function(d) {
    //     typeBoxMap[d.group] = typeBoxMap[d.group] || this.getBBox();
    //     return -typeBoxMap[d.group].width / 2 + 0.5;
    //   });
    nodesDevice
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .style('font-size', '8px')
      .attr('dx', nodeSize + 3);
    nodesParam
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.6)
      .attr('pointer-events', 'none')
      .style('font-size', '6px')
      .attr('dx', nodeSize + 3);
  }
  private initEvent() {
    const _this = this;
    const { events = {} } = this.option;
    const { onSelectedChange = () => {} } = events;
    const nodesDevice = d3.selectAll(
      '.nodesDeviceWrap .device',
    ) as d3.Selection<SVGGElement, NodeData, null, undefined>;
    const nodesParam = d3.selectAll('.nodesParamWrap .param') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const links = d3.selectAll('.linksWrap .link') as d3.Selection<
      SVGLineElement,
      LinkData2,
      null,
      unknown
    >;
    const opacityFn = function() {
      const target = d3.select(this);
      const event = d3.event;
      if (!target.classed('opacity')) {
        target.classed('opacity', true).attr('opacity', 0.4);
      }
    };
    const unopacityFn = function() {
      const target = d3.select(this);
      const event = d3.event;
      if (target.classed('opacity')) {
        target.classed('opacity', false).attr('opacity', 1);
      }
    };
    const activeFn = function(d, i) {
      const target = d3.select(d3.event.target.parentNode);
      const { event } = d3;
      if (!event.ctrlKey) {
        nodesDevice.dispatch('unactive');
        nodesParam.dispatch('unactive');
      }
      if (target.classed('active')) {
        target.dispatch('unactive');
      } else {
        target.dispatch('active');
      }

      _this.setOpacity(nodesDevice, nodesParam, links);
      onSelectedChange(Array.from(_this.activeNodeIdSet));
    };
    const showInCenterFn = function(d) {
      _this.svg.call(
        _this.zoom.transform,
        d3.zoomIdentity.translate(
          _this.contain.offsetWidth / 2 - (_this.simulation ? d.x : d.fx),
          _this.contain.offsetHeight / 2 - (_this.simulation ? d.y : d.fy),
        ),
      );
    };
    nodesDevice.select('.rect').on('click', activeFn);
    nodesParam.select('.rect').on('click', activeFn);
    nodesDevice
      .on('active', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        target
          .classed('active', true)
          .select('.rect')
          .transition()
          .attr('stroke', _this.createColor(d.group));
        _this.activeNodeIdSet.add(d.id);
      })
      .on('unactive', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        if (target.classed('active')) {
          target
            .classed('active', false)
            .select('.rect')
            .transition()
            .attr('stroke', '#fff');
          _this.activeNodeIdSet.delete(d.id);
        }
      })
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('showInCenter', showInCenterFn);
    nodesParam
      .on('active', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        target.classed('active', true);
        _this.activeNodeIdSet.add(d.id);
      })
      .on('unactive', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        if (target.classed('active')) {
          target.classed('active', false).select('.rect');
          _this.activeNodeIdSet.delete(d.id);
        }
      })
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('showInCenter', showInCenterFn);
    links.on('opacity', opacityFn).on('unopacity', unopacityFn);
    this.simulation &&
      this.simulation.on('tick', () => {
        links
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        nodesDevice.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
        nodesParam.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
      });
  }
  private setOpacity(
    d?: d3.Selection<SVGGElement, NodeData, null, undefined>,
    p?: d3.Selection<SVGGElement, NodeData, null, undefined>,
    l?: d3.Selection<SVGLineElement, LinkData2, null, unknown>,
  ) {
    const nodesDevice =
      d ||
      (d3.selectAll('.nodesDeviceWrap .device') as d3.Selection<
        SVGGElement,
        NodeData,
        null,
        undefined
      >);
    const nodesParam =
      p ||
      (d3.selectAll('.nodesDeviceWrap .param') as d3.Selection<
        SVGGElement,
        NodeData,
        null,
        undefined
      >);
    const links =
      l ||
      (d3.selectAll('.linksWrap .link') as d3.Selection<
        SVGLineElement,
        LinkData2,
        null,
        unknown
      >);
    if (this.activeNodeIdSet.size > 0) {
      nodesDevice.sort((a, b) => (this.activeNodeIdSet.has(a.id) ? 1 : -1));
      nodesDevice.dispatch('opacity');
      nodesParam.dispatch('opacity');
      links.dispatch('opacity');
      const linkNodeIdSet = new Set<string>(this.activeNodeIdSet);

      links
        .filter(d => {
          const is =
            this.activeNodeIdSet.has(d.source.id) ||
            this.activeNodeIdSet.has(d.target.id);
          if (is) {
            linkNodeIdSet.add(d.source.id);
            linkNodeIdSet.add(d.target.id);
          }
          return is;
        })
        .dispatch('unopacity');
      nodesDevice.filter(d => linkNodeIdSet.has(d.id)).dispatch('unopacity');
      nodesParam.filter(d => linkNodeIdSet.has(d.id)).dispatch('unopacity');
      nodesParam.sort((a, b) => (linkNodeIdSet.has(a.id) ? 1 : -1));
    } else {
      nodesDevice.dispatch('unopacity');
      nodesParam.dispatch('unopacity');
      links.dispatch('unopacity');
    }
  }
  public addLinks(ls: LinkData1[]) {
    const { data, type = 'auto' } = this.option;
    const { nodes } = data;
    const devicesIdSet = new Set(nodes.map(v => v.id));
    ls = ls.filter(
      v => devicesIdSet.has(v.source) && devicesIdSet.has(v.target),
    );
    if (!ls.length) {
      return;
    }
    this.option.data.links.push(
      ...(type === 'auto'
        ? ls
        : ls.map(d =>
            Object.assign(d, {
              source: { id: d.source },
              target: { id: d.target },
            }),
          )),
    );
    const linksData = this.option.data.links.map(d => Object.create(d));
    const links = d3
      .select('.linksWrap')
      .selectAll('line')
      .data(linksData) as d3.Selection<
      SVGLineElement,
      LinkData2,
      null,
      unknown
    >;
    if (!this.simulation) {
      const nodeMap = nodes.reduce(
        (l, v) => Object.assign(l, { [v.id]: v }),
        {},
      ) as { [k: string]: SVGManageOption['data']['nodes'][0] };
      links
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links)
        .attr('x1', d => nodeMap[d.source.id].fx)
        .attr('y1', d => nodeMap[d.source.id].fy)
        .attr('x2', d => nodeMap[d.target.id].fx)
        .attr('y2', d => nodeMap[d.target.id].fy);
      links.exit().remove();
    } else {
      this.forceLink.links(linksData);
      links
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links);
      links.exit().remove();
      this.initEvent();
      this.simulation.restart();
    }
  }
  public removeLinks(ids: string[]) {
    if (!ids.length) {
      return;
    }
    const idSet = new Set(ids);
    this.option.data.links = this.option.data.links.filter(
      v => !idSet.has(v.id),
    );
    const linksData = this.option.data.links.map(d => Object.create(d));
    const links = d3
      .select('.linksWrap')
      .selectAll('line')
      .data(linksData) as d3.Selection<
      SVGLineElement,
      LinkData2,
      null,
      unknown
    >;
    if (!this.simulation) {
      links
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links);
      links.exit().remove();
    } else {
      this.forceLink.links(linksData);
      links
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links);
      links.exit().remove();
      this.initEvent();
      this.simulation.restart();
    }
  }
  public getLegend() {
    return Array.from(new Set(this.option.data.nodes.map(v => v.group))).map(
      v => ({
        group: v,
        color: this.createColor({ group: v }),
      }),
    );
  }
  public selectByIds(ids: string[]) {
    const nodesDevice = d3.selectAll(
      '.nodesDeviceWrap .device',
    ) as d3.Selection<SVGGElement, NodeData, null, undefined>;
    const nodesParam = d3.selectAll('.nodesParamWrap .param') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const links = d3.selectAll('.linksWrap .link') as d3.Selection<
      SVGLineElement,
      LinkData2,
      null,
      unknown
    >;
    nodesDevice.dispatch('unactive');
    nodesParam.dispatch('unactive');
    const activeNodeIdSet = new Set(ids);
    const selectDevice = nodesDevice
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    const selectParam = nodesParam
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    this.setOpacity(nodesDevice, nodesParam, links);
    selectParam.dispatch('showInCenter');
    selectDevice.dispatch('showInCenter');
  }
  public getD3Option() {
    const { d3Option = {} } = this.option;
    return Object.assign({}, SVGManage.D3Option(), d3Option);
  }
  public getNode() {
    return this.svg.node();
  }
  public destroy() {
    this.simulation && this.simulation.stop();
    this.simulation = undefined;
    this.svg.remove();
  }
}
