import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, ScrollView, PanResponderGestureState } from 'react-native';
import TouchSortListRow from './row';
import { LayoutType, ResolveType, RowLayout, DataTypeWise, ResolveReturnType } from './types';
import { isEqual } from './utils';

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

const emptyLayout: LayoutType = { width: 0, height: 0, x: 0, y: 0 };

function createPromises<T extends DataTypeWise>(item: T, receiver: ResolveType<T>): Promise<ResolveReturnType<T>> {
  return new Promise((resolve, _reject) => {
    receiver[item.id] = props => {
      resolve(props);
    };
  });
}

class TouchSortList<T extends DataTypeWise> extends Component<TouchSortListProps<T>, TouchSortListState> {
  private _allLayoutPromises: Array<Promise<ResolveReturnType<T>>> = [];
  private _allLayoutResolves: ResolveType<T> = {};
  private _targetItem: RowLayout | null = null;

  constructor(props: TouchSortListProps<T>) {
    super(props);
    this._allLayoutResolves = {};
    this._allLayoutPromises = props.data.map(item => createPromises<T>(item, this._allLayoutResolves));

    this.state = {
      scrollEnabled: true,
      totalHeight: 0,
      target: null,
      prevTarget: null,
      rowsLayout: props.data.reduce(
        (p, n) => ({
          ...p,
          [n.id]: {
            id: n.id,
            order: n.order,
            currentOrder: n.order,
            boundaries: {
              top: 0,
              bottom: 0,
            },
            animateTo: null,
            layoutReady: false,
            layout: { ...emptyLayout },
          },
        }),
        {},
      ),
    };
  }

  componentDidMount() {
    Promise.all(this._allLayoutPromises)
      .then(this.reorderRows)
      .catch(err => console.error(err));
  }

  componentDidUpdate(prevProps: TouchSortListProps<T>) {
    if (!isEqual(prevProps.data, this.props.data)) {
      // console.log('MUDOU PROPS.DATA', this.props.data)
      const layoutsDone: Array<ResolveReturnType<T>> = [];
      this._allLayoutResolves = {};
      this._allLayoutPromises = [];

      this.props.data.forEach(item => {
        const rl = this.state.rowsLayout[item.id];
        if (rl && rl.layoutReady) {
          // existe ja
          layoutsDone.push({
            item,
            layout: { ...rl.layout, y: 0 },
          });
        } else {
          // fazer promise
          this._allLayoutPromises.push(createPromises<T>(item, this._allLayoutResolves));
        }
      });
      // this._allLayoutPromises = this.props.data
      // 	.filter(item => {
      // 		if (
      // 			this.state.rowsLayout[item.id] &&
      // 			this.state.rowsLayout[item.id].layoutReady
      // 		) {
      // 			return false
      // 		}
      // 		return true
      // 	})
      // 	.map(item => createPromises<T>(item, this._allLayoutResolves))

      // const layoutsDone = Object.keys(this.state.rowsLayout).map(key => {
      // 	const rl = this.state.rowsLayout[key]
      // 	if (rl.layoutReady) {
      // 		return {
      // 			item: this.props.data.find(x => x.id === rl.id),
      // 			layout: { ...rl.layout, y: 0 },
      // 		}
      // 	}
      // 	return undefined
      // })

      Promise.all(this._allLayoutPromises)
        .then(result => {
          this.reorderRows([...layoutsDone, ...result]);
        })
        .catch(err => console.error(err));
    }
  }

  reorderRows = (result: Array<ResolveReturnType<T>>) => {
    // console.log(' REORDER ROWS ', result)
    let totalY = 0;
    let totalHeight = 0;
    const rowsLayout = result
      .sort((a, b) => {
        if (a.item.order > b.item.order) {
          return 1;
        } else if (a.item.order < b.item.order) {
          return -1;
        } else {
          return 0;
        }
      })
      .map(
        ({ item, layout }): RowLayout => {
          totalHeight += layout.height;
          if (item.order !== 0) {
            totalY += layout.y + layout.height;
          }
          const hDiv = layout.height / 2;
          return {
            id: item.id,
            order: item.order,
            currentOrder: item.order,
            animateTo: null,
            layoutReady: true,
            boundaries: {
              bottom: totalY - hDiv,
              top: totalY + hDiv,
            },
            layout: {
              ...layout,
              y: totalY,
            },
          };
        },
      )
      .reduce((p, n) => ({ ...p, [n.id]: n }), {});
    // console.log('---- new row layout ----', rowsLayout)
    this.setState({ rowsLayout, totalHeight });
  };

  renderRow = ({ item, index }: { item: T; index: number }) => {
    const isTarget = this.state.target !== null && this.state.target.id === item.id;
    const rl = this.state.rowsLayout[item.id];
    const y = rl ? rl.layout.y : 0;
    const animateTo = rl ? rl.animateTo : null;

    return (
      <TouchSortListRow
        key={index}
        item={item}
        isTarget={isTarget}
        y={y}
        animateTo={animateTo}
        renderItem={isActive => this.props.renderRow(item, isActive, isTarget)}
        onItemActivation={() => this.onItemActivation(item)}
        enableScroll={this.enableScroll}
        disableScroll={this.disableScroll}
        onItemMove={g => this.onItemMove(item, g)}
        onLayout={layout => this.handleOnLayout(layout, item)}
        onConfirmPosition={this.onConfirmPosition}
      />
    );
  };

  render() {
    // console.log('RERENDER ********', this.state)

    return (
      <ScrollView scrollEnabled={this.state.scrollEnabled} style={styles.container}>
        {this.props.data.map((x, index) => {
          return this.renderRow({ item: x, index });
        })}
        <View style={{ height: this.state.totalHeight }} />
      </ScrollView>
    );
  }

