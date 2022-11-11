/*************************************************************************
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2021 Adobe
 *  All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/

import React, { ReactElement } from 'react';
import { Coriolis } from '@adobe/coriolis';
// import styles from './PreviewCanvas.module.scss';

type Props = {
  html: string;
  // width: string;
  // height?: string;
  coriolisUrl: string;
  // title: string;
  // borderRadius: string;
};

class CoriolisIframe extends React.Component<Props> {
  ref: React.RefObject<HTMLIFrameElement>;
  private coriolisIframeUrl: string;
  private coriolis: Coriolis | null = null;

  constructor(props: Props) {
    super(props);
    this.ref = React.createRef();
    this.coriolisIframeUrl = `${props.coriolisUrl}/${Coriolis.version}/index.html`;
  }

  componentDidMount(): void {
    this.coriolis = new Coriolis(this.ref.current as HTMLIFrameElement, this.coriolisIframeUrl, {
      autoConnect: false,
      contentModule: { initialContent: this.props.html, keepInitialCss: false },
    });
  }

  componentWillUnmount(): void {
    this.coriolis?.disconnect();
  }
  shouldComponentUpdate(nextProps: Props): boolean {
    if (nextProps.html && this.props.html !== nextProps.html) {
      this.coriolis?.content.replaceHtml(nextProps.html, { keepCss: false });
    }
    return false;
  }

  render(): ReactElement {
    return (
      <iframe
        ref={this.ref}
        src={this.coriolisIframeUrl}
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="origin"
        // className={styles.previewCanevasIframe}
      />
    );
  }
}
export default CoriolisIframe;
