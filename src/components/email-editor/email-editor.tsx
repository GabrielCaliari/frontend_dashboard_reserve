"use client";

import React from'react';
import { useTranslations } from"next-intl";
import { createEditor } from'slate';
import { Slate, Editable, withReact, RenderLeafProps, RenderElementProps } from'slate-react';
import { withHistory } from'slate-history';
import { Toolbar } from'./toolbar';
import { CustomElement, CustomText } from'./types';

interface EmailEditorProps {
 initialValue?: CustomElement[];
 onChange?: (value: CustomElement[]) => void;
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
 const customLeaf = leaf as CustomText;
 let style: React.CSSProperties = {};

 if (customLeaf.bold) {
 style.fontWeight ='bold';
 }
 if (customLeaf.italic) {
 style.fontStyle ='italic';
 }
 if (customLeaf.underline) {
 style.textDecoration ='underline';
 }
 if (customLeaf.fontSize) {
 style.fontSize = customLeaf.fontSize ==='normal' ?'inherit' : customLeaf.fontSize;
 }
 if (customLeaf.color) {
 style.color = customLeaf.color;
 }

 return (
 <span {...attributes} style={style}>
 {children}
 </span>
 );
};

const Element = ({ attributes, children, element }: RenderElementProps) => {
 switch (element.type) {
 case'link':
 return (
 <a {...attributes} href={element.url} style={{ color:'blue', textDecoration:'underline' }}>
 {children}
 </a>
 );
 case'image':
 return <img {...attributes} src={element.url} alt="" style={{ maxWidth:'100%', height:'auto' }} />;
 case'paragraph':
 default:
 return <p {...attributes} style={{ textAlign: element.align }}>{children}</p>;
 }
};

export const EmailEditor: React.FC<EmailEditorProps> = ({ onChange }) => {
 const t = useTranslations("toolbar");
 const editor = React.useMemo(() => withHistory(withReact(createEditor())), []);

 const initialValue: CustomElement[] = [
 {
 type:'paragraph',
 children: [{ text: t("typeEmail") }],
 },
 ];

 const renderLeaf = React.useCallback((props: RenderLeafProps) => {
 return <Leaf {...props} />;
 }, []);

 const renderElement = React.useCallback((props: RenderElementProps) => {
 return <Element {...props} />;
 }, []);

 return (
 <div className="w-full min-h-[500px] border border-border rounded-lg">
 <Slate
 editor={editor}
 initialValue={initialValue}
 onChange={value => {
 onChange?.(value as CustomElement[]);
 }}
 >
 <div className="border-b border-border p-2">
 <Toolbar />
 </div>
 <Editable
 className="p-4 min-h-[400px]"
 placeholder={t("typeEmail")}
 renderLeaf={renderLeaf}
 renderElement={renderElement}
 />
 </Slate>
 </div>
 );
}; 