import { Component, ReactNode } from 'react';
import { PanResponderGestureState } from 'react-native';
import { LayoutType, RowLayout, DataTypeWise } from './types';
interface TouchableSortListProps<T> {
    data: T[];
    activeItem?: string;
    renderRow: (item: T, isActive: boolean, isTarget: boolean) => ReactNode;
    onOrderChange: (newData: T[]) => void;
    onItemActivation?: (item: T) => void;
}
interface TouchableSortListState {
    totalHeight: number;
    target: RowLayout | null;
    prevTarget: RowLayout | null;
    rowsLayout: Record<string, RowLayout>;
    scrollEnabled: boolean;
}
export default class TouchableSortList<T extends DataTypeWise> extends Component<TouchableSortListProps<T>, TouchableSortListState> {
    private _allLayoutPromises;
    private _allLayoutResolves;
    private _targetItem;
    constructor(props: TouchableSortListProps<T>);
    componentDidMount(): void;
    componentDidUpdate(prevProps: TouchableSortListProps<T>): void;
    reorderRows: (result: {
        item: T;
        layout: LayoutType;
    }[]) => void;
    renderRow: ({ item, index }: {
        item: T;
        index: number;
    }) => JSX.Element;
    render(): JSX.Element;
    enableScroll: () => void;
    disableScroll: () => void;
    handleOnLayout: (layout: LayoutType, item: T) => void;
    onItemActivation: (item: T) => void;
    onItemMove: (item: T, gestureState: PanResponderGestureState) => false | undefined;
    findTarget: (deltaY: number, onChangeTarget: (target: RowLayout | null) => void) => boolean;
    changeTarget: (target: RowLayout | null, onChangeTarget?: ((target: RowLayout | null) => void) | undefined) => void;
    changeItemsOrder: (activeItem: RowLayout, targetItem: RowLayout, direction: "up" | "down") => void;
    resetItemsOrder: (activeItem: RowLayout, targetItem: RowLayout) => void;
    onConfirmPosition: (activeItem: T) => void;
}
export {};
