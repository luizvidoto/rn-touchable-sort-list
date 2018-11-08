import React, { Component } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import TouchSortListRow from './row';
import { isEqual } from './utils';
const emptyLayout = { width: 0, height: 0, x: 0, y: 0 };
function createPromises(item, receiver) {
    return new Promise((resolve, _reject) => {
        receiver[item.id] = props => {
            resolve(props);
        };
    });
}
class TouchSortList extends Component {
    constructor(props) {
        super(props);
        this._allLayoutPromises = [];
        this._allLayoutResolves = {};
        this._targetItem = null;
        this.reorderRows = (result) => {
            // console.log(' REORDER ROWS ', result)
            let totalY = 0;
            let totalHeight = 0;
            const rowsLayout = result
                .sort((a, b) => {
                if (a.item.order > b.item.order) {
                    return 1;
                }
                else if (a.item.order < b.item.order) {
                    return -1;
                }
                else {
                    return 0;
                }
            })
                .map(({ item, layout }) => {
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
                    layout: Object.assign({}, layout, { y: totalY }),
                };
            })
                .reduce((p, n) => (Object.assign({}, p, { [n.id]: n })), {});
            // console.log('---- new row layout ----', rowsLayout)
            this.setState({ rowsLayout, totalHeight });
        };
        this.renderRow = ({ item, index }) => {
            const isTarget = this.state.target !== null && this.state.target.id === item.id;
            const rl = this.state.rowsLayout[item.id];
            const y = rl ? rl.layout.y : 0;
            const animateTo = rl ? rl.animateTo : null;
            return (React.createElement(TouchSortListRow, { key: index, item: item, isTarget: isTarget, y: y, animateTo: animateTo, renderItem: isActive => this.props.renderRow(item, isActive, isTarget), onItemActivation: () => this.onItemActivation(item), enableScroll: this.enableScroll, disableScroll: this.disableScroll, onItemMove: g => this.onItemMove(item, g), onLayout: layout => this.handleOnLayout(layout, item), onConfirmPosition: this.onConfirmPosition }));
        };
        this.enableScroll = () => {
            this.setState({ scrollEnabled: true });
        };
        this.disableScroll = () => {
            this.setState({ scrollEnabled: false });
        };
        this.handleOnLayout = (layout, item) => {
            if (this._allLayoutResolves[item.id]) {
                this._allLayoutResolves[item.id]({ item, layout });
            }
        };
        this.onItemActivation = (item) => {
            if (this.props.onItemActivation) {
                this.props.onItemActivation(item);
            }
        };
        this.onItemMove = (item, gestureState) => {
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
                if ((deltaY < target.boundaries.bottom && deltaY > 0) ||
                    (deltaY > target.boundaries.top && deltaY < totalHeight - target.layout.height)) {
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
                if ((deltaY > prevTarget.boundaries.top && direction === 'up') ||
                    (deltaY < prevTarget.boundaries.bottom && direction === 'down')) {
                    this.resetItemsOrder(activeRow, prevTarget);
                }
            }
        };
        this.findTarget = (deltaY, onChangeTarget) => {
            const { rowsLayout, totalHeight, target } = this.state;
            if ((deltaY < 0 && target) || (deltaY > totalHeight && target)) {
                return true;
            }
            const mapped = Object.keys(rowsLayout)
                .map(key => rowsLayout[key])
                .sort((a, b) => {
                if (a.order > b.order) {
                    return 1;
                }
                else if (a.order < b.order) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
            if (deltaY < 0) {
                this.changeTarget(mapped[0], onChangeTarget);
                return true;
            }
            else if (deltaY > totalHeight) {
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
        this.changeTarget = (target, onChangeTarget) => {
            this._targetItem = target;
            this.setState(prevState => ({ target, prevTarget: prevState.target }), () => {
                if (onChangeTarget) {
                    onChangeTarget(target);
                }
            });
        };
        this.changeItemsOrder = (activeItem, targetItem, direction) => {
            // const animateTo =
            // 	direction === 'down' ? -targetItem.layout.height : targetItem.layout.height
            const animateTo = direction === 'down' ? 'up' : 'down';
            this.setState(prevState => {
                return Object.assign({}, prevState, { rowsLayout: Object.assign({}, prevState.rowsLayout, { [targetItem.id]: Object.assign({}, prevState.rowsLayout[targetItem.id], { currentOrder: direction === 'down' ? targetItem.order - 1 : targetItem.order + 1, animateTo }), [activeItem.id]: Object.assign({}, prevState.rowsLayout[activeItem.id], { currentOrder: targetItem.order, animateTo: null }) }) });
            });
        };
        this.resetItemsOrder = (activeItem, targetItem) => {
            this.setState(prevState => ({
                rowsLayout: Object.assign({}, prevState.rowsLayout, { [targetItem.id]: Object.assign({}, prevState.rowsLayout[targetItem.id], { currentOrder: targetItem.order, animateTo: null }), [activeItem.id]: Object.assign({}, prevState.rowsLayout[activeItem.id], { currentOrder: prevState.rowsLayout[targetItem.id].currentOrder, animateTo: null }) }),
            }));
        };
        this.onConfirmPosition = (_activeItem) => {
            const mapped = Object.keys(this.state.rowsLayout)
                .map(key => {
                const rl = this.state.rowsLayout[key];
                return {
                    id: rl.id,
                    order: rl.currentOrder,
                };
            })
                .reduce((p, c) => (Object.assign({}, p, { [c.id]: c })), {});
            const newData = this.props.data.map(item => {
                return Object.assign({}, item, { order: mapped[item.id].order });
            });
            this.setState({ target: null, prevTarget: null });
            this.props.onOrderChange(newData);
        };
        this._allLayoutResolves = {};
        this._allLayoutPromises = props.data.map(item => createPromises(item, this._allLayoutResolves));
        this.state = {
            scrollEnabled: true,
            totalHeight: 0,
            target: null,
            prevTarget: null,
            rowsLayout: props.data.reduce((p, n) => (Object.assign({}, p, { [n.id]: {
                    id: n.id,
                    order: n.order,
                    currentOrder: n.order,
                    boundaries: {
                        top: 0,
                        bottom: 0,
                    },
                    animateTo: null,
                    layoutReady: false,
                    layout: Object.assign({}, emptyLayout),
                } })), {}),
        };
    }
    componentDidMount() {
        Promise.all(this._allLayoutPromises)
            .then(this.reorderRows)
            .catch(err => console.error(err));
    }
    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.data, this.props.data)) {
            // console.log('MUDOU PROPS.DATA', this.props.data)
            const layoutsDone = [];
            this._allLayoutResolves = {};
            this._allLayoutPromises = [];
            this.props.data.forEach(item => {
                const rl = this.state.rowsLayout[item.id];
                if (rl && rl.layoutReady) {
                    // existe ja
                    layoutsDone.push({
                        item,
                        layout: Object.assign({}, rl.layout, { y: 0 }),
                    });
                }
                else {
                    // fazer promise
                    this._allLayoutPromises.push(createPromises(item, this._allLayoutResolves));
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
    render() {
        // console.log('RERENDER ********', this.state)
        return (React.createElement(ScrollView, { scrollEnabled: this.state.scrollEnabled, style: styles.container },
            this.props.data.map((x, index) => {
                return this.renderRow({ item: x, index });
            }),
            React.createElement(View, { style: { height: this.state.totalHeight } })));
    }
}
const styles = StyleSheet.create({
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
