import React, { Component } from 'react';
import { Modal, Select } from 'antd';

interface OptionType {
  selected: string[];
  onChnage: (selected: string[]) => void;
}
interface StateType {
  show: boolean;
  selected: OptionType['selected'];
}
export default class CmdModal extends Component<any, StateType> {
  state = { show: false, selected: [] };
  option: OptionType = undefined;
  public show = (option: OptionType) => {
    this.option = option;
    this.setState({
      show: true,
      selected: option.selected,
    });
  };
  private handleOk = e => {
    const { selected } = this.state;
    this.option.onChnage(selected);
    this.handleCancel(e);
  };

  private handleCancel = e => {
    this.option = undefined;
    this.setState({
      show: false,
      selected: [],
    });
  };

  private handleChange = selected => {
    this.setState({
      selected,
    });
  };
  render() {
    const { show, selected } = this.state;
    return (
      <Modal
        title="custom命令管理"
        visible={show}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
      >
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="请输入命令"
          value={selected}
          onChange={this.handleChange}
        ></Select>
      </Modal>
    );
  }
}
