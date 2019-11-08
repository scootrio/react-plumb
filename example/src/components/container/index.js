import React, { useState } from 'react';
import ContainerView from './view';
import useDrop from '../../hooks/useDrop';
import usePlumbContainer from 'react-plumb';
import Node from './node';
import './plumb-styles.css';
import initialState, { genid } from './state';

function Container() {
  const [state, setState] = useState(initialState);
  console.log('Rendering Container with state', state);
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
  const onRemove = (id, connections) => {
    let removedIds = connections.map(c => c.id);
    setState(prev => ({
      nodes: prev.nodes.filter(n => n.id !== id),
      connections: prev.connections.filter(c => !removedIds.includes(c.id))
    }));
  };

  const [ref, plumb] = usePlumbContainer({
    onDragStart: () => {},
    onDragStop: (id, x, y) =>
      setState(prev => ({
        connections: [...prev.connections],
        nodes: prev.nodes.map(s => (s.id === id ? { id, x, y } : { ...s }))
      })),
    onConnect: conn => {
      console.log('Connect', conn);
      setState(prev => ({ ...prev, connections: [...prev.connections, conn] }));
    },
    onDisconnect: conn => {
      console.log('Disconnect', conn);
      setState(prev => ({ ...prev, connections: prev.connections.filter(c => c.id !== conn.id) }));
    },
    onConnectionMoved: (oldConn, newConn) => {
      console.log('Connection Moved', oldConn, newConn);
      setState(prev => {
        let connections = prev.connections.filter(c => c.id !== oldConn.id);
        connections.push(newConn);
        return { ...prev, connections };
      });
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
