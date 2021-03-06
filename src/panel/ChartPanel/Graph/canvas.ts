import _ from 'lodash';
import * as d3 from 'd3';
import SVGManage,{ SVGManageOption } from './svg';
import Worker from "worker-loader!./svg.worker";
interface CanvasManageOption {
  data: {
    nodes: {
      id: string;
      group: string;
      fx?: number;
      fy?: number;
      type: 'device' | 'param' | 'group';
      name?: string;
    }[];
    links: { id?: string; source: string; target: string }[];
  };
  d3Option?: SVGManageOption['d3Option'],
  showLogic?: boolean;
  onTick:(data:any)=>void;
  onEnd:(data:any)=>void;
}
export default class CanvasManage {
  private contain: HTMLDivElement;
  private option: CanvasManageOption;
  private canvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
  constructor(contain, option) {
    this.contain = contain;
    this.option = _.cloneDeep(option);
    this.canvas = undefined;
    this.init();
  }
  private init() {
    this.canvas = d3
      .select(this.contain)
      .append('canvas')
      .attr('width', this.contain.offsetWidth)
      .attr('height', this.contain.offsetHeight);
    const canvas = this.canvas.node();
    const  context = canvas.getContext('2d');
    const  width = canvas.width;
    const  height = canvas.height;

    function drawLink(d) {
      context.moveTo(d.source.x, d.source.y);
      context.lineTo(d.target.x, d.target.y);
    }
    function drawNode(d) {
      context.moveTo(d.x + 3, d.y);
      context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
    }

    const draw = this.option.showLogic
      ? data => {
          context.clearRect(0, 0, width, height);
          context.beginPath();
          data.links.forEach(drawLink);
          context.strokeStyle = '#aaa';
          context.stroke();

          context.beginPath();
          data.nodes.forEach(drawNode);
          context.fill();
          context.strokeStyle = '#fff';
          context.stroke();
        }
      : () => {};

    const worker = new Worker();
    const ticked = (data) => {
      draw(data);
      this.option.onTick && this.option.onTick(data);
    };
    const ended = data => {
      this.option.onEnd && this.option.onEnd(data);
    };
    worker.postMessage(JSON.parse(JSON.stringify({
      nodes: this.option.data.nodes,
      links: this.option.data.links,
      width: this.contain.offsetWidth,
      height: this.contain.offsetHeight,
      d3Option: this.option.d3Option
    })));

    worker.onmessage = function(event) {
      switch (event.data.type) {
        case 'tick':
          return ticked(event.data);
        case 'end':
          return ended(event.data);
      }
    };
  }
  public getNode() {
    return this.canvas.node();
  }
  public getD3Option() {
    const {d3Option={}} = this.option;
    return {...SVGManage.D3Option(),...d3Option};
  }
  public destroy() {
    if (this.canvas) {
      this.canvas.remove();
    }
  }
}
