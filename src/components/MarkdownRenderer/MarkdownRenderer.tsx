import {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactMarkdown, {Components} from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {useBem} from '@/hooks/useBem';

import './markdown-renderer.scss';

interface MarkdownRendererProps {
	className?: string;
	content: string;
	onProgressChange?: (progress: number) => void;
	editable?: boolean;
	onContentChange?: (content: string) => void;
}

interface MarkdownInputProps {
	checked?: boolean;
	element: (name: string, mods?: Record<string, boolean>) => string;
	onCheckboxChange: (checked: boolean, index: number) => void;
	editable: boolean;
	type?: string;
	'data-index'?: string;
	[key: string]: unknown;
}

interface MarkdownComponentProps {
	children?: React.ReactNode;
	element: (name: string, mods?: Record<string, boolean>) => string;
	[key: string]: unknown;
}

interface MarkdownCodeProps extends MarkdownComponentProps {
	inline?: boolean;
}

// Вынесем компоненты за пределы рендера
const MarkdownInput: FC<MarkdownInputProps> = ({checked, element, onCheckboxChange, editable, ...props}) => {
	if (props.type === 'checkbox') {
		const checkboxIndex = parseInt(props['data-index'] || '0', 10);
		return (
			<input
				{...props}
				checked={checked}
				onChange={(e) => onCheckboxChange(e.target.checked, checkboxIndex)}
				disabled={!editable}
				className={element('checkbox')}
			/>
		);
	}
	return <input {...props} />;
};

const MarkdownListItem: FC<MarkdownComponentProps> = ({children, element, ...props}) => {
	const hasCheckbox = Array.isArray(children) && children.some((child) => child?.props?.type === 'checkbox');
	return (
		<li {...props} className={element('list-item', {checkbox: hasCheckbox})}>
			{children}
		</li>
	);
};

const MarkdownParagraph: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<p {...props} className={element('paragraph')}>
		{children}
	</p>
);

const MarkdownHeading1: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<h1 {...props} className={element('heading', {'level-1': true})}>
		{children}
	</h1>
);

const MarkdownHeading2: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<h2 {...props} className={element('heading', {'level-2': true})}>
		{children}
	</h2>
);

const MarkdownHeading3: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<h3 {...props} className={element('heading', {'level-3': true})}>
		{children}
	</h3>
);

const MarkdownCode: FC<MarkdownCodeProps> = ({inline = false, children, element, ...props}) => (
	<code {...props} className={element('code', {inline})}>
		{children}
	</code>
);

const MarkdownPre: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<pre {...props} className={element('code-block')}>
		{children}
	</pre>
);

const MarkdownBlockquote: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<blockquote {...props} className={element('blockquote')}>
		{children}
	</blockquote>
);

const MarkdownLink: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<a {...props} className={element('link')} target="_blank" rel="noopener noreferrer">
		{children}
	</a>
);

const MarkdownTable: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<table {...props} className={element('table')}>
		{children}
	</table>
);

const MarkdownTableHeader: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<th {...props} className={element('table-header')}>
		{children}
	</th>
);

const MarkdownTableCell: FC<MarkdownComponentProps> = ({children, element, ...props}) => (
	<td {...props} className={element('table-cell')}>
		{children}
	</td>
);

// Создаем фабрику компонентов вне компонента рендера
const createMarkdownComponents = (
	element: (name: string, mods?: Record<string, boolean>) => string,
	handleCheckboxChange: (checked: boolean, index: number) => void,
	editable: boolean
): Components => ({
	input: (props: MarkdownInputProps) => (
		<MarkdownInput {...props} element={element} onCheckboxChange={handleCheckboxChange} editable={editable} />
	),
	li: (props: MarkdownComponentProps) => <MarkdownListItem {...props} element={element} />,
	p: (props: MarkdownComponentProps) => <MarkdownParagraph {...props} element={element} />,
	h1: (props: MarkdownComponentProps) => <MarkdownHeading1 {...props} element={element} />,
	h2: (props: MarkdownComponentProps) => <MarkdownHeading2 {...props} element={element} />,
	h3: (props: MarkdownComponentProps) => <MarkdownHeading3 {...props} element={element} />,
	code: (props: MarkdownCodeProps) => <MarkdownCode {...props} element={element} />,
	pre: (props: MarkdownComponentProps) => <MarkdownPre {...props} element={element} />,
	blockquote: (props: MarkdownComponentProps) => <MarkdownBlockquote {...props} element={element} />,
	a: (props: MarkdownComponentProps) => <MarkdownLink {...props} element={element} />,
	table: (props: MarkdownComponentProps) => <MarkdownTable {...props} element={element} />,
	th: (props: MarkdownComponentProps) => <MarkdownTableHeader {...props} element={element} />,
	td: (props: MarkdownComponentProps) => <MarkdownTableCell {...props} element={element} />,
});

export const MarkdownRenderer: FC<MarkdownRendererProps> = ({className, content, onProgressChange, editable = false, onContentChange}) => {
	const [block, element] = useBem('markdown-renderer', className);
	const [editableContent, setEditableContent] = useState(content);

	// Используем useRef для стабильной ссылки на onProgressChange
	const onProgressChangeRef = useRef(onProgressChange);

	useEffect(() => {
		onProgressChangeRef.current = onProgressChange;
	}, [onProgressChange]);

	useEffect(() => {
		setEditableContent(content);
	}, [content]);

	// Подсчет прогресса чекбоксов - убираем onProgressChange из dependencies
	useEffect(() => {
		if (onProgressChangeRef.current) {
			const checkboxMatches = content.match(/- \[[ x]\]/g);
			if (checkboxMatches) {
				const total = checkboxMatches.length;
				const completed = (content.match(/- \[x\]/g) || []).length;
				const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
				onProgressChangeRef.current(progress);
			} else {
				onProgressChangeRef.current(0);
			}
		}
	}, [content]); // убрали onProgressChange из dependency array

	const handleCheckboxChange = useCallback(
		(checked: boolean, index: number) => {
			if (!editable || !onContentChange) return;

			const lines = editableContent.split('\n');
			let checkboxIndex = 0;

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line.match(/- \[[ x]\]/)) {
					if (checkboxIndex === index) {
						lines[i] = line.replace(/- \[[ x]\]/, checked ? '- [x]' : '- [ ]');
						break;
					}
					checkboxIndex++;
				}
			}

			const newContent = lines.join('\n');
			setEditableContent(newContent);
			onContentChange(newContent);
		},
		[editableContent, editable, onContentChange]
	);

	const customComponents = useMemo(
		() => createMarkdownComponents(element, handleCheckboxChange, editable),
		[element, handleCheckboxChange, editable]
	);

	// Препроцессинг для обработки чекбоксов
	const processedContent = useMemo(() => {
		return editableContent.replace(/- \[[ x]\]/g, (match) => {
			return match.replace(/\[[ x]\]/, `[${match.includes('x') ? 'x' : ' '}]`);
		});
	}, [editableContent]);

	return (
		<div className={block()}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={customComponents}>
				{processedContent}
			</ReactMarkdown>
		</div>
	);
};
