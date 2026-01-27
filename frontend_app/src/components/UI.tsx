import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, type CSSProperties } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const getButtonClasses = (variant: ButtonVariant, size: ButtonSize, className?: string): string => {
    const base = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'default' ? `btn-${size}` : '';
    return [base, variantClass, sizeClass, className].filter(Boolean).join(' ');
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'default', ...props }, ref) => (
        <button
            ref={ref}
            className={getButtonClasses(variant, size, className)}
            {...props}
        />
    )
);

Button.displayName = 'Button';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', ...props }, ref) => (
        <input
            ref={ref}
            type={type}
            className={['input', className].filter(Boolean).join(' ')}
            {...props}
        />
    )
);

Input.displayName = 'Input';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => (
        <textarea
            ref={ref}
            className={['input', className].filter(Boolean).join(' ')}
            {...props}
        />
    )
);

Textarea.displayName = 'Textarea';

interface CardProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const Card = ({ children, className, style }: CardProps) => (
    <div className={['card', className].filter(Boolean).join(' ')} style={style}>
        {children}
    </div>
);

interface LabelProps {
    children: ReactNode;
    htmlFor?: string;
    hint?: string;
    className?: string;
}

export const Label = ({ children, htmlFor, hint, className }: LabelProps) => (
    <label htmlFor={htmlFor} className={['label', className].filter(Boolean).join(' ')}>
        {children}
        {hint && <span className="label-hint"> ({hint})</span>}
    </label>
);

type BadgeVariant = 'success' | 'warning' | 'error' | 'secondary';

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

export const Badge = ({ children, variant = 'secondary', className }: BadgeProps) => (
    <span className={['badge', `badge-${variant}`, className].filter(Boolean).join(' ')}>
        {children}
    </span>
);

type AlertVariant = 'error' | 'success' | 'warning';

interface AlertProps {
    children: ReactNode;
    variant?: AlertVariant;
    className?: string;
}

export const Alert = ({ children, variant = 'error', className }: AlertProps) => (
    <div className={['alert', `alert-${variant}`, className].filter(Boolean).join(' ')}>
        {children}
    </div>
);
