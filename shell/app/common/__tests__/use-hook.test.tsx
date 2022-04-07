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
import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { fireEvent, render } from '@testing-library/react';
import { createBrowserHistory } from 'history';
import { setConfig } from 'core/config';
import { useDiff, useFormModal, useSwitch, useUpdate, useUpdateSearch } from '../use-hooks';

describe('use-hooks', () => {
  describe('useSwitch', () => {
    const setUp = (init: boolean) => renderHook(() => useSwitch(init));
    it('should be defined', () => {
      expect(useSwitch).toBeDefined();
    });
    it('should work well', () => {
      const { result } = setUp(true);
      const [bool, on, off, toggle] = result.current;
      expect(bool).toEqual(true);
      act(() => {
        off();
      });
      expect(result.current[0]).toEqual(false);
      act(() => {
        on();
      });
      expect(result.current[0]).toEqual(true);
      act(() => {
        toggle();
      });
      expect(result.current[0]).toEqual(false);
    });
  });

  describe('useFormModal', () => {
    it('should work well', () => {
      const FormComp = (props) => {
        return props.visible ? (
          <div>
            <button onClick={props.onCancel}>cancel</button>
          </div>
        ) : null;
      };
      const Comp = () => {
        const [Modal, toggle] = useFormModal({ visible: false, Form: FormComp });
        return (
          <div>
            <button onClick={toggle}>toggle</button>
            <button
              onClick={() => {
                toggle(true);
              }}
            >
              open
            </button>
            <Modal />
          </div>
        );
      };
      const result = render(<Comp />);
      fireEvent.click(result.getByText('open'));
      expect(result.queryByText('cancel')).toBeTruthy();
      fireEvent.click(result.getByText('cancel'));
      expect(result.queryByText('cancel')).toBeFalsy();
      fireEvent.click(result.getByText('toggle'));
      expect(result.queryByText('cancel')).toBeTruthy();
      fireEvent.click(result.getByText('toggle'));
      expect(result.queryByText('cancel')).toBeFalsy();
    });
  });

  describe('useDiff', () => {
    it('should work well', () => {
      let var1 = 0;
      let var2 = '0';
      const var3 = { value: 0 };
      const hook = renderHook(() => useDiff([var1, var2, var3], ['var1', 'var2', 'var3']));
      var1++;
      var2 = '1';
      hook.rerender();
    });
  });

  describe('useUpdate', () => {
    it('should work well', () => {
      const initialProps = {
        name: 'erda-fe',
        org: 'erda',
      };
      const hook = renderHook((props) => useUpdate(props), {
        initialProps,
      });
      const [, updater, update, reset] = hook.result.current;
      expect(typeof updater.name).toBe('function');
      expect(typeof update).toBe('function');
      expect(typeof reset).toBe('function');
      expect(hook.result.current[0]).toStrictEqual({
        ...initialProps,
      });
      act(() => {
        updater.name('erda cloud');
      });
      expect(hook.result.current[0]).toStrictEqual({
        ...initialProps,
        name: 'erda cloud',
      });
      act(() => {
        updater.name((prev: string) => prev.toUpperCase());
      });
      expect(hook.result.current[0]).toStrictEqual({
        ...initialProps,
        name: 'ERDA CLOUD',
      });
      act(() => {
        update({
          org: 'ERDA',
        });
      });
      expect(hook.result.current[0]).toStrictEqual({
        name: 'ERDA CLOUD',
        org: 'ERDA',
      });
      act(() => {
        update((prevState) => {
          return {
            ...prevState,
            ...initialProps,
            org: 'erda',
          };
        });
      });
      expect(hook.result.current[0]).toStrictEqual({
        ...initialProps,
        org: 'erda',
      });
      act(() => {
        reset();
      });
      expect(hook.result.current[0]).toStrictEqual({
        ...initialProps,
      });
    });
  });

  describe('useUpdateSearch', () => {
    it('should work well', () => {
      const reload = jest.fn();
      const browserHistory = createBrowserHistory();
      setConfig('history', browserHistory);

      const setUp = (reloadFun: (_q?: Obj) => void) => renderHook(() => useUpdateSearch({ reload: reloadFun }));
      const setUpObj = setUp(reload);
      const { result } = setUpObj;
      const [curQuery, setQuery] = result.current;
      expect(curQuery).toEqual({});
      act(() => setQuery({ name: 'a' }));
      expect(result.current[0]).toEqual({ name: 'a' });

      setConfig('history', undefined);
    });
  });
});
