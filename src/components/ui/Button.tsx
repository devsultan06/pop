import React from "react";
import { playSound } from "@/lib/sounds";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  playTapSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className = "",
  playTapSound = true,
  children,
  onClick,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  
  const variants = {
    primary: "bg-accent text-bg hover:bg-accent-hover active:bg-accent-hover text-white",
    secondary: "bg-card-surface text-ink border border-border hover:bg-bg active:bg-border",
    outline: "border border-ink text-ink hover:bg-ink hover:text-bg active:bg-ink active:text-bg rounded-full",
    ghost: "text-muted hover:text-ink hover:bg-border/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-full",
    md: "px-5 py-2.5 text-sm rounded-full",
    lg: "px-7 py-3.5 text-base rounded-full",
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playTapSound) {
      playSound("tap");
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};
