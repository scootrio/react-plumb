import React, { useRef, useState, useEffect, cloneElement } from 'react';
import { jsPlumb } from 'jsplumb';

export function usePlumbContainer(options = {}) {
  const ref = useRef();
  const instance = useState(jsPlumb.getInstance())[0];
  const initialized = useState({})[0];
  const finishedFirstRegisterRef = useRef(false);

  // TODO: when binding to events, decide how we want the calling component to indicate it only wants to capture
  // events when they are triggered by a user
  //
  // For a quick solution, we could always just pass a boolean as the first argument to the callback that says whether
  // or not the event was user-triggered or programmatic.

  // Bind to new connection events
  //
  instance.bind('connection', (info, ev) => {
    if (finishedFirstRegisterRef.current && options.onConnect) {
      // TODO: consider the endpoints...do we need to pass them on when invoking the provided function?
      options.onConnect(info.sourceId, info.targetId);
    }
  });

  // Bind to disconnect events
  //
  instance.bind('connectionDetached', (info, ev) => {
    if (finishedFirstRegisterRef.current && options.onDisconnect) {
      options.onDisconnect(info.sourceId, info.targetId);
    }
  });

  // Bind to events where a connection has been moved.
  //
  // TODO: decide whether or not to hide this as a default implementation. The reasoning behind this is that, in
  // most cases, the rest of the application will be able to mimic a "moved" event with a "disconnect" followed by
  // a "connect". A default implementation would simply call the user's provided "disconnect" handler followed by
  // their "connect" handler. For the edge cases where the application needs to know about a "move" event explicitly,
  // it can provides one or both of the callbacks used below to bypass the defaults.
  //
  instance.bind('connectionMoved', (info, ev) => {
    if (finishedFirstRegisterRef.current) {
      if (info.index === 0 && options.onConnectionSourceChange) {
        options.onConnectionSourceChange(info.newSourceId, info.newTargetId, info.originalSourceId);
      } else if (info.index === 1 && options.onConnectionTargetChange) {
        options.onConnectionTargetChange(info.newSourceId, info.newTargetId, info.originalTargetId);
      }
    }
  });

  function plumb(children) {
    let childrenArray = React.Children.toArray(children);

    useEffect(() => {
      function init(child) {
        let id = child.props.id;
        if (!initialized[id]) {
          // Make the element draggable
          instance.draggable(id, {
            start: () => {
              if (options.onDragStart) {
                options.onDragStart(id);
              }
            },
            stop: e => {
              if (options.onDragStop) {
                const [x, y] = e.finalPos;
                options.onDragStop(id, x, y);
              }
            }
          });

          // Add any endpoints specified in the properties of the child
          if (child.props.endpoints) {
            child.props.endpoints.forEach(e => {
              instance.addEndpoint(id, e);
            });
          }

          initialized[id] = true;
        }
      }

      instance.setContainer(ref.current);
      childrenArray.forEach(init);
      finishedFirstRegisterRef.current = true;

      // NOTE: we don't need to worry about clean-up when the container component unmounts. As long as each
      // child component has a unique key, React will only rerender elements that do not change. Since these elements
      // remain the same, we don't have to unregister them from jsPlumb.
      //
      // TODO: there may be a case where, external to the node, `onRemove` needs to be called for a single component.
      // In this case, we do need to unregister inside the react lifecycle. We will need some logic here for
      // determining how to do this.
      //
    }, [ref, childrenArray]);

    function intercept(child) {
      let id = child.props.id;
      return cloneElement(child, {
        onRemove: () => {
          if (!child.props.onRemove) {
            // If no event handler for removing a node has been registered, then it is safe to assume that React
            // is not controlling the DOM when removing a node registered with jsPlumb elements. We can just remove it.
            //
            // TODO: evaluate this assumption. Do we want to trigger a re-render anyways and just let React do its
            // thing?
            //
            instance.remove(id);
          } else {
            // React will take care of the DOM for us, but we need to unregister everything associated with
            // the element we are remove from jsPlumb.
            //
            _unregister(id, instance);
            delete initialized[id];

            // Call the user-defined remove function
            if (child.props.onRemove) {
              child.props.onRemove(id);
            }
          }
          delete initialized[id];
        }
      });
    }

    return childrenArray.map(intercept);
  }

  return [ref, plumb];
}

export default usePlumbContainer;

function _unregister(id, instance) {
  let affectedElements = [];
  let info = _info(id, instance);
  if (info.id) {
    instance.batch(function() {
      _remove(info, affectedElements, instance);
    }, false);
  }
  return instance;
}

function _info(id, instance) {
  let el = document.getElementById(id);
  if (el == null) {
    return null;
  } else if (el.nodeType === 3 || el.nodeType === 8) {
    return { el: el, text: true };
  } else {
    var _el = instance.getElement(el);
    return { el: _el, id };
  }
}

function _remove(info, affectedElements, instance) {
  instance.removeAllEndpoints(info.id, true, affectedElements);
  var dm = instance.getDragManager();
  var managedElements = instance.getManagedElements();
  var _one = function(_info) {
    if (dm) {
      dm.elementRemoved(_info.id);
    }
    instance.anchorManager.clearFor(_info.id);

    // TODO: decide how to handle connection
    // Most likely we will use a React state object to programatically add/remove connections
    instance.anchorManager.removeFloatingConnection(_info.id);

    if (instance.isSource(_info.el)) {
      instance.unmakeSource(_info.el);
    }
    if (instance.isTarget(_info.el)) {
      instance.unmakeTarget(_info.el);
    }
    instance.destroyDraggable(_info.el);
    instance.destroyDroppable(_info.el);

    delete instance.floatingConnections[_info.id];
    delete managedElements[_info.id];
    // TODO: We need to clear the offset cache to prevent memory leaks
    // delete offsets[_info.id];
    if (_info.el) {
      _info.el._jsPlumb = null;
    }
  };

  // unregister all affected child elements
  for (var ae = 1; ae < affectedElements.length; ae++) {
    _one(affectedElements[ae]);
  }
  // and always remove the requested one from the dom.
  _one(info);
}
