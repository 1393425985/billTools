import React, { useState, useRef } from 'react';
import {
  Button,
  Breadcrumb,
  Tooltip,
  Input,
} from 'antd';
import { getFile } from '@utils/utils';
import { apiTransfer } from '@services/api';
import ShowModal from './showModal';
import s, { ITransferLess } from './transfer.less';
const { remote } = require('electron');
const path = require('path');
const { dialog } = remote;

const styles = s as Partial<ITransferLess>;
export default function() {
  const [filePath, setFilePath] = useState(undefined as string);
  const [list, setList] = useState([] as string[][]);
  const [text, setText] = useState('');
  const SModal = useRef<ShowModal>(null);
  const transferMap: { [key: string]: string } = list.reduce(
    (l, v) => Object.assign(l, { [v[0]]: v[1] }),
    {},
  );
  const onSetPath = () => {
    dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [{ name: 'All Files', extensions: ['*'] }],
      },
      fileNames => {
        if (fileNames) {
          setFilePath(fileNames[0]);
          setList([]);
          setText('');
        }
      },
    );
  };

  const onAddList = async (text: string, des?: string) => {
    const value = text;
    const item = [value, transferMap[value], des || value];
    setList(plist => {
      return plist.concat([item]);
    });
    setText('');
    if (item[1] === undefined) {
      return apiTransfer(value).then(rs => {
        transferMap[value] = rs.translateResult[0][0].tgt;
        return {
          src: value,
          tgt: transferMap[value],
        };
      });
    } else {
      return {
        src: value,
        tgt: transferMap[value],
      };
    }
  };
  const onDeleteList = (index: number) => {
    setList(plist => {
      const newList = plist.concat();
      newList.splice(index, 1);
      return newList;
    });
  };
  const onChangeLowUp = (index: number) => {
    setList(plist => {
      const newList = plist.concat();
      const font = newList[index][1][0];
      const fontOther = newList[index][1].slice(1);
      const fontUp = font.toLocaleUpperCase();
      const fontDown = font.toLocaleLowerCase();
      if (fontUp === font) {
        newList[index][1] = fontDown + fontOther;
      } else {
        newList[index][1] = fontUp + fontOther;
      }
      return newList;
    });
  };
  const onEditList = (index: number, e) => {
    const { value } = e.target;
    setList(plist => {
      const newList = plist.concat();
      newList[index][1] = value;
      return newList;
    });
  };
  const onStart = () => {
    getFile(filePath).then(str => {
      const arr = str.match(/([\u4e00-\u9fa5]+[\u4e00-\u9fa5,，.。!！？?]*[\u4e00-\u9fa5.。!！？?]*)/g);
      Promise.all(
        arr.map(v => {
          const re = new RegExp(`.*${v}.*`,'g');
          const desArr = str.match(re);
          return onAddList(v, desArr && desArr[0]);
        }),
      ).then(rs => {
        setList(plist => {
          return plist.map(v => [v[0], transferMap[v[0]], v[2]]);
        });
      });
    });
  };
  const onCreate = () => {
    const en = {};
    const zh = {};
    list.forEach(arr => {
      const nameArr = arr[1].toLocaleUpperCase().split(' ');
      let name;
      if(nameArr.length>5 && !(nameArr.slice(0,5).join('_') in zh)){
        name = nameArr.slice(0,5).join('_');
      }else{
        name = nameArr.join('_');
      }
      name = name.replace(/[\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,"");
      zh[name] = arr[0];
      en[name] = arr[1];
    });
    SModal.current.show({
      en,
      zh,
    });
  };
  const pathArr = filePath ? path.normalize(filePath).split(path.sep) : [];
  return (
    <div className={styles.wrap}>
      <div className={styles.pathWrap}>
        <div>
          {pathArr.length ? (
            <Breadcrumb>
              {pathArr.map((v, i) => (
                <Breadcrumb.Item key={`path_${i}`}>
                  <span className={styles.pathText}>{v}</span>
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          ) : (
            '请先设置文件路径'
          )}
        </div>
        <div>
          <Button type="primary" onClick={onSetPath}>
            设置
          </Button>
          <Button type="primary" disabled={!pathArr.length} onClick={onStart}>
            解析
          </Button>
        </div>
      </div>
      <div className={styles.body}>
        <Input
          placeholder="手动添加文本"
          value={text}
          onChange={e => {
            setText(e.target.value);
          }}
          onPressEnter={() => {
            onAddList(text).then(() => {
              setList(plist => {
                return plist.map(v => [v[0], transferMap[v[0]], v[2]]);
              });
            });
          }}
          allowClear
        />
        <div className={styles.list}>
          {list.map((v, i) => {
            const index = v[2].indexOf(v[0]);
            const beforeStr = v[2].substr(0, index);
            const afterStr = v[2].substr(index + v[0].length);
            const title =
              index > -1 ? (
                <span>
                  {beforeStr}
                  <span style={{ color: '#f50' }}>{v[0]}</span>
                  {afterStr}
                </span>
              ) : (
                <span>{v[2]}</span>
              );
            return (
              <div key={i} className={styles.item}>
                <Tooltip title={title}>
                  <div>{v[0]}</div>
                </Tooltip>

                <div>
                  <Button
                    type="primary"
                    icon="delete"
                    title="删除"
                    onClick={onDeleteList.bind(this, i)}
                  ></Button>
                </div>
                <div>
                  <Input
                    value={v[1] === undefined ? '翻译中' : v[1]}
                    onChange={onEditList.bind(this, i)}
                  />
                  <Button
                    type="primary"
                    icon="font-size"
                    title="切换大小写"
                    disabled={!v[1]}
                    onClick={onChangeLowUp.bind(this, i)}
                  ></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.foot}>
        <div></div>
        <div>
          <Button type="primary" onClick={onCreate}>
            生成
          </Button>
        </div>
      </div>
      <ShowModal ref={SModal} filePath={filePath} />
    </div>
  );
}
