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

import React, { useEffect, useRef } from 'react';
import { Coriolis } from '@adobe/coriolis';

type Props = {
  html?: string;
  coriolisUrl: string;
  setRef?: (coriolis: Coriolis) => void;
};

const CoriolisIframe = ({html, coriolisUrl, setRef}: Props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const coriolisRef = useRef<Coriolis>();

  useEffect(() => {
    if (coriolisRef.current) {
      coriolisRef.current?.connect();
      return;
    }

    coriolisRef.current = new Coriolis(iframeRef.current as HTMLIFrameElement, coriolisUrl, {
      autoConnect: false,
      contentModule: { initialContent: html, keepInitialCss: true },
    });
    if (setRef) {
      setRef(coriolisRef.current);
    }
    return () => {
      coriolisRef.current?.disconnect();
    }
  }, []);

  useEffect(() => {
    if (html) {
      coriolisRef.current?.content.replaceHtml(html, { keepCss: false });
    }
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      src={coriolisUrl}
      sandbox="allow-scripts allow-same-origin"
      referrerPolicy="origin"
      width='100%'
      height='100%'
      title='Iframe'
      // className={styles.previewCanevasIframe}
    />
  );
}
export default CoriolisIframe;
