import React, { createElement } from 'react';
import { EndpointOptions } from 'jsplumb';

/**
 * Creates a higher-ordered component for attaching jsPlumb endpoint options to a component. The endpoints will be
 * available to the `plumb()` function returned from the `usePlumbContainer()` hook.
 *
 * @param {EndpointOptions[]} endpoints
 * @returns {React.Component} a new component with the endpoint options as a default property
 */
export function withEndpoints(endpoints) {
    return function(Component) {
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