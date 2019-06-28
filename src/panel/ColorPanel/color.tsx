import React, { Component, createRef } from 'react';
import { Select, Popover, Button, Input } from 'antd';
import { ChromePicker, CirclePicker } from 'react-color';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import classnames from 'classnames';
import caclColor from '@utils/color';
import s, { IColorLess } from './color.less';

const { remote } = require('electron');
const { clipboard } = remote;

const styles = s as Partial<IColorLess>;
const primaryMinSaturation = 70; // 主色推荐最小饱和度
const primaryMinBrightness = 70; // 主色推荐最小亮度

interface ColorStateProps {
  color: ModelTypes.model['color'];
}
interface ColorDispatchProps {
  dispatch: Dispatch;
}
interface ColorOwnProps {}
type ColorModalProps = ColorStateProps & ColorDispatchProps & ColorOwnProps;

interface ColorModalState {
  selectedIndex: number;
  selectedItem: ColorTypes.colorItem;
  primaryColorInstance: {
    hsv: {
      s: number;
      v: number;
    };
  };
}
export class ColorModal extends Component<
  Partial<ColorModalProps>,
  ColorModalState
> {
  state = {
    selectedIndex: 0,
    selectedItem:
      this.props.color && this.props.color.list && this.props.color.list[0],
    primaryColorInstance: undefined,
  };
  colorNameIpt = createRef<Input>();
  componentDidUpdate() {
    const { selectedItem } = this.state;
    if (this.colorNameIpt.current && selectedItem) {
      this.colorNameIpt.current.input.value = selectedItem.name;
    }
  }
  onSelectedChange = selectedIndex => {
    const {
      color: { list },
    } = this.props;
    this.setState({
      selectedIndex,
      selectedItem: list[selectedIndex],
    });
  };
  onColorNameChange = e => {
    const { selectedItem, selectedIndex } = this.state;
    const newItem = Object.assign({}, selectedItem, {
      name: e.target.value ? e.target.value : `custom_${selectedIndex}`,
    });
    this.setState({
      selectedItem: newItem,
    });
  };
  onColorChange = color => {
    const { hex } = color;
    const { selectedItem } = this.state;
    const newItem = Object.assign({}, selectedItem, {
      color: hex,
    });
    this.setState({
      selectedItem: newItem,
      primaryColorInstance: color,
    });
  };
  onColorCopy = (color)=>{
    clipboard.writeText(color);
  }
  onSave = () => {
    const {
      dispatch,
      color: { list },
    } = this.props;
    const { selectedIndex, selectedItem } = this.state;
    const newList = list.concat();
    newList[selectedIndex] = selectedItem;
    dispatch({
      type: 'color/update',
      payload: {
        list: newList,
      },
    });
  };
  renderColorValidation() {
    const { primaryColorInstance } = this.state;
    let text = '';
    if (primaryColorInstance) {
      if (primaryColorInstance.hsv.s * 100 < primaryMinSaturation) {
        text += ` 饱和度建议不低于${primaryMinSaturation}（现在 ${(
          primaryColorInstance.hsv.s * 100
        ).toFixed(2)}）`;
      }
      if (primaryColorInstance.hsv.v * 100 < primaryMinBrightness) {
        text += ` 亮度建议不低于${primaryMinBrightness}（现在 ${(
          primaryColorInstance.hsv.v * 100
        ).toFixed(2)}）`;
      }
    }
    return <div className={styles.primaryColorText}>{text.trim()}</div>;
  }
  render() {
    const {
      color: { list },
    } = this.props;
    const { selectedIndex, selectedItem } = this.state;
    const colorList = list.map(v => v.color);
    return (
      <div className={styles.wrap}>
        <div className={styles.left}>
          <div className={styles.block}>
            <Select
              showSearch
              value={selectedIndex}
              style={{ width: 200 }}
              onChange={this.onSelectedChange}
              filterOption={(input, option) =>  option.props.children
                .toString()
                .toLowerCase()
                .indexOf(input.toLowerCase()) >= 0}
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
                    ref={this.colorNameIpt}
                    defaultValue={selectedItem.name}
                    placeholder="名称"
                    onBlur={this.onColorNameChange}
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
          </div>
          <div className={styles.block}>
            <CirclePicker
              color={selectedItem.color}
              width="100%"
              colors={colorList}
              onChangeComplete={c => {
                const index = colorList.findIndex(
                  v => v.toLocaleLowerCase() === c.hex,
                );
                this.onSelectedChange(index);
              }}
            />
          </div>
          <div className={styles.block}>
            {this.renderColorValidation()}
            <ChromePicker
              onChange={this.onColorChange}
              color={selectedItem.color}
            />
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.colorWrap}>
            {new Array(10).fill(0).map((v, i) => {
              const textColor = caclColor(selectedItem.color, i + 1);
              return (
                <div
                  key={`color_${i}`}
                  className={styles.colorItem}
                  style={{
                    background: textColor,
                    color: i < 5 ? '#314659' : '#fff',
                  }}
                  onClick={this.onColorCopy.bind(this, textColor)}
                >
                  {i + 1}
                  <div className={styles.colorHover}>{textColor}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}
export default connect<ColorStateProps, ColorDispatchProps, ColorOwnProps>(
  (state: ModelTypes.model) => ({
    color: state.color,
  }),
  null,
  null,
  { forwardRef: true },
)(ColorModal);
