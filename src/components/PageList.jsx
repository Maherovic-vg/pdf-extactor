import { Document, Page } from "react-pdf";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";

export default function PageList({ pages, setPages }) {
  const [rendered, setRendered] = useState({}); // cache success loads

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(pages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setPages(reordered);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Extracted Pages</h2>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="pages" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex gap-4 overflow-x-auto p-2 border rounded-lg bg-white"
            >
              {pages.map((p, index) => {
                const blob = new Blob([new Uint8Array(p.bytes)], {
                  type: "application/pdf",
                });
                const blobUrl = URL.createObjectURL(blob);

                return (
                  <Draggable key={p.id} draggableId={p.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="w-32 h-44 border rounded-lg shadow bg-gray-100 flex flex-col items-center"
                      >
                        <Document
                          file={blobUrl}
                          loading={<div className="text-xs text-gray-500">Loading...</div>}
                          error={<div className="text-xs text-red-500">⚠ Failed</div>}
                          onLoadSuccess={() =>
                            setRendered((prev) => ({ ...prev, [p.id]: true }))
                          }
                        >
                          <Page pageNumber={1} width={100} />
                        </Document>
                        <span className="text-xs mt-1">Page {p.number}</span>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
