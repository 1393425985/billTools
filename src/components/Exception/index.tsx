import React, { createElement } from 'react';
import classNames from 'classnames';
import { Button } from 'antd';
import config from './typeConfig';
import s, { IIndexLess } from './index.less';
const styles = s as Partial<IIndexLess>;
export interface IExceptionProps {
  type?: '403' | '404' | '500';
  title?: React.ReactNode;
  desc?: React.ReactNode;
  img?: string;
  actions?: React.ReactNode;
  linkElement?:
    | string
    | React.FunctionComponent<{ to: string; href: string }>
    | React.ComponentClass<{ to: string; href: string }, any>;
  style?: React.CSSProperties;
  className?: string;
}

export default function(props: IExceptionProps) {
  const {
    className,
    linkElement = 'a',
    type,
    title,
    desc,
    img,
    actions,
    ...rest
  } = props;
  const pageType = type in config ? type : '404';
  const clsString = classNames(styles.exception, className);
  return (
    <div className={clsString} {...rest}>
      <div className={styles.imgBlock}>
        <div
          className={styles.imgEle}
          style={{ backgroundImage: `url(${img || config[pageType].img})` }}
        />
      </div>
      <div className={styles.content}>
        <h1>{title || config[pageType].title}</h1>
        <div className={styles.desc}>{desc || config[pageType].desc}</div>
        <div className={styles.actions}>
          {actions ||
            createElement(
              linkElement,
              {
                to: '/',
                href: '/',
              },
              <Button type="primary">返回首页</Button>,
            )}
        </div>
      </div>
    </div>
  );
}
