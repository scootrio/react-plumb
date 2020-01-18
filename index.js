import React, { useRef, useState, useEffect, cloneElement } from 'react';
import { jsPlumb } from 'jsplumb';
import uuid from 'uuid/v4';

/**
 * Hook for applying jsPlumb functionality to a container component. The container will use an isolated instance of
 * jsPlumb.
 *
 * @param {Object} [options] Options used to configure the hook behavior.
 * @returns {[React.MutableRefObject<undefined>, Function]} the reference used to initialze the container and the
 * `plumb()` function used to bind jsPlumb functionality to the rendered child nodes.
 */
export function usePlumbContainer(options = {}) {
  // Our reference to the container DOM element. We use this to scope the jsPlumb instance to the container.
  const ref = useRef();
  useEffect(() => {
    instance.setContainer(ref.current);
    instance.setDefaultScope('default');
  }, [ref]);

  // State required for jsPlumb
  const instance = useState(jsPlumb.getInstance())[0];
  const initializedNodes = useState({})[0];
  const initializedConnections = useState({})[0];
  const moved = useRef(false);

  // Unbind all previous handlers and bind new ones. We have to do this due to the update nature of
  // React. If we don't rebind on every call, then functions passed by the developer that rely on old state
  // values in their environment will never be updated to use the new environment. This should not
  // introduce a significant performance impact.
  //
  instance.unbind();

  function _maybeStopEvent(ev) {
    if (options.stopEvents) {
      ev.stopPropagation();
      ev.preventDefault();
    }
  }

  function _bindConnectionHandlers(jsPlumbConn) {
    // Allow handlers to be bound to connections
    if (options.connectionHandlers) {
      let handlers = options.connectionHandlers;
      if (handlers.onClick) {
        jsPlumbConn.bind('click', (_, ev) => {
          _maybeStopEvent(ev);
          handlers.onClick(_connection(jsPlumbConn), jsPlumbConn);
        });
      }
    }
  }

  // Bind to new connections
  //
  instance.bind('connection', (info, ev) => {
    if (ev) {
      _maybeStopEvent(ev);
      if (moved.current) {
        moved.current = false;
        return;
      }
      info.connection.id = uuid();
      info.connection.idPrefix = '';
      let conn = _connection(info.connection);

      // Allow handlers to be bound to connections
      _bindConnectionHandlers(info.connection);

      initializedConnections[conn.id] = true;

      if (options.onConnect) {
        options.onConnect(conn, info.connection);
      }
    }
  });

  // We also need to re-bind the handlers on existing connections so that they are using the latest state
  //
  instance.getAllConnections().forEach(c => {
    c.unbind();
    _bindConnectionHandlers(c);
  });

  // Bind to disconnect
  //
  instance.bind('connectionDetached', (info, ev) => {
    if (ev) {
      _maybeStopEvent(ev);
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
    if (ev) {
      _maybeStopEvent(ev);
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
      let oldConn = {
        id: info.connection.id,
        scope: info.connection.scope,
        source: {
          id: info.originalSourceId,
          endpoint: info.originalSourceEndpoint.getUuid()
        },
        target: {
          id: info.originalTargetId,
          endpoint: info.originalTargetEndpoint.getUuid()
        }
      };
      info.connection.id = uuid();
      let newConn = _connection(info.connection);

      delete initializedConnections[oldConn.id];
      initializedConnections[newConn.id] = true;

      if (options.onConnectionMoved) {
        options.onConnectionMoved(oldConn, newConn);
      }
    }
  });

  // Bind to the dragging of a new and existing connections
  //
  function connectionDrag(info, ev) {
    if (ev) {
      _maybeStopEvent(ev);
    }
    if (options.onConnectionDrag) {
      let candidates = [];
      instance.selectEndpoints({ scope: info.endpoint.scope }).each(endpoint => {
        candidates.push({
          id: endpoint.elementId,
          endpoint: endpoint.getUuid()
        });
      });
      let pendingConnection = {
        candidates
      };
      if (info.connection) {
        // Dealing with an existing connection
        if (info.connection.endpoints[0].elementId === info.sourceId) {
          // The source is being changed
          pendingConnection.scope = info.connection.endpoints[1].scope;
          pendingConnection.source = null;
          pendingConnection.target = {
            id: info.connection.endpoints[1].elementId,
            endpoint: info.connection.endpoints[1].getUuid()
          };
        } else {
          // The target is being changed
          pendingConnection.scope = info.connection.endpoints[0].scope;
          pendingConnection.source = {
            id: info.connection.endpoints[0].elementId,
            endpoint: info.connection.endpoints[0].getUuid()
          };
          pendingConnection.target = null;
        }
      } else {
        // Dealing with a new connection
        pendingConnection.source = {
          id: info.sourceId,
          endpoint: info.endpoint.getUuid()
        };
        pendingConnection.target = null;
      }
      options.onConnectionDrag(pendingConnection);
    }
  }
  instance.bind('beforeDrag', connectionDrag);
  instance.bind('beforeStartDetach', connectionDrag);

  /**
   * Initializes the child components of a plumb container to be used as the node elements in jsPlumb.
   *
   * @param {React.Component|React.Component[]} [children] the child components representing the nodes in jsPlumb
   */
  function plumb(children) {
    let childrenArray;
    if (children.type && children.type === React.Fragment) {
      childrenArray = React.Children.toArray(children.props.children);
    } else {
      childrenArray = React.Children.toArray(children);
    }

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
            },
            grid: options.dragGrid
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

      childrenArray.forEach(init);

      // Now that all the nodes have been initialized, we can draw any initial connections we received
      //
      // Notice that we cannot separate the initialization of the nodes and connections into two separate `useEffect()`
      // calls because we have a strict requirement on the order of initialization.
      //
      if (options.connections) {
        // TODO: figure out the performance implications of this approach. How do we improve it?
        // We first need to remove all of the old connections. This is important for cases where a connection has been
        // moved so we don't cause errors by exceeding the maximum number of connections on a re-render.
        let currentConnections = {};
        Object.values(options.connections).forEach(c => {
          let conn = options.connectionPropPath ? _destructureToPlumbProps(c, options.connectionPropPath) : c;
          currentConnections[conn.id] = conn;
        });
        Object.keys(initializedConnections).forEach(id => {
          if (!currentConnections[id]) {
            // The connection has been removed
            let conn = instance.getConnections().filter(c => c.id === id)[0];
            instance.deleteConnection(conn, { force: true });
            delete initializedConnections[id];
          }
        });

        options.connections.forEach(c => {
          let conn = options.connectionPropPath ? _destructureToPlumbProps(c, options.connectionPropPath) : c;
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
    }, [childrenArray, options, initializedConnections, initializedNodes]);

    /**
     * Intercepts the `onRemove` callback registered by the child's parent component and performs logic necessary for
     * preventing memory leaks in jsPlumb.
     *
     * @param {React.Component} child A single child component of the jsPlumb container.
     * @returns {React.Component} A clone of the old component with the `onRemove` property intercepted and extended.
     */
    function interceptOnRemoveNode(child) {
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
    return childrenArray.map(interceptOnRemoveNode);
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
    scope: connection.scope,
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

function _destructureToPlumbProps(obj, path) {
  let props = null;
  path.split('.').forEach(function(part) {
    if (props === null) props = obj[part];
    else props = props[part];
  });
  return props;
}
