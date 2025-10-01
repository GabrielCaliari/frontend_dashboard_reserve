import { BaseEditor, BaseElement, BaseText } from 'slate';
import { ReactEditor } from 'slate-react';
import { HistoryEditor } from 'slate-history';

export type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

export type ParagraphElement = {
  type: 'paragraph';
  align?: 'left' | 'center' | 'right';
  children: CustomText[];
};

export type LinkElement = {
  type: 'link';
  url: string;
  children: CustomText[];
};

export type ImageElement = {
  type: 'image';
  url: string;
  children: [{ text: '' }];
};

export type CustomElement = ParagraphElement | LinkElement | ImageElement;

export type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: string;
  color?: string;
};

export type CustomText = FormattedText;

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
} 