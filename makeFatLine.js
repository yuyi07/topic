//import * as THREE from "https://threejs.org/build/three.module.js";
import {Line2} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/Line2.js';
import {LineMaterial} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/LineMaterial.js';
import {LineGeometry} from 'https://raw.githack.com/mrdoob/three.js/dev/examples/jsm/lines/LineGeometry.js';

export  function makeXYRectangle(xsize, ysize, center = [0, 0], lineWidth = 15, colorHex = 0xffffff) {

  var positions = [];
  positions.push(-xsize / 2, -ysize / 2, 0);
  positions.push(xsize / 2, -ysize / 2, 0);
  positions.push(xsize / 2, ysize / 2, 0);
  positions.push(-xsize / 2, ysize / 2, 0);
  positions.push(-xsize / 2, -ysize / 2, 0);

  var geometry = new LineGeometry();
  geometry.setPositions(positions);

  var matLine = new LineMaterial({
    color: colorHex,
    linewidth: lineWidth, // in pixels
    //vertexColors: THREE.VertexColors,
    dashed: false

  });
  
  matLine.resolution.set(window.innerWidth, window.innerHeight); 

  var rectangle = new Line2(geometry, matLine);
  rectangle.computeLineDistances();

  rectangle.position.set (center[0],center[1],0);
  return rectangle;
}
