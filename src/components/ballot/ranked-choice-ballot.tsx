// src/components/ballot/ranked-choice-ballot.tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BallotOption } from "@/lib/types";

interface RankedChoiceBallotProps {
  options: BallotOption[];
  currentRanking: string[] | null;
  onVote: (rankedOptionIds: string[]) => void;
  disabled: boolean;
}

function SortableItem({
  option,
  rank,
}: {
  option: BallotOption;
  rank: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border-2 bg-white px-4 py-3 ${
        isDragging
          ? "z-10 border-brand-400 shadow-lg"
          : "border-gray-200"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded bg-gray-100 text-gray-400 active:cursor-grabbing"
        aria-label={`Drag to reorder ${option.label}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {rank}
      </div>
      <div className="flex-1">
        <span className="font-medium text-gray-900">{option.label}</span>
        {option.description && (
          <p className="mt-0.5 text-sm text-gray-500">
            {option.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function RankedChoiceBallot({
  options,
  currentRanking,
  onVote,
  disabled,
}: RankedChoiceBallotProps) {
  // Initialize ordering: use current ranking if it exists, otherwise display order
  const [orderedIds, setOrderedIds] = useState<string[]>(() => {
    if (currentRanking && currentRanking.length === options.length) {
      return currentRanking;
    }
    return options.map((o) => o.id);
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedIds.indexOf(active.id as string);
    const newIndex = orderedIds.indexOf(over.id as string);
    const newOrder = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(newOrder);
  }

  const orderedOptions = orderedIds.map(
    (id) => options.find((o) => o.id === id)!
  );

  const hasChanged =
    currentRanking &&
    JSON.stringify(orderedIds) !== JSON.stringify(currentRanking);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Drag and drop to rank your preferences. #1 is your top choice.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {orderedOptions.map((option, index) => (
              <SortableItem
                key={option.id}
                option={option}
                rank={index + 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={() => onVote(orderedIds)}
        disabled={disabled}
        className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
      >
        {currentRanking ? "Update Ranking" : "Submit Ranking"}
      </button>

      {currentRanking && !hasChanged && (
        <p className="text-center text-sm text-green-600">
          This is your current ranking.
        </p>
      )}
    </div>
  );
}
