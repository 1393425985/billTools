import {
  Svg,
  Container,
  G,
  SVG,
  Circle,
  Line,
  List,
  Polyline,
} from '@svgdotjs/svg.js';
import _ from 'lodash';

const point_w = 10;
const point_r = point_w / 2;
const point_c = '#617e8c';
const point_line_w = 2;
const point_line_c = '#829299';
const animate_time = 2000;
const move_point_c = [
  '#785548',
  '#ff5521',
  '#ff9900',
  '#ffeb3b',
  '#8ac24a',
  '#009687',
  '#02a8f5',
];
const move_point_line_c = [
  '#856e65',
  '#ff7a4a',
  '#ffb029',
  '#fff563',
  '#a5cf70',
  '#1aa391',
  '#2bc3ff',
];

interface SVGManageOption {
  data: BezierTypes.bezierItem['info'];
  onChange: (option: SVGManageOption) => void;
}
interface PointMoveData {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  pos: number;
}
export default class SVGManage {
  private contain: SVGSVGElement;
  private option: SVGManageOption;
  private draw: Container;
  private pointGroup: G;
  private moveGroupArr: G[];
  private isAnimating: boolean = false;
  constructor(contain: SVGSVGElement, option: SVGManageOption) {
    this.contain = contain;
    this.draw = new Svg(contain).size('100%', '100%');
    this.pointGroup = this.draw.group().id('pointGroup');
    this.moveGroupArr = [];
    this.option = _.cloneDeep(option);
    this.init();
  }
  private init() {
    const { data = [] } = this.option;

    const moveGroupArrLen = Math.max(data.length - 1, 1);
    const points = this.createPoints(data) as List<Circle>;
    this.createMovePoints(points, moveGroupArrLen);
    this.createPointLines(points);
    // this.pointGroup.add(this.draw.path('M172 209 C 218 469, 449 498, 460 239').fill('none').stroke({
    //   color: 'red',
    //   width: point_line_w,
    // }));
  }
  private reDraw() {
    if (this.draw) {
      this.draw.clear();
    }
    this.pointGroup = this.draw.group().id('pointGroup');
    this.moveGroupArr = [];
    this.init();
  }
  private createPoints = (data: SVGManageOption['data']) => {
    return data.map(this.createPoint);
  };
  private createPoint = (info: SVGManageOption['data'][0], index: number) => {
    const point = this.draw.circle(point_w);
    point
      .x(info.x - point_r)
      .y(info.y - point_r)
      .fill(point_c)
      .addClass(`point`)
      .id(`point_${index}`);
    this.pointGroup.add(point);
    return point;
  };
  private createMovePoints = (points: List<Circle>, num: number) => {
    this.moveGroupArr = [];
    const group = this.draw.group();
    this.moveGroupArr.push(group);
    let firstPoint;
    points.forEach((point, index) => {
      if (index === 0) {
        firstPoint = point.clone().addClass('movePoint');
        group.add(firstPoint);
      } else {
        firstPoint = this.createFirstMovePoint(
          group,
          firstPoint,
          points[index],
          points[index + 1],
        );
      }
      firstPoint
        .fill(move_point_c[0])
        .opacity(0)
        .id(`movepoint_${num}_${index}`);
    });
    if (--num > 0) {
      this.loopMovePoint(group.find('.movePoint') as List<Circle>, num);
    }
  };
  private createFirstMovePoint = (
    group: G,
    pointStart: Circle,
    pointEnd: Circle,
    pointEx: Circle,
  ) => {
    const isLast = !pointEx;
    const movePoint = pointEnd.clone();
    movePoint.addClass('movePoint');
    const pointStartX = pointStart.x();
    const pointStartY = pointStart.y();
    const pointEndX = pointEnd.x();
    const pointEndY = pointEnd.y();

    const groupIndex = this.moveGroupArr.findIndex(v => v === group);
    pointStart.off('startmove').on('startmove', () => {
      const childId = pointStart.attr('childPointId');
      const childGroup = this.moveGroupArr[groupIndex + 1];
      const child = childGroup && childGroup.findOne(`#${childId}`);
      pointStart
        .opacity(1)
        .animate(animate_time)
        .move(pointEndX, pointEndY)
        .during(function(pos, morph, eased, situation) {
          child &&
            child.fire('startmove', {
              startX: pointStart.x(),
              startY: pointStart.y(),
              endX: isLast ? pointEndX : movePoint.x(),
              endY: isLast ? pointEndY : movePoint.y(),
              pos,
            } as PointMoveData);
        })
        .after(function reMovePoint() {
          pointStart.opacity(0).move(pointStartX, pointStartY);
          child && child.fire('endmove');
        });
    });
    if (!isLast) {
      group.add(movePoint);
    }

    return movePoint;
  };
  private loopMovePoint = (points: List<Circle>, num: number) => {
    const group = this.draw.group();
    const colorIndex = this.moveGroupArr.length;
    this.moveGroupArr.push(group);
    let firstPoint;
    points.forEach((point, index) => {
      const id = `movepoint_${num}_${index}`;
      if (index === 0) {
        firstPoint = point.clone().addClass('movePoint');
        group.add(firstPoint);
      } else {
        firstPoint = this.createNextMovePoint(
          group,
          firstPoint,
          point,
          points[index + 1],
          points.length === 2,
        );
      }
      point.attr('childPointId', id);
      firstPoint
        .fill(move_point_c[colorIndex % move_point_c.length])
        .opacity(0)
        .id(id);
    });
    if (--num > 0) {
      this.loopMovePoint(group.find('.movePoint') as List<Circle>, num);
    }
  };
  private createNextMovePoint = (
    group: G,
    pointStart: Circle,
    pointEnd: Circle,
    pointEx?: Circle,
    isMain?: boolean,
  ) => {
    interface p {
      x: number;
      y: number;
    }
    const mathPoint: (p1: p, p2: p, d: number) => p = (p1, p2, d) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const a = dy / dx;
      const b = p1.y - a * p1.x;
      const rsX = p1.x + dx * d;
      return {
        x: rsX,
        y: a * rsX + b,
      };
    };
    const isLast = !pointEx;
    const movePoint = pointEnd.clone();
    movePoint.addClass('movePoint');
    const pointStartX = pointStart.x();
    const pointStartY = pointStart.y();
    const pointEndX = pointEnd.x();
    const pointEndY = pointEnd.y();
    const groupIndex = this.moveGroupArr.findIndex(v => v === group);
    const moveLine = this.draw
      .line()
      .fill('none')
      .stroke({
        color: move_point_line_c[groupIndex - (1 % move_point_line_c.length)],
        width: point_line_w,
      })
      .opacity(0)
      .addClass(`pointLine`);
    group.add(moveLine);
    let mainLine: Polyline;
    if (isMain) {
      mainLine = this.draw
        .polyline([[pointStartX + point_r, pointStartY + point_r]]).id('mainLine')
        .fill('none')
        .stroke({
          color: point_line_c,
          width: point_line_w,
        });
        group.add(mainLine);
    }

