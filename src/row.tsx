import React from "react";
import {
  StyleSheet,
  ViewStyle,
  TextStyle,
  PanResponder,
  PanResponderInstance,
  Animated,
  Dimensions,
  Platform,
  Easing,
  PanResponderGestureState
} from "react-native";
import { DataTypeWise, LayoutEventType, LayoutType } from "./types";

type TouchableSortListRowProps<T> = {
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

const defaultProps = {
  onItemActivation: () => {},
  animateTo: null as "up" | "down" | null
};

class TouchableSortListRow<T extends DataTypeWise> extends React.Component<
  TouchableSortListRowProps<T>,
  TouchableSortListRowState
> {
  static defaultProps = defaultProps;

  private _layout: LayoutType = { x: 0, y: 0, height: 0, width: 0 };
  private _panResponder: PanResponderInstance;
  private _longPressTimer = 0;
  private _translateAnim = new Animated.Value(0);
  // private _isAnimationRunning: boolean = false

  constructor(props: TouchableSortListRowProps<T>) {
    super(props);
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

  shouldComponentUpdate(
    nextProps: TouchableSortListRowProps<T>,
    nextState: TouchableSortListRowState
  ) {
    // Limit rerendering to improve performance
    if (
      nextProps.animateTo === this.props.animateTo &&
      nextProps.isTarget === this.props.isTarget &&
      nextProps.y === this.props.y &&
      nextState.isActive === this.state.isActive
    ) {
      return false;
    }
    return true;
  }
  componentDidUpdate(prevProps: TouchableSortListRowProps<T>) {
    if (this.props.animateTo !== null) {
      const toValue =
        this.props.animateTo === "up"
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
    } else if (prevProps.y !== this.props.y) {
      this._translateAnim.setValue(0);
    } else if (prevProps.animateTo !== null && this.props.animateTo === null) {
      this.resetPositionAnimation();
    }
  }
  resetPositionAnimation = (callback?: () => void) => {
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
  cancelLongPress = () => {
    clearInterval(this._longPressTimer);
  };

  activateItem = () => {
    this.props.onItemActivation();
    this.setState({ isActive: true });
  };
  deactivateItem = () => {
    this.setState({ isActive: false });
  };
  confirmPosition = () => {
    this._translateAnim.setValue(0);
    this.deactivateItem();
    this.props.onConfirmPosition(this.props.item);
  };
  onLayout = (e: LayoutEventType) => {
    this._layout = e.nativeEvent.layout;
    this.props.onLayout(e.nativeEvent.layout);
  };
  render() {
    // console.log('------- rerender item -------', this.state)
    const ZINDEX = Platform.OS === "ios" ? "zIndex" : "elevation";
    const zindexStyle = this.state.isActive
      ? { [ZINDEX]: 100 }
      : { [ZINDEX]: 1 };
    const animateStyle = { transform: [{ translateY: this._translateAnim }] };
    const absolutePos = { top: this.props.y };

    return (
      <Animated.View
        style={[styles.itemContainer, absolutePos, zindexStyle, animateStyle]}
        onLayout={this.onLayout}
        {...this._panResponder.panHandlers}
      >
        {this.props.renderItem(this.state.isActive)}
      </Animated.View>
    );
  }
}

type Styles = {
  itemContainer: ViewStyle;
  text: TextStyle;
};

const styles = StyleSheet.create<Styles>({
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
