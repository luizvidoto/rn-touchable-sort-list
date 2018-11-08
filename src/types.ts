import { PanResponderGestureState } from 'react-native';

export interface Location {
  x: number;
  y: number;
}

export type onEventType = (e: any, gestureState: PanResponderGestureState, location: Location) => void;

export type LayoutType = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutEventType = {
  nativeEvent: { layout: LayoutType };
};

export interface DataTypeWise {
  id: string;
  order: number;
}
export interface ResolveReturnType<T> {
  item: T;
  layout: LayoutType;
}
export interface RowLayout {
  id: string;
  layoutReady: boolean;
  order: number;
  boundaries: { top: number; bottom: number };
  layout: LayoutType;
  animateTo: 'up' | 'down' | null;
  currentOrder: number | null;
}

export type ResolveType<T> = (value?: T | undefined | PromiseLike<T>) => void;
