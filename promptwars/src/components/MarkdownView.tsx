import React from "react";

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");

  const parseInline = (text: string) => {
    // Bold: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1">
              {parseInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-base font-bold text-foreground mt-3 mb-1">
              {parseInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-lg font-bold text-foreground mt-4 mb-2">
              {parseInline(trimmed.slice(2))}
            </h1>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
              <span className="text-primary mt-1">•</span>
              <span>{parseInline(trimmed.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)$/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-2 my-0.5">
                <span className="font-semibold text-primary">{match[1]}.</span>
                <span>{parseInline(match[2])}</span>
              </div>
            );
          }
        }
        if (trimmed === "") {
          return <div key={idx} className="h-1.5" />;
        }
        return <p key={idx}>{parseInline(line)}</p>;
      })}
    </div>
  );
};
