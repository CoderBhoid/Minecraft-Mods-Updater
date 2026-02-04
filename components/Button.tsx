import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading,
  icon,
  className = '',
  disabled,
  ...props
}) => {

  // Added min-h-[48px] for mobile touch targets
  // Added active:scale-[0.98] for tactile feedback
  // Increased border radius to rounded-xl
  const baseStyles = "relative w-full min-h-[48px] inline-flex items-center justify-center px-6 py-3 text-sm tracking-wide transition-all duration-200 ease-out border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation";

  const variants = {
    // Updated to Neon Green (#1bd96a)
    primary: "bg-[#1bd96a] text-black border-[#1bd96a] hover:bg-[#1bd96a]/90 hover:border-[#1bd96a]/90 focus:ring-[#1bd96a] shadow-[0_0_20px_-5px_rgba(27,217,106,0.4)]",
    secondary: "bg-zinc-800 text-white border-zinc-800 hover:bg-zinc-700 hover:border-zinc-700 focus:ring-zinc-700",
    outline: "bg-transparent text-white border-zinc-700 hover:bg-zinc-900 hover:border-[#1bd96a] hover:text-[#1bd96a] focus:ring-zinc-500",
    ghost: "bg-transparent text-zinc-400 border-transparent hover:text-[#1bd96a] hover:bg-zinc-900/50",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};