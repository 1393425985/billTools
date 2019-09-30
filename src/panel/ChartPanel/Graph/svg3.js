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
        var _this_1 = this;
        this.createDrag = function (simulation) {
            var _this = _this_1;
            var lineType = _this_1.getD3Option().lineType;
            var rMap = _this_1.getR();
            var couldDrag = true;
            function dragstarted(d) {
                if (!d3.select(d3.event.sourceEvent.target).classed('rect')) {
                    couldDrag = false;
                    return;
                }
                if (!d3.event.active)
                    simulation && simulation.alphaTarget(0.3).restart();
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
                        d3.select(this).attr('transform', function (d) {
                            return 'translate(' + d.fx + ',' + d.fy + ')';
                        });
                        var links = d3.selectAll(".linksWrap .link");
                        //   const links1 = links
                        //   .filter(d2 => d2.source.id === d.id)
                        //   .attr('x1', d.fx)
                        //   .attr('y1', d.fy);
                        // const links2 = links
                        //   .filter(d2 => d2.target.id === d.id)
                        //   .attr('x2', d.fx)
                        //   .attr('y2', d.fy);
                        var links1 = links
                            .filter(function (d2) { return d2.source.id === d.id; })
                            .attr('x1', function (d2) {
                            return createNearXY(d.fx, d.fy, _this.nodeMap[d2.target.id].fx, _this.nodeMap[d2.target.id].fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).x1;
                        })
                            .attr('y1', function (d2) {
                            return createNearXY(d.fx, d.fy, _this.nodeMap[d2.target.id].fx, _this.nodeMap[d2.target.id].fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).y1;
                        })
                            .attr('x2', function (d2) {
                            return createNearXY(d.fx, d.fy, _this.nodeMap[d2.target.id].fx, _this.nodeMap[d2.target.id].fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).x2;
                        })
                            .attr('y2', function (d2) {
                            return createNearXY(d.fx, d.fy, _this.nodeMap[d2.target.id].fx, _this.nodeMap[d2.target.id].fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id]), true).y2;
                        });
                        var links2 = links
                            .filter(function (d2) { return d2.target.id === d.id; })
                            .attr('x2', d.fx)
                            .attr('y2', d.fy)
                            .attr('x1', function (d2) {
                            return createNearXY(_this.nodeMap[d2.source.id].fx, _this.nodeMap[d2.source.id].fy, d.fx, d.fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).x1;
                        })
                            .attr('y1', function (d2) {
                            return createNearXY(_this.nodeMap[d2.source.id].fx, _this.nodeMap[d2.source.id].fy, d.fx, d.fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).y1;
                        })
                            .attr('x2', function (d2) {
                            return createNearXY(_this.nodeMap[d2.source.id].fx, _this.nodeMap[d2.source.id].fy, d.fx, d.fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id])).x2;
                        })
                            .attr('y2', function (d2) {
                            return createNearXY(_this.nodeMap[d2.source.id].fx, _this.nodeMap[d2.source.id].fy, d.fx, d.fy, rMap[_this.nodeMap[d2.source.id].type] *
                                _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                _this.createScale(_this.nodeMap[d2.target.id]), true).y2;
                        });
                        if (lineType === 'path') {
                            links1.attr('d', function (d2) {
                                var t = d3.select(this);
                                return createLinePath(d.fx, d.fy, _this.nodeMap[d2.target.id].fx, _this.nodeMap[d2.target.id].fy, rMap[_this.nodeMap[d2.source.id].type] *
                                    _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                    _this.createScale(_this.nodeMap[d2.target.id]));
                            });
                            links2.attr('d', function (d2) {
                                var t = d3.select(this);
                                return createLinePath(_this.nodeMap[d2.source.id].fx, _this.nodeMap[d2.source.id].fy, d.fx, d.fy, rMap[_this.nodeMap[d2.source.id].type] *
                                    _this.createScale(_this.nodeMap[d2.source.id]), rMap[_this.nodeMap[d2.target.id].type] *
                                    _this.createScale(_this.nodeMap[d2.target.id]));
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
                    simulation && simulation.alphaTarget(0);
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
        this.contain = contain;
        this.option = lodash_1["default"].cloneDeep(option);
        this.init();
    }
    SVGManage.D3Option = function () {
        return {
            nodeSize: nodeBaseWidth,
            lineType: 'path',
            sizeX: {
                device: 1,
                group: 1.2,
                param: 0.5,
                fault: 1.5,
                energy: 1.5
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
            manyBodydistanceMax: 999999999
        };
    };
    SVGManage.prototype.init = function () {
        var _this_1 = this;
        var _a = this.getD3Option(), sizeX = _a.sizeX, collideRadius = _a.collideRadius, collideStrength = _a.collideStrength, collideIterations = _a.collideIterations, linkDistance = _a.linkDistance, linkIterations = _a.linkIterations, manyBodyStrength = _a.manyBodyStrength, manyBodyTheta = _a.manyBodyTheta, manyBodyDistanceMin = _a.manyBodyDistanceMin, manyBodydistanceMax = _a.manyBodydistanceMax;
        var scale = d3.scaleOrdinal(d3.schemeCategory10);
        this.forceManyBody = d3
            .forceManyBody()
            .strength(manyBodyStrength)
            .theta(manyBodyTheta)
            .distanceMin(manyBodyDistanceMin)
            .distanceMax(manyBodydistanceMax);
        this.forceCollide = d3
            .forceCollide(function (d) { return collideRadius * sizeX[d.type] * _this_1.createScale(d); })
            .strength(collideStrength)
            .iterations(collideIterations);
        this.forceCenter = d3.forceCenter(this.contain.offsetWidth / 2, this.contain.offsetHeight / 2);
        this.forceLink = d3
            .forceLink([])
            .id(function (d) { return d.id; })
            .distance(linkDistance)
            .iterations(linkIterations);
        this.activeNodeIdSet = new Set();
        this.initTooltips();
        this.initSVG();
        this.initEvent();
    };
    SVGManage.prototype.createColor = function (d) {
        return d.color || '#333';
    };
    SVGManage.prototype.createScale = function (d) {
        return d.scale || 1;
    };
    SVGManage.prototype.createOpacity = function (d) {
        return d.opacity || 1;
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
        var _this_1 = this;
        var _a = this.option, data = _a.data, _b = _a.type, type = _b === void 0 ? 'auto' : _b, _c = _a.defaultScale, defaultScale = _c === void 0 ? 1 : _c;
        var _d = this.getD3Option(), alpha = _d.alpha, alphaMin = _d.alphaMin, alphaDecay = _d.alphaDecay, velocityDecay = _d.velocityDecay, nodeSize = _d.nodeSize, linkDistance = _d.linkDistance, linkIterations = _d.linkIterations, lineType = _d.lineType;
        var rMap = this.getR();
        var groupWidth = rMap.group;
        var deviceWidth = rMap.device;
        var paramWidth = rMap.param;
        var faultWidth = rMap.fault;
        var energyWidth = rMap.energy;
        var isFixed = type === 'fixed';
        var width = this.contain.offsetWidth;
        var height = this.contain.offsetHeight;
        var linksData = type === 'auto'
            ? data.links.map(function (d) { return Object.create(d); })
            : data.links.map(function (d) {
                return Object.create(Object.assign(d, {
                    source: { id: d.source },
                    target: { id: d.target }
                }));
            });
        var nodesData = data.nodes.map(function (d) { return Object.create(d); });
        var _e = nodesData.reduce(function (l, v) {
            var _a;
            return Object.assign(l, (_a = {}, _a[v.type] = (l[v.type] || []).concat([v]), _a));
        }, {}), _f = _e.device, device = _f === void 0 ? [] : _f, _g = _e.param, param = _g === void 0 ? [] : _g, _h = _e.group, group = _h === void 0 ? [] : _h, _j = _e.fault, fault = _j === void 0 ? [] : _j, _k = _e.energy, energy = _k === void 0 ? [] : _k;
        var nodeMap = nodesData.reduce(function (l, v) {
            var _a;
            return Object.assign(l, (_a = {}, _a[v.id] = v, _a));
        }, {});
        this.nodeMap = nodeMap;
        this.arrowMap = {};
        this.forceLink = d3
            .forceLink(linksData)
            .id(function (d) { return d.id; })
            .distance(linkDistance)
            .iterations(linkIterations);
        this.simulation =
            !isFixed &&
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
        this.zoom = d3.zoom().on('zoom', function () {
            _this_1.transform = {
                x: d3.event.transform.x,
                y: d3.event.transform.y,
                k: d3.event.transform.k
            };
            g.attr('transform', d3.event.transform);
        });
        this.svg = d3
            .select(this.contain)
            .append('svg')
            .attr('width', +width)
            .attr('height', +height)
            .call(this.zoom);
        var g = this.svg.append('g').attr('class', 'everythingWrap');
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
        var links = g
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
            .attr('marker-end', function (d) {
            return d.type === 'arrow' ? _this_1.getArrow(_this_1.createColor(d)) : '';
        });
        if (!this.simulation) {
            links
                .attr('x1', function (d) {
                return createNearXY(nodeMap[d.source.id].fx, nodeMap[d.source.id].fy, nodeMap[d.target.id].fx, nodeMap[d.target.id].fy, rMap[nodeMap[d.source.id].type] *
                    _this_1.createScale(nodeMap[d.source.id]), rMap[nodeMap[d.target.id].type] *
                    _this_1.createScale(nodeMap[d.target.id])).x1;
            })
                .attr('y1', function (d) {
                return createNearXY(nodeMap[d.source.id].fx, nodeMap[d.source.id].fy, nodeMap[d.target.id].fx, nodeMap[d.target.id].fy, rMap[nodeMap[d.source.id].type] *
                    _this_1.createScale(nodeMap[d.source.id]), rMap[nodeMap[d.target.id].type] *
                    _this_1.createScale(nodeMap[d.target.id])).y1;
            })
                .attr('x2', function (d) {
                return createNearXY(nodeMap[d.source.id].fx, nodeMap[d.source.id].fy, nodeMap[d.target.id].fx, nodeMap[d.target.id].fy, rMap[nodeMap[d.source.id].type] *
                    _this_1.createScale(nodeMap[d.source.id]), rMap[nodeMap[d.target.id].type] *
                    _this_1.createScale(nodeMap[d.target.id])).x2;
            })
                .attr('y2', function (d) {
                return createNearXY(nodeMap[d.source.id].fx, nodeMap[d.source.id].fy, nodeMap[d.target.id].fx, nodeMap[d.target.id].fy, rMap[nodeMap[d.source.id].type] *
                    _this_1.createScale(nodeMap[d.source.id]), rMap[nodeMap[d.target.id].type] *
                    _this_1.createScale(nodeMap[d.target.id]), true).y2;
            });
            lineType === 'path' &&
                links.attr('d', function (d) {
                    return createLinePath(nodeMap[d.source.id].fx, nodeMap[d.source.id].fy, nodeMap[d.target.id].fx, nodeMap[d.target.id].fy, rMap[nodeMap[d.source.id].type] *
                        _this_1.createScale(nodeMap[d.source.id]), rMap[nodeMap[d.target.id].type] *
                        _this_1.createScale(nodeMap[d.target.id]));
                });
        }
        var nodesGroup = g
            .append('g')
            .attr('class', 'nodesGroupWrap')
            .selectAll('g')
            .data(group)
            .join('g')
            .attr('class', 'group')
            // .attr('id',d=>`device_${d.id}`)
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        })
            .call(this.createDrag(this.simulation));
        nodesGroup
            .append('circle')
            .attr('class', 'rect')
            .attr('r', function (d) { return _this_1.createScale(d) * groupWidth; })
            // .attr('fill', this.createColor)
            .attr('opacity', this.createOpacity)
            .style('fill', function (d) {
            return d.isFault ? 'url(#linearColor)' : _this_1.createColor(d);
        });
        // .style('filter',d=>d.isFault?'url("#shadow")':'');
        var deviceW = Math.sqrt((3 / 4) * Math.pow(deviceWidth, 2));
        var nodesDevice = g
            .append('g')
            .attr('class', 'nodesDeviceWrap')
            .selectAll('g')
            .data(device)
            .join('g')
            .attr('class', 'device')
            // .attr('id',d=>`device_${d.id}`)
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        })
            .call(this.createDrag(this.simulation));
        nodesDevice
            .append('path')
            .attr('class', 'rect')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.createColor)
            .attr('opacity', this.createOpacity)
            .attr('d', "m 0 -" + deviceWidth + " l " + deviceW + " " + deviceWidth /
            2 + " l 0 " + deviceWidth + " l -" + deviceW + " " + deviceWidth /
            2 + " l -" + deviceW + " -" + deviceWidth / 2 + " l 0 -" + deviceWidth + "  z");
        var nodesParam = g
            .append('g')
            .attr('class', 'nodesParamWrap')
            .selectAll('g')
            .data(param)
            .join('g')
            .attr('class', 'param')
            // .attr('id',d=>`device_${d.id}`)
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        })
            .call(this.createDrag(this.simulation));
        nodesParam
            .append('path')
            .attr('class', 'rect')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.createColor)
            .attr('opacity', this.createOpacity)
            .attr('d', "m 0 -" + paramWidth + " l " + paramWidth + " " + paramWidth + " l -" + paramWidth + " " + paramWidth + " l -" + paramWidth + " -" + paramWidth + " z");
        var faultW = Math.sqrt((3 / 4) * Math.pow(faultWidth, 2));
        var nodesFault = g
            .append('g')
            .attr('class', 'nodesFaultWrap')
            .selectAll('g')
            .data(fault)
            .join('g')
            .attr('class', 'fault')
            // .attr('id',d=>`device_${d.id}`)
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        })
            .call(this.createDrag(this.simulation));
        nodesFault
            .append('path')
            .attr('class', 'rect')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.createColor)
            .attr('opacity', this.createOpacity)
            .attr('d', "m 0 -" + faultWidth + " l " + faultW + " " + faultWidth /
            2 + " l 0 " + faultWidth + " l -" + faultW + " " + faultWidth /
            2 + " l -" + faultW + " -" + faultWidth / 2 + " l 0 -" + faultWidth + "  z");
        var energyW = Math.sqrt((3 / 4) * Math.pow(energyWidth, 2));
        var nodesEnergy = g
            .append('g')
            .attr('class', 'nodesEnergyWrap')
            .selectAll('g')
            .data(energy)
            .join('g')
            .attr('class', 'energy')
            // .attr('id',d=>`device_${d.id}`)
            .attr('transform', function (d) {
            return d.fx ? "translate(" + d.fx + "," + d.fy + ")" : '';
        })
            .call(this.createDrag(this.simulation));
        nodesEnergy
            .append('path')
            .attr('class', 'rect')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('fill', this.createColor)
            .attr('opacity', this.createOpacity)
            .attr('d', "m 0 -" + energyWidth + " l " + energyW + " " + energyWidth /
            2 + " l 0 " + energyWidth + " l -" + energyW + " " + energyWidth /
            2 + " l -" + energyW + " -" + energyWidth / 2 + " l 0 -" + energyWidth + "  z");
        // nodes.append('circle').attr('dx',0).attr('dy',0).attr("r", 1).attr('fill', 'green').attr('opacity',0.2)
        var typeBoxMap = {};
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
            .text(function (d) { return d.name || ''; })
            .attr('opacity', 0.8)
            .attr('pointer-events', 'none')
            .style('font-size', '8px')
            .attr('dx', function (d) { return _this_1.createScale(d) * groupWidth + 3; });
        nodesGroup
            .append('text')
            .attr('class', 'bg')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text(function (d) { return d.bgText || '!'; })
            .attr('fill', '#EAC8A0')
            .attr('opacity', 1)
            .attr('pointer-events', 'none')
            .style('font-size', function (d) { return _this_1.createScale(d) * groupWidth + 'px'; })
            .style('display', function (d) { return (d.isFault ? 'inline' : 'none'); });
        nodesDevice
            .append('text')
            .attr('class', 'name')
            .attr('dy', '0.35em')
            .text(function (d) { return d.name || ''; })
            .attr('opacity', 0.8)
            .attr('pointer-events', 'none')
            .style('font-size', '8px')
            .attr('dx', deviceWidth + 3);
        nodesParam
            .append('text')
            .attr('class', 'name')
            .attr('dy', '0.35em')
            .text(function (d) { return d.name || ''; })
            .attr('opacity', 0.6)
            .attr('pointer-events', 'none')
            .style('font-size', '6px')
            .attr('dx', paramWidth + 3);
        nodesFault
            .append('text')
            .attr('class', 'name')
            .attr('dy', '0.35em')
            .text(function (d) { return d.name || ''; })
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
            .style('font-size', faultWidth + "px");
        nodesEnergy
            .append('text')
            .attr('class', 'name')
            .attr('dy', '0.35em')
            .text(function (d) { return d.name || ''; })
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
            .style('font-size', energyWidth + "px");
    };
    SVGManage.prototype.initEvent = function () {
        var _this_1 = this;
        var _this = this;
        var isClickSVG = true;
        var _a = this.option.events, events = _a === void 0 ? {} : _a;
        var _b = events.onSelectedChange, onSelectedChange = _b === void 0 ? function () { } : _b, _c = events.onClick, onClick = _c === void 0 ? function () { return true; } : _c;
        var lineType = this.getD3Option().lineType;
        var rMap = this.getR();
        var _d = this.getVars(), nodesGroup = _d.nodesGroup, nodesDevice = _d.nodesDevice, nodesParam = _d.nodesParam, nodesFault = _d.nodesFault, nodesEnergy = _d.nodesEnergy, links = _d.links;
        var opacityFn = function () {
            var target = d3.select(this);
            var event = d3.event;
            if (!target.classed('opacity')) {
                target.classed('opacity', true).attr('opacity', 0.4);
            }
        };
        var unopacityFn = function () {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('opacity')) {
                target.classed('opacity', false).attr('opacity', 1);
            }
        };
        var activeFn = function (d, i) {
            isClickSVG = false;
            var target = d3.select(d3.event.target.parentNode);
            var event = d3.event;
            var ctrlKey = event.ctrlKey || event.metaKey;
            var isNext = onClick(target.datum().id, event) === false ? false : true;
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
            }
            else {
                target.dispatch('active');
            }
            _this.setOpacity(nodesGroup, nodesDevice, nodesParam, nodesFault, nodesEnergy, links);
            onSelectedChange(Array.from(_this.activeNodeIdSet), event);
        };
        var showInCenterFn = function (d) {
            _this.svg
                .transition()
                .duration(750)
                .call(_this.zoom.transform, d3.zoomIdentity.translate(_this.contain.offsetWidth / 2 - (_this.simulation ? d.x : d.fx), _this.contain.offsetHeight / 2 - (_this.simulation ? d.y : d.fy)).scale(_this.transform.k));
        };
        var mouseoverFn = function (d) {
            if (d.tooltip) {
                _this.tooltip
                    .style('z-index', '1')
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9);
                _this.tooltip
                    .html(d.tooltip);
                var top_1 = d.y * _this.transform.k +
                    _this.transform.y -
                    rMap[d.type] * _this.createScale(d) * _this.transform.k;
                var left = d.x * _this.transform.k +
                    _this.transform.x +
                    rMap[d.type] * _this.createScale(d) * _this.transform.k;
                if (_this.tooltip.node().offsetHeight >
                    document.body.offsetHeight / 2) {
                    if (top_1 > document.body.offsetHeight / 2) {
                        _this.tooltip.style('top', document.body.offsetHeight -
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
                    document.body.offsetWidth - left - 8) {
                    _this.tooltip.style('left', left - _this.tooltip.node().offsetWidth - rMap[d.type] * _this.createScale(d) + 'px');
                }
                else {
                    _this.tooltip.style('left', left + 'px');
                }
                _this.tooltip.style('font-size', 8 * _this.transform.k + 'px');
            }
        };
        var mouseoutFn = function (d) {
            if (d.tooltip) {
                _this.tooltip
                    .transition()
                    .duration(500)
                    .style('opacity', 0)
                    .style('z-index', '-1')
                    .style('max-height', '60vh');
            }
        };
        var nodeBigerFn = function () {
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
        var nodeUnbigerFn = function () {
            // const target = d3.select(this);
            // const event = d3.event;
            // if (target.classed('biger')) {
            //   target.classed('biger', false).attr('transform', 'scale(1)');
            // }
        };
        var linkBigerFn = function () {
            // const target = d3.select(this);
            // const event = d3.event;
            // if (!target.classed('biger')) {
            //   target.classed('biger', true).attr('transform', 'scale(3)');
            // }
        };
        var linkUnbigerFn = function () {
            // const target = d3.select(this);
            // const event = d3.event;
            // if (target.classed('biger')) {
            //   target.classed('biger', false).attr('transform', 'scale(1)');
            // }
        };
        this.svg.on('click', function () {
            if (isClickSVG) {
                nodesGroup.dispatch('unactive');
                nodesDevice.dispatch('unactive');
                nodesParam.dispatch('unactive');
                nodesFault.dispatch('unactive');
                nodesEnergy.dispatch('unactive');
                _this.setOpacity(nodesGroup, nodesDevice, nodesParam, nodesFault, nodesEnergy, links);
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
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target.classed('active', true);
            _this.activeNodeIdSet.add(d.id);
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target.classed('active', false);
                _this.activeNodeIdSet["delete"](d.id);
            }
        })
            .on('opacity', opacityFn)
            .on('unopacity', unopacityFn)
            .on('showInCenter', showInCenterFn)
            .on('biger', nodeBigerFn)
            .on('unbiger', nodeUnbigerFn);
        nodesDevice
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target
                .classed('active', true)
                .select('.rect')
                .transition()
                .attr('stroke', _this.createColor(d));
            _this.activeNodeIdSet.add(d.id);
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target
                    .classed('active', false)
                    .select('.rect')
                    .transition()
                    .attr('stroke', '#fff');
                _this.activeNodeIdSet["delete"](d.id);
            }
        })
            .on('opacity', opacityFn)
            .on('unopacity', unopacityFn)
            .on('showInCenter', showInCenterFn)
            .on('biger', nodeBigerFn)
            .on('unbiger', nodeUnbigerFn);
        nodesParam
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target.classed('active', true);
            _this.activeNodeIdSet.add(d.id);
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target.classed('active', false).select('.rect');
                _this.activeNodeIdSet["delete"](d.id);
            }
        })
            .on('opacity', opacityFn)
            .on('unopacity', unopacityFn)
            .on('showInCenter', showInCenterFn)
            .on('biger', nodeBigerFn)
            .on('unbiger', nodeUnbigerFn);
        nodesFault
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target.classed('active', true);
            _this.activeNodeIdSet.add(d.id);
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target.classed('active', false);
                _this.activeNodeIdSet["delete"](d.id);
            }
        })
            .on('opacity', opacityFn)
            .on('unopacity', unopacityFn)
            .on('showInCenter', showInCenterFn)
            .on('biger', nodeBigerFn)
            .on('unbiger', nodeUnbigerFn);
        nodesEnergy
            .on('active', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            target.classed('active', true);
            _this.activeNodeIdSet.add(d.id);
        })
            .on('unactive', function (d, i) {
            var target = d3.select(this);
            var event = d3.event;
            if (target.classed('active')) {
                target.classed('active', false);
                _this.activeNodeIdSet["delete"](d.id);
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
            var changeLinks_1 = lineType === 'path'
                ? function () {
                    links.attr('d', function (d) {
                        return createLinePath(d.source.x, d.source.y, d.target.x, d.target.y, rMap[_this.nodeMap[d.source.id].type] *
                            _this_1.createScale(_this_1.nodeMap[d.source.id]), rMap[_this.nodeMap[d.target.id].type] *
                            _this_1.createScale(_this_1.nodeMap[d.target.id]));
                    });
                }
                : function () { };
            this.simulation.on('tick', function () {
                links
                    .attr('x1', function (d) {
                    return createNearXY(d.source.x, d.source.y, d.target.x, d.target.y, rMap[_this_1.nodeMap[d.source.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.source.id]), rMap[_this_1.nodeMap[d.target.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.target.id])).x1;
                })
                    .attr('y1', function (d) {
                    return createNearXY(d.source.x, d.source.y, d.target.x, d.target.y, rMap[_this_1.nodeMap[d.source.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.source.id]), rMap[_this_1.nodeMap[d.target.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.target.id])).y1;
                })
                    .attr('x2', function (d) {
                    return createNearXY(d.source.x, d.source.y, d.target.x, d.target.y, rMap[_this_1.nodeMap[d.source.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.source.id]), rMap[_this_1.nodeMap[d.target.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.target.id])).x2;
                })
                    .attr('y2', function (d) {
                    return createNearXY(d.source.x, d.source.y, d.target.x, d.target.y, rMap[_this_1.nodeMap[d.source.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.source.id]), rMap[_this_1.nodeMap[d.target.id].type] *
                        _this_1.createScale(_this_1.nodeMap[d.target.id]), true).y2;
                });
                changeLinks_1();
                nodesDevice.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
                nodesParam.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
                nodesGroup.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
                nodesFault.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
                nodesEnergy.attr('transform', function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            });
        }
    };
    SVGManage.prototype.getArrow = function (color) {
        if (color in this.arrowMap) {
            return this.arrowMap[color];
        }
        var defs = d3.select('.defsWrap');
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
        var rs = 'url(' + color + ')';
        this.arrowMap[color] = rs;
        return rs;
    };
    SVGManage.prototype.setOpacity = function (nodesGroup, nodesDevice, nodesParam, nodesFault, nodesEnergy, links) {
        var _this_1 = this;
        if (this.activeNodeIdSet.size > 0) {
            nodesDevice.sort(function (a, b) { return (_this_1.activeNodeIdSet.has(a.id) ? 1 : -1); });
            nodesGroup.dispatch('opacity').dispatch('unbiger');
            nodesDevice.dispatch('opacity').dispatch('unbiger');
            nodesParam.dispatch('opacity').dispatch('unbiger');
            nodesFault.dispatch('opacity').dispatch('unbiger');
            nodesEnergy.dispatch('opacity').dispatch('unbiger');
            links.dispatch('opacity');
            var linkNodeIdSet_1 = new Set(this.activeNodeIdSet);
            links
                .filter(function (d) {
                var is = _this_1.activeNodeIdSet.has(d.source.id) ||
                    _this_1.activeNodeIdSet.has(d.target.id);
                if (is) {
                    linkNodeIdSet_1.add(d.source.id);
                    linkNodeIdSet_1.add(d.target.id);
                }
                return is;
            })
                .dispatch('unopacity');
            nodesGroup
                .filter(function (d) { return linkNodeIdSet_1.has(d.id); })
                .dispatch('unopacity')
                .dispatch('biger');
            nodesDevice
                .filter(function (d) { return linkNodeIdSet_1.has(d.id); })
                .dispatch('unopacity')
                .dispatch('biger');
            nodesParam
                .filter(function (d) { return linkNodeIdSet_1.has(d.id); })
                .dispatch('unopacity')
                .dispatch('biger');
            nodesFault
                .filter(function (d) { return linkNodeIdSet_1.has(d.id); })
                .dispatch('unopacity')
                .dispatch('biger');
            nodesEnergy
                .filter(function (d) { return linkNodeIdSet_1.has(d.id); })
                .dispatch('unopacity')
                .dispatch('biger');
            nodesParam.sort(function (a, b) { return (linkNodeIdSet_1.has(a.id) ? 1 : -1); });
            nodesGroup.sort(function (a, b) { return (linkNodeIdSet_1.has(a.id) ? 1 : -1); });
            nodesFault.sort(function (a, b) { return (linkNodeIdSet_1.has(a.id) ? 1 : -1); });
            nodesEnergy.sort(function (a, b) { return (linkNodeIdSet_1.has(a.id) ? 1 : -1); });
        }
        else {
            nodesGroup.dispatch('unopacity').dispatch('unbiger');
            nodesDevice.dispatch('unopacity').dispatch('unbiger');
            nodesParam.dispatch('unopacity').dispatch('unbiger');
            nodesFault.dispatch('unopacity').dispatch('unbiger');
            nodesEnergy.dispatch('unopacity').dispatch('unbiger');
            links.dispatch('unopacity').dispatch('unbiger');
        }
    };
    SVGManage.prototype.getVars = function () {
        var nodesGroup = d3.selectAll('.nodesGroupWrap .group');
        var nodesDevice = d3.selectAll('.nodesDeviceWrap .device');
        var nodesParam = d3.selectAll('.nodesParamWrap .param');
        var nodesFault = d3.selectAll('.nodesFaultWrap .fault');
        var nodesEnergy = d3.selectAll('.nodesEnergyWrap .energy');
        var links = d3.selectAll('.linksWrap .link');
        return {
            nodesGroup: nodesGroup,
            nodesDevice: nodesDevice,
            nodesParam: nodesParam,
            nodesFault: nodesFault,
            nodesEnergy: nodesEnergy,
            links: links
        };
    };
    SVGManage.prototype.addLinks = function (ls) {
        var _this_1 = this;
        var _a;
        var lineType = this.getD3Option().lineType;
        var rMap = this.getR();
        var _b = this.option, data = _b.data, _c = _b.type, type = _c === void 0 ? 'auto' : _c;
        var nodes = data.nodes;
        var devicesIdSet = new Set(nodes.map(function (v) { return v.id; }));
        ls = ls.filter(function (v) { return devicesIdSet.has(v.source) && devicesIdSet.has(v.target); });
        if (!ls.length) {
            return;
        }
        (_a = this.option.data.links).push.apply(_a, (type === 'auto'
            ? ls
            : ls.map(function (d) {
                return Object.assign(d, {
                    source: { id: d.source },
                    target: { id: d.target }
                });
            })));
        var linksData = this.option.data.links.map(function (d) { return Object.create(d); });
        var links = d3
            .select('.linksWrap')
            .selectAll('.link')
            .data(linksData);
        if (!this.simulation) {
            var nodeMap_1 = nodes.reduce(function (l, v) {
                var _a;
                return Object.assign(l, (_a = {}, _a[v.id] = v, _a));
            }, {});
            var linesTarget = links
                .enter()
                .append(lineType)
                .attr('class', 'link')
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .merge(links);
            linesTarget
                .attr('x1', function (d) {
                return createNearXY(nodeMap_1[d.source.id].fx, nodeMap_1[d.source.id].fy, nodeMap_1[d.target.id].fx, nodeMap_1[d.target.id].fy, rMap[nodeMap_1[d.source.id].type] *
                    _this_1.createScale(nodeMap_1[d.source.id]), rMap[nodeMap_1[d.target.id].type] *
                    _this_1.createScale(nodeMap_1[d.target.id])).x1;
            })
                .attr('y1', function (d) {
                return createNearXY(nodeMap_1[d.source.id].fx, nodeMap_1[d.source.id].fy, nodeMap_1[d.target.id].fx, nodeMap_1[d.target.id].fy, rMap[nodeMap_1[d.source.id].type] *
                    _this_1.createScale(nodeMap_1[d.source.id]), rMap[nodeMap_1[d.target.id].type] *
                    _this_1.createScale(nodeMap_1[d.target.id])).y1;
            })
                .attr('x2', function (d) {
                return createNearXY(nodeMap_1[d.source.id].fx, nodeMap_1[d.source.id].fy, nodeMap_1[d.target.id].fx, nodeMap_1[d.target.id].fy, rMap[nodeMap_1[d.source.id].type] *
                    _this_1.createScale(nodeMap_1[d.source.id]), rMap[nodeMap_1[d.target.id].type] *
                    _this_1.createScale(nodeMap_1[d.target.id])).x2;
            })
                .attr('y2', function (d) {
                return createNearXY(nodeMap_1[d.source.id].fx, nodeMap_1[d.source.id].fy, nodeMap_1[d.target.id].fx, nodeMap_1[d.target.id].fy, rMap[nodeMap_1[d.source.id].type] *
                    _this_1.createScale(nodeMap_1[d.source.id]), rMap[nodeMap_1[d.target.id].type] *
                    _this_1.createScale(nodeMap_1[d.target.id]), true).y2;
            });
            lineType === 'path' &&
                linesTarget.attr('d', function (d) {
                    return createLinePath(nodeMap_1[d.source.id].fx, nodeMap_1[d.source.id].fy, nodeMap_1[d.target.id].fx, nodeMap_1[d.target.id].fy, rMap[nodeMap_1[d.source.id].type] *
                        _this_1.createScale(nodeMap_1[d.source.id]), rMap[nodeMap_1[d.target.id].type] *
                        _this_1.createScale(nodeMap_1[d.target.id]));
                });
            links.exit().remove();
        }
        else {
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
    };
    SVGManage.prototype.removeLinks = function (ids) {
        if (!ids.length) {
            return;
        }
        var lineType = this.getD3Option().lineType;
        var idSet = new Set(ids);
        this.option.data.links = this.option.data.links.filter(function (v) { return !idSet.has(v.id); });
        var linksData = this.option.data.links.map(function (d) { return Object.create(d); });
        var links = d3
            .select('.linksWrap')
            .selectAll('.link')
            .data(linksData);
        if (!this.simulation) {
            links
                .enter()
                .append(lineType)
                .attr('class', 'link')
                .attr('stroke-width', 1)
                .merge(links);
            links.exit().remove();
        }
        else {
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
    };
    SVGManage.prototype.selectByIds = function (ids) {
        var _a = this.getVars(), nodesGroup = _a.nodesGroup, nodesDevice = _a.nodesDevice, nodesParam = _a.nodesParam, nodesFault = _a.nodesFault, nodesEnergy = _a.nodesEnergy, links = _a.links;
        nodesGroup.dispatch('unactive');
        nodesDevice.dispatch('unactive');
        nodesParam.dispatch('unactive');
        nodesFault.dispatch('unactive');
        nodesEnergy.dispatch('unactive');
        var activeNodeIdSet = new Set(ids);
        var selectGroup = nodesGroup
            .filter(function (d) { return activeNodeIdSet.has(d.id); })
            .dispatch('active');
        var selectDevice = nodesDevice
            .filter(function (d) { return activeNodeIdSet.has(d.id); })
            .dispatch('active');
        var selectParam = nodesParam
            .filter(function (d) { return activeNodeIdSet.has(d.id); })
            .dispatch('active');
        var selectFault = nodesFault
            .filter(function (d) { return activeNodeIdSet.has(d.id); })
            .dispatch('active');
        var selectEnergy = nodesEnergy
            .filter(function (d) { return activeNodeIdSet.has(d.id); })
            .dispatch('active');
        this.setOpacity(nodesGroup, nodesDevice, nodesParam, nodesFault, nodesEnergy, links);
        selectParam.dispatch('showInCenter');
        selectDevice.dispatch('showInCenter');
        selectGroup.dispatch('showInCenter');
        selectFault.dispatch('showInCenter');
        selectEnergy.dispatch('showInCenter');
    };
    SVGManage.prototype.highlightFE = function () {
        var _a = this.getVars(), nodesGroup = _a.nodesGroup, nodesDevice = _a.nodesDevice, nodesParam = _a.nodesParam, nodesFault = _a.nodesFault, nodesEnergy = _a.nodesEnergy, links = _a.links;
        nodesGroup.dispatch('opacity');
        nodesDevice.dispatch('opacity');
        nodesParam.dispatch('opacity');
        nodesFault.dispatch('opacity');
        nodesEnergy.dispatch('opacity');
        links.dispatch('opacity');
        nodesFault.dispatch('unopacity');
        nodesEnergy.dispatch('unopacity');
    };
    SVGManage.prototype.getD3Option = function () {
        var _a = this.option.d3Option, d3Option = _a === void 0 ? {} : _a;
        return Object.assign({}, SVGManage.D3Option(), d3Option);
    };
    SVGManage.prototype.getR = function (type) {
        var _a = this.getD3Option(), nodeSize = _a.nodeSize, sizeX = _a.sizeX;
        if (type) {
            return nodeSize * sizeX[type];
        }
        var rs = {
            device: nodeSize * sizeX['device'],
            group: nodeSize * sizeX['group'],
            param: nodeSize * sizeX['param'],
            fault: nodeSize * sizeX['fault'],
            energy: nodeSize * sizeX['energy']
        };
        return rs;
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
        var dx = this.transform.x - this.contain.offsetWidth * (v - this.transform.k) / 2;
        var dy = this.transform.y - this.contain.offsetHeight * (v - this.transform.k) / 2;
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
