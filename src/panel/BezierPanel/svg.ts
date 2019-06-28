import {Svg,Container,G} from '@svgdotjs/svg.js';

interface SVGManageOption{
    data: BezierTypes.bezierItem['info']
}
export default class SVGManage {
    private contain:HTMLDivElement;
    private option:SVGManageOption;
    private draw:Container;
    private pointGroup:G;
    private moveGroup:G;
    constructor(contain:HTMLDivElement,option:SVGManageOption){
        this.contain = contain;
        console.log(111)
        var draw = new Svg(contain.id).size(300, 300)
        var rect = draw.rect(100, 100).attr({ fill: '#f06' })
        return;
        this.draw = new Svg(contain.id).size('100%', '100%');
        this.pointGroup = this.draw.group().id('pointGroup');
        this.moveGroup = this.draw.group().id('moveGroup');
        this.option = option;
        this.init();
    }
    private init(){
        const { data = [] } = this.option;
        data.forEach(this.createPoint);
    }
    private createPoint(info:SVGManageOption['data'][0]){
        const point = this.draw.circle(100);
        point.x(info.x);
        point.y(info.y);
        this.pointGroup.add(point);
    }
    public addPoint(info:SVGManageOption['data'][0]){
        this.option.data.push(info);
        this.createPoint(info);
    }
}