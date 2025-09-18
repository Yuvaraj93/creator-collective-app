import { useState } from "react";
import { Mic, MicOff, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note, Todo } from "@/types";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";

const Home = () => {
  const { isRecording, isSupported, transcript, startRecording, stopRecording } = useVoiceRecording();
  const [notes, setNotes] = useLocalStorage<Note[]>("besto-notes", []);
  const [todos, setTodos] = useLocalStorage<Todo[]>("besto-todos", []);
  
  const [showCategorizeDialog, setShowCategorizeDialog] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [selectedType, setSelectedType] = useState<'note' | 'todo' | 'event'>('note');

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
      if (transcript.trim()) {
        setRecordedText(transcript.trim());
        setShowCategorizeDialog(true);
      }
    } else {
      startRecording();
    }
  };

  const handleSave = () => {
    if (!recordedText.trim()) return;

    const id = Date.now().toString();
    const now = new Date().toISOString();

    if (selectedType === 'todo') {
      const newTodo: Todo = {
        id,
        title: recordedText,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };
      setTodos(prev => [newTodo, ...prev]);
      toast({
        title: "Todo created",
        description: "Your voice note has been saved as a todo.",
      });
    } else {
      const newNote: Note = {
        id,
        content: recordedText,
        type: selectedType,
        createdAt: now,
        updatedAt: now,
      };
      setNotes(prev => [newNote, ...prev]);
      toast({
        title: "Note created",
        description: `Your voice note has been saved as a ${selectedType}.`,
      });
    }

    setShowCategorizeDialog(false);
    setRecordedText("");
    setSelectedType('note');
  };

  const recentNotes = notes.slice(0, 3);
  const recentTodos = todos.filter(todo => !todo.completed).slice(0, 3);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Besto</h1>
          <p className="text-muted-foreground">Capture ideas instantly, act on them effortlessly</p>
        </div>

        {/* Voice Recording Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleRecordingToggle}
            disabled={!isSupported}
            size="lg"
            className={`w-24 h-24 rounded-full ${
              isRecording 
                ? 'bg-destructive hover:bg-destructive/90' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </Button>
        </div>

        {isRecording && (
          <div className="text-center mb-6">
            <p className="text-primary font-medium">Listening...</p>
            {transcript && (
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                "{transcript}"
              </p>
            )}
          </div>
        )}

        {!isSupported && (
          <div className="text-center mb-6">
            <p className="text-destructive text-sm">
              Speech recognition is not supported in your browser
            </p>
          </div>
        )}

        {/* Recent Items */}
        <div className="space-y-6">
          {/* Recent Notes */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Recent Notes</h2>
            {recentNotes.length > 0 ? (
              <div className="space-y-2">
                {recentNotes.map((note) => (
                  <Card key={note.id} className="p-3">
                    <p className="text-sm line-clamp-2">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No notes yet</p>
            )}
          </div>

          {/* Recent Todos */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Pending Todos</h2>
            {recentTodos.length > 0 ? (
              <div className="space-y-2">
                {recentTodos.map((todo) => (
                  <Card key={todo.id} className="p-3">
                    <p className="text-sm line-clamp-2">{todo.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(todo.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No todos yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Categorize Dialog */}
      <Dialog open={showCategorizeDialog} onOpenChange={setShowCategorizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorize your note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={recordedText}
              onChange={(e) => setRecordedText(e.target.value)}
              placeholder="Edit your note..."
              rows={3}
            />
            <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="note" id="note" />
                <Label htmlFor="note">Note</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todo" id="todo" />
                <Label htmlFor="todo">Todo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="event" id="event" />
                <Label htmlFor="event">Event</Label>
              </div>
            </RadioGroup>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                <Save size={16} className="mr-2" />
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCategorizeDialog(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Home;