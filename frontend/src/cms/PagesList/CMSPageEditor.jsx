import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import DraggableSectionItem from "../components/cms/DraggableSectionItem";

const handleDragEnd = (event) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = pageData.sections.findIndex(
    s => s.sectionKey === active.id
  );
  const newIndex = pageData.sections.findIndex(
    s => s.sectionKey === over.id
  );

  const reordered = arrayMove(
    pageData.sections,
    oldIndex,
    newIndex
  ).map((sec, index) => ({
    ...sec,
    order: index + 1, // 🔥 auto update order
  }));

  setPageData({
    ...pageData,
    sections: reordered,
  });
};
