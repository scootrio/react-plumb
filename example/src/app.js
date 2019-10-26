import { hot } from 'react-hot-loader/root';
import React from 'react';
import LeftPane from './components/left-pane';
import Container from './components/container';

function App() {
  return (
    <>
      <LeftPane></LeftPane>
      <Container></Container>
    </>
  );
}

export default hot(App);
