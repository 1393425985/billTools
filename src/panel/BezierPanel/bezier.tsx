import React, { Component, createRef } from 'react';
import { Select, Popover, Button, Input } from 'antd';

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
  private svgWrap = createRef<HTMLDivElement>();
  componentDidMount() {
    const { selectedItem } = this.state;
    this.svgManage = new SVGManage(this.svgWrap.current, {
      data: selectedItem.info,
    });
  }
  shouldComponentUpdate(){
    return false;
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
  private handleAdd = ev => {
    const offset = $(this.svgWrap.current).offset();
    const clientX = ev.clientX - offset.left;
    const clientY = ev.clientY - offset.top;
    this.svgManage.addPoint({
      x: clientX,
      y: clientY,
    });
  };
  render() {
    const {
      bezier: { list },
    } = this.props;
    const { selectedIndex, selectedItem } = this.state;
    return (
      <div className={styles.wrap}>
        <div className={styles.propWrap}>
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
        </div>
        <div
          ref={this.svgWrap}
          id="svgWrap"
          className={styles.svgWrap}
          onClick={this.handleAdd}
        ></div>
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
