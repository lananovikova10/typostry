import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

const initialItems: TodoItem[] = [
  { id: 1, text: "Write blog post about Markdown features", done: true },
  { id: 2, text: "Add code examples to documentation", done: false },
  { id: 3, text: "Review team's pull requests", done: false },
];

const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#6366f1", "#ef4444", "#06b6d4"];
const STORAGE_KEY = "typostry-todos";

// Load todos from localStorage
const loadTodos = (): TodoItem[] => {
  if (typeof window === "undefined") return initialItems;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialItems;
  } catch {
    return initialItems;
  }
};

// Save todos to localStorage
const saveTodos = (todos: TodoItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("Failed to save todos:", error);
  }
};

export function TodoCard() {
  const [items, setItems] = useState<TodoItem[]>(loadTodos);
  const [dateInfo, setDateInfo] = useState({ date: "", time: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [newTodoText, setNewTodoText] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const newTodoInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever items change
  useEffect(() => {
    saveTodos(items);
  }, [items]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateInfo({ date, time });
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Focus input when adding new todo
  useEffect(() => {
    if (isAddingNew && newTodoInputRef.current) {
      newTodoInputRef.current.focus();
    }
  }, [isAddingNew]);

  const toggleItem = (id: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const startEdit = (id: number, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editingId !== null && editText.trim()) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, text: editText.trim() } : i))
      );
      setEditingId(null);
      setEditText("");
    } else {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const deleteTodo = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addNewTodo = () => {
    if (newTodoText.trim()) {
      const newId = Math.max(...items.map((i) => i.id), 0) + 1;
      setItems((prev) => [...prev, { id: newId, text: newTodoText.trim(), done: false }]);
      setNewTodoText("");
      setIsAddingNew(false);
    }
  };

  const cancelAddNew = () => {
    setNewTodoText("");
    setIsAddingNew(false);
  };

  const resetList = () => {
    setItems(initialItems);
    saveTodos(initialItems);
  };

  const allDone = useMemo(() => items.length > 0 && items.every((i) => i.done), [items]);

  const [celebrating, setCelebrating] = useState(false);
  const wasAllDoneRef = useRef(false);

  useEffect(() => {
    if (allDone && !wasAllDoneRef.current) {
      setCelebrating(true);
      wasAllDoneRef.current = true;
      const t = setTimeout(() => setCelebrating(false), 4000);
      return () => clearTimeout(t);
    }
    if (!allDone) {
      wasAllDoneRef.current = false;
      setCelebrating(false);
    }
  }, [allDone]);

  const Header = (
    <div
      className={`flex items-center justify-between px-4 py-3 border-b transition-colors ${
        allDone
          ? "bg-success/10 border-success/20"
          : "bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10 border-violet-200 dark:border-violet-800"
      }`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-sm font-semibold text-foreground">{dateInfo.date}</span>
        <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium px-2 py-1 rounded-md">
          {dateInfo.time}
        </span>
      </div>

      {allDone ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-success">All done!</span>
          <button
            onClick={resetList}
            className="text-foreground font-semibold text-xs px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 transition"
          >
            Reset
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="text-violet-600 dark:text-violet-400 font-semibold text-sm hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      )}
    </div>
  );

  return (
    <div
      className={`w-[380px] rounded-lg shadow-lg border overflow-hidden bg-card transition-all duration-500 ${
        allDone ? "border-success/30 ring-2 ring-success/20 scale-[1.01]" : "border-border"
      }`}
    >
      {Header}

      <div className="relative p-5 bg-card">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {allDone ? "You crushed it today" : "Things to do today"}
        </h3>

        {!allDone && (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={`group flex items-center gap-2 px-2 py-1 rounded-lg transition ${
                  item.done ? "bg-muted/50" : ""
                }`}
              >
                <label className="relative inline-flex items-center justify-center w-6 h-6 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className="peer appearance-none absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200 ease-out transform ${
                      item.done
                        ? "bg-primary border-primary scale-95"
                        : "border-input bg-background scale-100"
                    }`}
                  >
                    <svg
                      className={`w-3 h-3 text-primary-foreground transition-opacity duration-200 ${
                        item.done ? "opacity-100" : "opacity-0"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 12 9"
                    >
                      <path d="M1 4.2L4 7L11 1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </label>

                {editingId === item.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 text-sm px-2 py-1 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    />
                    <button
                      onClick={saveEdit}
                      className="p-1 text-success hover:bg-success/10 rounded transition"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm transition-all duration-200 ${
                        item.done
                          ? "font-semibold text-foreground translate-x-[2px]"
                          : "text-foreground"
                      }`}
                    >
                      {item.text}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(item.id, item.text)}
                        className="p-1 text-muted-foreground hover:bg-muted rounded transition"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTodo(item.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}

            {/* Add new todo input */}
            {isAddingNew && (
              <li className="flex items-center gap-2 px-2 py-1 rounded-lg bg-accent/50 border border-accent">
                <div className="w-6 h-6 flex-shrink-0" />
                <input
                  ref={newTodoInputRef}
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNewTodo();
                    if (e.key === "Escape") cancelAddNew();
                  }}
                  placeholder="New todo..."
                  className="flex-1 text-sm px-2 py-1 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
                <button
                  onClick={addNewTodo}
                  className="p-1 text-success hover:bg-success/10 rounded transition"
                  title="Add"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelAddNew}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            )}
          </ul>
        )}

        {allDone && (
          <div className="relative">
            <p className="mt-1 text-sm text-muted-foreground font-medium">Take a breather and celebrate!</p>
            {celebrating && <ConfettiOverlay />}
          </div>
        )}

        {!allDone && !isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="mt-4 w-full text-sm text-muted-foreground font-medium hover:text-foreground flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition"
          >
            <Plus className="w-4 h-4" />
            Add new todo
          </button>
        )}
      </div>
    </div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 36 });
  return (
    <>
      <style>
        {`
        @keyframes confetti-fall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(80vh) rotate(720deg); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-piece { animation: none !important; }
        }
      `}
      </style>
      <div className="pointer-events-none fixed inset-0">
        {pieces.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 0.5;
          const duration = 2.5 + Math.random() * 1.2;
          const size = 6 + Math.random() * 6;
          const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
          return (
            <span
              key={i}
              className="confetti-piece absolute rounded-sm"
              style={{
                left: `${left}%`,
                top: "-10px",
                width: `${size}px`,
                height: `${size * 0.4}px`,
                backgroundColor: color,
                transform: "translateY(0)",
                animation: `confetti-fall ${duration}s ease-in forwards`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}
