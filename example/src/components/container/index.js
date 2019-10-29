import React, { useState } from 'react';
import ContainerView from './view';
import useDrop from '../../hooks/useDrop';
import usePlumbContainer from 'react-plumb';
import Node from './node';
import './plumb-styles.css';
import initialState, { genid } from './state';

function Container() {
  const [state, setState] = useState(initialState);
  const onDrop = data =>
    setState(prev => ({
      connections: [...prev.connections],
      nodes: [
        ...prev.nodes,
        {
          id: genid(),
          x: data.x,
          y: data.y
        }
      ]
    }));
  const onRemove = id => setState(prev => {
    
  });

  const [ref, plumb] = usePlumbContainer({
    onDragStart: () => {},
    onDragStop: (id, x, y) => setState(prev => prev.map(s => (s.id === id ? { id, x, y } : { ...s }))),
    onConnect: (sourceId, targetId) => {
      console.log('Connect', sourceId, targetId);
    },
    onDisconnect: (sourceId, targetId) => {
      console.log('Disconnect', sourceId, targetId);
    },
    onConnectionSourceChange: (sourceId, targetId, originalSourceId) => {
      console.log('Source Change', sourceId, targetId, originalSourceId);
    },
    onConnectionTargetChange: (sourceId, targetId, originalTargetId) => {
      console.log('Target Change', sourceId, targetId, originalTargetId);
    },
    connections: state.connections
  });

  useDrop({
    ref,
    onDrop
  });

  return (
    <ContainerView ref={ref}>
      {plumb(state.nodes.map(c => <Node key={c.id} {...c} onRemove={onRemove} />))}
    </ContainerView>
  );
}

export default Container;
