import React, { Component } from 'react';
import { Modal, Button, Input } from 'antd';
import { writeFile, getFile } from '@utils/utils';
import s, { IShowModalLess } from './showModal.less';
const { remote } = require('electron');
const path = require('path');
const { dialog,shell } = remote;
const { TextArea } = Input;
const styles = s as Partial<IShowModalLess>;
const defaultOption = {
  en: {},
  zh: {},
};
export default class ShowModal extends Component<
  { filePath: string },
  { show: boolean }
> {
  state = {
    show: false,
  };
  option = defaultOption;
  public show(option: Partial<typeof defaultOption>) {
    Object.assign(this.option, option);
    this.setState({
      show: true,
    });
  }
  public hide = () => {
    this.setState({
      show: false,
    });
  };
  private handleExport = () => {
    const { filePath } = this.props;
    let dirPath;
    if (filePath) {
      dirPath = path.dirname(path.normalize(filePath));
    }
    dialog.showOpenDialog(
      {
        defaultPath: dirPath,
        properties: ['openDirectory'],
      },
      fileNames => {
        const { zh, en } = this.option;
        const exportI18n = () => [
          writeFile(
            path.join(fileNames[0], 'zh.js'),
            'export default ' + JSON.stringify(zh, null, 4),
          ),
          writeFile(
            path.join(fileNames[0], 'en.js'),
            'export default ' + JSON.stringify(en, null, 4),
          ),
        ];
        let promise: Promise<boolean[]>;
        if (filePath) {
          promise = new Promise((resolve)=>{
            getFile(filePath).then(rs => {
              let newJs = rs;
              for (let k in zh) {
                newJs = newJs.replace(new RegExp(`${zh[k]}`,'g'), `i18n.${k}`);
              }
              Promise.all([
                writeFile(
                  path.join(fileNames[0], path.basename(filePath)),
                  newJs,
                ),
                ...exportI18n(),
              ]).then(resolve);
            });
          });
        } else {
          promise = Promise.all(exportI18n());
        }
        promise.then(() => {
          shell.showItemInFolder(path.join(fileNames[0],'zh.js'));
          this.hide();
        });
      },
    );
  };
  render() {
    const { show } = this.state;
    const { zh, en } = this.option;
    return (
      <Modal
        visible={show}
        title="I18N"
        onCancel={this.hide}
        width="80vw"
        footer={[
          <Button key="back" onClick={this.hide}>
            返回
          </Button>,
          <Button key="submit" type="primary" onClick={this.handleExport}>
            生成文件
          </Button>,
        ]}
      >
        <div className={styles.wrap}>
          <div>
            <TextArea
              value={JSON.stringify(zh, null, 4)}
              style={{ height: '100%' }}
            />
          </div>
          <div>
            <TextArea
              value={JSON.stringify(en, null, 4)}
              style={{ height: '100%' }}
            />
          </div>
        </div>
      </Modal>
    );
  }
}
