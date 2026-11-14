import React from "react";

export interface DateTimePickerEvent {
  type: "set" | "dismissed";
  nativeEvent: {
    timestamp: number;
    utcOffset: number;
  };
}

export const DateTimePicker: React.FC<any> = ({ value, onChange, testID, ...props }: any) => {
  return null;
};

export const DateTimePickerAndroid = {
  open: (_options: any) => {},
  dismiss: () => {},
};

export default DateTimePicker;
