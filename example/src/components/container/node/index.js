import React from 'react';
import styled from 'styled-components';

const NodeView = styled.div`
  width: 50px;
  height: 50px;
  position: absolute;
  box-shadow: 1px 1px 2px black;
  top: ${({ y }) => y + 'px'};
  left: ${({ x }) => x + 'px'};
  display: flex;
`;

const RemoveButton = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: red;
  margin-left: auto;
  align-self: flex-start;
  margin-top: 5px;
  margin-right: 5px;
  cursor: pointer;
`;

function Node({ onRemove, ...props }) {
  return (
    <NodeView {...props}>
      <RemoveButton onMouseUp={onRemove} />
    </NodeView>
  );
}

export default Node;
