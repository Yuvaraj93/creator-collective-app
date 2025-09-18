import { useState } from "react";
import { Search, Share2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note } from "@/types";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";

const Notes = () => {
  const [notes] = useLocalStorage<Note[]>("besto-notes", []);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShare = (note: Note) => {
    if (navigator.share) {
      navigator.share({
        title: 'Besto Note',
        text: note.content,
      });
    } else {
      navigator.clipboard.writeText(note.content);
      toast({
        title: "Copied to clipboard",
        description: "Note content has been copied to your clipboard.",
      });
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'todo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'event': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">Notes</h1>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notes List */}
        <div className="space-y-3">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <Card key={note.id} className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(note.type)}>
                        {note.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(note)}
                  >
                    <Share2 size={16} />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <p className="text-muted-foreground mb-2">No notes found for "{searchTerm}"</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search</p>
                </div>
              ) : (
                <div>
                  <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground mb-2">No notes yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start recording your first voice note from the home screen
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Notes;