  enableScroll = () => {
    this.setState({ scrollEnabled: true });
  };
  disableScroll = () => {
    this.setState({ scrollEnabled: false });
  };

  handleOnLayout = (layout: LayoutType, item: T) => {
    if (this._allLayoutResolves[item.id]) {
      this._allLayoutResolves[item.id]({ item, layout });
    }
  };
  onItemActivation = (item: T) => {
    if (this.props.onItemActivation) {
      this.props.onItemActivation(item);
    }
  };
  onItemMove = (item: T, gestureState: PanResponderGestureState) => {
    const { target, rowsLayout, totalHeight, prevTarget } = this.state;
    const activeRow = rowsLayout[item.id];
    // DY é em relação a posição 0
    const direction = gestureState.dy > 0 ? 'down' : 'up';

    // pegar o y do item atual e adicionar ou subtrair o deltaY para ver se está em cima de outro
    const deltaY = activeRow.layout.y + gestureState.dy;

    // QUANDO ITEM É ATIVADO, TARGET É O PRÓPRIO ESPACO EM QUE ESTÁ

    // se item for menor que 0 não precisa procurar o target
    // se item for maior que totalHeight tbm não
    // se item estiver fora das pontas, colocar null e depois procurar novo target
    if (target !== null) {
      if (
        (deltaY < target.boundaries.bottom && deltaY > 0) ||
        (deltaY > target.boundaries.top && deltaY < totalHeight - target.layout.height)
      ) {
        this.changeTarget(null);
        return false;
      }
    }

    if (target === null) {
      this.findTarget(deltaY, foundTarget => {
        if (foundTarget) {
          this.changeItemsOrder(activeRow, foundTarget, direction);
        }
      });
    }

    if (prevTarget) {
      if (
        (deltaY > prevTarget.boundaries.top && direction === 'up') ||
        (deltaY < prevTarget.boundaries.bottom && direction === 'down')
      ) {
        this.resetItemsOrder(activeRow, prevTarget);
      }
    }
  };
  findTarget = (deltaY: number, onChangeTarget: (target: RowLayout | null) => void) => {
    const { rowsLayout, totalHeight, target } = this.state;

    if ((deltaY < 0 && target) || (deltaY > totalHeight && target)) {
      return true;
    }

    const mapped = Object.keys(rowsLayout)
      .map(key => rowsLayout[key])
      .sort((a, b) => {
        if (a.order > b.order) {
          return 1;
        } else if (a.order < b.order) {
          return -1;
        } else {
          return 0;
        }
      });

    if (deltaY < 0) {
      this.changeTarget(mapped[0], onChangeTarget);
      return true;
    } else if (deltaY > totalHeight) {
      this.changeTarget(mapped[mapped.length - 1], onChangeTarget);
      return true;
    }

    return mapped.some(x => {
      if (deltaY > x.boundaries.bottom && deltaY < x.boundaries.top) {
        this.changeTarget(x, onChangeTarget);
        return true;
      }
      return false;
    });
  };
  changeTarget = (target: RowLayout | null, onChangeTarget?: (target: RowLayout | null) => void) => {
    this._targetItem = target;
    this.setState(
      prevState => ({ target, prevTarget: prevState.target }),
      () => {
        if (onChangeTarget) {
          onChangeTarget(target);
        }
      },
    );
  };
  changeItemsOrder = (activeItem: RowLayout, targetItem: RowLayout, direction: 'up' | 'down') => {
    // const animateTo =
    // 	direction === 'down' ? -targetItem.layout.height : targetItem.layout.height
    const animateTo = direction === 'down' ? 'up' : 'down';
    this.setState(prevState => {
      return {
        ...prevState,
        rowsLayout: {
          ...prevState.rowsLayout,
          [targetItem.id]: {
            ...prevState.rowsLayout[targetItem.id],
            currentOrder: direction === 'down' ? targetItem.order - 1 : targetItem.order + 1,
            animateTo,
          },
          [activeItem.id]: {
            ...prevState.rowsLayout[activeItem.id],
            currentOrder: targetItem.order,
            animateTo: null,
          },
        },
      };
    });
  };
  resetItemsOrder = (activeItem: RowLayout, targetItem: RowLayout) => {
    this.setState(prevState => ({
      rowsLayout: {
        ...prevState.rowsLayout,
        [targetItem.id]: {
          ...prevState.rowsLayout[targetItem.id],
          currentOrder: targetItem.order,
          animateTo: null,
        },
        [activeItem.id]: {
          ...prevState.rowsLayout[activeItem.id],
          currentOrder: prevState.rowsLayout[targetItem.id].currentOrder,
          animateTo: null,
        },
      },
    }));
  };

  onConfirmPosition = (_activeItem: T) => {
    type Mapped = Record<string, { id: string; order: number }>;
    const mapped: Mapped = Object.keys(this.state.rowsLayout)
      .map(key => {
        const rl = this.state.rowsLayout[key];
        return {
          id: rl.id,
          order: rl.currentOrder,
        };
      })
      .reduce((p, c) => ({ ...p, [c.id]: c }), {});
    const newData = this.props.data.map(item => {
      return Object.assign({}, item, { order: mapped[item.id].order });
    });
    this.setState({ target: null, prevTarget: null });
    this.props.onOrderChange(newData);
  };
}

type Styles = {
  container: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    position: 'relative',
  },
});

export default TouchSortList;

/*
{y: 0, width: 60, order: 0, b1: -30, b2: 30}
{y: 60, width: 60, order: 1, b1: 30, b2: 90}
{y: 120, width: 60, order: 2, b1: 90, b2: 150}
{y: 180...}
*/
