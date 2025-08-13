import React, { useState, useEffect } from 'react';
import type { SchemaNode } from './Schema';

const TreeNode: React.FC<{
  node: SchemaNode;
  onNodeToggle: (node: SchemaNode) => void;
}> = ({ node, onNodeToggle }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (node.hasChildren) {
      setIsOpen(!isOpen);
      onNodeToggle(node);
    }
  };

  return (
    <div style={{ marginLeft: '20px' }}>
      <div>
        <span onClick={handleToggle} style={{ cursor: 'pointer' }}>
          {node.hasChildren ? (isOpen ? '[-]' : '[+]') : '•'}{' '}
        </span>
        <a href={`https://datacommons.org/browser/${node.name}`} target="_blank" rel="noopener noreferrer">
          {node.name}
        </a>
      </div>
      {isOpen && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.name}
              node={child}
              onNodeToggle={onNodeToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [schema, setSchema] = useState<SchemaNode | null>(null);

  const fetchChildren = async (nodeName: string): Promise<SchemaNode[]> => {
    const response = await fetch(
      `https://api.datacommons.org/v2/node?key=${process.env.REACT_APP_API_KEY}&nodes=${nodeName}&property=%3C-subClassOf`
    );
    const data = await response.json();
    const nodes = data?.data?.[nodeName]?.arcs?.subClassOf?.nodes || [];

    const childrenWithHasChildren = await Promise.all(
      nodes.map(async (n: any) => {
        const childResponse = await fetch(
          `https://api.datacommons.org/v2/node?key=${process.env.REACT_APP_API_KEY}&nodes=${n.dcid}&property=%3C-subClassOf`
        );
        const childData = await childResponse.json();
        const grandChildren =
          childData?.data?.[n.dcid]?.arcs?.subClassOf?.nodes || [];
        return {
          name: n.dcid,
          children: [],
          isFetched: false,
          hasChildren: grandChildren.length > 0,
        };
      })
    );

    return childrenWithHasChildren;
  };

  useEffect(() => {
    const init = async () => {
      const children = await fetchChildren('Thing');
      setSchema({
        name: 'Thing',
        children: children,
        isFetched: true,
        hasChildren: children.length > 0,
      });
    };
    init();
  }, []);

  const handleNodeToggle = async (node: SchemaNode) => {
    if (!node.isFetched) {
      const children = await fetchChildren(node.name);
      const newSchema = { ...schema! };
      const updateChildren = (nodes: SchemaNode[]): SchemaNode[] => {
        return nodes.map((n) => {
          if (n.name === node.name) {
            return { ...n, children: children, isFetched: true };
          }
          if (n.children.length > 0) {
            return { ...n, children: updateChildren(n.children) };
          }
          return n;
        });
      };
      newSchema.children = updateChildren(newSchema.children);
      setSchema(newSchema);
    }
  };

  if (!schema) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Data Commons Schema Visualizer</h1>
      <TreeNode node={schema} onNodeToggle={handleNodeToggle} />
    </div>
  );
};

export default App;