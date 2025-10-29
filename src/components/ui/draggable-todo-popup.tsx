"use client";

import { useState, useRef, useEffect } from "react";
import { X, GripVertical } from "lucide-react";
import { TodoCard } from "./to-do-card";

interface DraggableTodoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DraggableTodoPopup({ isOpen, onClose }: DraggableTodoPopupProps) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!popupRef.current) return;

    const rect = popupRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !popupRef.current) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Keep within viewport bounds
      const maxX = window.innerWidth - popupRef.current.offsetWidth;
      const maxY = window.innerHeight - popupRef.current.offsetHeight;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Draggable popup */}
      <div
        ref={popupRef}
        className="fixed z-50 select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? "grabbing" : "auto",
        }}
      >
        {/* Drag handle */}
        <div
          className="absolute -top-10 left-0 right-0 flex items-center justify-between px-3 py-2 bg-primary/95 backdrop-blur-sm rounded-t-lg cursor-grab active:cursor-grabbing border border-border border-b-0"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-primary-foreground text-sm font-medium">
            <GripVertical className="w-4 h-4" />
            <span>Todo List</span>
          </div>
          <button
            onClick={onClose}
            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1 rounded hover:bg-primary-foreground/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Todo card */}
        <div className="relative">
          <TodoCard />
        </div>
      </div>
    </>
  );
}
