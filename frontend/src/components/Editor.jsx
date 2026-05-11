import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus'; 
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export default function NexusEditor({ content, setContent, maxChars = 500, compact = false }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: "What's your perspective today?",
                emptyEditorClass: 'is-editor-empty',
            }),
            CharacterCount.configure({
                limit: maxChars,
            }),
        ],
        // 1. Set the initial content when the editor first loads
        content: content || '', 
        onUpdate: ({ editor }) => {
            // 2. CRITICAL FIX: Use getHTML() so you don't lose Bold/Italic formatting
            setContent(editor.getHTML()); 
        },
        editorProps: {
            attributes: {
                // CHANGED: Replaced `max-w-none` with `max-w-full`, added `break-words`, `whitespace-pre-wrap`, and `overflow-x-hidden`
                class: cn('w-full outline-none p-2 md:p-4 leading-[1.8]         tracking-wide text-foreground',
                    'prose dark:prose-invert !max-w-full break-words overflow-x-hidden',
                    // ↓ compact mode for modal — normal post creation keeps the big size
                    compact ? 'text-sm md:text-base' : 'text-xl md:text-2xl font-light',
                ),
            },
        },
    });

    // 3. Sync incoming content (e.g., when "Restore Draft" is clicked)
    useEffect(() => {
        if (editor && content !== undefined) {
            // We check if the incoming content is different from the current editor state
            // to prevent an infinite loop while the user is typing
            if (editor.getHTML() !== content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return (
        // CHANGED: Added flex col, min-w-0, and overflow-x-hidden to strict-lock the width
        <div className="w-full h-full min-w-0 flex flex-col relative custom-tiptap-wrapper overflow-x-hidden">
            {/* The Floating Bubble Menu */}
            {editor && (
                <BubbleMenu 
                    editor={editor} 
                    options={{ placement: 'top', offset: 8 }} 
                    className="animate-shift-toward flex items-center gap-1 p-1 bg-background/80 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl overflow-hidden"
                >
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            editor.isActive('bold') 
                                ? 'bg-indigo-500/10 text-indigo-500' 
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            editor.isActive('italic') 
                                ? 'bg-indigo-500/10 text-indigo-500' 
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            editor.isActive('underline') 
                                ? 'bg-indigo-500/10 text-indigo-500' 
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <UnderlineIcon className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`p-2 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            editor.isActive('strike') 
                                ? 'bg-indigo-500/10 text-indigo-500' 
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        <Strikethrough className="w-4 h-4" />
                    </button>
                </BubbleMenu>
            )}

            {/* CHANGED: Added max-w-full and flex-1 to allow vertical growth but block horizontal expansion */}
            <EditorContent editor={editor} className="w-full flex-1 max-w-full" />
        </div>
    );
}