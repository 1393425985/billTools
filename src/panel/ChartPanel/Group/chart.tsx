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
interface ChartModalState {}
export class ChartModal extends Component<
  Partial<ChartModalProps>,
  ChartModalState
> {
  state = {};
  private svgManage: SVGManage;
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
    const data = this.getData();
    this.svgManage = new SVGManage(this.svgWrap.current, {
      data: data,
    } as SVGManageOption);
  };
  getData() {
    return {
      name: 'flare',
      type: 'group',
      children: [
        {
          name: 'analytics',
          type: 'group',
          faultCount: 3,
          energyCount: 2,
          children: [
            {
              name: 'cluster',
              type: 'group',
              faultCount: 1,
              energyCount: 1,
              children: [
                {
                  name: 'AgglomerativeCluster',
                  type: 'device',
                  value: 1,
                  isFault: true,
                  isEnergy: true,
                },
                {
                  name: 'CommunityStructure',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: false,
                },
                {
                  name: 'HierarchicalCluster',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: false,
                },
                {
                  name: 'MergeEdge',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: false,
                },
              ],
            },
            {
              name: 'graph',
              type: 'group',
              faultCount: 2,
              energyCount: 1,
              children: [
                {
                  name: 'BetweennessCentrality',
                  type: 'device',
                  value: 1,
                  isFault: true,
                  isEnergy: true,
                },
                {
                  name: 'LinkDistance',
                  type: 'device',
                  value: 1,
                  isFault: true,
                  isEnergy: false,
                },
                {
                  name: 'MaxFlowMinCut',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: true,
                },
                {
                  name: 'ShortestPaths',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: false,
                },
                {
                  name: 'SpanningTree',
                  type: 'device',
                  value: 1,
                  isFault: false,
                  isEnergy: false,
                },
              ],
            },
            {
              name: 'optimization',
              type: 'group',
              faultCount: 0,
              energyCount: 0,
              children: [
                {
                  name: 'AspectRatioBanker',
                  value: 1,
                  type: 'device',
                  isFault: false,
                  isEnergy: false,
                },
              ],
            },
          ],
        },
        {
          name: 'animate',
          faultCount: 1,
          energyCount: 1,
          type: 'group',
          children: [
            {
              name: 'Easing',
              value: 1,
              type: 'device',
              isFault: true,
              isEnergy: true,
            },
            {
              name: 'FunctionSequence',
              value: 1,
              type: 'device',
              isFault: false,
              isEnergy: false,
              children:[{
                name: 'FunctionSequence2',
                value: 1,
                type: 'param',
              },]
            },
          ],
        },
      ],
    };
  }
  render() {
    const {} = this.state;
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
