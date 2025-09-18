import { Download, Trash2, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Note, Todo } from "@/types";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";

const Settings = () => {
  const [notes, setNotes] = useLocalStorage<Note[]>("besto-notes", []);
  const [todos, setTodos] = useLocalStorage<Todo[]>("besto-todos", []);

  const handleExportData = () => {
    const data = {
      notes,
      todos,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `besto-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      setNotes([]);
      setTodos([]);
      toast({
        title: "Data cleared",
        description: "All your notes and todos have been deleted.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="text-primary" size={24} />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Stats */}
        <Card className="p-4 mb-6">
          <h2 className="font-semibold mb-3">Your Data</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{notes.length}</p>
              <p className="text-sm text-muted-foreground">Notes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{todos.length}</p>
              <p className="text-sm text-muted-foreground">Todos</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold mb-3">Data Management</h2>
            <div className="space-y-3">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full justify-start"
              >
                <Download size={16} className="mr-2" />
                Export All Data
              </Button>
              <Button
                onClick={handleClearAllData}
                variant="destructive"
                className="w-full justify-start"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All Data
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">About Besto</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Version:</strong> 1.0.0 (MVP)</p>
              <p><strong>Tagline:</strong> Capture ideas instantly, act on them effortlessly</p>
              <p className="mt-3">
                Besto is your intelligent voice-powered note-taking companion. 
                Record your thoughts, organize them into notes or todos, and turn ideas into action.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;