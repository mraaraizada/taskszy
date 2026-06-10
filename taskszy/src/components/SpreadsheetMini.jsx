import React, { useState, useRef, useEffect, useCallback } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function SpreadsheetMini({ rows = 10, cols = 6 }) {
  // Pre-populate with sample data related to Taskzy project management
  const initialData = {
    'A1': { value: 'Task' },
    'B1': { value: 'Assignee' },
    'C1': { value: 'Status' },
    'D1': { value: 'Priority' },
    'E1': { value: 'Due Date' },
    'A2': { value: 'Design Landing' },
    'B2': { value: 'Sarah Chen' },
    'C2': { value: 'Done' },
    'D2': { value: 'High' },
    'E2': { value: 'Jun 12' },
    'A3': { value: 'API Integration' },
    'B3': { value: 'Mike Ross' },
    'C3': { value: 'In Progress' },
    'D3': { value: 'High' },
    'E3': { value: 'Jun 15' },
    'A4': { value: 'User Testing' },
    'B4': { value: 'Emma Lee' },
    'C4': { value: 'Pending' },
    'D4': { value: 'Medium' },
    'E4': { value: 'Jun 18' },
    'A5': { value: 'Budget Review' },
    'B5': { value: 'John Davis' },
    'C5': { value: 'Done' },
    'D5': { value: 'High' },
    'E5': { value: 'Jun 10' },
    'A6': { value: 'Team Meeting' },
    'B6': { value: 'All Team' },
    'C6': { value: 'Scheduled' },
    'D6': { value: 'Low' },
    'E6': { value: 'Jun 14' },
    'A7': { value: 'Dashboard UI' },
    'B7': { value: 'Sarah Chen' },
    'C7': { value: 'In Progress' },
    'D7': { value: 'High' },
    'E7': { value: 'Jun 16' },
    'A8': { value: 'Database Backup' },
    'B8': { value: 'Mike Ross' },
    'C8': { value: 'Done' },
    'D8': { value: 'Medium' },
    'E8': { value: 'Jun 11' },
    'A9': { value: 'Documentation' },
    'B9': { value: 'Emma Lee' },
    'C9': { value: 'In Progress' },
    'D9': { value: 'Low' },
    'E9': { value: 'Jun 20' },
    'A10': { value: 'Deploy Sprint 3' },
    'B10': { value: 'John Davis' },
    'C10': { value: 'Pending' },
    'D10': { value: 'High' },
    'E10': { value: 'Jun 22' },
  };

  const [cells, setCells] = useState(initialData);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [animatingCell, setAnimatingCell] = useState(null);
  const inputRef = useRef(null);

  // Automatic cell highlighting animation
  useEffect(() => {
    let currentRow = 2; // Start from row 2 (skip header)
    let currentCol = 0;
    
    const interval = setInterval(() => {
      const cellKey = getCellKey(currentRow - 1, currentCol);
      setAnimatingCell(cellKey);
      
      // Move to next cell
      currentCol++;
      if (currentCol >= cols - 1) { // Skip last column (F is empty)
        currentCol = 0;
        currentRow++;
        if (currentRow > rows) {
          currentRow = 2; // Loop back to start (skip header)
        }
      }
    }, 600); // Change cell every 600ms

    return () => clearInterval(interval);
  }, [cols, rows]);

  // Generate column letters (A, B, C, ...)
  const getColumnLetter = (index) => {
    let result = "";
    while (index >= 0) {
      result = String.fromCharCode(65 + (index % 26)) + result;
      index = Math.floor(index / 26) - 1;
    }
    return result;
  };

  // Get cell key from row and column
  const getCellKey = (row, col) => {
    return `${getColumnLetter(col)}${row + 1}`;
  };

  // Get cell value or empty string
  const getCellValue = (row, col) => {
    const key = getCellKey(row, col);
    return cells[key]?.value || "";
  };

  // Update cell value
  const updateCell = (row, col, value) => {
    const key = getCellKey(row, col);
    setCells((prev) => ({
      ...prev,
      [key]: { value },
    }));
  };

  // Handle cell click
  const handleCellClick = (row, col) => {
    const key = getCellKey(row, col);
    setSelectedCell(key);
    setEditingCell(null);
  };

  // Handle cell double click to start editing
  const handleCellDoubleClick = (row, col) => {
    const key = getCellKey(row, col);
    setSelectedCell(key);
    setEditingCell(key);
    setEditValue(getCellValue(row, col));
  };

  // Handle input change during editing
  const handleInputChange = (e) => {
    setEditValue(e.target.value);
  };

  // Handle input key press
  const handleInputKeyDown = (e, row, col) => {
    if (e.key === "Enter") {
      updateCell(row, col, editValue);
      setEditingCell(null);
      if (row < rows - 1) {
        setSelectedCell(getCellKey(row + 1, col));
      }
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      updateCell(row, col, editValue);
      setEditingCell(null);
      if (col < cols - 1) {
        setSelectedCell(getCellKey(row, col + 1));
      }
    }
  };

  // Handle input blur
  const handleInputBlur = (row, col) => {
    updateCell(row, col, editValue);
    setEditingCell(null);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  return (
    <div 
      className="border border-gray-300 rounded-lg overflow-hidden bg-white w-full h-full flex flex-col"
      style={{ 
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {/* Header with selected cell info */}
      <div className="bg-gray-50 border-b border-gray-300 px-2 py-1 flex items-center flex-shrink-0">
        <div className="font-mono" style={{ fontSize: '8px' }}>
          {selectedCell && (
            <>
              <span className="font-semibold text-gray-600">{selectedCell}</span>
              <span className="ml-1 text-gray-600">
                {getCellValue(
                  parseInt(selectedCell.match(/\d+/)?.[0] || "1") - 1,
                  selectedCell.match(/[A-Z]+/)?.[0].charCodeAt(0) - 65 || 0
                )}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Spreadsheet grid - fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full overflow-auto spreadsheet-scroll">
          <style>
            {`
              .spreadsheet-scroll::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              .spreadsheet-scroll::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
              }
              .spreadsheet-scroll::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              .spreadsheet-scroll::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
            `}
          </style>
          <table className="border-collapse w-full h-full">
            <thead>
              <tr>
                {/* Empty corner cell */}
                <th className="bg-gray-100 border border-gray-300 font-medium text-gray-600" style={{ width: '24px', fontSize: '7px', padding: '2px' }}></th>
                {/* Column headers */}
                {Array.from({ length: cols }, (_, col) => (
                  <th 
                    key={col} 
                    className="bg-gray-100 border border-gray-300 font-medium text-gray-600"
                    style={{ fontSize: '8px', padding: '2px' }}
                  >
                    {getColumnLetter(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, row) => (
                <tr key={row}>
                  {/* Row header */}
                  <td 
                    className="bg-gray-100 border border-gray-300 font-medium text-gray-600 text-center"
                    style={{ width: '24px', fontSize: '7px', padding: '2px' }}
                  >
                    {row + 1}
                  </td>
                  {/* Data cells */}
                  {Array.from({ length: cols }, (_, col) => {
                    const cellKey = getCellKey(row, col);
                    const isSelected = selectedCell === cellKey;
                    const isEditing = editingCell === cellKey;
                    const isAnimating = animatingCell === cellKey;
                    return (
                      <td
                        key={col}
                        className={cn(
                          "border border-gray-300 relative cursor-cell transition-colors duration-500 ease-in-out",
                          isAnimating && !isSelected && "bg-blue-50",
                          isSelected && "bg-blue-100 border-blue-500",
                          !isSelected && !isAnimating && "hover:bg-gray-50"
                        )}
                        style={{ 
                          padding: '2px',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                        onClick={() => handleCellClick(row, col)}
                        onDoubleClick={() => handleCellDoubleClick(row, col)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleInputKeyDown(e, row, col)}
                            onBlur={() => handleInputBlur(row, col)}
                            className="w-full h-full px-1 border-none outline-none bg-white"
                            style={{ fontSize: '8px' }}
                          />
                        ) : (
                          <div 
                            className={cn(
                              "w-full h-full px-1 flex items-center overflow-hidden transition-colors duration-500 ease-in-out",
                              isAnimating && !isSelected && "text-blue-600 font-medium"
                            )}
                            style={{ fontSize: '8px' }}
                          >
                            {getCellValue(row, col)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
