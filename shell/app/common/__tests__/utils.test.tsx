// Copyright (c) 2021 Terminus, Inc.
//
// This program is free software: you can use, redistribute, and/or modify
// it under the terms of the GNU Affero General Public License, version 3
// or later ("AGPL"), as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { isPromise, isImage, removeProtocol, ossImg, uuid, isValidJsonStr } from '../utils';
import { describe, it } from '@jest/globals';

describe('utils', () => {
  it('isImage ', () => {
    const suffixes = ['jpg', 'bmp', 'gif', 'png', 'jpeg', 'svg'];
    expect(isImage('images/a.doc')).toBe(false);
    suffixes.map(suffix => {
      expect(isImage(`images/a.${suffix}`)).toBe(true);
      expect(isImage(`images/a.${suffix.toUpperCase()}`)).toBe(true);
    });
  });
  it('isPromise', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise({ then: null })).toBe(false);
    expect(isPromise([])).toBe(false);
    expect(isPromise(null)).toBe(false);
  });
  it('removeProtocol', () => {
    expect(removeProtocol('http://www.erda.cloud')).toBe('//www.erda.cloud');
    expect(removeProtocol('www.erda.cloud')).toBe('www.erda.cloud');
  });
  it('ossImg', () => {
    expect(ossImg()).toBeUndefined();
    expect(ossImg(null)).toBeUndefined();
    expect(ossImg('http://oss.erda.cloud')).toBe('//oss.erda.cloud?x-oss-process=image/resize,w_200,h_200');
    expect(ossImg('http://oss.erda.cloud', {
      op: 'op',
      h: 100,
      w: 100,
    })).toBe('//oss.erda.cloud?x-oss-process=image/op,h_100,w_100');
  });
  it('isValidJsonStr', () => {
    expect(isValidJsonStr('')).toBe(true);
    expect(isValidJsonStr('erda')).toBe(false);
    expect(isValidJsonStr('{"name":"erda"}')).toBe(true);
  });
  it('uuid', () => {
    expect(uuid()).toHaveLength(20);
  });
});
