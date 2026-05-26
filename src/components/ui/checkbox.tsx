import * as React from"react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
 (props, ref) => <input type="checkbox" ref={ref} {...props} />
);

Checkbox.displayName ="Checkbox"; 