import React, { forwardRef } from 'react';
import styled from 'styled-components';

const ContainerContent = styled.div`
  width: 1000px;
  height: 1000px;
  position: relative;
`;

function Container({ children }, ref) {
  return <ContainerContent ref={ref}>{children}</ContainerContent>;
}

export default forwardRef(Container);
