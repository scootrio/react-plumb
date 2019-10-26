import React from 'react';
import styled from 'styled-components';

const Pane = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  background-color: #cccccc;
  color: #000000;
`;

function LeftPaneView({ children }) {
  return <Pane>{children}</Pane>;
}

export default LeftPaneView;
