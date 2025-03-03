"use client"

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Heading1, 
  Heading2, 
  Table, 
  Image, 
  Link as LinkIcon
} from "lucide-react";

export function ReportEditor() {
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState("");

  // Simple markdown-like preview conversion
  const generatePreview = (text: string) => {
    let html = text;
    
    // Convert headings
    html = html.replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>');
    html = html.replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>');
    
    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert lists
    html = html.replace(/- (.*?)(\n|$)/g, '<li>$1</li>');
    
    // Convert paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Wrap in paragraph tags
    html = '<p>' + html + '</p>';
    
    return html;
  };

  const handleTabChange = (value: string) => {
    if (value === "preview") {
      setPreview(generatePreview(content));
    }
  };

  const insertFormatting = (format: string) => {
    const textarea = document.getElementById("editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    let formattedText = "";
    let cursorPosition = 0;

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`;
        cursorPosition = selectedText ? end + 4 : start + 2;
        break;
      case "italic":
        formattedText = `*${selectedText}*`;
        cursorPosition = selectedText ? end + 2 : start + 1;
        break;
      case "h1":
        formattedText = `# ${selectedText}`;
        cursorPosition = selectedText ? end + 2 : start + 2;
        break;
      case "h2":
        formattedText = `## ${selectedText}`;
        cursorPosition = selectedText ? end + 3 : start + 3;
        break;
      case "ul":
        formattedText = `- ${selectedText}`;
        cursorPosition = selectedText ? end + 2 : start + 2;
        break;
      case "ol":
        formattedText = `1. ${selectedText}`;
        cursorPosition = selectedText ? end + 3 : start + 3;
        break;
      case "link":
        formattedText = `[${selectedText}](url)`;
        cursorPosition = selectedText ? end + 6 : start + 1;
        break;
      case "image":
        formattedText = `![${selectedText}](url)`;
        cursorPosition = selectedText ? end + 7 : start + 2;
        break;
      case "table":
        formattedText = `| Spalte 1 | Spalte 2 | Spalte 3 |\n| -------- | -------- | -------- |\n| Zelle 1  | Zelle 2  | Zelle 3  |`;
        cursorPosition = end + formattedText.length;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    // Set cursor position after update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/30">
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("bold")}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("italic")}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("h1")}>
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("h2")}>
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("ul")}>
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("ol")}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("link")}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("image")}>
          <Image className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => insertFormatting("table")}>
          <Table className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1"></div>
        <Button type="button" variant="ghost" size="icon">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon">
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="write" onValueChange={handleTabChange}>
        <TabsList className="mb-2">
          <TabsTrigger value="write">Schreiben</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            id="editor"
            placeholder="Beschreiben Sie Ihre Tätigkeiten und Lerninhalte..."
            className="min-h-[300px] font-mono"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </TabsContent>
        <TabsContent value="preview">
          <div 
            className="min-h-[300px] p-4 border rounded-md bg-background"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}