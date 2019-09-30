import * as d3 from 'd3';
import _ from 'lodash';

const nodeBaseWidth = 6;
const tempNearXY = {};
function createNearXY(x, y, tx, ty, r, r2, isClear = false) {
  const tr = r2 + 1;
  const key = `${x.toFixed(1)}-${y.toFixed(1)}-${tx.toFixed(1)}-${ty.toFixed(
    1,
  )}-${r.toFixed(1)}-${tr.toFixed(1)}`;
  let rs;
  if (key in tempNearXY) {
    rs = tempNearXY[key];
    if (isClear) {
      Reflect.deleteProperty(tempNearXY, key);
    }
    return rs;
  }
  const dx = tx - x;
  const dy = ty - y;
  const dz = Math.sqrt(dx ** 2 + dy ** 2);
  const rsX1 = (r * dx) / dz;
  const rsY1 = (r * dy) / dz;
  const rsX2 = dx - (dx * tr) / dz;
  const rsY2 = dy - (dy * tr) / dz;
  rs = {
    x1: x + rsX1,
    y1: y + rsY1,
    x2: x + rsX2,
    y2: y + rsY2,
  };
  tempNearXY[key] = rs;
  return rs;
}
function createLinePath(x, y, tx, ty, r, tr) {
  const { x1, y1, x2, y2 } = createNearXY(
    Number(x),
    Number(y),
    Number(tx),
    Number(ty),
    Number(r),
    Number(tr),
    true,
  );
  const radian = (2 * Math.PI) / 360;
  const centerX = x1 + (x2 - x1) / 2;
  const centerY = y1 + (y2 - y1) / 2;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const distance = Math.sqrt(dx * dx + dy * dy) / 2;
  let angle = isNaN(Math.atan(dx / dy) / radian)
    ? 0
    : Math.atan(dx / dy) / radian;

  let controlPointX;
  let controlPointY;
  let path = '';

  if (centerY >= y1) {
    if (x1 <= x2) {
      if (angle >= 45) {
        controlPointX = x1 + distance / Math.sin(angle * radian);
        path = `M ${x1} ${y1} Q ${controlPointX} ${y1} ${x2} ${y2}`;
      } else {
        controlPointY = y2 - distance / Math.cos(angle * radian);
        path = `M ${x1} ${y1} Q ${x2} ${controlPointY} ${x2} ${y2}`;
      }
    } else {
      if (angle >= 45) {
        controlPointX = x2 + distance / Math.sin(angle * radian);
        path = `M ${x1} ${y1} Q ${controlPointX} ${y2} ${x2} ${y2}`;
      } else {
        controlPointY = y1 + distance / Math.cos(angle * radian);
        path = `M ${x1} ${y1} Q ${x1} ${controlPointY} ${x2} ${y2}`;
      }
    }
  } else {
    if (x1 <= x2) {
      if (angle >= 45) {
        controlPointX = x2 - distance / Math.sin(angle * radian);
        path = `M ${x1} ${y1} Q ${controlPointX} ${y2} ${x2} ${y2}`;
      } else {
        controlPointY = y1 - distance / Math.cos(angle * radian);
        path = `M ${x1} ${y1} Q ${x1} ${controlPointY} ${x2} ${y2}`;
      }
    } else {
      if (angle >= 45) {
        controlPointX = x1 - distance / Math.sin(angle * radian);
        path = `M ${x1} ${y1} Q ${controlPointX} ${y1} ${x2} ${y2}`;
      } else {
        controlPointY = y2 + distance / Math.cos(angle * radian);
        path = `M ${x1} ${y1} Q ${x2} ${controlPointY} ${x2} ${y2}`;
      }
    }
  }
  return path;
}
type NodeType = 'device' | 'param' | 'group' | 'fault' | 'energy';
export interface SVGManageOption {
  data: {
    nodes: {
      id: string;
      fx?: number;
      fy?: number;
      type?: NodeType;
      isFault?: boolean;
      isEnergy?: boolean;
      bgText?: string;
      name?: string;
      color?: string;
      opacity?: number;
      scale?: number;
      tooltip?: string;
    }[];
    links: LinkData1[];
  };
  type: 'fixed' | 'auto';
  defaultScale?: number;
  events?: {
    onSelectedChange?: (ids: string[], e: any) => {};
    onClick?: (id: string, e: any) => boolean;
  };
  d3Option?: {
    nodeSize?: number;
    sizeX?: { [key: string]: number };
    lineType?: string;

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
type LinkData1 = {
  id?: string;
  source: string;
  target: string;
  type?: 'normal' | 'arrow';
  color?: string;
  opacity?: number;
};
type LinkData2 = {
  source: { id: string; x?: number; y?: number };
  target: { id: string; x?: number; y?: number };
  type?: LinkData1['type'];
};
export default class SVGManage {
  private contain: HTMLDivElement;
  private option: SVGManageOption;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private forceManyBody: d3.ForceManyBody<d3.SimulationNodeDatum>;
  private forceCollide: d3.ForceCollide<NodeData>;
  private forceLink: d3.ForceLink<NodeData, d3.SimulationLinkDatum<NodeData>>;
  private forceCenter: d3.ForceCenter<NodeData>;
  private simulation: d3.Simulation<NodeData, undefined>;
  private activeNodeIdSet: Set<string>;
  private zoom: d3.ZoomBehavior<Element, unknown>;
  private transform: { x: number; y: number; k: number };
  private nodeMap: { [k: string]: SVGManageOption['data']['nodes'][0] };
  private arrowMap: { [k: string]: string };
  constructor(contain: HTMLDivElement, option: SVGManageOption) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.init();
    
  }
  static D3Option() {
    return {
      nodeSize: nodeBaseWidth,
      lineType: 'path',
      sizeX: {
        device: 1,
        group: 1.2,
        param: 0.5,
        fault: 1.5,
        energy: 1.5,
      },
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
      collideRadius: nodeBaseWidth * 1,
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
      sizeX,
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
    this.forceManyBody = d3
      .forceManyBody()
      .strength(manyBodyStrength)
      .theta(manyBodyTheta)
      .distanceMin(manyBodyDistanceMin)
      .distanceMax(manyBodydistanceMax);
    this.forceCollide = d3
      .forceCollide<NodeData>(
        d => collideRadius * sizeX[d.type] * this.createScale(d),
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
    this.initTooltips();
    this.initSVG();
    this.initEvent();
  }
  private createDrag: (
    k: d3.Simulation<NodeData, undefined>,
  ) => d3.DragBehavior<Element, unknown, unknown> = simulation => {
    const _this = this;
    const { lineType } = this.getD3Option();
    const rMap = this.getR();
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
          const links = d3.selectAll(`.linksWrap .link`) as d3.Selection<
            SVGLineElement | SVGPathElement,
            LinkData2,
            null,
            unknown
          >;
          //   const links1 = links
          //   .filter(d2 => d2.source.id === d.id)
          //   .attr('x1', d.fx)
          //   .attr('y1', d.fy);
          // const links2 = links
          //   .filter(d2 => d2.target.id === d.id)
          //   .attr('x2', d.fx)
          //   .attr('y2', d.fy);
          const links1 = links
            .filter(d2 => d2.source.id === d.id)
            .attr(
              'x1',
              d2 =>
                createNearXY(
                  d.fx,
                  d.fy,
                  _this.nodeMap[d2.target.id].fx,
                  _this.nodeMap[d2.target.id].fy,
                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).x1,
            )
            .attr(
              'y1',
              d2 =>
                createNearXY(
                  d.fx,
                  d.fy,
                  _this.nodeMap[d2.target.id].fx,
                  _this.nodeMap[d2.target.id].fy,
                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).y1,
            )
            .attr(
              'x2',
              d2 =>
                createNearXY(
                  d.fx,
                  d.fy,
                  _this.nodeMap[d2.target.id].fx,
                  _this.nodeMap[d2.target.id].fy,
                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).x2,
            )
            .attr(
              'y2',
              d2 =>
                createNearXY(
                  d.fx,
                  d.fy,
                  _this.nodeMap[d2.target.id].fx,
                  _this.nodeMap[d2.target.id].fy,
                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                  true,
                ).y2,
            );
          const links2 = links
            .filter(d2 => d2.target.id === d.id)
            .attr('x2', d.fx)
            .attr('y2', d.fy)
            .attr(
              'x1',
              d2 =>
                createNearXY(
                  _this.nodeMap[d2.source.id].fx,
                  _this.nodeMap[d2.source.id].fy,
                  d.fx,
                  d.fy,
                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).x1,
            )
            .attr(
              'y1',
              d2 =>
                createNearXY(
                  _this.nodeMap[d2.source.id].fx,
                  _this.nodeMap[d2.source.id].fy,
                  d.fx,
                  d.fy,

                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).y1,
            )
            .attr(
              'x2',
              d2 =>
                createNearXY(
                  _this.nodeMap[d2.source.id].fx,
                  _this.nodeMap[d2.source.id].fy,
                  d.fx,
                  d.fy,

                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                ).x2,
            )
            .attr(
              'y2',
              d2 =>
                createNearXY(
                  _this.nodeMap[d2.source.id].fx,
                  _this.nodeMap[d2.source.id].fy,
                  d.fx,
                  d.fy,

                  rMap[_this.nodeMap[d2.source.id].type] *
                    _this.createScale(_this.nodeMap[d2.source.id]),
                  rMap[_this.nodeMap[d2.target.id].type] *
                    _this.createScale(_this.nodeMap[d2.target.id]),
                  true,
                ).y2,
            );
          if (lineType === 'path') {
            links1.attr('d', function(d2) {
              const t = d3.select(this);
              return createLinePath(
                d.fx,
                d.fy,
                _this.nodeMap[d2.target.id].fx,
                _this.nodeMap[d2.target.id].fy,
                rMap[_this.nodeMap[d2.source.id].type] *
                  _this.createScale(_this.nodeMap[d2.source.id]),
                rMap[_this.nodeMap[d2.target.id].type] *
                  _this.createScale(_this.nodeMap[d2.target.id]),
              );
            });
            links2.attr('d', function(d2) {
              const t = d3.select(this);
              return createLinePath(
                _this.nodeMap[d2.source.id].fx,
                _this.nodeMap[d2.source.id].fy,
                d.fx,
                d.fy,
                rMap[_this.nodeMap[d2.source.id].type] *
                  _this.createScale(_this.nodeMap[d2.source.id]),
                rMap[_this.nodeMap[d2.target.id].type] *
                  _this.createScale(_this.nodeMap[d2.target.id]),
              );
            });
          }
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
  private createColor(d: NodeData) {
    return d.color || '#333';
  }
  private createScale(d: NodeData) {
    return d.scale || 1;
  }
  private createOpacity(d: NodeData) {
    return d.opacity || 1;
  }
  private initTooltips() {
    this.tooltip = d3
      .select(this.contain)
      .append('div')
      .attr('class', 'svg-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('z-index', '1')
      .style('max-height', '60vh')
      .style('user-select','none');
  }
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
      lineType,
    } = this.getD3Option();
    const rMap = this.getR();
    const groupWidth = rMap.group;
    const deviceWidth = rMap.device;
    const paramWidth = rMap.param;
    const faultWidth = rMap.fault;
    const energyWidth = rMap.energy;
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
    const {
      device = [],
      param = [],
      group = [],
      fault = [],
      energy = [],
    }: {
      device: any[];
      param: any[];
      group: any[];
      fault: any[];
      energy: any[];
    } = nodesData.reduce(
      (l, v) => Object.assign(l, { [v.type]: [...(l[v.type] || []), v] }),
      {},
    );
    const nodeMap = nodesData.reduce(
      (l, v) => Object.assign(l, { [v.id]: v }),
      {},
    ) as { [k: string]: SVGManageOption['data']['nodes'][0] };
    this.nodeMap = nodeMap;
    this.arrowMap = {};
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

    this.zoom = d3.zoom().on('zoom', () => {
      this.transform = {
        x: d3.event.transform.x,
        y: d3.event.transform.y,
        k: d3.event.transform.k,
      };
      g.attr('transform', d3.event.transform);
    });
    this.svg = d3
      .select(this.contain)
      .append('svg')
      .attr('width', +width)
      .attr('height', +height)
      .call(this.zoom);

    const g = this.svg.append('g').attr('class', 'everythingWrap');

    const defs = this.svg.append('defs').attr('class', 'defsWrap');
    const filter = defs
      .append('filter')
      .attr('id', 'shadow')
      .attr('height', '130%');
    filter
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '5')
      .attr('result', 'blur');
    filter
      .append('feOffset')
      .attr('in', 'blur')
      .attr('dx', '5')
      .attr('dy', '5')
      .attr('result', 'offsetBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'offsetBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const linearGradient = defs
      .append('linearGradient')
      .attr('id', 'linearColor')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#3648DC');

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#224297');
    this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(defaultScale));

    const links = g
      .append('g')
      .attr('class', 'linksWrap')

      .selectAll(lineType)
      .data(linksData)
      .join(lineType)
      .attr('class', 'link')
      .attr('stroke-width', 1)
      .attr('stroke', this.createColor)
      .attr('opacity', this.createOpacity)
      .attr('fill', 'none')
      .attr('marker-end', d =>
        d.type === 'arrow' ? this.getArrow(this.createColor(d)) : '',
      ) as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      SVGGElement,
      unknown
    >;
    if (!this.simulation) {
      links
        .attr(
          'x1',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).x1,
        )
        .attr(
          'y1',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).y1,
        )
        .attr(
          'x2',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).x2,
        )
        .attr(
          'y2',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
              true,
            ).y2,
        );
      lineType === 'path' &&
        links.attr('d', d =>
          createLinePath(
            nodeMap[d.source.id].fx,
            nodeMap[d.source.id].fy,
            nodeMap[d.target.id].fx,
            nodeMap[d.target.id].fy,
            rMap[nodeMap[d.source.id].type] *
              this.createScale(nodeMap[d.source.id]),
            rMap[nodeMap[d.target.id].type] *
              this.createScale(nodeMap[d.target.id]),
          ),
        );
    }

    const nodesGroup = g
      .append('g')
      .attr('class', 'nodesGroupWrap')
      .selectAll('g')
      .data(group)
      .join('g')
      .attr('class', 'group')
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
    nodesGroup
      .append('circle')
      .attr('class', 'rect')
      .attr('r', d => this.createScale(d) * groupWidth)
      // .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .style('fill', d =>
        d.isFault ? 'url(#linearColor)' : this.createColor(d),
      );
    // .style('filter',d=>d.isFault?'url("#shadow")':'');

    const deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
    const nodesDevice = g
      .append('g')
      .attr('class', 'nodesDeviceWrap')
      .selectAll('g')
      .data(device)
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
      .attr('opacity', this.createOpacity)
      .attr(
        'd',
        `m 0 -${deviceWidth} l ${deviceW} ${deviceWidth /
          2} l 0 ${deviceWidth} l -${deviceW} ${deviceWidth /
          2} l -${deviceW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`,
      );

    const nodesParam = g
      .append('g')
      .attr('class', 'nodesParamWrap')
      .selectAll('g')
      .data(param)
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
    nodesParam
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .attr(
        'd',
        `m 0 -${paramWidth} l ${paramWidth} ${paramWidth} l -${paramWidth} ${paramWidth} l -${paramWidth} -${paramWidth} z`,
      );

    const faultW = Math.sqrt((3 / 4) * Math.pow(faultWidth, 2));
    const nodesFault = g
      .append('g')
      .attr('class', 'nodesFaultWrap')
      .selectAll('g')
      .data(fault)
      .join('g')
      .attr('class', 'fault')
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
    nodesFault
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .attr(
        'd',
        `m 0 -${faultWidth} l ${faultW} ${faultWidth /
          2} l 0 ${faultWidth} l -${faultW} ${faultWidth /
          2} l -${faultW} -${faultWidth / 2} l 0 -${faultWidth}  z`,
      );

    const energyW = Math.sqrt((3 / 4) * Math.pow(energyWidth, 2));
    const nodesEnergy = g
      .append('g')
      .attr('class', 'nodesEnergyWrap')
      .selectAll('g')
      .data(energy)
      .join('g')
      .attr('class', 'energy')
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
    nodesEnergy
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .attr(
        'd',
        `m 0 -${energyWidth} l ${energyW} ${energyWidth /
          2} l 0 ${energyWidth} l -${energyW} ${energyWidth /
          2} l -${energyW} -${energyWidth / 2} l 0 -${energyWidth}  z`,
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
    nodesGroup
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .style('font-size', '8px')
      .attr('dx', d => this.createScale(d) * groupWidth + 3);
    nodesGroup
      .append('text')
      .attr('class', 'bg')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text(d => d.bgText || '!')
      .attr('fill', '#EAC8A0')
      .attr('opacity', 1)
      .attr('pointer-events', 'none')
      .style('font-size', d => this.createScale(d) * groupWidth + 'px')
      .style('display', d => (d.isFault ? 'inline' : 'none'));
    nodesDevice
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .style('font-size', '8px')
      .attr('dx', deviceWidth + 3);
    nodesParam
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.6)
      .attr('pointer-events', 'none')
      .style('font-size', '6px')
      .attr('dx', paramWidth + 3);
    nodesFault
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .style('font-size', '8px')
      .attr('dx', faultWidth + 3);
    nodesFault
      .append('text')
      .attr('class', 'bg')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('!')
      .attr('fill', '#fff')
      .attr('opacity', 1)
      .attr('pointer-events', 'none')
      .style('font-size', `${faultWidth}px`);
    nodesEnergy
      .append('text')
      .attr('class', 'name')
      .attr('dy', '0.35em')
      .text(d => d.name || '')
      .attr('opacity', 0.8)
      .attr('pointer-events', 'none')
      .style('font-size', '8px')
      .attr('dx', energyWidth + 3);
    nodesEnergy
      .append('text')
      .attr('class', 'bg')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('$')
      .attr('fill', '#fff')
      .attr('opacity', 1)
      .attr('pointer-events', 'none')
      .style('font-size', `${energyWidth}px`);
  }
  private initEvent() {
    const _this = this;
    let isClickSVG = true;
    const { events = {} } = this.option;
    const { onSelectedChange = () => {}, onClick = () => true } = events;
    const { lineType } = this.getD3Option();
    const rMap = this.getR();
    const {
      nodesGroup,
      nodesDevice,
      nodesParam,
      nodesFault,
      nodesEnergy,
      links,
    } = this.getVars();

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
      isClickSVG = false;
      const target = d3.select(d3.event.target.parentNode) as d3.Selection<
        SVGGElement,
        NodeData,
        null,
        undefined
      >;
      const { event } = d3;
      const ctrlKey = event.ctrlKey || event.metaKey;
      const isNext = onClick(target.datum().id, event) === false ? false : true;
      if (!isNext) {
        return;
      }

      if (!ctrlKey) {
        nodesGroup.dispatch('unactive');
        nodesDevice.dispatch('unactive');
        nodesParam.dispatch('unactive');
        nodesFault.dispatch('unactive');
        nodesEnergy.dispatch('unactive');
      }
      if (target.classed('active')) {
        target.dispatch('unactive');
      } else {
        target.dispatch('active');
      }
      _this.setOpacity(
        nodesGroup,
        nodesDevice,
        nodesParam,
        nodesFault,
        nodesEnergy,
        links,
      );
      onSelectedChange(Array.from(_this.activeNodeIdSet), event);
    };
    const showInCenterFn = function(d) {
      _this.svg
        .transition()
        .duration(750)
        .call(
          _this.zoom.transform,
          d3.zoomIdentity.translate(
            _this.contain.offsetWidth / 2 - (_this.simulation ? d.x : d.fx),
            _this.contain.offsetHeight / 2 - (_this.simulation ? d.y : d.fy),
          ).scale(_this.transform.k),
        );
    };
    const mouseoverFn = function(d) {
      if (d.tooltip) {
        _this.tooltip
          .style('z-index', '1')
          .transition()
          .duration(200)
          .style('opacity', 0.9);

        _this.tooltip
          .html(d.tooltip);
          
        const top =
          d.y * _this.transform.k +
          _this.transform.y -
          rMap[d.type] * _this.createScale(d) * _this.transform.k;
        const left = d.x * _this.transform.k +
        _this.transform.x +
        rMap[d.type] * _this.createScale(d) * _this.transform.k;
        if (
          _this.tooltip.node().offsetHeight >
         _this.contain.offsetHeight / 2
        ) {
          if (top > _this.contain.offsetHeight / 2) {
            _this.tooltip.style(
              'top',
              _this.contain.offsetHeight -
                _this.tooltip.node().offsetHeight -
                8 +
                'px',
            );
          } else {
            _this.tooltip.style('top', 8 + 'px');
          }
        } else {
          _this.tooltip.style('top', top + 'px');
        }
        if (
          _this.tooltip.node().offsetWidth >
          _this.contain.offsetWidth - left - 8
        ) {
          _this.tooltip.style('left', left -_this.tooltip.node().offsetWidth - rMap[d.type] * _this.createScale(d)*2* _this.transform.k  + 'px');
        } else {
          _this.tooltip.style('left', left + 'px');
        }

        _this.tooltip.style('font-size', 8 * _this.transform.k + 'px');
      }
    };
    const mouseoutFn = function(d) {
      if (d.tooltip) {
        _this.tooltip
          .transition()
          .duration(500)
          .style('opacity', 0)
          .style('z-index', '-1')
          .style('max-height', '60vh');
      }
    };
    const nodeBigerFn = function() {
      // const target = d3.select(this);
      // const event = d3.event;
      // if (!target.classed('biger')) {
      //   const zoom = d3.zoom().on('zoom', function zoom_actions() {
      //     console.log(1111,d3.event.transform)
      //     d3.select(this).attr('transform', d3.event.transform);
      //   });
      //   // zoom.scaleBy(target.classed('biger', true), 3)
      //   target.classed('biger', true).call(zoom).call(zoom.transform, d3.zoomIdentity.scale(3));
      // }
    };
    const nodeUnbigerFn = function() {
      // const target = d3.select(this);
      // const event = d3.event;
      // if (target.classed('biger')) {
      //   target.classed('biger', false).attr('transform', 'scale(1)');
      // }
    };
    const linkBigerFn = function() {
      // const target = d3.select(this);
      // const event = d3.event;
      // if (!target.classed('biger')) {
      //   target.classed('biger', true).attr('transform', 'scale(3)');
      // }
    };
    const linkUnbigerFn = function() {
      // const target = d3.select(this);
      // const event = d3.event;
      // if (target.classed('biger')) {
      //   target.classed('biger', false).attr('transform', 'scale(1)');
      // }
    };
    this.svg.on('click',function(){
      if(isClickSVG){
        nodesGroup.dispatch('unactive');
        nodesDevice.dispatch('unactive');
        nodesParam.dispatch('unactive');
        nodesFault.dispatch('unactive');
        nodesEnergy.dispatch('unactive');
        _this.setOpacity(
          nodesGroup,
          nodesDevice,
          nodesParam,
          nodesFault,
          nodesEnergy,
          links,
        );
      }
      isClickSVG = true;
    })
    this.tooltip
      .on('mouseover', () => {
        _this.tooltip
          .style('z-index', '1')
          .transition()
          .duration(200)
          .style('opacity', 1);
      })
      .on('mouseout', () => {
        _this.tooltip
          .transition()
          .duration(500)
          .style('opacity', 0)
          .style('z-index', '-1');
      });
    nodesGroup
      .select('.rect')
      .on('click', activeFn)
      .on('mouseover', mouseoverFn)
      .on('mouseout', mouseoutFn);
    nodesDevice
      .select('.rect')
      .on('click', activeFn)
      .on('mouseover', mouseoverFn)
      .on('mouseout', mouseoutFn);
    nodesParam
      .select('.rect')
      .on('click', activeFn)
      .on('mouseover', mouseoverFn)
      .on('mouseout', mouseoutFn);
    nodesFault
      .select('.rect')
      .on('click', activeFn)
      .on('mouseover', mouseoverFn)
      .on('mouseout', mouseoutFn);
    nodesEnergy
      .select('.rect')
      .on('click', activeFn)
      .on('mouseover', mouseoverFn)
      .on('mouseout', mouseoutFn);
    nodesGroup
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
          target.classed('active', false);
          _this.activeNodeIdSet.delete(d.id);
        }
      })
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('showInCenter', showInCenterFn)
      .on('biger', nodeBigerFn)
      .on('unbiger', nodeUnbigerFn);
    nodesDevice
      .on('active', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        target
          .classed('active', true)
          .select('.rect')
          .transition()
          .attr('stroke', _this.createColor(d));
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
      .on('showInCenter', showInCenterFn)
      .on('biger', nodeBigerFn)
      .on('unbiger', nodeUnbigerFn);
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
      .on('showInCenter', showInCenterFn)
      .on('biger', nodeBigerFn)
      .on('unbiger', nodeUnbigerFn);
    nodesFault
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
          target.classed('active', false);
          _this.activeNodeIdSet.delete(d.id);
        }
      })
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('showInCenter', showInCenterFn)
      .on('biger', nodeBigerFn)
      .on('unbiger', nodeUnbigerFn);
    nodesEnergy
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
          target.classed('active', false);
          _this.activeNodeIdSet.delete(d.id);
        }
      })
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('showInCenter', showInCenterFn)
      .on('biger', nodeBigerFn)
      .on('unbiger', nodeUnbigerFn);
    links
      .on('opacity', opacityFn)
      .on('unopacity', unopacityFn)
      .on('biger', linkBigerFn)
      .on('unbiger', linkUnbigerFn);
    if (this.simulation) {
      const changeLinks =
        lineType === 'path'
          ? () => {
              links.attr('d', d =>
                createLinePath(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y,
                  rMap[_this.nodeMap[d.source.id].type] *
                    this.createScale(this.nodeMap[d.source.id]),
                  rMap[_this.nodeMap[d.target.id].type] *
                    this.createScale(this.nodeMap[d.target.id]),
                ),
              );
            }
          : () => {};
      this.simulation.on('tick', () => {
        links

          .attr(
            'x1',
            d =>
              createNearXY(
                d.source.x,
                d.source.y,
                d.target.x,
                d.target.y,
                rMap[this.nodeMap[d.source.id].type] *
                  this.createScale(this.nodeMap[d.source.id]),
                rMap[this.nodeMap[d.target.id].type] *
                  this.createScale(this.nodeMap[d.target.id]),
              ).x1,
          )
          .attr(
            'y1',
            d =>
              createNearXY(
                d.source.x,
                d.source.y,
                d.target.x,
                d.target.y,
                rMap[this.nodeMap[d.source.id].type] *
                  this.createScale(this.nodeMap[d.source.id]),
                rMap[this.nodeMap[d.target.id].type] *
                  this.createScale(this.nodeMap[d.target.id]),
              ).y1,
          )
          .attr(
            'x2',
            d =>
              createNearXY(
                d.source.x,
                d.source.y,
                d.target.x,
                d.target.y,
                rMap[this.nodeMap[d.source.id].type] *
                  this.createScale(this.nodeMap[d.source.id]),
                rMap[this.nodeMap[d.target.id].type] *
                  this.createScale(this.nodeMap[d.target.id]),
              ).x2,
          )
          .attr(
            'y2',
            d =>
              createNearXY(
                d.source.x,
                d.source.y,
                d.target.x,
                d.target.y,
                rMap[this.nodeMap[d.source.id].type] *
                  this.createScale(this.nodeMap[d.source.id]),
                rMap[this.nodeMap[d.target.id].type] *
                  this.createScale(this.nodeMap[d.target.id]),
                true,
              ).y2,
          );
        changeLinks();
        nodesDevice.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
        nodesParam.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
        nodesGroup.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
        nodesFault.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
        nodesEnergy.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
      });
    }
  }
  private getArrow(color) {
    if (color in this.arrowMap) {
      return this.arrowMap[color];
    }
    const defs = d3.select('.defsWrap') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    defs
      .append('marker')
      .attr('id', color.replace('#', ''))
      .attr('markerUnits', 'strokeWidth')
      .attr('viewBox', '0 0 4 4')
      .attr('refX', 0)
      .attr('refY', 1)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L0,2 L1,1 z')
      .style('fill', color);

    const rs = 'url(' + color + ')';
    this.arrowMap[color] = rs;
    return rs;
  }
  private setOpacity(
    nodesGroup: d3.Selection<SVGGElement, NodeData, null, undefined>,
    nodesDevice: d3.Selection<SVGGElement, NodeData, null, undefined>,
    nodesParam: d3.Selection<SVGGElement, NodeData, null, undefined>,
    nodesFault: d3.Selection<SVGGElement, NodeData, null, undefined>,
    nodesEnergy: d3.Selection<SVGGElement, NodeData, null, undefined>,
    links: d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      null,
      unknown
    >,
  ) {
    if (this.activeNodeIdSet.size > 0) {
      nodesDevice.sort((a, b) => (this.activeNodeIdSet.has(a.id) ? 1 : -1));
      nodesGroup.dispatch('opacity').dispatch('unbiger');
      nodesDevice.dispatch('opacity').dispatch('unbiger');
      nodesParam.dispatch('opacity').dispatch('unbiger');
      nodesFault.dispatch('opacity').dispatch('unbiger');
      nodesEnergy.dispatch('opacity').dispatch('unbiger');
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
      nodesGroup
        .filter(d => linkNodeIdSet.has(d.id))
        .dispatch('unopacity')
        .dispatch('biger');
      nodesDevice
        .filter(d => linkNodeIdSet.has(d.id))
        .dispatch('unopacity')
        .dispatch('biger');
      nodesParam
        .filter(d => linkNodeIdSet.has(d.id))
        .dispatch('unopacity')
        .dispatch('biger');
      nodesFault
        .filter(d => linkNodeIdSet.has(d.id))
        .dispatch('unopacity')
        .dispatch('biger');
      nodesEnergy
        .filter(d => linkNodeIdSet.has(d.id))
        .dispatch('unopacity')
        .dispatch('biger');
      nodesParam.sort((a, b) => (linkNodeIdSet.has(a.id) ? 1 : -1));
      nodesGroup.sort((a, b) => (linkNodeIdSet.has(a.id) ? 1 : -1));
      nodesFault.sort((a, b) => (linkNodeIdSet.has(a.id) ? 1 : -1));
      nodesEnergy.sort((a, b) => (linkNodeIdSet.has(a.id) ? 1 : -1));
    } else {
      nodesGroup.dispatch('unopacity').dispatch('unbiger');
      nodesDevice.dispatch('unopacity').dispatch('unbiger');
      nodesParam.dispatch('unopacity').dispatch('unbiger');
      nodesFault.dispatch('unopacity').dispatch('unbiger');
      nodesEnergy.dispatch('unopacity').dispatch('unbiger');
      links.dispatch('unopacity').dispatch('unbiger');
    }
  }
  private getVars() {
    const nodesGroup = d3.selectAll('.nodesGroupWrap .group') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const nodesDevice = d3.selectAll(
      '.nodesDeviceWrap .device',
    ) as d3.Selection<SVGGElement, NodeData, null, undefined>;
    const nodesParam = d3.selectAll('.nodesParamWrap .param') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const nodesFault = d3.selectAll('.nodesFaultWrap .fault') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      undefined
    >;
    const nodesEnergy = d3.selectAll(
      '.nodesEnergyWrap .energy',
    ) as d3.Selection<SVGGElement, NodeData, null, undefined>;
    const links = d3.selectAll('.linksWrap .link') as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      null,
      unknown
    >;
    return {
      nodesGroup,
      nodesDevice,
      nodesParam,
      nodesFault,
      nodesEnergy,
      links,
    };
  }
  public addLinks(ls: LinkData1[]) {
    const { lineType } = this.getD3Option();
    const rMap = this.getR();
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
      .selectAll('.link')
      .data(linksData) as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      null,
      unknown
    >;
    if (!this.simulation) {
      const nodeMap = nodes.reduce(
        (l, v) => Object.assign(l, { [v.id]: v }),
        {},
      ) as { [k: string]: SVGManageOption['data']['nodes'][0] };
      const linesTarget = links
        .enter()
        .append(lineType)
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .attr('fill', 'none')
        .merge(links);

      linesTarget
        .attr(
          'x1',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).x1,
        )
        .attr(
          'y1',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).y1,
        )
        .attr(
          'x2',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
            ).x2,
        )
        .attr(
          'y2',
          d =>
            createNearXY(
              nodeMap[d.source.id].fx,
              nodeMap[d.source.id].fy,
              nodeMap[d.target.id].fx,
              nodeMap[d.target.id].fy,
              rMap[nodeMap[d.source.id].type] *
                this.createScale(nodeMap[d.source.id]),
              rMap[nodeMap[d.target.id].type] *
                this.createScale(nodeMap[d.target.id]),
              true,
            ).y2,
        );
      lineType === 'path' &&
        linesTarget.attr('d', d =>
          createLinePath(
            nodeMap[d.source.id].fx,
            nodeMap[d.source.id].fy,
            nodeMap[d.target.id].fx,
            nodeMap[d.target.id].fy,
            rMap[nodeMap[d.source.id].type] *
              this.createScale(nodeMap[d.source.id]),
            rMap[nodeMap[d.target.id].type] *
              this.createScale(nodeMap[d.target.id]),
          ),
        );
      links.exit().remove();
    } else {
      this.forceLink.links(linksData);
      links
        .enter()
        .append(lineType)
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .attr('fill', 'none')
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
    const { lineType } = this.getD3Option();
    const idSet = new Set(ids);
    this.option.data.links = this.option.data.links.filter(
      v => !idSet.has(v.id),
    );
    const linksData = this.option.data.links.map(d => Object.create(d));
    const links = d3
      .select('.linksWrap')
      .selectAll('.link')
      .data(linksData) as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      null,
      unknown
    >;
    if (!this.simulation) {
      links
        .enter()
        .append(lineType)
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links);
      links.exit().remove();
    } else {
      this.forceLink.links(linksData);
      links
        .enter()
        .append(lineType)
        .attr('class', 'link')
        .attr('stroke-width', 1)
        .merge(links);
      links.exit().remove();
      this.initEvent();
      this.simulation.restart();
    }
  }

  public selectByIds(ids: string[]) {
    const {
      nodesGroup,
      nodesDevice,
      nodesParam,
      nodesFault,
      nodesEnergy,
      links,
    } = this.getVars();
    nodesGroup.dispatch('unactive');
    nodesDevice.dispatch('unactive');
    nodesParam.dispatch('unactive');
    nodesFault.dispatch('unactive');
    nodesEnergy.dispatch('unactive');
    const activeNodeIdSet = new Set(ids);
    const selectGroup = nodesGroup
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    const selectDevice = nodesDevice
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    const selectParam = nodesParam
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    const selectFault = nodesFault
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    const selectEnergy = nodesEnergy
      .filter(d => activeNodeIdSet.has(d.id))
      .dispatch('active');
    this.setOpacity(
      nodesGroup,
      nodesDevice,
      nodesParam,
      nodesFault,
      nodesEnergy,
      links,
    );
    selectParam.dispatch('showInCenter');
    selectDevice.dispatch('showInCenter');
    selectGroup.dispatch('showInCenter');
    selectFault.dispatch('showInCenter');
    selectEnergy.dispatch('showInCenter');
  }
  public highlightFE() {
    const {
      nodesGroup,
      nodesDevice,
      nodesParam,
      nodesFault,
      nodesEnergy,
      links,
    } = this.getVars();
    nodesGroup.dispatch('opacity');
    nodesDevice.dispatch('opacity');
    nodesParam.dispatch('opacity');
    nodesFault.dispatch('opacity');
    nodesEnergy.dispatch('opacity');
    links.dispatch('opacity');

    nodesFault.dispatch('unopacity');
    nodesEnergy.dispatch('unopacity');
  }
  public getD3Option() {
    const { d3Option = {} } = this.option;
    return Object.assign({}, SVGManage.D3Option(), d3Option);
  }
  public getR(): {
    device: number;
    group: number;
    param: number;
    fault: number;
    energy: number;
  };
  public getR(type: NodeType): number;
  public getR(type?: NodeType) {
    const { nodeSize, sizeX } = this.getD3Option();
    if (type) {
      return nodeSize * sizeX[type];
    }
    const rs = {
      device: nodeSize * sizeX['device'],
      group: nodeSize * sizeX['group'],
      param: nodeSize * sizeX['param'],
      fault: nodeSize * sizeX['fault'],
      energy: nodeSize * sizeX['energy'],
    };

    return rs;
  }
  public scaleBy(k: '+' | '-',step?:number): number;
  public scaleBy(k: number,step?:number): number;
  public scaleBy(k,step=0.1) {
    let v = k;
    if (k == '+') {
      v = this.transform.k + step;
    } else if (k == '-') {
      v = Math.max(this.transform.k - step,0.1);
    }
    let dx = this.transform.x - this.contain.offsetWidth * (v-this.transform.k) /2;
    let dy = this.transform.y - this.contain.offsetHeight* (v-this.transform.k) /2;

    this.svg
      .transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(dx, dy).scale(v),
      );
    return this.transform.k;
  }
  public transformBy(k: 't' | 'b' | 'l' | 'r',step:number=100) {
    let { x, y } = this.transform;
    switch (k) {
      case 't':
        y = y - step;
        break;
      case 'b':
        y = y + step;
        break;
      case 'l':
        x = x - step;
        break;
      case 'r':
        x = x + step;
        break;
    }
    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity.translate(x, y).scale(this.transform.k));
  }
  public getNode() {
    return this.svg.node();
  }
  public destroy() {
    this.simulation && this.simulation.stop();
    this.simulation = undefined;
    this.svg.remove();
    this.tooltip.remove();
  }
}
