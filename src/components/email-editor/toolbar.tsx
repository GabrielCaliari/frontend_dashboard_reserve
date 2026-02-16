"use client";

import React from 'react';
import { useTranslations } from "next-intl";
import { useSlate } from 'slate-react';
import { Editor, Transforms, Text } from 'slate';
import { CustomEditor, CustomText } from './types';

const ToolbarButton = ({ 
  icon, 
  isActive = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  isActive?: boolean; 
  onClick: () => void;
}) => (
  <button
    className={`p-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-200' : ''}`}
    onClick={onClick}
  >
    {icon}
  </button>
);

const isMarkActive = (editor: CustomEditor, format: keyof Omit<CustomText, 'text'>) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleMark = (editor: CustomEditor, format: keyof Omit<CustomText, 'text'>) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

export const Toolbar = () => {
  const t = useTranslations("toolbar");
  const editor = useSlate() as CustomEditor;

  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        icon={<span className="font-bold">B</span>}
        isActive={isMarkActive(editor, 'bold')}
        onClick={() => toggleMark(editor, 'bold')}
      />
      <ToolbarButton
        icon={<span className="italic">I</span>}
        isActive={isMarkActive(editor, 'italic')}
        onClick={() => toggleMark(editor, 'italic')}
      />
      <ToolbarButton
        icon={<span className="underline">U</span>}
        isActive={isMarkActive(editor, 'underline')}
        onClick={() => toggleMark(editor, 'underline')}
      />
      
      <div className="w-px h-6 bg-gray-200 mx-2" />
      
      <select 
        className="px-2 py-1 border border-gray-200 rounded"
        onChange={(e) => {
          const size = e.target.value;
          Editor.addMark(editor, 'fontSize', size);
        }}
      >
        <option value="normal">{t("normal")}</option>
        <option value="text-lg">{t("large")}</option>
        <option value="text-xl">{t("veryLarge")}</option>
        <option value="text-2xl">{t("extraLarge")}</option>
      </select>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <ToolbarButton
        icon={<span>🔗</span>}
        onClick={() => {
          const url = window.prompt(t("enterUrl"));
          if (url) {
            const { selection } = editor;
            if (selection) {
              Transforms.wrapNodes(
                editor,
                { type: 'link', url },
                { split: true }
              );
            }
          }
        }}
      />

      <ToolbarButton
        icon={<span>🖼️</span>}
        onClick={() => {
          const url = window.prompt(t("enterImageUrl"));
          if (url) {
            Transforms.insertNodes(editor, {
              type: 'image',
              url,
              children: [{ text: '' }],
            });
          }
        }}
      />

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <select 
        className="px-2 py-1 border border-gray-200 rounded"
        onChange={(e) => {
          const color = e.target.value;
          Editor.addMark(editor, 'color', color);
        }}
      >
        <option value="black">{t("black")}</option>
        <option value="red">{t("red")}</option>
        <option value="blue">{t("blue")}</option>
        <option value="green">{t("green")}</option>
      </select>

      <div className="w-px h-6 bg-gray-200 mx-2" />

      <ToolbarButton
        icon={<span>⬅️</span>}
        onClick={() => {
          Transforms.setNodes(
            editor,
            { align: 'left' },
            { match: n => Text.isText(n), split: true }
          );
        }}
      />
      <ToolbarButton
        icon={<span>⬆️</span>}
        onClick={() => {
          Transforms.setNodes(
            editor,
            { align: 'center' },
            { match: n => Text.isText(n), split: true }
          );
        }}
      />
      <ToolbarButton
        icon={<span>➡️</span>}
        onClick={() => {
          Transforms.setNodes(
            editor,
            { align: 'right' },
            { match: n => Text.isText(n), split: true }
          );
        }}
      />
    </div>
  );
}; 