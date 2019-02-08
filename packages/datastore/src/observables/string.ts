// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { IObservableString } from '@jupyterlab/observables';

import { ISignal, Signal } from '@phosphor/signaling';

import { TextField } from '@phosphor/datastore';

import { ObservableBase } from './base';

/**
 *
 */
export class ObservableString extends ObservableBase<TextField.Change>
  implements IObservableString {
  /**
   * The type of this object.
   */
  get type(): 'String' {
    return 'String';
  }

  /**
   * A signal emitted when the string has changed.
   */
  get changed(): ISignal<this, IObservableString.IChangedArgs> {
    return this._changed;
  }

  /**
   * The value of the string.
   */
  get text(): string | undefined {
    const record = this.ds.get(this.schema).get(this.recordID);
    return record ? (record[this.fieldId] as string) : undefined;
  }

  /**
   * Insert a substring.
   *
   * @param index - The starting index.
   *
   * @param text - The substring to insert.
   */
  insert(index: number, text: string): void {
    const table = this.ds.get(this.schema);
    this.ds.beginTransaction();
    try {
      table.update({
        [this.recordID]: {
          [this.fieldId]: {
            index,
            remove: 0,
            text
          }
        }
      } as any);
    } finally {
      this.ds.endTransaction();
    }
  }

  /**
   * Remove a substring.
   *
   * @param start - The starting index.
   *
   * @param end - The ending index.
   */
  remove(start: number, end: number): void {
    const table = this.ds.get(this.schema);
    this.ds.beginTransaction();
    try {
      table.update({
        [this.recordID]: {
          [this.fieldId]: {
            index: start,
            remove: end - start,
            text: ''
          }
        }
      } as any);
    } finally {
      this.ds.endTransaction();
    }
  }

  /**
   * Set the ObservableString to an empty string.
   */
  clear(): void {
    const table = this.ds.get(this.schema);
    const current = this.text;
    this.ds.beginTransaction();
    try {
      table.update({
        [this.recordID]: {
          [this.fieldId]: {
            index: 0,
            remove: current.length,
            text: ''
          }
        }
      } as any);
    } finally {
      this.ds.endTransaction();
    }
  }

  protected onChange(change: TextField.Change) {
    for (let c of change) {
      if (c.removed) {
        this._changed.emit({
          type: 'remove',
          start: c.index,
          end: c.index + c.removed.length,
          value: c.removed
        });
      }
      if (c.inserted) {
        this._changed.emit({
          type: 'insert',
          start: c.index,
          end: c.index,
          value: c.inserted
        });
      }
    }
  }

  private _changed = new Signal<this, IObservableString.IChangedArgs>(this);
}
