import React, { Component, createRef } from 'react';
import {
  Select,
  Popover,
  Button,
  Input,
  Table,
  InputNumber,
  Radio,
  Progress,
} from 'antd';
import * as d3 from 'd3';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import SVGManage, { SVGManageOption } from './svg';
import s, { IChartLess } from './chart.less';
import CanvasManage from './canvas';
import Loading from './loading';

const { remote } = require('electron');
const { clipboard } = remote;

const styles = s as Partial<IChartLess>;

interface ChartStateProps {}
interface ChartDispatchProps {
  dispatch: Dispatch;
}
interface ChartOwnProps {}
type ChartModalProps = ChartStateProps & ChartDispatchProps & ChartOwnProps;
enum Mode {
  'animate',
  'static',
}
enum ModeType {
  'SVG',
  'canvas',
}
interface ChartModalState {
  groupCount?: number;
  rootCount?: number;
  childCount?: number;
  mode?: Mode;
  modeType?: ModeType;
  option?: SVGManageOption['d3Option'];
}
export class ChartModal extends Component<
  Partial<ChartModalProps>,
  ChartModalState
> {
  state = {
    groupCount: 100,
    rootCount: 100,
    childCount: 500,
    faultCount: 10,
    energyCount: 10,
    mode: Mode.animate,
    modeType: ModeType.SVG,
    option: {
      ...SVGManage.D3Option(),
    },
  };
  private svgManage: SVGManage | CanvasManage;
  private svgWrap = createRef<HTMLDivElement>();
  private loading = createRef<Loading>();
  componentDidMount() {
    this.start();
  }
  componentDidUpdate(
    prvProps: Partial<ChartModalProps>,
    preState: ChartModalState,
  ) {}
  private start = () => {
    if (this.svgManage) {
      this.svgManage.destroy();
    }
    const {
      groupCount,
      rootCount,
      childCount,
      faultCount,
      energyCount,
      mode,
      modeType,
      option,
    } = this.state;
    // sizeX: {
    //   device: 1,
    //   group: 1.2,
    //   param: 0.5,
    //   fault: 1.5,
    //   energy: 1.5,
    // },
    const groupNode = d3.range(groupCount).map(function(i) {
      return {
        id: `${i}`,
        type: 'group',
        name: `group_${i}`,
        isFault: true,
        isEnergy: true,
        bgText: '11',
        bgTextColor: '#EAC8A0',
        color: 'url(#faultEnergyGroupColor)',
        opacity: 1,
        scale: 1.2,
        tooltip: 'aaa',
      };
    }) as SVGManageOption['data']['nodes'];
    const rootNode = d3.range(rootCount).map(function(i) {
      return {
        id: `${i + groupNode.length}`,
        type: 'device',
        name: `root_${i}`,
        isFault: false,
        isEnergy: false,
        color: 'black',
        opacity: 1,
        scale: 1,
        tooltip: '222',
      };
    }) as SVGManageOption['data']['nodes'];
    const childNode = d3.range(childCount).map(function(i) {
      return {
        id: `${i + rootNode.length + groupNode.length}`,
        type: 'param',
        name: `param_${i}`,
        isFault: false,
        isEnergy: false,
        color: 'green',
        opacity: 0.8,
        scale: 0.5,
        tooltip: 'bbb',
      };
    }) as SVGManageOption['data']['nodes'];
    const faultNode = d3.range(faultCount).map(function(i) {
      return {
        id: `${i + rootNode.length + groupNode.length + childNode.length}`,
        type: 'device',
        name: `fault_${i}`,
        isFault: true,
        isEnergy: false,
        bgText: '!',
        bgTextColor: '#fff',
        color: 'red',
        opacity: 1,
        scale: 1.5,
        tooltip: 'ccc',
      };
    }) as SVGManageOption['data']['nodes'];
    const energyNode = d3.range(energyCount).map(function(i) {
      return {
        id: `${i +
          rootNode.length +
          groupNode.length +
          childNode.length +
          faultNode.length}`,
        type: 'device',
        name: `energy_${i}`,
        isFault: false,
        isEnergy: true,
        bgText: '$',
        bgTextColor: '#fff',
        color: 'blue',
        opacity: 1.5,
        scale: 1.5,
        tooltip: 'ddd',
      };
    }) as SVGManageOption['data']['nodes'];

    const groupDeviceLinks = d3
      .range(groupNode.length + rootNode.length - 1)
      .map(function(i) {
        const s = Math.floor(Math.sqrt(i));
        return {
          id: `line-${i}`,
          source: `${s}`,
          target: `${i + 1}`,
          type: 'arrow',
          color: '#1096A7',
        opacity: 0.2
        };
      }) as SVGManageOption['data']['links'];
    const deviceParamLinks = d3
      .range(rootNode.length + childNode.length - 1)
      .map(function(i) {
        const index = i + groupNode.length;
        const s = Math.floor(Math.sqrt(i));
        return {
          id: `line-${index}`,
          source: `${s + groupNode.length}`,
          target: `${index + 1}`,
          type: 'normal',
          color: '#1096A7',
        opacity: 0.2
        };
      }) as SVGManageOption['data']['links'];
    const links = [...groupDeviceLinks, ...deviceParamLinks];
    const nodes = [
      ...groupNode,
      ...rootNode,
      ...childNode,
      ...faultNode,
      ...energyNode,
    ];
    if (mode === Mode.animate) {
      console.log(option);
      this.svgManage = new SVGManage(this.svgWrap.current, {
        data: {
          nodes,
          links,
        },
        type: 'auto',
        d3Option: option,
      } as SVGManageOption);
    } else {
      this.svgManage = new CanvasManage(this.svgWrap.current, {
        data: {
          nodes,
          links,
        },
        d3Option: option,
        onTick: ({ progress }) => {
          this.loading.current.tick(progress);
        },
        onEnd: ({ nodes, links }) => {
          this.loading.current.tick(undefined);
          if (modeType === ModeType.SVG) {
            console.log(option);
            this.svgManage.destroy();
            this.svgManage = new SVGManage(this.svgWrap.current, {
              data: {
                nodes: nodes.map(v => Object.assign(v, { fx: v.x, fy: v.y })),
                links: links.map(v =>
                  Object.assign({}, v, {
                    source: v.source.id,
                    target: v.target.id,
                  }),
                ),
              },
              type: 'fixed',
              defaultScale: 1,
              d3Option: option,
            });
          } else {
            // canvas
            const canvas = this.svgManage.getNode() as HTMLCanvasElement;
            const context = canvas.getContext('2d'),
              width = canvas.width,
              height = canvas.height;
            function drawLink(d) {
              context.moveTo(d.source.x, d.source.y);
              context.lineTo(d.target.x, d.target.y);
            }

            function drawNode(d) {
              context.moveTo(d.x + 3, d.y);
              context.arc(d.x, d.y, 3, 0, 2 * Math.PI);
            }
            context.clearRect(0, 0, width, height);
            context.save();
            // context.translate(width / 2, height / 2);

            context.beginPath();
            links.forEach(drawLink);
            context.strokeStyle = '#aaa';
            context.stroke();

            context.beginPath();
            nodes.forEach(drawNode);
            context.fill();
            context.strokeStyle = '#fff';
            context.stroke();
            context.restore();
          }
        },
      });
    }
  };
  private handleChangeCount = (key: string, count: number) => {
    this.setState({
      [key]: count,
    });
  };
  private handleChangeOptionCount = (key: string, count: number) => {
    const option = Object.assign({}, this.state.option);
    option[key] = count;
    this.setState({
      option,
    });
  };
  private handleChangeValue = (key: string, e) => {
    this.setState({
      [key]: e.target.value,
    });
  };
  private handleChangeOptionValue = (key: string, e) => {
    const option = Object.assign({}, this.state.option);
    option[key] = e.target.value;
    this.setState({
      option,
    });
  };
  render() {
    const {
      groupCount,
      rootCount,
      childCount,
      faultCount,
      energyCount,
      mode,
      modeType,
      option,
    } = this.state;
    return (
      <div className={styles.wrap}>
        <div className={styles.toolWrap}>
          <div>
            <Button
              type="primary"
              icon="step-forward"
              title="开始"
              onClick={this.start}
            />
          </div>

          <div className={styles.block}>
            <div className={styles.title}>画布</div>
            <div>
              <Radio.Group
                onChange={this.handleChangeValue.bind(this, 'mode')}
                value={mode}
              >
                <Radio value={Mode.animate}>动态</Radio>
                <Radio value={Mode.static}>静态</Radio>
              </Radio.Group>
            </div>
            <div>
              <Radio.Group
                disabled={mode === Mode.animate}
                onChange={this.handleChangeValue.bind(this, 'modeType')}
                value={modeType}
              >
                <Radio value={ModeType.SVG}>SVG</Radio>
                <Radio value={ModeType.canvas}>canvas</Radio>
              </Radio.Group>
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>节点</div>
            <div>
              <div>分组节点数量:</div>
              <InputNumber
                min={0}
                value={groupCount}
                step={1}
                onChange={this.handleChangeCount.bind(this, 'groupCount')}
              />
            </div>
            <div>
              <div>父节点数量:</div>
              <InputNumber
                min={0}
                value={rootCount}
                step={1}
                onChange={this.handleChangeCount.bind(this, 'rootCount')}
              />
            </div>
            <div>
              <div>子节点数量:</div>
              <InputNumber
                min={0}
                value={childCount}
                step={1}
                onChange={this.handleChangeCount.bind(this, 'childCount')}
              />
            </div>
            <div>
              <div>故障节点数量:</div>
              <InputNumber
                min={0}
                value={faultCount}
                step={1}
                onChange={this.handleChangeCount.bind(this, 'faultCount')}
              />
            </div>
            <div>
              <div>节能节点数量:</div>
              <InputNumber
                min={0}
                value={energyCount}
                step={1}
                onChange={this.handleChangeCount.bind(this, 'energyCount')}
              />
            </div>
            <div>
              <div>节点大小:</div>
              <InputNumber
                min={1}
                value={option.nodeSize}
                step={1}
                onChange={this.handleChangeOptionCount.bind(this, 'nodeSize')}
              />
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>连线</div>
            <div>
              <Radio.Group
                onChange={this.handleChangeOptionValue.bind(this, 'lineType')}
                value={option.lineType}
              >
                <Radio value={'line'}>直线</Radio>
                <Radio value={'path'}>path</Radio>
              </Radio.Group>
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>碰撞检测</div>
            <div>
              <div>半径radius:</div>
              <InputNumber
                min={1}
                value={option.collideRadius}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'collideRadius',
                )}
              />
            </div>
            <div>
              <div>强度strength:</div>
              <InputNumber
                min={0}
                max={1}
                value={option.collideStrength}
                step={0.1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'collideStrength',
                )}
              />
            </div>
            <div>
              <div>迭代次数iterations:</div>
              <InputNumber
                min={1}
                value={option.collideIterations}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'collideIterations',
                )}
              />
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>弹簧力</div>
            <div>
              <div>距离distance:</div>
              <InputNumber
                min={1}
                value={option.linkDistance}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'linkDistance',
                )}
              />
            </div>
            <div>
              <div>迭代次数iterations:</div>
              <InputNumber
                min={1}
                value={option.linkIterations}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'linkIterations',
                )}
              />
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>电荷力</div>
            <div>
              <div>最小距离distance:</div>
              <InputNumber
                min={1}
                value={option.manyBodyDistanceMin}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'manyBodyDistanceMin',
                )}
              />
            </div>
            <div>
              <div>最大距离distance:</div>
              <InputNumber
                min={1}
                value={option.manyBodydistanceMax}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'manyBodydistanceMax',
                )}
              />
            </div>
            <div>
              <div>引力强度strength:</div>
              <InputNumber
                value={option.manyBodyStrength}
                step={1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'manyBodyStrength',
                )}
              />
            </div>
            <div>
              <div>算法阈值theta:</div>
              <InputNumber
                min={0.1}
                value={option.manyBodyTheta}
                step={0.1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'manyBodyTheta',
                )}
              />
            </div>
          </div>
          <div className={styles.block}>
            <div className={styles.title}>迭代</div>
            <div>
              <div>初始alpha:</div>
              <InputNumber
                min={0}
                max={1}
                value={option.alpha}
                step={0.001}
                onChange={this.handleChangeOptionCount.bind(this, 'alpha')}
              />
            </div>
            <div>
              <div>迭代阈值alphaMin:</div>
              <InputNumber
                min={0}
                max={1}
                value={option.alphaMin}
                step={0.001}
                onChange={this.handleChangeOptionCount.bind(this, 'alphaMin')}
              />
            </div>
            <div>
              <div>alpha衰减系数alphaDecay:</div>
              <InputNumber
                min={0}
                max={1}
                value={option.alphaDecay}
                step={0.0001}
                onChange={this.handleChangeOptionCount.bind(this, 'alphaDecay')}
              />
            </div>
            <div>
              <div>节点速度衰减系数velocityDecay:</div>
              <InputNumber
                min={0}
                max={1}
                value={option.velocityDecay}
                step={0.1}
                onChange={this.handleChangeOptionCount.bind(
                  this,
                  'velocityDecay',
                )}
              />
            </div>
            <div>
              迭代次数:Math.log(alphaMin) / Math.log(1 - alphaDecay)=
              {Math.ceil(
                Math.log(option.alphaMin) / Math.log(1 - option.alphaDecay),
              )}
            </div>
          </div>
        </div>
        <div className={styles.svgWrap} ref={this.svgWrap} id="svgWrap">
          <Loading ref={this.loading} />
        </div>
      </div>
    );
  }
}
export default connect<ChartStateProps, ChartDispatchProps, ChartOwnProps>(
  (state: ICache.model) => ({}),
  null,
  null,
  { forwardRef: true },
)(ChartModal);
