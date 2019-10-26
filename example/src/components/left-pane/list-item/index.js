import React, { useRef } from 'react';
import ListItemView from './view';
import useDrag from '../../../hooks/useDrag';

function ListItem({ id }) {
  const dragRef = useRef();
  useDrag({
    data: id,
    ref: dragRef
  });
  return <ListItemView ref={dragRef} id={id} />;
}

export default ListItem;
