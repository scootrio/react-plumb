import { useEffect } from 'react';

function useDrop({ ref, onDrop }) {
  const dropOverCb = ev => {
    ev.preventDefault();
  };

  const dropCb = ev => {
    ev.preventDefault();
    let data = JSON.parse(ev.dataTransfer.getData('source'));
    onDrop({
      x: ev.offsetX - data.offsetX,
      y: ev.offsetY - data.offsetY,
      data: data.data
    });
  };
  useEffect(() => {
    const elem = ref.current;
    if (elem) {
      elem.addEventListener('dragover', dropOverCb);
      elem.addEventListener('drop', dropCb);
      return () => {
        elem.removeEventListener('dragover', dropOverCb);
        elem.removeEventListener('drop', dropCb);
      };
    }
  });
}

export default useDrop;