    pointStart.off('startmove').on('startmove', e => {
      const detail = e.detail as PointMoveData;
      const childId = pointStart.attr('childPointId');
      const childGroup = this.moveGroupArr[groupIndex + 1];
      const child = childGroup && childGroup.findOne(`#${childId}`);
      const mp = mathPoint(
        { x: detail.startX, y: detail.startY },
        { x: detail.endX, y: detail.endY },
        detail.pos,
      );
      pointStart.opacity(1).move(mp.x, mp.y);
      child &&
        child.fire('startmove', {
          startX: mp.x,
          startY: mp.y,
          endX: isLast ? pointEndX : movePoint.x(),
          endY: isLast ? pointEndY : movePoint.y(),
          pos: detail.pos,
        } as PointMoveData);
      moveLine
        .opacity(1)
        .plot(
          detail.startX + point_r,
          detail.startY + point_r,
          detail.endX + point_r,
          detail.endY + point_r,
        );
      if (mainLine) {
        mainLine.plot(
          mainLine.plot().concat([[mp.x + point_r, mp.y + point_r]]),
        );
      }
    });
    pointStart.off('endmove').on('endmove', e => {
      const childId = pointStart.attr('childPointId');
      const childGroup = this.moveGroupArr[groupIndex + 1];
      const child = childGroup && childGroup.findOne(`#${childId}`);
      child && child.fire('endmove');
      pointStart.opacity(0).move(pointStartX, pointStartY);
      moveLine.opacity(0).plot();
    });
    if (!isLast) {
      group.add(movePoint);
    }

    return movePoint;
  };
  private createPointLines = (points: List<Circle>) => {
    points.forEach((point, index) => {
      if (index < points.length - 1) {
        this.createPointLine(point, points[index + 1]);
      }
    });
  };
  private createPointLine = (pointStart: Circle, pointEnd: Circle) => {
    const line = this.draw.line(
      pointStart.x() + point_r,
      pointStart.y() + point_r,
      pointEnd.x() + point_r,
      pointEnd.y() + point_r,
    );
    line
      .fill('none')
      .stroke({
        color: point_line_c,
        width: point_line_w,
        //   linecap: 'round',
        //   linejoin: 'round',
      })
      .opacity(1)
      .addClass(`pointLine`);
    this.pointGroup.add(line);
  };

  public addPoint(info: SVGManageOption['data'][0]) {
    this.option.data.push(info);
    this.option.onChange(this.option);
    this.reDraw();
  }
  public updatePoint(
    index: number,
    key: keyof BezierTypes.bezierItem['info'][0],
    value,
  ) {
    this.option.data[index][key] = value;
    this.option.onChange(this.option);
    this.reDraw();
  }
  public deletePoint(index: number) {
    this.option.data = this.option.data.filter((v, i) => i !== index);
    this.option.onChange(this.option);
    this.reDraw();
  }
  public run() {
    if (this.isAnimating) {
      return;
    }
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
    }, animate_time);
    const movePoints = this.moveGroupArr[0].find('.movePoint');
    const mainLine = this.moveGroupArr[this.moveGroupArr.length-1].findOne('#mainLine') as Polyline;
    mainLine && mainLine.plot([mainLine.plot()[0]]);
    movePoints.each((point: Circle) => {
      point.fire('startmove');
    });
  }
  public destroy() {
    this.draw.clear();
  }
}
