import React from "react";
import { PanResponderGestureState } from "react-native";
import { DataTypeWise, LayoutEventType, LayoutType } from "./types";
declare type TouchableSortListRowProps<T> = {
    item: T;
    animateTo: "up" | "down" | null;
    isTarget: boolean;
    y: number;
    renderItem: (isActive: boolean) => React.ReactNode;
    disableScroll: () => void;
    enableScroll: () => void;
    onLayout: (layout: LayoutType) => void;
    onItemMove: (gestureState: PanResponderGestureState) => void;
    onConfirmPosition: (item: T) => void;
} & typeof defaultProps;
interface TouchableSortListRowState {
    isActive: boolean;
}
declare const defaultProps: {
    onItemActivation: () => void;
    animateTo: "up" | "down" | null;
};
declare class TouchableSortListRow<T extends DataTypeWise> extends React.Component<TouchableSortListRowProps<T>, TouchableSortListRowState> {
    static defaultProps: {
        onItemActivation: () => void;
        animateTo: "up" | "down" | null;
    };
    private _layout;
    private _panResponder;
    private _longPressTimer;
    private _translateAnim;
    constructor(props: TouchableSortListRowProps<T>);
    shouldComponentUpdate(nextProps: TouchableSortListRowProps<T>, nextState: TouchableSortListRowState): boolean;
    componentDidUpdate(prevProps: TouchableSortListRowProps<T>): void;
    resetPositionAnimation: (callback?: (() => void) | undefined) => void;
    cancelLongPress: () => void;
    activateItem: () => void;
    deactivateItem: () => void;
    confirmPosition: () => void;
    onLayout: (e: LayoutEventType) => void;
    render(): JSX.Element;
}
export default TouchableSortListRow;
