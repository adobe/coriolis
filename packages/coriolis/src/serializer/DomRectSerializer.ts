/*
 * Copyright 2017 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * @module Serializer
 */

import {SerializerBase} from '../SerializerBase';

type SerializedData = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export class DomRectSerializer extends SerializerBase<DOMRect, SerializedData> {
  private _domElement:
    | false
    | HTMLIFrameElement
    | (() => HTMLIFrameElement | false);
  private _target: HTMLElement;

  constructor(
    domElement:
      | false
      | HTMLIFrameElement
      | (() => HTMLIFrameElement | false) = false,
    target = window.document.body,
  ) {
    super();
    this._domElement = domElement;
    this._target = target;
  }

  get classToSerialize() {
    return window.DOMRect;
  }

  serialize(clientRect: DOMRect) {
    const {x, y} = this._serializeXY(clientRect.left, clientRect.top);

    return {
      left: x,
      top: y,
      width: clientRect.width,
      height: clientRect.height,
    };
  }

  deserialize(clientRect: SerializedData) {
    const {x, y} = this._deserializeXY(clientRect.left, clientRect.top);

    return {
      left: x,
      top: y,
      right: x + clientRect.width,
      bottom: y + clientRect.height,
      width: clientRect.width,
      height: clientRect.height,
    } as DOMRect;
  }

  private _serializeXY(xLeft: number, yTop: number) {
    const domElement =
      this._domElement instanceof Function
        ? this._domElement()
        : this._domElement;
    if (domElement) {
      const rect = domElement.getBoundingClientRect();
      let borderLeft = 0;
      let borderTop = 0;
      if (domElement.ownerDocument?.defaultView) {
        const style =
          domElement.ownerDocument.defaultView.getComputedStyle(domElement);
        borderLeft = parseFloat(
          style.getPropertyValue('border-left-width').replace('px', ''),
        );
        borderTop = parseFloat(
          style.getPropertyValue('border-top-width').replace('px', ''),
        );
      }

      return {
        x: xLeft - rect.left - borderLeft,
        y: yTop - rect.top - borderTop,
      };
    } else {
      return {
        x: xLeft,
        y: yTop,
      };
    }
  }

  private _deserializeXY(xLeft: number, yTop: number) {
    const bodyRect = this._target.getBoundingClientRect();
    let bodyBorderLeft = 0;
    let bodyBorderTop = 0;
    if (this._target.ownerDocument?.defaultView) {
      const bodyStyle = this._target.ownerDocument.defaultView.getComputedStyle(
        this._target,
      );
      bodyBorderLeft = parseFloat(
        bodyStyle.getPropertyValue('border-left-width').replace('px', ''),
      );
      bodyBorderTop = parseFloat(
        bodyStyle.getPropertyValue('border-top-width').replace('px', ''),
      );
    }

    const domElement =
      this._domElement instanceof Function
        ? this._domElement()
        : this._domElement;

    if (domElement) {
      const iframeRect = domElement.getBoundingClientRect();
      let iframeBorderLeft = 0;
      let iframeBorderTop = 0;
      if (domElement.ownerDocument?.defaultView) {
        const ifraneStyle =
          domElement.ownerDocument.defaultView.getComputedStyle(domElement);
        iframeBorderLeft = parseFloat(
          ifraneStyle.getPropertyValue('border-left-width').replace('px', ''),
        );
        iframeBorderTop = parseFloat(
          ifraneStyle.getPropertyValue('border-top-width').replace('px', ''),
        );
      }

      return {
        x:
          xLeft +
          iframeRect.left +
          iframeBorderLeft -
          bodyRect.left -
          bodyBorderLeft,
        y:
          yTop +
          iframeRect.top +
          iframeBorderTop -
          bodyRect.top -
          bodyBorderTop,
      };
    } else {
      return {
        x: xLeft - bodyBorderLeft - bodyRect.left,
        y: yTop - bodyBorderTop - bodyRect.top,
      };
    }
  }
}
