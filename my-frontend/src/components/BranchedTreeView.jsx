// BranchedTreeD3.js
import React, { useRef, useEffect } from "react";
import Tree from "react-d3-tree";

export default function BranchedTreeD3({ data }) {
  const treeContainer = useRef(null);

  // Центруємо горизонтально
  useEffect(() => {
    if (treeContainer.current) {
      treeContainer.current.scrollLeft = 200;
    }
  }, []);

  return (
    <div ref={treeContainer} style={{ width: "100%", height: "600px", overflow: "auto" }}>
      <Tree
        data={data}
        orientation="vertical"
        zoomable
        pathFunc="elbow"
        collapsible={false}
        translate={{ x: 500, y: 60 }}
        separation={{ siblings: 2, nonSiblings: 2 }}
        styles={{
          nodes: {
            node: {
              circle: { fill: "#6366f1", r: 17 },
              name: { fontSize: "1.1rem", fontWeight: 700, fill: "#1e293b" },
              attributes: { fontSize: "0.95rem", fill: "#555", fontFamily: "monospace" }
            },
            leafNode: {
              circle: { fill: "#a7f3d0", stroke: "#047857", strokeWidth: 2 },
              name: { fontSize: "1.1rem", fontWeight: 700, fill: "#065f46" },
              attributes: { fontSize: "0.95rem", fill: "#0f5132", fontFamily: "monospace" }
            }
          }
        }}
      />
    </div>
  );
}
