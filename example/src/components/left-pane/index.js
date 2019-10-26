import React from 'react';
import View from './view';
import ListItem from './list-item';

function LeftPane() {
  return (
    <View>
      {[1, 2, 3].map(i => (
        <ListItem key={i} id={i} />
      ))}
    </View>
  );
}

export default LeftPane;
