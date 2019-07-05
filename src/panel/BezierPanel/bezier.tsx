import React, { Component, createRef } from 'react';
import { Select, Popover, Button, Input, Table, InputNumber } from 'antd';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import $ from 'jquery';
import SVGManage from './svg';
import s, { IBezierLess } from './bezier.less';

const { remote } = require('electron');
const { clipboard } = remote;

const styles = s as Partial<IBezierLess>;

interface BezierStateProps {
  bezier: BezierTypes.model;
}
interface BezierDispatchProps {
  dispatch: Dispatch;
}
interface BezierOwnProps {}
type BezierModalProps = BezierStateProps & BezierDispatchProps & BezierOwnProps;

interface BezierModalState {
  selectedIndex: number;
  selectedItem: BezierTypes.bezierItem;
}
export class BezierModal extends Component<
  Partial<BezierModalProps>,
  BezierModalState
> {
  state = {
    selectedIndex: 0,
    selectedItem:
      this.props.bezier && this.props.bezier.list && this.props.bezier.list[0],
  };
  private svgManage: SVGManage;
  private svgWrap = createRef<SVGSVGElement>();
  private nameIpt = createRef<Input>();
  componentDidMount() {
    const { selectedItem } = this.state;
    this.svgManage = new SVGManage(this.svgWrap.current, {
      data: selectedItem.info,
      onChange: this.onPointsChange,
    });
  }
  componentDidUpdate(prvProps, preState) {
    if (preState.selectedIndex !== this.state.selectedIndex) {
      this.svgManage.destroy();
      this.svgManage = new SVGManage(this.svgWrap.current, {
        data: this.state.selectedItem.info,
        onChange: this.onPointsChange,
      });
    }
  }
  private onSelectedChange = selectedIndex => {
    const {
      bezier: { list },
    } = this.props;
    this.setState({
      selectedIndex,
      selectedItem: list[selectedIndex],
    });
  };
  private onNameChange = e => {
    const { selectedItem, selectedIndex } = this.state;
    const newItem = Object.assign({}, selectedItem, {
      name: e.target.value ? e.target.value : `custom_${selectedIndex}`,
    });
    this.setState({
      selectedItem: newItem,
    });
  };
  private onPointsChange = o => {
    const { selectedItem } = this.state;
    const infos = o.data.concat();
    const newItem = Object.assign({}, selectedItem, {
      info: infos,
    });
    this.setState({
      selectedItem: newItem,
    });
  };
  private onSave = () => {
    const {
      dispatch,
      bezier: { list },
    } = this.props;
    const { selectedIndex, selectedItem } = this.state;
    const newList = list.concat();
    newList[selectedIndex] = selectedItem;
    dispatch({
      type: 'bezier/update',
      payload: {
        list: newList,
      },
    });
  };
  private onStart = ()=>{
    this.svgManage.run();
  }
  private handleAdd = ev => {
    const offset = $(this.svgWrap.current).offset();
    const clientX = Number((ev.clientX - offset.left).toFixed(0));
    const clientY = Number((ev.clientY - offset.top).toFixed(0));
    this.svgManage.addPoint({
      x: clientX,
      y: clientY,
    });
  };
  private handleUpdate = (key, index, value) => {
    this.svgManage.updatePoint(index, key, value);
  };
  private handleDelete = index => {
    this.svgManage.deletePoint(index);
  };
  render() {
    const {
      bezier: { list },
    } = this.props;
    const { selectedIndex, selectedItem } = this.state;
    return (
      <div className={styles.wrap}>
        <div className={styles.propWrap}>
          <div className={styles.tools}>
            <Select
              showSearch
              value={selectedIndex}
              style={{ width: 200 }}
              onChange={this.onSelectedChange}
              filterOption={(input, option) =>
                option.props.children
                  .toString()
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {list.map((v, i) => (
                <Select.Option key={`main_${i}`} value={i}>
                  {v.name}
                </Select.Option>
              ))}
            </Select>
            <Popover
              placement="bottomRight"
              content={
                <div>
                  <Input
                    ref={this.nameIpt}
                    defaultValue={selectedItem.name}
                    placeholder="名称"
                    onBlur={this.onNameChange}
                  />
                </div>
              }
              title="名称"
            >
              <Button
                type="primary"
                icon="save"
                title="保存"
                onClick={this.onSave}
                style={{
                  marginLeft: '4px',
                }}
              />
            </Popover>
            <Button
                type="primary"
                icon="step-forward"
                title="开始"
                onClick={this.onStart}
                style={{
                  marginLeft: '4px',
                }}
                disabled={selectedItem.info.length<3}
              />
          </div>
          <div className={styles.listWrap}>
            <Table
              showHeader={false}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'x',
                  dataIndex: 'x',
                  key: 'x',
                  render: (text, { key }) => {
                    return (
                      <div>
                        x:
                        <InputNumber
                          min={0}
                          value={text}
                          step={1}
                          onChange={this.handleUpdate.bind(this, 'x', key)}
                        />
                      </div>
                    );
                  },
                },
                {
                  title: 'y',
                  dataIndex: 'y',
                  key: 'y',
                  render: (text, { key }) => {
                    return (
                      <div>
                        y:
                        <InputNumber
                          min={0}
                          value={text}
                          step={1}
                          onChange={this.handleUpdate.bind(this, 'y', key)}
                        />
                      </div>
                    );
                  },
                },
                {
                  title: 'Action',
                  key: 'key',
                  dataIndex: 'key',
                  width: 100,
                  render: (text, { key }) => (
                    <span>
                      <Button.Group>
                        <Button
                          type="primary"
                          icon="delete"
                          title="删除"
                          onClick={this.handleDelete.bind(this, key)}
                        />
                      </Button.Group>
                    </span>
                  ),
                },
              ]}
              dataSource={selectedItem.info.map((v, i) =>
                Object.assign({}, v, {
                  key: i,
                }),
              )}
            />
          </div>
        </div>
        <div className={styles.svgWrap} onClick={this.handleAdd}>
          <svg ref={this.svgWrap}></svg>
        </div>
      </div>
    );
  }
}
export default connect<BezierStateProps, BezierDispatchProps, BezierOwnProps>(
  (state: ModelTypes.model) => ({
    bezier: state.bezier,
  }),
  null,
  null,
  { forwardRef: true },
)(BezierModal);
