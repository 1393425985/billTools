import * as d3 from 'd3';
import _ from 'lodash';

const faultWidth = 10;
const faultW = Math.sqrt((3 / 4) * Math.pow(faultWidth, 2));
interface Data {
  name: string;
  children: Data[];
  value?: number;
  type?: 'device' | 'param' | 'group';
  isFault?: boolean;
  isEnergy?: boolean;
  faultCount?: number;
  energyCount?: number;
}
export interface SVGManageOption {
  data: Data;
}

export default class SVGManage {
  private contain: HTMLDivElement;
  private option: SVGManageOption;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private createColor: (k: any) => string;
  private root: d3.HierarchyCircularNode<Data>;

  constructor(contain: HTMLDivElement, option: SVGManageOption) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.init();
  }

  private init() {
    const scale = d3.scaleOrdinal(d3.schemeCategory10);
    scale.range([
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
    this.createColor = k => scale(`${k}`);

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
    
    // const nodesGroup = svg
    //   .append('g')
    //   .attr('class', 'nodesGroupWrap')
    //   .style('opacity', 0.5)
    //   .selectAll('g')
    //   .data(groupData)
    //   .join('g')
    //   .attr('class', 'group');
    // nodesGroup
    //   .append('circle')
    //   .attr('class', 'rect')
    //   .attr('fill', d => this.createColor(d.depth))
    //   .attr('pointer-events',null);

    const node = svg
      .append('g')
      .style('opacity', 0.5)
      .selectAll('circle')
      .data(root.descendants().slice(1))
      .join('circle')
      .attr('fill', d => (d.children ? this.createColor(d.depth) : 'white'))
      .attr('pointer-events', d => (!d.children ? 'none' : null))
      .on('mouseover', function() {
        d3.select(this).attr('stroke', '#000');
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke', null);
      })
      .on('click', d => focus !== d && (zoom(d), d3.event.stopPropagation()));
    const label = svg
      .append('g')
      .attr('class', 'textWrap')
      .selectAll('g')
      .data(root.descendants() as d3.HierarchyCircularNode<Data>[])
      .join('g')
      .attr('class', 'text')
      .style('font', '20px sans-serif')
      .attr('pointer-events', 'none')
      // .attr('text-anchor', 'middle')
      .style('fill-opacity', d => (d.parent === root ? 1 : 0))
      .style('display', d => (d.parent === root ? 'inline' : 'none'));
    label.append('text').text(d => d.data.name);
    const faultG = label
      .append('g')
      .attr('transform', `translate(${faultWidth},20)`)
      .style('display', d =>
        d.data.type === 'group'
          ? d.data.faultCount == 0
            ? 'none'
            : 'inline'
          : 'none',
      );
    faultG
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', '#c23531')
      .attr(
        'd',
        `m 0 -${faultWidth} l ${faultW} ${faultWidth /
          2} l 0 ${faultWidth} l -${faultW} ${faultWidth /
          2} l -${faultW} -${faultWidth / 2} l 0 -${faultWidth}  z`,
      );

    faultG
      .append('text')
      .text(d => d.data.faultCount || '0')
      .attr('fill', '#c23531')
      .attr('dy', '0.35em')
      .attr('dx', faultWidth + 3);
    faultG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('!')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .style('font-size', `${faultWidth}px`);
    const energyG = label
      .append('g')
      .attr('transform', `translate(${faultWidth},${20 + faultWidth * 2 + 4})`)
      .style('display', d =>
        d.data.type === 'group'
          ? d.data.energyCount == 0
            ? 'none'
            : 'inline'
          : 'none',
      );
    energyG
      .append('path')
      .attr('class', 'rect')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('fill', '#55af74')
      .attr(
        'd',
        `m 0 -${faultWidth} l ${faultW} ${faultWidth /
          2} l 0 ${faultWidth} l -${faultW} ${faultWidth /
          2} l -${faultW} -${faultWidth / 2} l 0 -${faultWidth}  z`,
      );

    energyG
      .append('text')
      .text(d => d.data.energyCount || '0')
      .attr('fill', '#55af74')
      .attr('dy', '0.35em')
      .attr('dx', faultWidth + 3);
    energyG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .text('$')
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .style('font-size', `${faultWidth}px`);

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
      const k = rectW / v[2];

      view = v;

      label.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      node.attr(
        'transform',
        d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`,
      );
      node.attr('r', d => d.r * k);
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

      label
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
