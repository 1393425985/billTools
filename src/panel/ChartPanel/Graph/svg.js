"use strict";
exports.__esModule = true;
var d3 = require("d3");
var lodash_1 = require("lodash");
var nodeBaseWidth = 6;
var tempNearXY = {};
function createNearXY(x, y, tx, ty, r, r2, isClear) {
    if (isClear === void 0) { isClear = false; }
    var tr = r2 + 1;
    var key = x.toFixed(1) + "-" + y.toFixed(1) + "-" + tx.toFixed(1) + "-" + ty.toFixed(1) + "-" + r.toFixed(1) + "-" + tr.toFixed(1);
    var rs;
    if (key in tempNearXY) {
        rs = tempNearXY[key];
        if (isClear) {
            Reflect.deleteProperty(tempNearXY, key);
        }
        return rs;
    }
    var dx = tx - x;
    var dy = ty - y;
    var dz = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    var rsX1 = (r * dx) / dz;
    var rsY1 = (r * dy) / dz;
    var rsX2 = dx - (dx * tr) / dz;
    var rsY2 = dy - (dy * tr) / dz;
    rs = {
        x1: x + rsX1,
        y1: y + rsY1,
        x2: x + rsX2,
        y2: y + rsY2
    };
    tempNearXY[key] = rs;
    return rs;
}
function createLinePath(x, y, tx, ty, r, tr) {
    var _a = createNearXY(Number(x), Number(y), Number(tx), Number(ty), Number(r), Number(tr), true), x1 = _a.x1, y1 = _a.y1, x2 = _a.x2, y2 = _a.y2;
    var radian = (2 * Math.PI) / 360;
    var centerX = x1 + (x2 - x1) / 2;
    var centerY = y1 + (y2 - y1) / 2;
    var dx = Math.abs(x2 - x1);
    var dy = Math.abs(y2 - y1);
    var distance = Math.sqrt(dx * dx + dy * dy) / 2;
    var angle = isNaN(Math.atan(dx / dy) / radian)
        ? 0
        : Math.atan(dx / dy) / radian;
    var controlPointX;
    var controlPointY;
    var path = '';
    if (centerY >= y1) {
        if (x1 <= x2) {
            if (angle >= 45) {
                controlPointX = x1 + distance / Math.sin(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + controlPointX + " " + y1 + " " + x2 + " " + y2;
            }
            else {
                controlPointY = y2 - distance / Math.cos(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + x2 + " " + controlPointY + " " + x2 + " " + y2;
            }
        }
        else {
            if (angle >= 45) {
                controlPointX = x2 + distance / Math.sin(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + controlPointX + " " + y2 + " " + x2 + " " + y2;
            }
            else {
                controlPointY = y1 + distance / Math.cos(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + x1 + " " + controlPointY + " " + x2 + " " + y2;
            }
        }
    }
    else {
        if (x1 <= x2) {
            if (angle >= 45) {
                controlPointX = x2 - distance / Math.sin(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + controlPointX + " " + y2 + " " + x2 + " " + y2;
            }
            else {
                controlPointY = y1 - distance / Math.cos(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + x1 + " " + controlPointY + " " + x2 + " " + y2;
            }
        }
        else {
            if (angle >= 45) {
                controlPointX = x1 - distance / Math.sin(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + controlPointX + " " + y1 + " " + x2 + " " + y2;
            }
            else {
                controlPointY = y2 + distance / Math.cos(angle * radian);
                path = "M " + x1 + " " + y1 + " Q " + x2 + " " + controlPointY + " " + x2 + " " + y2;
            }
        }
    }
    return path;
}
var SVGManage = /** @class */ (function () {
    function SVGManage(contain, option) {
        this.contain = contain;
        this.option = lodash_1["default"].cloneDeep(option);
        this.init();
    }
    SVGManage.IEV = function () {
        var userAgent = navigator.userAgent;
        var isIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1; //判断是否IE<11浏览器
        var isEdge = userAgent.indexOf('Edge') > -1 && !isIE;
        var isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf('rv:11.0') > -1;
        if (isIE) {
            var reIE = new RegExp('MSIE (\\d+\\.\\d+);');
            reIE.test(userAgent);
            var fIEVersion = parseFloat(RegExp['$1']);
            if (fIEVersion == 7) {
                return 7;
            }
            else if (fIEVersion == 8) {
                return 8;
            }
            else if (fIEVersion == 9) {
                return 9;
            }
            else if (fIEVersion == 10) {
                return 10;
            }
            else {
                return 6;
            }
        }
        else if (isEdge) {
            return 'edge';
        }
        else if (isIE11) {
            return 11;
        }
        else {
            return -1;
        }
    };
    SVGManage.D3Option = function () {
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
            manyBodydistanceMax: 999999999
        };
    };
    SVGManage.prototype.init = function () {
        this.activeNodeIdSet = new Set();
        var _a = this.initSimulation(), linksData = _a.linksData, nodesData = _a.nodesData;
        this.initTooltips();
        this.initSVG();
        this.initDefs();
        this.initLinks(linksData);
        this.initNodes(nodesData);
        this.initActiveLayer();
        this.createZoom();
        this.createDrag();
        this.initEvent();
    };
    SVGManage.prototype.initSimulation = function () {
        var _this_1 = this;
        var _a = this.option, data = _a.data, _b = _a.type, type = _b === void 0 ? 'auto' : _b;
        var _c = this.getD3Option(), alpha = _c.alpha, alphaMin = _c.alphaMin, alphaDecay = _c.alphaDecay, velocityDecay = _c.velocityDecay, collideRadius = _c.collideRadius, collideStrength = _c.collideStrength, collideIterations = _c.collideIterations, linkDistance = _c.linkDistance, linkIterations = _c.linkIterations, manyBodyStrength = _c.manyBodyStrength, manyBodyTheta = _c.manyBodyTheta, manyBodyDistanceMin = _c.manyBodyDistanceMin, manyBodydistanceMax = _c.manyBodydistanceMax;
        var linksData = type === 'auto'
            ? data.links.map(function (d) { return Object.create(d); })
            : data.links.map(function (d) {
                return Object.create(Object.assign(d, {
                    source: { id: d.source },
                    target: { id: d.target }
                }));
            });
        var nodesData = data.nodes.map(function (d) { return Object.create(d); });
        this.forceManyBody = d3
            .forceManyBody()
            .strength(manyBodyStrength)
            .theta(manyBodyTheta)
            .distanceMin(manyBodyDistanceMin)
            .distanceMax(manyBodydistanceMax);
        this.forceCollide = d3
            .forceCollide(function (d) { return collideRadius * _this_1.getScale(d); })
            .strength(collideStrength)
            .iterations(collideIterations);
        this.forceCenter = d3.forceCenter(this.contain.offsetWidth / 2, this.contain.offsetHeight / 2);
        this.forceLink = d3
            .forceLink(linksData)
            .id(function (d) { return d.id; })
            .distance(linkDistance)
            .iterations(linkIterations);
        this.simulation =
            type === 'auto' &&
                d3
                    .forceSimulation(nodesData)
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
        this.nodeMap = nodesData.reduce(function (l, v) {
            var _a;
            return Object.assign(l, (_a = {}, _a[v.id] = v, _a));
        }, {});
        return {
            linksData: linksData,
            nodesData: nodesData
        };
    };
    SVGManage.prototype.initTooltips = function () {
        this.tooltip = d3
            .select(this.contain)
            .append('div')
            .attr('class', 'svg-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('z-index', '1')
            .style('max-height', '60vh')
            .style('user-select', 'none');
    };
    SVGManage.prototype.initSVG = function () {
        var width = this.contain.offsetWidth;
        var height = this.contain.offsetHeight;
        this.svg = d3
            .select(this.contain)
            .append('svg')
            .attr('width', +width)
            .attr('height', +height);
        this.svg.append('g').attr('class', 'zoomWrap');
    };
    SVGManage.prototype.initDefs = function () {
        this.arrowMap = {};
        var defs = this.svg.append('defs').attr('class', 'defsWrap');
        var filter = defs
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
        var feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'offsetBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
        var linearGradient = defs
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
    };
    SVGManage.prototype.initLinks = function (linksData) {
        var _this_1 = this;
        var _a = this.getD3Option(), lineType = _a.lineType, nodeSize = _a.nodeSize;
        var linksWrap = this.svg.select('.linksWrap');
        if (linksWrap.empty()) {
            linksWrap = this.svg
                .select('.zoomWrap')
                .append('g')
                .attr('class', 'linksWrap');
        }
        var links = linksWrap
            .selectAll(lineType)
            .data(linksData)
            .join(lineType)
            .attr('class', 'link')
            .attr('stroke-width', 1)
            .attr('stroke', this.getColor)
            .attr('opacity', this.getOpacity)
            .attr('fill', 'none')
            .attr('marker-end', function (d) {
            return d.type === 'arrow' ? _this_1.getArrow(_this_1.getColor(d)) : '';
        });
        if (!this.simulation) {
            var fn_1 = function (d) {
                var s = _this_1.nodeMap[d.source.id];
                var t = _this_1.nodeMap[d.target.id];
                return createNearXY(s.fx, s.fy, t.fx, t.fy, nodeSize * _this_1.getScale(s), nodeSize * _this_1.getScale(t));
            };
            links
                .attr('x1', function (d) { return fn_1(d).x1; })
                .attr('y1', function (d) { return fn_1(d).y1; })
                .attr('x2', function (d) { return fn_1(d).x2; })
                .attr('y2', function (d) { return fn_1(d).y2; });
            lineType === 'path' &&
                links.attr('d', function (d) {
                    var s = _this_1.nodeMap[d.source.id];
                    var t = _this_1.nodeMap[d.target.id];
                    return createLinePath(s.fx, s.fy, t.fx, t.fy, nodeSize * _this_1.getScale(s), nodeSize * _this_1.getScale(t));
                });
        }
    };
    SVGManage.prototype.initNodes = function (nodesData) {
        var _this_1 = this;
        var nodeSize = this.getD3Option().nodeSize;
        var nodes = this.svg
            .select('.zoomWrap')
            .append('g')
            .attr('class', 'nodesWrap')
            .selectAll('g')
            .data(nodesData)
            .join('g')
            .attr('class', 'node')
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        });
        var groups = nodes.filter(function (d) { return d.type === 'group'; });
        groups
            .append('circle')
            .attr('class', 'dragBg')
            .attr('r', function (d) { return _this_1.getScale(d) * nodeSize; })
            .attr('opacity', this.getOpacity)
            .style('fill', this.getColor);
        // .style('filter',d=>d.isFault?'url("#shadow")':'')
        var devices = nodes.filter(function (d) { return d.type === 'device'; });
        devices
            .append('path')
            .attr('class', 'dragBg')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.getColor)
            .attr('opacity', this.getOpacity)
            .attr('d', function (d) {
            var deviceWidth = nodeSize * _this_1.getScale(d);
            var deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
            return "m 0 -" + deviceWidth + " l " + deviceW + " " + deviceWidth /
                2 + " l 0 " + deviceWidth + " l -" + deviceW + " " + deviceWidth /
                2 + " l -" + deviceW + " -" + deviceWidth / 2 + " l 0 -" + deviceWidth + "  z";
        });
        var params = nodes.filter(function (d) { return d.type === 'param'; });
        params
            .append('path')
            .attr('class', 'dragBg')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.getColor)
            .attr('opacity', this.getOpacity)
            .attr('d', function (d) {
            var paramWidth = nodeSize * _this_1.getScale(d);
            return "m 0 -" + paramWidth + " l " + paramWidth + " " + paramWidth + " l -" + paramWidth + " " + paramWidth + " l -" + paramWidth + " -" + paramWidth + " z";
        });
        nodes
            .filter(function (d) { return d.name && d.name !== ''; })
            .append('text')
            .attr('dy', '0.35em')
            .text(function (d) { return d.name; })
            .attr('opacity', 0.8)
            .attr('fill', this.getTextColor)
            .attr('pointer-events', 'none')
            .style('font-size', '6px')
            .attr('dx', function (d) { return _this_1.getScale(d) * nodeSize + 3; });
        nodes
            .filter(function (d) { return (d.isFault || d.isEnergy) && d.bgText && d.bgText !== ''; })
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text(this.getBgText)
            .attr('fill', this.getBgTextColor)
            .attr('opacity', 1)
            .attr('pointer-events', 'none')
            .style('font-size', function (d) { return _this_1.getScale(d) * nodeSize + 'px'; });
    };
    SVGManage.prototype.initActiveLayer = function () {
        var zoomWrap = this.svg.select('.zoomWrap');
        zoomWrap.append('g').attr('class', 'activeLinksWrap');
        zoomWrap.append('g').attr('class', 'activeNodesWrap');
    };
    SVGManage.prototype.getColor = function (d) {
        return d.color || '#333';
    };
    SVGManage.prototype.getScale = function (d) {
        return d.scale || 1;
    };
    SVGManage.prototype.getOpacity = function (d) {
        return d.opacity || 1;
    };
    SVGManage.prototype.getBgText = function (d) {
        return d.bgText || '';
    };
    SVGManage.prototype.getBgTextColor = function (d) {
        return d.bgTextColor || '#fff';
    };
    SVGManage.prototype.getTextColor = function (d) {
        return d.textColor || '#8e8e8e';
    };
    SVGManage.prototype.getArrow = function (color) {
        if (color in this.arrowMap) {
            return this.arrowMap[color];
        }
        var defs = this.svg.select('.defsWrap');
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
        var rs = 'url(' + color + ')';
        this.arrowMap[color] = rs;
        return rs;
    };
    SVGManage.prototype.createZoom = function () {
        var _this_1 = this;
        var _a = this.option.defaultScale, defaultScale = _a === void 0 ? 1 : _a;
        var zoom = d3.zoom().on('zoom', function () {
            _this_1.transform = {
                x: d3.event.transform.x,
                y: d3.event.transform.y,
                k: d3.event.transform.k
            };
            _this_1.svg.select('.zoomWrap').attr('transform', d3.event.transform);
        });
        this.zoom = zoom;
        this.svg
            .call(zoom)
            .call(zoom.transform, d3.zoomIdentity.scale(defaultScale));
    };
    SVGManage.prototype.createDrag = function () {
        var _this = this;
        var _a = this.getD3Option(), lineType = _a.lineType, nodeSize = _a.nodeSize;
        var couldDrag = true;
        function dragstarted(d) {
            if (!d3.select(d3.event.sourceEvent.target).classed('dragBg')) {
                couldDrag = false;
                return;
            }
            if (!d3.event.active)
                _this.simulation && _this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        function dragged(d) {
            if (couldDrag) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
                if (!_this.simulation) {
                    d.x = d.fx;
                    d.y = d.fy;
                    d3.select(this).attr('transform', function (d) {
                        return 'translate(' + d.fx + ',' + d.fy + ')';
                    });
                    var links = _this.svg.selectAll(".link");
                    var createTargetPoint_1 = function (d2) {
                        var s = _this.nodeMap[d2.source.id];
                        var t = _this.nodeMap[d2.target.id];
                        return createNearXY(d.fx, d.fy, t.fx, t.fy, nodeSize * _this.getScale(s), nodeSize * _this.getScale(t));
                    };
                    var createSourcePoint_1 = function (d2) {
                        var s = _this.nodeMap[d2.source.id];
                        var t = _this.nodeMap[d2.target.id];
                        return createNearXY(s.fx, s.fy, d.fx, d.fy, nodeSize * _this.getScale(s), nodeSize * _this.getScale(t));
                    };
                    var links1 = links
                        .filter(function (d2) { return d2.source.id === d.id; })
                        .attr('x1', function (d2) { return createTargetPoint_1(d2).x1; })
                        .attr('y1', function (d2) { return createTargetPoint_1(d2).y1; })
                        .attr('x2', function (d2) { return createTargetPoint_1(d2).x2; })
                        .attr('y2', function (d2) { return createTargetPoint_1(d2).y2; });
                    var links2 = links
                        .filter(function (d2) { return d2.target.id === d.id; })
                        .attr('x1', function (d2) { return createSourcePoint_1(d2).x1; })
                        .attr('y1', function (d2) { return createSourcePoint_1(d2).y1; })
                        .attr('x2', function (d2) { return createSourcePoint_1(d2).x2; })
                        .attr('y2', function (d2) { return createSourcePoint_1(d2).y2; });
                    if (lineType === 'path') {
                        links1.attr('d', function (d2) {
                            var s = _this.nodeMap[d2.source.id];
                            var t = _this.nodeMap[d2.target.id];
                            return createLinePath(d.fx, d.fy, t.fx, t.fy, nodeSize * _this.getScale(s), nodeSize * _this.getScale(t));
                        });
                        links2.attr('d', function (d2) {
                            var s = _this.nodeMap[d2.source.id];
                            var t = _this.nodeMap[d2.target.id];
                            return createLinePath(s.fx, s.fy, d.fx, d.fy, nodeSize * _this.getScale(s), nodeSize * _this.getScale(t));
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
            if (!d3.event.active)
                _this.simulation && _this.simulation.alphaTarget(0);
            if (_this.simulation) {
                d.fx = null;
                d.fy = null;
            }
        }
        var drag = d3
            .drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
        this.svg.selectAll('.nodesWrap .node').call(drag);
    };
    SVGManage.prototype.initEvent = function () {
        var _this_1 = this;
        var _this = this;
        var isNotIe = SVGManage.IEV() === -1;
        var _a = this.option.events, events = _a === void 0 ? {} : _a;
        var _b = events.onSelectedChange, onSelectedChange = _b === void 0 ? function () { } : _b, _c = events.onClick, onClick = _c === void 0 ? function () { return true; } : _c;
        var _d = this.getD3Option(), lineType = _d.lineType, nodeSize = _d.nodeSize;
        var isClickSVG = true;
        var nodesWrap = this.svg.select('.nodesWrap');
        var linksWrap = this.svg.select('.linksWrap');
        var activeNodesWrap = this.svg.select('.activeNodesWrap');
        var activeLinksWrap = this.svg.select('.activeLinksWrap');
        var nodes = nodesWrap.selectAll('.node');
        var links = linksWrap.selectAll('.link');
        this.svg.on('click', function () {
            if (isClickSVG) {
                _this.removeOpacity();
            }
            isClickSVG = true;
        });
        this.tooltip
            .on('mouseover', function () {
            _this.tooltip
                .style('z-index', '1')
                .transition()
                .duration(200)
                .style('opacity', 1);
        })
            .on('mouseout', function () {
            hideTooltip({ tooltip: true });
        });
        nodes
            .selectAll('.dragBg')
            .on('click', nodeClick)
            .on('mouseover', nodeHover)
            .on('mouseout', nodeNoHover);
        nodes
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target.classed('active', true);
            _this.activeNodeIdSet.add(d.id);
            hadleNodesLinks(d.id, 'highLight');
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target.classed('active', false);
                _this.activeNodeIdSet["delete"](d.id);
                hadleNodesLinks(d.id, 'unhighLight');
            }
        })
            .on('highLight', function (d) {
            var t = d3.select(this);
            if (d.name == '' && d._name) {
                t.append('text')
                    .attr('class', 'highLightText')
                    .attr('dy', '0.35em')
                    .text(d._name)
                    .attr('opacity', 0.8)
                    .attr('pointer-events', 'none')
                    .style('font-size', '8px')
                    .attr('dx', function (d2) {
                    return _this.getScale(d2) * nodeSize + 3;
                });
            }
            var target = t.remove();
            target.select('.dragBg').attr('opacity', 1);
            activeNodesWrap.append(function () { return target.node(); });
        })
            .on('unhighLight', function (d) {
            var t = d3.select(this);
            t.selectAll('.highLightText').remove();
            var target = t.remove();
            target.select('.dragBg').attr('opacity', _this.getOpacity);
            nodesWrap.append(function () { return target.node(); });
        })
            .on('showInCenter', showInCenter);
        links
            .on('highLight', function () {
            var target = d3
                .select(this)
                .remove()
                .attr('opacity', 1)
                .attr('stroke-width', 2);
            activeLinksWrap.append(function () { return target.node(); });
        })
            .on('unhighLight', function () {
            var target = d3
                .select(this)
                .remove()
                .attr('opacity', _this.getOpacity)
                .attr('stroke-width', 1);
            linksWrap.append(function () { return target.remove().node(); });
        });
        if (this.simulation) {
            var createPoint_1 = function (d) {
                return createNearXY(d.source.x, d.source.y, d.target.x, d.target.y, nodeSize * _this_1.getScale(_this_1.nodeMap[d.source.id]), nodeSize * _this_1.getScale(_this_1.nodeMap[d.target.id]));
            };
            var changeLinks_1 = lineType === 'path'
                ? function () {
                    links.attr('d', function (d) {
                        return createLinePath(d.source.x, d.source.y, d.target.x, d.target.y, nodeSize * _this_1.getScale(_this_1.nodeMap[d.source.id]), nodeSize * _this_1.getScale(_this_1.nodeMap[d.target.id]));
                    });
                }
                : function () { };
            this.simulation.on('tick', function () {
                links
                    .attr('x1', function (d) { return createPoint_1(d).x1; })
                    .attr('y1', function (d) { return createPoint_1(d).y1; })
                    .attr('x2', function (d) { return createPoint_1(d).x2; })
                    .attr('y2', function (d) { return createPoint_1(d).y2; });
                changeLinks_1();
                nodes.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            });
        }
        function nodeClick(d, i) {
            isClickSVG = false;
            var target = d3.select(d3.event.target.parentNode);
            var event = d3.event;
            var ctrlKey = event.ctrlKey || event.metaKey;
            var isNext = onClick(target.datum().id, event, target.datum()) === false
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
            }
            else {
                target.dispatch('active');
            }
            if (_this.activeNodeIdSet.size) {
                _this.setOpacity();
            }
            else {
                _this.removeOpacity();
            }
            onSelectedChange(Array.from(_this.activeNodeIdSet), event, target.datum());
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
            }
            else {
                _this.svg.selectAll('.node.active').dispatch('active');
            }
        }
        function hadleNodesLinks(id, name) {
            var linkNodeIdSet = new Set([id]);
            var links = _this.svg.selectAll('.link');
            var nodes = _this.svg.selectAll('.node');
            links
                .filter(function (d) {
                var is = d.source.id == id || d.target.id == id;
                if (is) {
                    linkNodeIdSet.add(d.source.id);
                    linkNodeIdSet.add(d.target.id);
                }
                return is;
            })
                .dispatch(name);
            nodes.filter(function (d) { return linkNodeIdSet.has(d.id); }).dispatch(name);
        }
        function showTooltip(d) {
            if (d.tooltip) {
                _this.tooltip
                    .style('z-index', '1')
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
                _this.tooltip.html(d.tooltip);
                var top_1 = d.y * _this.transform.k +
                    _this.transform.y -
                    nodeSize * _this.getScale(d) * _this.transform.k;
                var left = d.x * _this.transform.k +
                    _this.transform.x +
                    nodeSize * _this.getScale(d) * _this.transform.k;
                if (_this.tooltip.node().offsetHeight >
                    _this.contain.offsetHeight / 2) {
                    if (top_1 > _this.contain.offsetHeight / 2) {
                        _this.tooltip.style('top', _this.contain.offsetHeight -
                            _this.tooltip.node().offsetHeight -
                            8 +
                            'px');
                    }
                    else {
                        _this.tooltip.style('top', 8 + 'px');
                    }
                }
                else {
                    _this.tooltip.style('top', top_1 + 'px');
                }
                if (_this.tooltip.node().offsetWidth >
                    _this.contain.offsetWidth - left - 8) {
                    _this.tooltip.style('left', left -
                        _this.tooltip.node().offsetWidth -
                        nodeSize * _this.getScale(d) * 2 * _this.transform.k +
                        'px');
                }
                else {
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
                .call(_this.zoom.transform, d3.zoomIdentity.translate(_this.contain.offsetWidth / 2 - (_this.simulation ? d.x : d.fx), _this.contain.offsetHeight / 2 - (_this.simulation ? d.y : d.fy)));
        }
    };
    SVGManage.prototype.setOpacity = function () {
        var nodesWrap = this.svg.select('.nodesWrap');
        var linksWrap = this.svg.select('.linksWrap');
        nodesWrap.attr('opacity', 0.7);
        linksWrap.attr('opacity', 0.7);
    };
    SVGManage.prototype.removeOpacity = function () {
        var nodesWrap = this.svg.select('.nodesWrap');
        var linksWrap = this.svg.select('.linksWrap');
        this.svg.selectAll('.node.active').dispatch('unactive');
        nodesWrap.attr('opacity', 1);
        linksWrap.attr('opacity', 1);
    };
    SVGManage.prototype.addLinks = function (ls) {
        var _a;
        var lineType = this.getD3Option().lineType;
        var devicesIdSet = new Set(this.option.data.nodes.map(function (v) { return v.id; }));
        ls = ls.filter(function (v) { return devicesIdSet.has(v.source) && devicesIdSet.has(v.target); });
        if (!ls.length) {
            return;
        }
        (_a = this.option.data.links).push.apply(_a, ls);
        var _b = this.option, data = _b.data, _c = _b.type, type = _c === void 0 ? 'auto' : _c;
        var linksData = type === 'auto'
            ? data.links.map(function (d) { return Object.create(d); })
            : data.links.map(function (d) {
                return Object.create(Object.assign(d, {
                    source: { id: d.source },
                    target: { id: d.target }
                }));
            });
        this.selectByIds([]);
        d3.select('.linksWrap')
            .selectAll(lineType)
            .data([])
            .exit()
            .remove();
        if (!this.simulation) {
            this.initLinks(linksData);
            this.initEvent();
        }
        else {
            this.forceLink.links(linksData);
            this.initLinks(linksData);
            this.initEvent();
            this.simulation.restart();
        }
    };
    SVGManage.prototype.removeLinks = function (ids) {
        if (!ids.length) {
            return;
        }
        var lineType = this.getD3Option().lineType;
        var idSet = new Set(ids);
        this.option.data.links = this.option.data.links.filter(function (v) { return !idSet.has(v.id); });
        var _a = this.option, data = _a.data, _b = _a.type, type = _b === void 0 ? 'auto' : _b;
        var linksData = type === 'auto'
            ? data.links.map(function (d) { return Object.create(d); })
            : data.links.map(function (d) {
                return Object.create(Object.assign(d, {
                    source: { id: d.source },
                    target: { id: d.target }
                }));
            });
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
        }
        else {
            this.forceLink.links(linksData);
            this.initLinks(linksData);
            this.initEvent();
            this.simulation.restart();
        }
    };
    SVGManage.prototype.selectByIds = function (ids) {
        var idsSet = new Set(ids);
        if (idsSet.size) {
            this.setOpacity();
        }
        else {
            this.removeOpacity();
        }
        this.svg.selectAll('.node.active').dispatch('unactive');
        var nodes = this.svg.selectAll('.nodesWrap .node');
        nodes
            .filter(function (d) { return idsSet.has(d.id); })
            .dispatch('active')
            .dispatch('showInCenter');
    };
    SVGManage.prototype.scaleBy = function (k, step) {
        if (step === void 0) { step = 0.1; }
        var v = k;
        if (k == '+') {
            v = this.transform.k + step;
        }
        else if (k == '-') {
            v = Math.max(this.transform.k - step, 0.1);
        }
        var dx = this.transform.x -
            (this.contain.offsetWidth * (v - this.transform.k)) / 2;
        var dy = this.transform.y -
            (this.contain.offsetHeight * (v - this.transform.k)) / 2;
        this.svg
            .transition()
            .duration(750)
            .call(this.zoom.transform, d3.zoomIdentity.translate(dx, dy).scale(v));
        return this.transform.k;
    };
    SVGManage.prototype.transformBy = function (k, step) {
        if (step === void 0) { step = 100; }
        var _a = this.transform, x = _a.x, y = _a.y;
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
    };
    SVGManage.prototype.getD3Option = function () {
        var _a = this.option.d3Option, d3Option = _a === void 0 ? {} : _a;
        return Object.assign({}, SVGManage.D3Option(), d3Option);
    };
    SVGManage.prototype.getNode = function () {
        return this.svg.node();
    };
    SVGManage.prototype.destroy = function () {
        this.simulation && this.simulation.stop();
        this.simulation = undefined;
        this.svg.remove();
        this.tooltip.remove();
    };
    return SVGManage;
}());
exports["default"] = SVGManage;
