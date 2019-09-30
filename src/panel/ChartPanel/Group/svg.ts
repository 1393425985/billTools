import * as d3 from 'd3';
import _ from 'lodash';

const deviceWidth = 10;
const deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
const faultColor = '#c23531';
const energyColor = '#55af74';
interface Data {
  name: string;
  children: Data[];
  value?: number;
  type?: 'device' | 'param' | 'group';
  isFault?: boolean;
  isEnergy?: boolean;
  faultCount?: number;
  energyCount?: number;
  color?: string;
  opacity?: number;
}
export interface SVGManageOption {
  data: Data;
}

export default class SVGManage {
  private contain: HTMLDivElement;
  private option: SVGManageOption;
  private scale: d3.ScaleOrdinal<string, string>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private root: d3.HierarchyCircularNode<Data>;

  constructor(contain: HTMLDivElement, option: SVGManageOption) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.init();
  }
  private createColor = (d: d3.HierarchyCircularNode<Data>) => {
    return d.data.color || this.scale(`${d.depth}`);
  };
  private createOpacity = (d: d3.HierarchyCircularNode<Data>) => {
    return d.data.opacity || 0.5;
  };
  private init() {
    this.scale = d3.scaleOrdinal(d3.schemeCategory10);
    this.scale.range([
      '#c23531',
      '#2f4554',
      '#61a0a8',
      '#d48265',
      '#91c7ae',
      '#749f83',
      '#ca8622',
      '#bda29a',
      '#6e7074',
      '#546570',
      '#c4ccd3',
    ]);

    this.initSVG();
    this.initEvent();
  }

  private initSVG() {
    const { data } = this.option;
    const width = Math.ceil(this.contain.offsetWidth);
    const height = Math.ceil(this.contain.offsetHeight);
    const rectW = Math.min(width, height);
    const maxW = Math.max(width, height);

    const hierarchy = d3
      .hierarchy<Data>(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);
    const root = (this.root = d3
      .pack<Data>()
      .size([rectW, rectW])
      .padding(3)(hierarchy));

    let focus = root;
    let view;

    const svg = (this.svg = d3
      .select(this.contain)
      .append('svg')
      .attr('width', +width)
      .attr('height', +height)
      .attr('viewBox', `-${rectW / 2} -${rectW / 2} ${rectW} ${rectW}`)
      .style('display', 'block')
      // .style('margin', maxW===width?`0 ${(maxW-rectW)/2}px`:`${(maxW-rectW)/2}px 0`)
      .style('background', '#fff')
      .style('cursor', 'pointer')
      .on('click', () => zoom(root)));

    const groupData = [];
    const deviceData = [];
    const paramData = [];
    root
      .descendants()
      .slice(1)
      .forEach(v => {
        switch (v.data.type) {
          case 'group':
            groupData.push(v);
            return;
          case 'device':
            deviceData.push(v);
            return;
          case 'param':
            paramData.push(v);
            return;
        }
      });

    const nodesGroup = svg
      .append('g')
      .style('opacity', 0.5)
      .selectAll('g')
      .data(groupData)
      .join('g')
      .on('mouseover', function() {
        d3.select(this).attr('stroke', '#000');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', null);
      })
      .on(
        'click',
        d => focus !== d && (zoom(d), d3.event.stopPropagation()),
      ) as d3.Selection<
      SVGGElement,
      d3.HierarchyCircularNode<Data>,
      null,
      undefined
    >;
    const groupCircle = nodesGroup
      .append('circle')
      .attr('fill', this.createColor)
      .attr('pointer-events', null);

    const nodesDevice = svg
      .append('g')
      .style('opacity', 1)
      .selectAll('g')
      .data(deviceData)
      .join('g') as d3.Selection<
      SVGGElement,
      d3.HierarchyCircularNode<Data>,
      null,
      undefined
    >;
    const deviceCircle = nodesDevice
      .append('path')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .on('mouseover', function() {
        d3.select(this).attr('stroke', '#000');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', '#fff');
      })
      .on('click', d => {
        focus !== d && d.data.children && (zoom(d), d3.event.stopPropagation());
      });
    const deviceFaultBg = nodesDevice
      .filter(d => d.data.isFault && !d.data.isEnergy)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('!')
      .attr('fill', '#fff')
      .attr('opacity', 1)
      .attr('pointer-events', 'none');
    const deviceEnergyBg = nodesDevice
      .filter(d => !d.data.isFault && d.data.isEnergy)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('$')
      .attr('fill', '#fff')
      .attr('opacity', 1)
      .attr('pointer-events', 'none');
    const deviceFEBg = nodesDevice
      .filter(d => d.data.isFault && d.data.isEnergy)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('!$')
      .attr('fill', '#fff')
      .attr('opacity', 1)
      .attr('pointer-events', 'none');
    const nodesParam = svg
      .append('g')
      .style('opacity', 1)
      .selectAll('g')
      .data(paramData)
      .join('g') as d3.Selection<
      SVGGElement,
      d3.HierarchyCircularNode<Data>,
      null,
      undefined
    >;
    const paramCircle = nodesParam
      .append('path')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', this.createColor)
      .attr('opacity', this.createOpacity)
      .on('mouseover', function() {
        d3.select(this).attr('stroke', '#000');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', '#fff');
      });

    const nodesLabel = svg
      .append('g')
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .style('font', '20px sans-serif')
      .attr('pointer-events', 'none')
      .style('fill-opacity', d => (d.parent === root ? 1 : 0))
      .style('display', d => (d.parent === root ? 'inline' : 'none'));
    nodesLabel.append('text').text(d => d.data.name);

    const faultG = nodesLabel
      .filter(d => d.data.type === 'group' && d.data.faultCount > 0)
      .append('g')
      .attr('transform', `translate(${deviceWidth},20)`);
    faultG
      .append('path')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', faultColor)
      .attr(
        'd',
        `m 0 -${deviceWidth} l ${deviceW} ${deviceWidth /
          2} l 0 ${deviceWidth} l -${deviceW} ${deviceWidth /
          2} l -${deviceW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`,
      );

    faultG
      .append('text')
      .text(d => d.data.faultCount)
      .attr('fill', '#222')
      .attr('dy', '0.35em')
      .attr('dx', deviceWidth + 3);
    faultG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('!')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .style('font-size', `${deviceWidth}px`);
    const energyG = nodesLabel
      .filter(d => d.data.type === 'group' && d.data.energyCount > 0)
      .append('g')
      .attr(
        'transform',
        `translate(${deviceWidth},${20 + deviceWidth * 2 + 4})`,
      );
    energyG
      .append('path')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', energyColor)
      .attr(
        'd',
        `m 0 -${deviceWidth} l ${deviceW} ${deviceWidth /
          2} l 0 ${deviceWidth} l -${deviceW} ${deviceWidth /
          2} l -${deviceW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`,
      );

    energyG
      .append('text')
      .text(d => d.data.energyCount || '0')
      .attr('fill', '#222')
      .attr('dy', '0.35em')
      .attr('dx', deviceWidth + 3);
    energyG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('$')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .style('font-size', `${deviceWidth}px`);

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
      const k = rectW / v[2];

      view = v;

      nodesLabel.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      nodesGroup.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      nodesDevice.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      nodesParam.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      groupCircle.attr('r', d => d.r * k);
      deviceCircle.attr('d', d => {
        const deviceWidth = d.r * k;
        const deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
        return `m 0 -${deviceWidth} l ${deviceW} ${deviceWidth /
          2} l 0 ${deviceWidth} l -${deviceW} ${deviceWidth /
          2} l -${deviceW} -${deviceWidth / 2} l 0 -${deviceWidth}  z`;
      });
      paramCircle.attr('d', d => {
        const paramWidth = d.r * k * 0.8;
        return `m 0 -${paramWidth} l ${paramWidth} ${paramWidth} l -${paramWidth} ${paramWidth} l -${paramWidth} -${paramWidth} z`;
      });
      deviceFaultBg.style('font-size', d => `${d.r * k}px`);
      deviceEnergyBg.style('font-size', d => `${d.r * k}px`);
      deviceFEBg.style('font-size', d => `${d.r * k}px`);
    }

    function zoom(d) {
      const focus0 = focus;

      focus = d;

      const transition = svg
        .transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween('zoom', d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

      nodesLabel
        .filter(function(d) {
          return (
            d.parent === focus || d3.select(this).style('display') === 'inline'
          );
        })
        .transition(transition)
        .style('fill-opacity', d => (d.parent === focus ? 1 : 0))
        .on('start', function(d) {
          if (d.parent === focus) d3.select(this).style('display', 'inline');
        })
        .on('end', function(d) {
          if (d.parent !== focus) d3.select(this).style('display', 'none');
        });
    }
  }
  private initEvent() {
    const _this = this;
  }

  public getNode() {
    return this.svg.node();
  }
  public selectByIds() {}
  public destroy() {
    this.svg.remove();
    this.svg = undefined;
  }
}
