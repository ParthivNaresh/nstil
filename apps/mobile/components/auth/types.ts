import type { Href } from "expo-router";

export interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export interface AuthFooterLinkProps {
  prompt: string;
  linkText: string;
  href: Href;
}

export interface FormErrorProps {
  message: string;
}
