/**
 * TaxasGE Mobile - Swipe Actions Component
 * Reusable swipe-to-reveal actions for list items
 * Date: 2025-10-22
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export interface SwipeAction {
  text: string;
  color: string;
  textColor?: string;
  onPress: () => void;
}

export interface SwipeActionsProps {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
}

/**
 * SwipeActions Component
 * Wraps children with swipeable gesture handlers
 * Reveals action buttons when swiped left or right
 */
export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  rightActions = [],
  leftActions = [],
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow swipe left to reveal right actions
        if (gestureState.dx < 0 && rightActions.length > 0) {
          translateX.setValue(Math.max(gestureState.dx, -120));
        }
        // Allow swipe right to reveal left actions
        else if (gestureState.dx > 0 && leftActions.length > 0) {
          translateX.setValue(Math.min(gestureState.dx, 120));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Full swipe - show actions
          const toValue = gestureState.dx < 0 ? -120 : 120;
          Animated.spring(translateX, {
            toValue,
            useNativeDriver: true,
            friction: 5,
          }).start();
        } else {
          // Incomplete swipe - reset
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handleActionPress = (action: SwipeAction) => {
    resetPosition();
    action.onPress();
  };

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      {leftActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.leftActions]}>
          {leftActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}>
              <Text style={[
                styles.actionText,
                action.textColor && { color: action.textColor }
              ]}>
                {String(action.text)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Swipeable Content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}>
        {children}
      </Animated.View>

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <View style={[styles.actionsContainer, styles.rightActions]}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { backgroundColor: action.color }]}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}>
              <Text style={[
                styles.actionText,
                action.textColor && { color: action.textColor }
              ]}>
                {String(action.text)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableContent: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
