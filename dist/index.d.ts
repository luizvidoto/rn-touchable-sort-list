import { Component, ReactNode } from 'react';
import { PanResponderGestureState } from 'react-native';
import { LayoutType, RowLayout, DataTypeWise, ResolveReturnType } from './types';
interface TouchSortListProps<T> {
    data: T[];
    activeItem?: string;
    renderRow: (item: T, isActive: boolean, isTarget: boolean) => ReactNode;
    onOrderChange: (newData: T[]) => void;
    onItemActivation?: (item: T) => void;
}
interface TouchSortListState {
    totalHeight: number;
    target: RowLayout | null;
    prevTarget: RowLayout | null;
    rowsLayout: Record<string, RowLayout>;
    scrollEnabled: boolean;
}
declare class TouchSortList<T extends DataTypeWise> extends Component<TouchSortListProps<T>, TouchSortListState> {
    private _allLayoutPromises;
    private _allLayoutResolves;
    private _targetItem;
    constructor(props: TouchSortListProps<T>);
    componentDidMount(): void;
    componentDidUpdate(prevProps: TouchSortListProps<T>): void;
    reorderRows: (result: ResolveReturnType<T>[]) => void;
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
    onConfirmPosition: (_activeItem: T) => void;
}
export default TouchSortList;
