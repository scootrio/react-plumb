/*
 * Endpoint positions on a node have the following syntax (according to the jsPlumb documentation):
 *
 * ```
 * [x, y, dx, dy]
 * ```
 *
 * Where `x` and `y` are the coordinates in the interval and `dx` and `dy` are the orientation of the curve incident
 * to the anchor (value of 0, 1, or -1). Visually the setup looks like this:
 *
 * ```
 *    0       1
 * 0  - - - - - x
 *    - o o o o
 *    - o o o o
 * 1  - o o o o --> dx = 1, dy = 0
 *    y       |
 *            V
 *      dx = 0, dy = 1
 * ```
 *
 * Where all `o` marks represent the node being drawn.
 * 
 * In the following exported anchors, all connections are pointing away from the figure if it is the source and
 * directly into the figure if it is the target.
 */

// Predefined static endpoints on the top quarter of the figure
export const TOP_LEFT = [0, 0, 0, -1];
export const TOP_LEFT_MIDDLE = [0.25, 0, 0, -1];
export const TOP_MIDDLE = [0.5, 0, 0, -1];
export const TOP = TOP_MIDDLE;
export const TOP_MIDDLE_RIGHT = [0.75, 0, 0, -1];
export const TOP_RIGHT = [1, 0, 0, -1];

// Predefined static endpoints on the right quarter of the figure
export const RIGHT_TOP = [1, 0, 1, 0];
export const RIGHT_TOP_MIDDLE = [1, 0.25, 1, 0];
export const RIGHT_MIDDLE = [1, 0.5, 1, 0];
export const RIGHT = RIGHT_MIDDLE;
export const RIGHT_MIDDLE_BOTTOM = [1, 0.75, 1, 0];
export const RIGHT_BOTTOM = [1, 1, 1, 0];

// Predefined static endpoints on the bottom quarter of the figure
export const BOTTOM_RIGHT = [1, 1, 0, 1];
export const BOTTOM_RIGHT_MIDDLE = [0.75, 1, 0, 1];
export const BOTTOM_MIDDLE = [0.5, 1, 0, 1];
export const BOTTOM = BOTTOM_MIDDLE;
export const BOTTOM_MIDDLE_LEFT = [0.25, 1, 0, 1];
export const BOTTOM_LEFT = [0, 1, 0, 1];

// Predefined static endpoints on the left quarter of the figure
export const LEFT_BOTTOM = [0, 1, -1, 0];
export const LEFT_BOTTOM_MIDDLE = [0, 0.75, -1, 0];
export const LEFT_MIDDLE = [0, 0.5, -1, 0];
export const LEFT = LEFT_MIDDLE;
export const LEFT_MIDDLE_TOP = [0, 0.25, -1, 0];
export const LEFT_TOP = [0, 0, -1, 0];
