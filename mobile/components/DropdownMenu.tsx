import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import React, { useState, useRef, isValidElement, cloneElement } from "react";

type DropdownMenuProps = {
  button: React.ReactNode;
  children: React.ReactNode;
};

export default function DropdownMenu({ button, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<View>(null);

  const openDropdown = () => {
    if (!open && buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, _width, height) => {
        setDropdownPosition({ top: y + height, left: x - 50 });
        setOpen(true);
      });
    } else {
      setOpen(false);
    }
  };

  const enhancedChildren = React.Children.map(children, (child) => {
    if (isValidElement(child)) {
      const element = child as React.ReactElement<any>;
      const originalOnPress = element.props.onPress;
      return cloneElement(element, {
        onPress: (...args: any[]) => {
          if (typeof originalOnPress === "function") {
            originalOnPress(...args);
          }
          setOpen(false); // <== Auto close
        },
      });
    }
    return child;
  });

  return (
    <>
      <TouchableOpacity onPress={openDropdown}>
        <View ref={buttonRef}>{button}</View>
      </TouchableOpacity>

      {open && (
        <Modal visible={open} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <View className="flex-1" />
          </TouchableWithoutFeedback>

          <View
            className="absolute border-2 border-gray-400 shadow-md rounded-md bg-gray-800 z-50"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
          >
            {enhancedChildren}
          </View>
        </Modal>
      )}
    </>
  );
}
