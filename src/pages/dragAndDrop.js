import React, { useState, useEffect } from "react"; 
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

const DragAndDropRanking = ({ items, onSubmit}) => {
  const [traits, setTraits] = useState(items);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reordered = Array.from(traits);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setTraits(reordered);
  };

  return (
    <div className="w-full max-w-md mx-auto text-left">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="traits">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className = "space-y-4">
              {traits.map((trait, index) => (
                <Draggable key={trait} draggableId={trait} index={index}>
                  {(provided) => (
                    <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className = "p-4 bg-white shadow-md rounded-md border border-gray-300"
                    >
                      {index + 1}. {trait}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <button
      onClick = {() => onSubmit(traits)}
      className = "mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Submit Ranking
      </button>
    </div>
  );
};

export default DragAndDropRanking;