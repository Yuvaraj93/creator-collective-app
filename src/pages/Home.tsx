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
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-screen bg-primary animate-matrix"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="relative inline-block">
            <h1 className="text-4xl font-bold text-primary mb-2 tracking-wider">
              B.E.S.T.O
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-30 blur rounded-lg"></div>
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-widest">
            BIOLOGICAL ENHANCEMENT SYSTEM FOR TACTICAL OPERATIONS
          </p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-4"></div>
        </div>

        {/* Voice Recording Button */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Button
              onClick={handleRecordingToggle}
              disabled={!isSupported}
              size="lg"
              className={`w-32 h-32 rounded-full jarvis-button relative transition-all duration-500 ${
                isRecording 
                  ? 'bg-gradient-to-r from-destructive/40 to-accent/40 pulse-glow' 
                  : 'bg-gradient-to-r from-primary/40 to-accent/30 hover:scale-110'
              }`}
            >
              <div className={`transition-all duration-300 ${isRecording ? 'animate-pulse' : 'float-animation'}`}>
                {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
              </div>
            </Button>
            
            {/* Concentric circles around button */}
            <div className={`absolute inset-0 rounded-full border border-primary/30 animate-ping ${isRecording ? 'block' : 'hidden'}`}></div>
            <div className={`absolute -inset-4 rounded-full border border-primary/20 animate-ping ${isRecording ? 'block' : 'hidden'}`} style={{animationDelay: '0.5s'}}></div>
            <div className={`absolute -inset-8 rounded-full border border-primary/10 animate-ping ${isRecording ? 'block' : 'hidden'}`} style={{animationDelay: '1s'}}></div>
          </div>
        </div>

        {isRecording && (
          <div className="text-center mb-6 jarvis-card p-4 mx-4 rounded-lg slide-up">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <p className="text-primary font-mono font-medium tracking-wider">VOICE ACTIVE</p>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            </div>
            {transcript && (
              <div className="relative">
                <p className="text-sm text-foreground font-mono max-w-md mx-auto border border-primary/20 rounded p-3 bg-primary/5">
                  <span className="text-primary">{'>'}</span> {transcript}
                </p>
              </div>
            )}
          </div>
        )}

        {!isSupported && (
          <div className="text-center mb-6">
            <div className="jarvis-card p-4 mx-4 rounded-lg border-destructive/50">
              <p className="text-destructive text-sm font-mono">
                [ERROR] VOICE MODULE UNAVAILABLE
              </p>
            </div>
          </div>
        )}

        {/* Recent Items */}
        <div className="space-y-8 px-4">
          {/* Recent Notes */}
          <div className="slide-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary"></div>
              <h2 className="text-lg font-mono font-semibold text-primary tracking-wider">RECENT_NOTES</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-primary to-transparent"></div>
            </div>
            {recentNotes.length > 0 ? (
              <div className="space-y-3">
                {recentNotes.map((note, index) => (
                  <div 
                    key={note.id} 
                    className="jarvis-card p-4 rounded-lg hover:scale-[1.02] transition-all duration-300"
                    style={{animationDelay: `${0.1 * index}s`}}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2 font-mono">{note.content}</p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="jarvis-card p-6 rounded-lg text-center">
                <p className="text-muted-foreground text-sm font-mono">[NO DATA AVAILABLE]</p>
              </div>
            )}
          </div>

          {/* Recent Todos */}
          <div className="slide-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-accent"></div>
              <h2 className="text-lg font-mono font-semibold text-accent tracking-wider">PENDING_TASKS</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-accent to-transparent"></div>
            </div>
            {recentTodos.length > 0 ? (
              <div className="space-y-3">
                {recentTodos.map((todo, index) => (
                  <div 
                    key={todo.id} 
                    className="jarvis-card p-4 rounded-lg hover:scale-[1.02] transition-all duration-300"
                    style={{animationDelay: `${0.1 * index}s`}}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2 font-mono">{todo.title}</p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {new Date(todo.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="jarvis-card p-6 rounded-lg text-center">
                <p className="text-muted-foreground text-sm font-mono">[NO TASKS SCHEDULED]</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorize Dialog */}
      <Dialog open={showCategorizeDialog} onOpenChange={setShowCategorizeDialog}>
        <DialogContent className="jarvis-card border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-primary tracking-wider">DATA_CLASSIFICATION</DialogTitle>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-mono text-muted-foreground">CONTENT:</label>
              <Textarea
                value={recordedText}
                onChange={(e) => setRecordedText(e.target.value)}
                placeholder="[VOICE_INPUT_DETECTED]"
                rows={3}
                className="jarvis-input font-mono resize-none"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-mono text-muted-foreground">CLASSIFICATION:</label>
              <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
                <div className="jarvis-card p-3 rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="note" id="note" className="border-primary" />
                    <Label htmlFor="note" className="font-mono text-sm cursor-pointer">DATA_LOG</Label>
                  </div>
                </div>
                <div className="jarvis-card p-3 rounded-lg hover:border-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="todo" id="todo" className="border-accent" />
                    <Label htmlFor="todo" className="font-mono text-sm cursor-pointer">TASK_QUEUE</Label>
                  </div>
                </div>
                <div className="jarvis-card p-3 rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="event" id="event" className="border-primary" />
                    <Label htmlFor="event" className="font-mono text-sm cursor-pointer">SCHEDULE</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1 jarvis-button font-mono">
                <Save size={16} className="mr-2" />
                EXECUTE
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCategorizeDialog(false)}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
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