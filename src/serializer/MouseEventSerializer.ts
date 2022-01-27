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

type SerializedData = MouseEventInit & {
  clientX: number;
  clientY: number;
  type: string;
};

export class MouseEventSerializer extends SerializerBase<
  MouseEvent,
  SerializedData
> {
  private _domElement: false | HTMLIFrameElement = false;

  constructor(domElement: false | HTMLIFrameElement = false) {
    super();
    this._domElement = domElement;
  }

  get classToSerialize() {
    return MouseEvent;
  }

  serialize(e: MouseEvent) {
    const {x, y} = this._serializeClientXY(e.clientX, e.clientY);

    return {
      type: e.type,
      bubbles: e.bubbles,
      cancelable: e.cancelable,
      which: e.which,
      detail: e.detail,
      screenX: e.screenX,
      screenY: e.screenY,
      clientX: x,
      clientY: y,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      button: e.button,
      buttons: e.buttons,
      relatedTarget: e.relatedTarget,
      composed: e.composed,
      movementX: e.movementX,
      movementY: e.movementY,
    } as SerializedData;
  }

  deserialize(e: SerializedData) {
    const {x, y} = this._deserializeClientXY(e.clientX, e.clientY);

    e.clientX = x;
    e.clientY = y;

    e.view = window;

    return new MouseEvent(e.type, e);
  }

  private _serializeClientXY(xLeft: number, yTop: number) {
    if (this._domElement) {
      const rect = this._domElement.getBoundingClientRect();
      const style = window.getComputedStyle(this._domElement);
      const borderLeft = parseFloat(
        style.getPropertyValue('border-left-width').replace('px', '')
      );
      const borderTop = parseFloat(
        style.getPropertyValue('border-top-width').replace('px', '')
      );

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

  private _deserializeClientXY(xLeft: number, yTop: number) {
    if (this._domElement) {
      const rect = this._domElement.getBoundingClientRect();
      const style = window.getComputedStyle(this._domElement);
      const borderLeft = parseFloat(
        style.getPropertyValue('border-left-width').replace('px', '')
      );
      const borderTop = parseFloat(
        style.getPropertyValue('border-top-width').replace('px', '')
      );
      return {
        x: xLeft + rect.left + borderLeft,
        y: yTop + rect.top + borderTop,
      };
    } else {
      return {
        x: xLeft,
        y: yTop,
      };
    }
  }
}
