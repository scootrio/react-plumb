import React, { useState } from 'react';
import ContainerView from './view';
import useDrop from '../../hooks/useDrop';
import usePlumbContainer from 'react-plumb';
import Node, { endpoints } from './node';
import './plumb-styles.css';

const genid = () => '' + Math.floor(Math.random() * 10000);

const initialState = [
  {
    id: genid(),
    x: 100,
    y: 400
  },
  {
    id: genid(),
    x: 400,
    y: 100
  },
  {
    id: genid(),
    x: 400,
    y: 400
  }
];

function Container() {
  const [state, setState] = useState(initialState);
  const onDrop = data =>
    setState(prev => [
      ...prev,
      {
        id: genid(),
        x: data.x,
        y: data.y
      }
    ]);
  const onRemove = id => setState(prev => prev.filter(n => n.id !== id));

  const [ref, plumb] = usePlumbContainer({
    onDragStart: () => {},
    onDragStop: (id, x, y) => setState(prev => prev.map(s => (s.id === id ? { id, x, y } : { ...s }))),
    onConnect: (sourceId, targetId) => {
      console.log("Connect", sourceId, targetId);
    },
    onDisconnect: (sourceId, targetId) => {
      console.log("Disconnect", sourceId, targetId);
    },
    onConnectionSourceChange: (sourceId, targetId, originalSourceId) => {
      console.log("Source Change", sourceId, targetId, originalSourceId);
    },
    onConnectionTargetChange: (sourceId, targetId, originalTargetId) => {
      console.log("Target Change", sourceId, targetId, originalTargetId);
    }
  });

  useDrop({
    ref,
    onDrop
  });

  return (
    <ContainerView ref={ref}>
      {plumb(state.map(c => <Node key={c.id} {...c} onRemove={onRemove} endpoints={endpoints} />))}
    </ContainerView>
  );
}

export default Container;
