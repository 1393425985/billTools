import * as d3 from 'd3';
import _ from 'lodash';
const nodeBaseWidth = 6;
const tempNearXY = {};
function createNearXY(x, y, tx, ty, r, r2, isClear = false) {
  const tr = r2 + 1;
  const key = `${x.toFixed(1)}-${y.toFixed(1)}-${tx.toFixed(1)}-${ty.toFixed(
    1,
  )}-${r.toFixed(1)}-${tr.toFixed(1)}`;
  let rs: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
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
type NodeType = 'device' | 'param' | 'group';
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
      bgTextColor?: string;
      textColor?: string;
      name?: string;
      _name?: string;
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
    onSelectedChange?: (ids: string[], e: any, data: NodeData) => {};
    onClick?: (id: string, e: any, data: NodeData) => boolean;
  };
  d3Option?: {
    nodeSize?: number;
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
  color?: string;
  opacity?: number;
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
  static IEV() {
    const userAgent = navigator.userAgent;
    const isIE =
      userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1; //判断是否IE<11浏览器
    const isEdge = userAgent.indexOf('Edge') > -1 && !isIE;
    const isIE11 =
      userAgent.indexOf('Trident') > -1 && userAgent.indexOf('rv:11.0') > -1;
    if (isIE) {
      const reIE = new RegExp('MSIE (\\d+\\.\\d+);');
      reIE.test(userAgent);
      let fIEVersion = parseFloat(RegExp['$1']);
      if (fIEVersion == 7) {
        return 7;
      } else if (fIEVersion == 8) {
        return 8;
      } else if (fIEVersion == 9) {
        return 9;
      } else if (fIEVersion == 10) {
        return 10;
      } else {
        return 6;
      }
    } else if (isEdge) {
      return 'edge';
    } else if (isIE11) {
      return 11;
    } else {
      return -1;
    }
  }
  static D3Option() {
    return {
      nodeSize: nodeBaseWidth,
      lineType: 'path',
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
    this.activeNodeIdSet = new Set();
    const { linksData, nodesData } = this.initSimulation();
    this.initTooltips();
    this.initSVG();

    this.initDefs();
    this.initLinks(linksData);
    this.initNodes(nodesData);
    this.initActiveLayer();
    this.createZoom();
    this.createDrag();
    this.initEvent();
  }
  private initSimulation() {
    const { data, type = 'auto' } = this.option;
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
    } = this.getD3Option();
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
    this.forceManyBody = d3
      .forceManyBody()
      .strength(manyBodyStrength)
      .theta(manyBodyTheta)
      .distanceMin(manyBodyDistanceMin)
      .distanceMax(manyBodydistanceMax);
    this.forceCollide = d3
      .forceCollide<NodeData>(d => collideRadius * this.getScale(d))
      .strength(collideStrength)
      .iterations(collideIterations);
    this.forceCenter = d3.forceCenter(
      this.contain.offsetWidth / 2,
      this.contain.offsetHeight / 2,
    );
    this.forceLink = d3
      .forceLink<NodeData, d3.SimulationLinkDatum<NodeData>>(linksData)
      .id(d => d.id)
      .distance(linkDistance)
      .iterations(linkIterations);
    this.simulation =
      type === 'auto' &&
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
    this.nodeMap = nodesData.reduce(
      (l, v) => Object.assign(l, { [v.id]: v }),
      {},
    ) as { [k: string]: SVGManageOption['data']['nodes'][0] };
    return {
      linksData,
      nodesData,
    };
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
      .style('user-select', 'none');
  }
  private initSVG() {
    const width = this.contain.offsetWidth;
    const height = this.contain.offsetHeight;
    this.svg = d3
      .select(this.contain)
      .append('svg')
      .attr('width', +width)
      .attr('height', +height);
    this.svg.append('g').attr('class', 'zoomWrap');
  }
  private initDefs() {
    this.arrowMap = {};
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
      .attr('id', 'faultEnergyGroupColor')
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
  }
  private initLinks(linksData: LinkData2[]) {
    const { lineType, nodeSize } = this.getD3Option();
    let linksWrap = this.svg.select('.linksWrap');
    if (linksWrap.empty()) {
      linksWrap = this.svg
        .select('.zoomWrap')
        .append('g')
        .attr('class', 'linksWrap');
    }
    const links = linksWrap
      .selectAll(lineType)
      .data(linksData)
      .join(lineType)
      .attr('class', 'link')
      .attr('stroke-width', 1)
      .attr('stroke', this.getColor)
      .attr('opacity', this.getOpacity)
      .attr('fill', 'none')
      .attr('marker-end', d =>
        d.type === 'arrow' ? this.getArrow(this.getColor(d)) : '',
      ) as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      SVGGElement,
      unknown
    >;
    if (!this.simulation) {
      const fn = (d: LinkData2) => {
        const s = this.nodeMap[d.source.id];
        const t = this.nodeMap[d.target.id];
        return createNearXY(
          s.fx,
          s.fy,
          t.fx,
          t.fy,
          nodeSize * this.getScale(s),
          nodeSize * this.getScale(t),
        );
      };
      links
        .attr('x1', d => fn(d).x1)
        .attr('y1', d => fn(d).y1)
        .attr('x2', d => fn(d).x2)
        .attr('y2', d => fn(d).y2);
      lineType === 'path' &&
        links.attr('d', d => {
          const s = this.nodeMap[d.source.id];
          const t = this.nodeMap[d.target.id];
          return createLinePath(
            s.fx,
            s.fy,
            t.fx,
            t.fy,
            nodeSize * this.getScale(s),
            nodeSize * this.getScale(t),
          );
        });
    }
  }
  private initNodes(nodesData: NodeData[]) {
    const { nodeSize } = this.getD3Option();
    const nodes = this.svg
      .select('.zoomWrap')
      .append('g')
      .attr('class', 'nodesWrap')
      .selectAll('g')
      .data(nodesData)
      .join('g')
      .attr('class', 'node')
      .attr('transform', function(d) {
        return d.fx ? `translate(${d.fx},${d.fy})` : '';
      }) as d3.Selection<SVGGElement, NodeData, SVGGElement, unknown>;
    const groups = nodes.filter(d => d.type === 'group');
    groups
      .append('circle')
      .attr('class', 'dragBg')
      .attr('r', d => this.getScale(d) * nodeSize)
      .attr('opacity', this.getOpacity)
      .style('fill', this.getColor);
    // .style('filter',d=>d.isFault?'url("#shadow")':'')
    const devices = nodes.filter(d => d.type === 'device');
    devices
      .append('path')
      .attr('class', 'dragBg')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.getColor)
      .attr('opacity', this.getOpacity)
      .attr('d', d => {
        const deviceWidth = nodeSize * this.getScale(d);
        const deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
        return `m 0 -${deviceWidth} l ${deviceW} ${deviceWidth /
          2} l 0 ${deviceWidth} l -${deviceW} ${deviceWidth /
          2} l -${deviceW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`;
      });
    const params = nodes.filter(d => d.type === 'param');
    params
      .append('path')
      .attr('class', 'dragBg')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.getColor)
      .attr('opacity', this.getOpacity)
      .attr('d', d => {
        const paramWidth = nodeSize * this.getScale(d);
        return `m 0 -${paramWidth} l ${paramWidth} ${paramWidth} l -${paramWidth} ${paramWidth} l -${paramWidth} -${paramWidth} z`;
      });

    nodes
      .filter(d => d.name && d.name !== '')
      .append('text')
      .attr('class', 'text')
      .attr('dy', '0.35em')
      .text(d => d.name)
      .attr('opacity', 0.8)
      .attr('fill', this.getTextColor)
      .attr('pointer-events', 'none')
      .style('font-size', '6px')
      .attr('dx', d => this.getScale(d) * nodeSize + 3);
    nodes
      .filter(d => (d.isFault || d.isEnergy) && d.bgText && d.bgText !== '')
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text(this.getBgText)
      .attr('fill', this.getBgTextColor)
      .attr('opacity', 1)
      .attr('pointer-events', 'none')
      .style('font-size', d => this.getScale(d) * nodeSize + 'px');
  }
  private initActiveLayer() {
    const zoomWrap = this.svg.select('.zoomWrap');
    zoomWrap.append('g').attr('class', 'activeLinksWrap');
    zoomWrap.append('g').attr('class', 'activeNodesWrap');
  }
  private getColor(d: NodeData | LinkData2) {
    return d.color || '#333';
  }
  private getScale(d: NodeData) {
    return d.scale || 1;
  }
  private getOpacity(d: NodeData | LinkData2) {
    return d.opacity || 1;
  }
  private getBgText(d: NodeData) {
    return d.bgText || '';
  }
  private getBgTextColor(d: NodeData) {
    return d.bgTextColor || '#fff';
  }
  private getTextColor(d: NodeData) {
    return d.textColor || '#191e29';
  }
  private getArrow(color: string) {
    if (color in this.arrowMap) {
      return this.arrowMap[color];
    }
    const defs = this.svg.select('.defsWrap');
    defs
      .append('marker')
      .attr('id', color.replace('#', ''))
      .attr('markerUnits', 'strokeWidth')
      .attr('viewBox', '0 0 20 20')
      .attr('refX', 5)
      .attr('refY', 5)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('stroke-width', 0)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M5,5 L0,10 L10,5 L0,0 L5,5')
      .style('fill', color);

    const rs = 'url(' + color + ')';
    this.arrowMap[color] = rs;
    return rs;
  }
  private createZoom() {
    const { defaultScale = 1 } = this.option;
    const zoom = d3.zoom().on('zoom', () => {
      this.transform = {
        x: d3.event.transform.x,
        y: d3.event.transform.y,
        k: d3.event.transform.k,
      };
      this.svg.select('.zoomWrap').attr('transform', d3.event.transform);
    });
    this.zoom = zoom;
    this.svg
      .call(zoom)
      .call(zoom.transform, d3.zoomIdentity.scale(defaultScale));
  }
  private createDrag() {
    const _this = this;
    const { lineType, nodeSize } = this.getD3Option();
    let couldDrag = true;
    function dragstarted(d: NodeData) {
      if (!d3.select(d3.event.sourceEvent.target).classed('dragBg')) {
        couldDrag = false;
        return;
      }
      if (!d3.event.active)
        _this.simulation && _this.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d: NodeData) {
      if (couldDrag) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
        if (!_this.simulation) {
          d.x = d.fx;
          d.y = d.fy;
          d3.select(this).attr('transform', function(d: NodeData) {
            return 'translate(' + d.fx + ',' + d.fy + ')';
          });
          const links = _this.svg.selectAll(`.link`) as d3.Selection<
            SVGLineElement | SVGPathElement,
            LinkData2,
            null,
            unknown
          >;
          const createTargetPoint = (d2: LinkData2) => {
            const s = _this.nodeMap[d2.source.id];
            const t = _this.nodeMap[d2.target.id];
            return createNearXY(
              d.fx,
              d.fy,
              t.fx,
              t.fy,
              nodeSize * _this.getScale(s),
              nodeSize * _this.getScale(t),
            );
          };
          const createSourcePoint = (d2: LinkData2) => {
            const s = _this.nodeMap[d2.source.id];
            const t = _this.nodeMap[d2.target.id];
            return createNearXY(
              s.fx,
              s.fy,
              d.fx,
              d.fy,
              nodeSize * _this.getScale(s),
              nodeSize * _this.getScale(t),
            );
          };
          const links1 = links
            .filter(d2 => d2.source.id === d.id)
            .attr('x1', d2 => createTargetPoint(d2).x1)
            .attr('y1', d2 => createTargetPoint(d2).y1)
            .attr('x2', d2 => createTargetPoint(d2).x2)
            .attr('y2', d2 => createTargetPoint(d2).y2);
          const links2 = links
            .filter(d2 => d2.target.id === d.id)
            .attr('x1', d2 => createSourcePoint(d2).x1)
            .attr('y1', d2 => createSourcePoint(d2).y1)
            .attr('x2', d2 => createSourcePoint(d2).x2)
            .attr('y2', d2 => createSourcePoint(d2).y2);
          if (lineType === 'path') {
            links1.attr('d', function(d2) {
              const s = _this.nodeMap[d2.source.id];
              const t = _this.nodeMap[d2.target.id];
              return createLinePath(
                d.fx,
                d.fy,
                t.fx,
                t.fy,
                nodeSize * _this.getScale(s),
                nodeSize * _this.getScale(t),
              );
            });
            links2.attr('d', function(d2) {
              const s = _this.nodeMap[d2.source.id];
              const t = _this.nodeMap[d2.target.id];
              return createLinePath(
                s.fx,
                s.fy,
                d.fx,
                d.fy,
                nodeSize * _this.getScale(s),
                nodeSize * _this.getScale(t),
              );
            });
          }
        }
      }
    }

    function dragended(d: NodeData) {
      if (!couldDrag) {
        couldDrag = true;
        return;
      }
      if (!d3.event.active) _this.simulation && _this.simulation.alphaTarget(0);
      if (_this.simulation) {
        d.fx = null;
        d.fy = null;
      }
    }

    const drag = d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
    this.svg.selectAll('.nodesWrap .node').call(drag);
  }

  private initEvent() {
    const _this = this;
    const isNotIe = SVGManage.IEV() === -1;
    const { events = {} } = this.option;
    const { onSelectedChange = () => {}, onClick = () => true } = events;
    const { lineType, nodeSize } = this.getD3Option();
    let isClickSVG = true;
    const nodesWrap = this.svg.select('.nodesWrap');
    const linksWrap = this.svg.select('.linksWrap');
    const activeNodesWrap = this.svg.select('.activeNodesWrap');
    const activeLinksWrap = this.svg.select('.activeLinksWrap');
    const nodes = nodesWrap.selectAll('.node') as d3.Selection<
      SVGGElement,
      NodeData,
      SVGGElement,
      unknown
    >;
    const links = linksWrap.selectAll('.link') as d3.Selection<
      SVGLineElement | SVGPathElement,
      LinkData2,
      SVGGElement,
      unknown
    >;

    this.svg.on('click', function() {
      if (isClickSVG) {
        _this.removeOpacity();
      }
      isClickSVG = true;
    });
    this.tooltip
      .on('mouseover', () => {
        _this.tooltip
          .style('z-index', '1')
          .transition()
          .duration(200)
          .style('opacity', 1);
      })
      .on('mouseout', () => {
        hideTooltip({ tooltip: true });
      });
    nodes
      .selectAll('.dragBg')
      .on('click', nodeClick)
      .on('mouseover', nodeHover)
      .on('mouseout', nodeNoHover);
    nodes
      .on('active', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        target.classed('active', true);
        _this.activeNodeIdSet.add(d.id);
        hadleNodesLinks(d.id, 'highLight');
      })
      .on('unactive', function(d, i) {
        const target = d3.select(this);
        const event = d3.event;
        if (target.classed('active')) {
          target.classed('active', false);
          _this.activeNodeIdSet.delete(d.id);
          hadleNodesLinks(d.id, 'unhighLight');
        }
      })
      .on('highLight', function(d) {
        const t = d3.select(this) as d3.Selection<
          SVGGElement,
          NodeData,
          SVGGElement,
          unknown
        >;
        if (d.name == '' && d._name) {
          t.append('text')
            .attr('class', 'highLightText')
            .attr('dy', '0.35em')
            .text(d._name)
            .attr('opacity', 0.8)
            .attr('fill', _this.getTextColor)
            .attr('pointer-events', 'none')
            .style('font-size', '6px')
            .attr('dx', function(d2) {
              return _this.getScale(d2) * nodeSize + 3;
            });
        }
        const target = t.remove();
        target.select('.dragBg').attr('opacity', 1);
        target.select('.text').attr('opacity', 1);
        activeNodesWrap.append(() => target.node());
      })
      .on('unhighLight', function(d) {
        const t = d3.select(this) as d3.Selection<
          SVGGElement,
          NodeData,
          SVGGElement,
          unknown
        >;
        t.selectAll('.highLightText').remove();
        const target = t.remove();
        target.select('.dragBg').attr('opacity', _this.getOpacity);
        target.select('.text').attr('opacity', _this.getOpacity);
        nodesWrap.append(() => target.node());
      })
      .on('showInCenter', showInCenter);
    links
      .on('highLight', function() {
        const target = d3
          .select(this)
          .remove()
          .attr('opacity', 1)
          .attr('stroke-width', 2);
        activeLinksWrap.append(() => target.node());
      })
      .on('unhighLight', function() {
        const target = d3
          .select(this)
          .remove()
          .attr('opacity', _this.getOpacity)
          .attr('stroke-width', 1);
        linksWrap.append(() => target.remove().node());
      });
    if (this.simulation) {
      const createPoint = (d: LinkData2) => {
        return createNearXY(
          d.source.x,
          d.source.y,
          d.target.x,
          d.target.y,
          nodeSize * this.getScale(this.nodeMap[d.source.id]),
          nodeSize * this.getScale(this.nodeMap[d.target.id]),
        );
      };
      const changeLinks =
        lineType === 'path'
          ? () => {
              links.attr('d', d =>
                createLinePath(
                  d.source.x,
                  d.source.y,
                  d.target.x,
                  d.target.y,
                  nodeSize * this.getScale(this.nodeMap[d.source.id]),
                  nodeSize * this.getScale(this.nodeMap[d.target.id]),
                ),
              );
            }
          : () => {};
      this.simulation.on('tick', () => {
        links

          .attr('x1', d => createPoint(d).x1)
          .attr('y1', d => createPoint(d).y1)
          .attr('x2', d => createPoint(d).x2)
          .attr('y2', d => createPoint(d).y2);
        changeLinks();
        nodes.attr('transform', function(d) {
          return `translate(${d.x},${d.y})`;
        });
      });
    }

    function nodeClick(d, i) {
      isClickSVG = false;
      const target = d3.select(d3.event.target.parentNode) as d3.Selection<
        SVGGElement,
        NodeData,
        null,
        undefined
      >;
      const { event } = d3;
      const ctrlKey = event.ctrlKey || event.metaKey;
      const isNext =
        onClick(target.datum().id, event, target.datum()) === false
          ? false
          : true;
      if (!isNext) {
        return;
      }

      if (!ctrlKey) {
        _this.svg.selectAll('.node.active').dispatch('unactive');
      }
      if (target.classed('active')) {
        target.dispatch('unactive');
      } else {
        target.dispatch('active');
      }
      if (_this.activeNodeIdSet.size) {
        _this.setOpacity();
      } else {
        _this.removeOpacity();
      }
      onSelectedChange(
        Array.from(_this.activeNodeIdSet),
        event,
        target.datum(),
      );
    }
    function nodeHover(d, i) {
      showTooltip(d);
      if (isNotIe) {
        hadleNodesLinks(d.id, 'highLight');
      }
      _this.setOpacity();
    }
    function nodeNoHover(d, i) {
      hideTooltip(d);
      if (isNotIe) {
        hadleNodesLinks(d.id, 'unhighLight');
      }

      if (!_this.activeNodeIdSet.size) {
        _this.removeOpacity();
      } else {
        _this.svg.selectAll('.node.active').dispatch('active');
      }
    }
    function hadleNodesLinks(id, name) {
      const linkNodeIdSet = new Set<string>([id]);
      const links = _this.svg.selectAll('.link') as d3.Selection<
        SVGLineElement | SVGPathElement,
        LinkData2,
        SVGGElement,
        unknown
      >;
      const nodes = _this.svg.selectAll('.node') as d3.Selection<
        SVGLineElement | SVGPathElement,
        NodeData,
        SVGGElement,
        unknown
      >;
      links
        .filter(d => {
          const is = d.source.id == id || d.target.id == id;
          if (is) {
            linkNodeIdSet.add(d.source.id);
            linkNodeIdSet.add(d.target.id);
          }
          return is;
        })
        .dispatch(name);

      nodes.filter(d => linkNodeIdSet.has(d.id)).dispatch(name);
    }

    function showTooltip(d) {
      if (d.tooltip) {
        _this.tooltip
          .style('z-index', '1')
          .transition()
          .duration(200)
          .style('opacity', 1);

        _this.tooltip.html(d.tooltip);

        const top =
          d.y * _this.transform.k +
          _this.transform.y -
          nodeSize * _this.getScale(d) * _this.transform.k;
        const left =
          d.x * _this.transform.k +
          _this.transform.x +
          nodeSize * _this.getScale(d) * _this.transform.k;
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
          _this.tooltip.style(
            'left',
            left -
              _this.tooltip.node().offsetWidth -
              nodeSize * _this.getScale(d) * 2 * _this.transform.k +
              'px',
          );
        } else {
          _this.tooltip.style('left', left + 'px');
        }

        _this.tooltip.style('font-size', 8 * _this.transform.k + 'px');
      }
    }
    function hideTooltip(d) {
      if (d.tooltip) {
        _this.tooltip
          .transition()
          .duration(500)
          .style('opacity', 0)
          .style('z-index', '-1')
          .style('max-height', '60vh');
      }
    }
    function showInCenter(d) {
      _this.svg
        .transition()
        .duration(750)
        .call(
          _this.zoom.transform,
          d3.zoomIdentity.translate(
            _this.contain.offsetWidth / 2 - (_this.simulation ? d.x : d.fx),
            _this.contain.offsetHeight / 2 - (_this.simulation ? d.y : d.fy),
          ),
        );
    }
  }
  private setOpacity() {
    const nodesWrap = this.svg.select('.nodesWrap');
    const linksWrap = this.svg.select('.linksWrap');
    nodesWrap.attr('opacity', 0.4);
    linksWrap.attr('opacity', 0.4);
  }
  private removeOpacity() {
    const nodesWrap = this.svg.select('.nodesWrap');
    const linksWrap = this.svg.select('.linksWrap');
    this.svg.selectAll('.node.active').dispatch('unactive');
    nodesWrap.attr('opacity', 1);
    linksWrap.attr('opacity', 1);
  }
  public addLinks(ls: LinkData1[]) {
    const { lineType } = this.getD3Option();
    const devicesIdSet = new Set(this.option.data.nodes.map(v => v.id));
    ls = ls.filter(
      v => devicesIdSet.has(v.source) && devicesIdSet.has(v.target),
    );
    if (!ls.length) {
      return;
    }
    this.option.data.links.push(...ls);
    const { data, type = 'auto' } = this.option;
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
    this.selectByIds([]);
    d3.select('.linksWrap')
      .selectAll(lineType)
      .data([])
      .exit()
      .remove();
    if (!this.simulation) {
      this.initLinks(linksData);
      this.initEvent();
    } else {
      this.forceLink.links(linksData);
      this.initLinks(linksData);
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
    const { data, type = 'auto' } = this.option;
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
    this.selectByIds([]);
    this.svg
      .select('.linksWrap')
      .selectAll(lineType)
      .data([])
      .exit()
      .remove();
    if (!this.simulation) {
      this.initLinks(linksData);
      this.initEvent();
    } else {
      this.forceLink.links(linksData);
      this.initLinks(linksData);
      this.initEvent();
      this.simulation.restart();
    }
  }

  public selectByIds(ids: string[]) {
    const idsSet = new Set(ids);
    if (idsSet.size) {
      this.setOpacity();
    } else {
      this.removeOpacity();
    }
    this.svg.selectAll('.node.active').dispatch('unactive');
    const nodes = this.svg.selectAll('.nodesWrap .node') as d3.Selection<
      SVGGElement,
      NodeData,
      null,
      unknown
    >;
    nodes
      .filter(d => idsSet.has(d.id))
      .dispatch('active')
      .dispatch('showInCenter');
  }
  public scaleBy(k: '+' | '-', step?: number): number;
  public scaleBy(k: number, step?: number): number;
  public scaleBy(k, step = 0.1) {
    let v = k;
    if (k == '+') {
      v = this.transform.k + step;
    } else if (k == '-') {
      v = Math.max(this.transform.k - step, 0.1);
    }
    let dx =
      this.transform.x -
      (this.contain.offsetWidth * (v - this.transform.k)) / 2;
    let dy =
      this.transform.y -
      (this.contain.offsetHeight * (v - this.transform.k)) / 2;

    this.svg
      .transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity.translate(dx, dy).scale(v));
    return this.transform.k;
  }
  public transformBy(k: 't' | 'b' | 'l' | 'r', step: number = 100) {
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
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(x, y).scale(this.transform.k),
      );
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
    this.tooltip.remove();
  }
}
