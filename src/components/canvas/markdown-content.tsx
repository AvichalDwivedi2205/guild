import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import styles from './canvas.module.css';

export function MarkdownContent({
  source,
  compact = false,
  className,
}: {
  source: string;
  compact?: boolean;
  className?: string | undefined;
}) {
  return (
    <div
      className={[styles.markdownContent, className].filter(Boolean).join(' ')}
      data-compact={compact || undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children, ...props }) => (
            <a {...props} className="nodrag" target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
