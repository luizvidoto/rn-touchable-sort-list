import React from "react";
import { StyleSheet, PanResponder, Animated, Dimensions, Platform, Easing } from "react-native";
const defaultProps = {
    onItemActivation: () => { },
    animateTo: null
};
class TouchableSortListRow extends React.Component {
    // private _isAnimationRunning: boolean = false
    constructor(props) {
        super(props);
        this._layout = { x: 0, y: 0, height: 0, width: 0 };
        this._longPressTimer = 0;
        this._translateAnim = new Animated.Value(0);
        this.resetPositionAnimation = (callback) => {
            // this._isAnimationRunning = true
            Animated.timing(this._translateAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.elastic(1),
                useNativeDriver: true
            }).start(() => {
                // this._isAnimationRunning = false
                if (callback) {
                    callback();
                }
            });
        };
        this.cancelLongPress = () => {
            clearInterval(this._longPressTimer);
        };
        this.activateItem = () => {
            this.props.onItemActivation();
            this.setState({ isActive: true });
        };
        this.deactivateItem = () => {
            this.setState({ isActive: false });
        };
        this.confirmPosition = () => {
            this._translateAnim.setValue(0);
            this.deactivateItem();
            this.props.onConfirmPosition(this.props.item);
        };
        this.onLayout = (e) => {
            this._layout = e.nativeEvent.layout;
            this.props.onLayout(e.nativeEvent.layout);
        };
        this.state = {
            isActive: false
        };
        this._panResponder = PanResponder.create({
            // Ask to be the responder:
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => false,
            onPanResponderGrant: (evt, gestureState) => {
                // console.log('onPanResponderGrant', this.state)
                this._longPressTimer = setTimeout(() => {
                    this.activateItem();
                    props.disableScroll();
                }, 300);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (this.state.isActive) {
                    props.onItemMove(gestureState);
                    this._translateAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderTerminationRequest: (evt, gestureState) => {
                // console.log('onPanResponderTerminationRequest', this.state)
                if (this.state.isActive) {
                    // If a view is active do not release responder.
                    return false;
                }
                this.cancelLongPress();
                return true;
            },
            onPanResponderRelease: (evt, { vx, dx }) => {
                // console.log('onPanResponderRelease', this.state)
                // The user has released all touches while this view is the
                // responder. This typically means a gesture has succeeded
                this.cancelLongPress();
                this.confirmPosition();
                props.enableScroll();
            },
            onPanResponderTerminate: (evt, gestureState) => {
                // console.log('onPanResponderTerminate', this.state)
                // Another component has become the responder, so this gesture
                // should be cancelled
                this.cancelLongPress();
                this.resetPositionAnimation(this.deactivateItem);
                props.enableScroll();
            },
            onShouldBlockNativeResponder: (evt, gestureState) => {
                // console.log('onShouldBlockNativeResponder', this.state)
                // Returns whether this component should block native components from becoming the JS
                // responder. Returns true by default. Is currently only supported on android.
                return true;
            }
        });
    }
    shouldComponentUpdate(nextProps, nextState) {
        // Limit rerendering to improve performance
        if (nextProps.animateTo === this.props.animateTo &&
            nextProps.isTarget === this.props.isTarget &&
            nextProps.y === this.props.y &&
            nextState.isActive === this.state.isActive) {
            return false;
        }
        return true;
    }
    componentDidUpdate(prevProps) {
        if (this.props.animateTo !== null) {
            const toValue = this.props.animateTo === "up"
                ? -this._layout.height
                : this._layout.height;
            // this._isAnimationRunning = true
            Animated.timing(this._translateAnim, {
                toValue,
                duration: 200,
                useNativeDriver: true
            }).start(() => {
                // this._isAnimationRunning = false
            });
        }
        else if (prevProps.y !== this.props.y) {
            this._translateAnim.setValue(0);
        }
        else if (prevProps.animateTo !== null && this.props.animateTo === null) {
            this.resetPositionAnimation();
        }
    }
    render() {
        // console.log('------- rerender item -------', this.state)
        const ZINDEX = Platform.OS === "ios" ? "zIndex" : "elevation";
        const zindexStyle = this.state.isActive
            ? { [ZINDEX]: 100 }
            : { [ZINDEX]: 1 };
        const animateStyle = { transform: [{ translateY: this._translateAnim }] };
        const absolutePos = { top: this.props.y };
        return (React.createElement(Animated.View, Object.assign({ style: [styles.itemContainer, absolutePos, zindexStyle, animateStyle], onLayout: this.onLayout }, this._panResponder.panHandlers), this.props.renderItem(this.state.isActive)));
    }
}
TouchableSortListRow.defaultProps = defaultProps;
const styles = StyleSheet.create({
    itemContainer: {
        position: "absolute",
        left: 0,
        top: 0,
        width: Dimensions.get("window").width
    },
    text: {
        fontSize: 20
    }
});
export default TouchableSortListRow;
