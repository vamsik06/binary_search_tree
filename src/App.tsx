import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Sun, Moon } from "lucide-react";

/* --------------------------------- Helpers -------------------------------- */
// Simple binary‑search‑tree node
interface TreeNode {
  id: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface NodePosition {
  x: number;
  y: number;
  level: number;
}

function insertIntoBST(root: TreeNode | null, value: number): TreeNode {
  if (!root) return { id: value, left: null, right: null };
  if (value < root.id) {
    return { ...root, left: insertIntoBST(root.left, value) };
  }
  return { ...root, right: insertIntoBST(root.right, value) };
}

// Updated calculatePositions to fit all nodes in the box
function calculatePositions(
  node: TreeNode | null,
  level = 0,
  position = 0,
  map = new Map<number, NodePosition>(),
  _depth = 0,
  _maxLeaves = 0
): Map<number, NodePosition> {
  if (!node) return map;
  const containerWidth = 520;
  const verticalSpacing = 80; // Fixed spacing between levels
  const slots = Math.pow(2, level);
  const horizontalSpacing = containerWidth / slots;
  const x = horizontalSpacing * (position + 0.5);
  const y = 20 + level * verticalSpacing;
  map.set(node.id, { x, y, level });
  if (node.left) calculatePositions(node.left, level + 1, position * 2, map);
  if (node.right) calculatePositions(node.right, level + 1, position * 2 + 1, map);
  return map;
}

function getHorizontalOffset(positions: Map<number, NodePosition>, canvasWidth: number) {
  if (positions.size === 0) return 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const pos of positions.values()) {
    if (pos.x < minX) minX = pos.x;
    if (pos.x > maxX) maxX = pos.x;
  }
  const treeWidth = maxX - minX;
  return (canvasWidth / 2) - (minX + treeWidth / 2);
}

function renderLines(node: TreeNode | null, positions: Map<number, NodePosition>, xOffset = 0): React.ReactElement[] {
  if (!node) return [];
  const lines: React.ReactElement[] = [];
  const nodePos = positions.get(node.id);
  const nodeRadius = 20; // Node is 40x40px
  if (node.left && nodePos) {
    const leftPos = positions.get(node.left.id);
    if (leftPos) {
      lines.push(
        <motion.line
          key={`${node.id}-left`}
          x1={nodePos.x + xOffset}
          y1={nodePos.y + nodeRadius}
          x2={leftPos.x + xOffset}
          y2={leftPos.y - nodeRadius}
          stroke="#6b7280"
          strokeWidth="4"
          strokeLinecap="round"
          className=""
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />,
      );
      lines.push(...renderLines(node.left, positions, xOffset));
    }
  }
  if (node.right && nodePos) {
    const rightPos = positions.get(node.right.id);
    if (rightPos) {
      lines.push(
        <motion.line
          key={`${node.id}-right`}
          x1={nodePos.x + xOffset}
          y1={nodePos.y + nodeRadius}
          x2={rightPos.x + xOffset}
          y2={rightPos.y - nodeRadius}
          stroke="#6b7280"
          strokeWidth="4"
          strokeLinecap="round"
          className=""
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />,
      );
      lines.push(...renderLines(node.right, positions, xOffset));
    }
  }
  return lines;
}

/* --------------------------- Main Visualizer ------------------------------ */
export default function App() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [usedValues, setUsedValues] = useState<number[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [treeOffset, setTreeOffset] = useState(0); // Store the offset
  const predefinedValues = [10, 20, 30, 40, 50, 60, 70];
  const canvasWidth = 520;
  const canvasHeight = 480;

  // Apply dark mode styles
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--bg-primary', '#111827');
      root.style.setProperty('--bg-secondary', '#1f2937');
      root.style.setProperty('--bg-tertiary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--border-color', '#4b5563');
      root.style.setProperty('--canvas-bg', '#111827');
    } else {
      root.style.setProperty('--bg-primary', '#f9fafb');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-tertiary', '#f3f4f6');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#d1d5db');
      root.style.setProperty('--canvas-bg', '#ffffff');
    }
  }, [isDarkMode]);

  const positions = useMemo(() => calculatePositions(tree), [tree]);

  // Only recalculate offset when tree is empty or reset
  useEffect(() => {
    if (tree && usedValues.length === 1) {
      // First node added, center it
      setTreeOffset(getHorizontalOffset(positions, canvasWidth));
    }
    if (!tree) {
      setTreeOffset(0);
    }
  }, [tree, usedValues.length, positions, canvasWidth]);

  /* -------------------------- Event handlers ---------------------------- */
  const handleInsert = (value: number) => {
    if (usedValues.includes(value)) return;
    setTree(prev => insertIntoBST(prev, value));
    setUsedValues(prev => [...prev, value]);
  };

  const resetTree = () => {
    setTree(null);
    setUsedValues([]);
    setTreeOffset(0);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  /* ------------------------------ Render ------------------------------- */
  return (
    <div 
      className="min-h-screen transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <main className="min-h-screen flex items-center justify-center px-4 py-4">
        <div 
          className="w-full min-w-[580px] h-[600px] p-4 rounded-lg border transition-colors duration-200"
          style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4 h-16">
            <div className="flex flex-wrap gap-2">
              {predefinedValues.map(value => (
                <button
                  key={value}
                  onClick={() => handleInsert(value)}
                  disabled={usedValues.includes(value)}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    usedValues.includes(value)
                      ? 'cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  style={{
                    backgroundColor: usedValues.includes(value) 
                      ? 'var(--bg-tertiary)' 
                      : undefined,
                    color: usedValues.includes(value) 
                      ? 'var(--text-secondary)' 
                      : undefined
                  }}
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={resetTree} 
                className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-gray-100 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>

              <button 
                onClick={toggleTheme} 
                className="px-3 py-1 border rounded flex items-center gap-1 hover:bg-gray-100 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div 
            className="relative w-full max-h-[480px] h-[480px] rounded-lg border overflow-y-auto flex items-center justify-center transition-colors duration-200"
            style={{
              backgroundColor: 'var(--canvas-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            {!tree ? (
              <div 
                className="flex items-center justify-center h-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Click a number to build your BST
              </div>
            ) : (
              <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
                {/* Connecting lines */}
                <svg className="absolute left-0 top-0 w-full h-full pointer-events-none">
                  <AnimatePresence>
                    {renderLines(tree, positions, treeOffset)}
                  </AnimatePresence>
                </svg>

                {/* Nodes */}
                <AnimatePresence>
                  {[...positions.entries()].map(([id, pos]) => {
                    return (
                      <motion.div
                        key={id}
                        className="absolute w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-base shadow-lg border-2 border-white"
                        style={{ left: pos.x + treeOffset - 20, top: pos.y - 20 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {id}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
