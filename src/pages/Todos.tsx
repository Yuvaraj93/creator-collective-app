import { useState } from "react";
import { Search, Plus, CheckSquare, Square, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Todo } from "@/types";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/layout/BottomNav";

const Todos = () => {
  const [todos, setTodos] = useLocalStorage<Todo[]>("besto-todos", []);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredTodos = todos.filter(todo =>
    todo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTodos = filteredTodos.filter(todo => !todo.completed);
  const completedTodos = filteredTodos.filter(todo => todo.completed);

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTodos(prev => [newTodo, ...prev]);
    setNewTodoTitle("");
    setShowAddDialog(false);
    toast({
      title: "Todo added",
      description: "Your new todo has been created.",
    });
  };

  const handleShare = (todo: Todo) => {
    if (navigator.share) {
      navigator.share({
        title: 'Besto Todo',
        text: todo.title,
      });
    } else {
      navigator.clipboard.writeText(todo.title);
      toast({
        title: "Copied to clipboard",
        description: "Todo has been copied to your clipboard.",
      });
    }
  };

  const TodoCard = ({ todo }: { todo: Todo }) => (
    <Card key={todo.id} className="p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => handleToggleTodo(todo.id)}
          className="mt-1"
        />
        <div className="flex-1">
          <p className={`text-sm leading-relaxed ${
            todo.completed ? 'line-through text-muted-foreground' : ''
          }`}>
            {todo.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(todo.createdAt).toLocaleDateString()}
            {todo.completed && ' • Completed'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleShare(todo)}
        >
          <Share2 size={16} />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-primary" size={24} />
            <h1 className="text-2xl font-bold">Todos</h1>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={16} className="mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Todo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  placeholder="What do you need to do?"
                  rows={3}
                />
                <Button onClick={handleAddTodo} className="w-full">
                  Add Todo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="bg-card border rounded-lg p-3 flex-1">
            <p className="text-2xl font-bold text-primary">{pendingTodos.length}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card border rounded-lg p-3 flex-1">
            <p className="text-2xl font-bold text-green-600">{completedTodos.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>

        {/* Todos List */}
        <div className="space-y-6">
          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Square size={20} className="text-primary" />
                Pending ({pendingTodos.length})
              </h2>
              <div className="space-y-3">
                {pendingTodos.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckSquare size={20} className="text-green-600" />
                Completed ({completedTodos.length})
              </h2>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <TodoCard key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTodos.length === 0 && (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <p className="text-muted-foreground mb-2">No todos found for "{searchTerm}"</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search</p>
                </div>
              ) : (
                <div>
                  <CheckSquare className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground mb-2">No todos yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first todo or record one with voice from the home screen
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

export default Todos;