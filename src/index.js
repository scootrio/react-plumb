import React, { useRef, useState, useEffect, cloneElement, createElement } from 'react';
import { jsPlumb } from 'jsplumb';
import uuid from 'uuid/v4';

export function withEndpoints(endpoints) {
  return function(Component) {
    // We just need to wrap it in a new component that we can set default properties on (maintain immutability, pure
    // functions)
    function ComponentWithEndpoints(props) {
      return createElement(Component, props);
    }

    // We apply the endpoints to the default props so that
    //
    // 1) the developer doesn't need to explicitly include the prop when using the component, and
    // 2) while doing so, the endpoints will be visible to the `usePlumbContainer()` hook
    //
    // This comes with the added advantage that, if the developer needs to override endpoint settings for certain
    // instances, they can by passing in an `endpoints` property to the component.
    ComponentWithEndpoints.defaultProps = {
      endpoints
    };

    return ComponentWithEndpoints;
  };
}

export function usePlumbContainer(options = {}) {
  const ref = useRef();
  const instance = useState(jsPlumb.getInstance())[0];
  const [bound, setBound] = useState(false);
  const initializedNodes = useState({})[0];
  const initializedConnections = useState({})[0];
  const moved = useRef(false);

  if (!bound) {
    // Bind to new connections
    //
    instance.bind('connection', (info, ev) => {
      console.log('Connection event fired');
      if (ev) {
        if (moved.current) {
          moved.current = false;
          return;
        }
        info.connection.id = uuid();
        info.connection.idPrefix = '';
        let conn = _connection(info.connection);

        initializedConnections[conn.id] = true;

        if (options.onConnect) {
          options.onConnect(conn);
        }
      }
    });

    // Bind to disconnect
    //
    instance.bind('connectionDetached', (info, ev) => {
      console.log('Disconnect event fired');
      if (ev) {
        if (moved.current) {
          moved.current = false;
          return;
        }
        let conn = _connection(info.connection);

        delete initializedConnections[conn.id];

        if (options.onDisconnect) {
          options.onDisconnect(conn);
        }
      }
    });

    // Bind to a connection move event
    //
    instance.bind('connectionMoved', (info, ev) => {
      console.log('Connection moved event fired');
      if (ev) {
        moved.current = true;
        // Invoke the connect and disconnect callbacks from here.
        //
        // For jsPlumb, the "new" connection resulting from the move is not actually new. An existing connection
        // simply had it's endpoint changed. This is not how we want to represent a moved connection. We want a moved
        // connection to mimic the destruction of an old connection and the creation of a new connection. This means
        // that each connection will have two completely different IDs.
        //
        // We need to get the old connection ID before calling the disconnect callback, and then we need to construct
        // a new connection to pass to the onConnect callback. Behind the scenes we simply do an ID swap on the jsPlumb
        // connection object.
        let newConn = _connection(info.connection);
        let oldConn = { ...newConn };
        newConn.id = uuid();
        info.connection.id = newConn.id;
        if (info.index === 0) {
          // Source changed
          oldConn.source.id = info.originalSourceId;
          oldConn.source.endpoint = info.originalSourceEndpoint.getUuid();
        } else {
          // Target Changed
          oldConn.target.id = info.originalTargetId;
          oldConn.target.endpoint = info.originalTargetEndpoint.getUuid();
        }

        delete initializedConnections[oldConn.id];
        initializedConnections[newConn.id] = true;

        if (options.onConnectionMoved) {
          options.onConnectionMoved(oldConn, newConn);
        }
      }
    });

    // Scope logic.
    //
    // jsPlumb offers 'connection' and 'connectionMoved' events that we could bind to, but these are fired after jsPlumb
    // has already manipulated the DOM. We want React to have exclusive rights to the DOM, so we need to intercept the
    // creation of a connection by jsPlumb and instead modify state so that React can update the DOM.
    instance.bind('beforeDrop', info => {
      // TODO: scopes
      return true;
    });

    setBound(true);
  }

  function plumb(children) {
    let childrenArray = React.Children.toArray(children);

    useEffect(() => {
      function init(child) {
        let id = child.props.id;
        if (!initializedNodes[id]) {
          // Make the element draggable
          // TODO: maybe...if the remove button is clicked and the user, realizing they made a mistake, attempts to
          // drag away from it, then the entire element moves with their mouse and they cannot avoid deleteing the
          // element. We need to find a way to avoid this.
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
          initializedNodes[id] = true;
        }
      }

      instance.setContainer(ref.current);
      childrenArray.forEach(init);

      // Now that all the nodes have been initialized, we can draw any initial connections we received
      if (options.connections) {
        // TODO: figure out the performance implications of this approach. How do we improve it?
        console.log('Initializing Connections');
        // We first need to remove all of the old connections. This is important for cases where a connection has been
        // moved so we don't cause errors by exceeding the maximum number of connections on a re-render.
        let currentConnections = {};
        Object.values(options.connections).forEach(c => {
          currentConnections[c.id] = c;
        });
        Object.keys(initializedConnections).forEach(id => {
          if (!currentConnections[id]) {
            console.log('Detected missing connection with ID: ' + id);
            // The connection has been removed
            let conn = instance.getConnections().filter(c => c.id === id)[0];
            instance.deleteConnection(conn, { force: true });
            delete initializedConnections[id];
          }
        });

        options.connections.forEach(conn => {
          let id = conn.id;
          if (!initializedConnections[id]) {
            let newConnection = instance.connect({
              uuids: [conn.source.endpoint, conn.target.endpoint]
            });
            newConnection.id = id;
            newConnection.idPrefix = '';
            initializedConnections[id] = true;
          }
        });
      }

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
          // TODO: need to trigger state change for connections that are removed
          if (!child.props.onRemove || typeof child.props.onRemove !== 'function') {
            // If no event handler for removing a node has been registered, then it is safe to assume that React
            // is not controlling the DOM when removing a node registered with jsPlumb elements. We can just remove it.
            //
            // TODO: evaluate this assumption. Do we want to trigger a re-render anyways and just let React do its
            // thing?
            //
            instance.remove(id);
          } else {
            // React will take care of the DOM for us, but we need to unregister everything associated with
            // the element we are removing from jsPlumb.
            //
            let conns = [...instance.getConnections({ source: id }), ...instance.getConnections({ target: id })].map(
              _connection
            );
            _unregister(id, instance);
            delete initializedNodes[id];

            conns.forEach(c => {
              delete initializedConnections[c.id];
            });

            // Call the user-defined remove function
            child.props.onRemove(id, conns);
          }
          delete initializedNodes[id];
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
    // There is no existing API into the jsplumb instance that lets us do this cleanly
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

function _connection(connection) {
  return {
    id: connection.id,
    source: {
      id: connection.sourceId,
      endpoint: connection.endpoints[0].getUuid()
    },
    target: {
      id: connection.targetId,
      endpoint: connection.endpoints[1].getUuid()
    }
  };
}
