
/**
 * The functions in this file create models in an
 * IFS format that can be drawn using gl.drawElements
 * with primitive type gl.TRIANGLES.  Objects have
 * vertex coordinates for each vertex with a list of indicies
 * for the element array buffer. The return value
 * of each function is an object, model, with properties:
 * model.vertexPositions -- the vertex coordinates;
 * model.indices -- the face indices. 
 *
 * This file also defines a variable (not a function) teapotIFS
 * which is s model of the OpenGL teapot in the same format.
 */
function obj2json(input) {
    
  var vertexPositions=[];
  var indices =[];
  var lines = input.split('\n');
  for(var i = 0; i < lines.length; i++){
    if(lines[i].length > 2) {
      //vertices
      if (lines[i].substring(0,2)=="v ") {
        var vertex=lines[i].split(" ");
        vertexPositions.push(parseFloat(vertex[1]));
        vertexPositions.push(parseFloat(vertex[2]));
        vertexPositions.push(parseFloat(vertex[3]));
      } 
      else if(lines[i].substring(0,3)=="f  ") {
        var face=lines[i].split(" ");
        indices.push(parseFloat(face[2]-1));
        indices.push(parseFloat(face[3]-1));
        indices.push(parseFloat(face[4]-1));
      }
    }
  }
  
  return {
      vertexPositions: new Float32Array(vertexPositions),
      indices: new Uint16Array(indices)
  }
}


 /**
  * Create a model of a cube, centered at the origin.  (This is not
  * a particularly good format for a cube, since an IFS representation
  * has a lot of redundancy.)
  * @side the length of a side of the cube.  If not given, the value will be 1.
  */
function cube(side) {
   var s = (side || 1)/2;
   var coords = [];
   var normals = [];
   var texCoords = [];
   var indices = [];
   function face(xyz, nrm) {
      var start = coords.length/3;
      var i;
      for (i = 0; i < 12; i++) {
         coords.push(xyz[i]);
      }
      for (i = 0; i < 4; i++) {
         normals.push(nrm[0],nrm[1],nrm[2]);
      }
      texCoords.push(0,0,1,0,1,1,0,1);
      indices.push(start,start+1,start+2,start,start+2,start+3);
   }
   face( [-s,-s,s, s,-s,s, s,s,s, -s,s,s], [0,0,1] );
   face( [-s,-s,-s, -s,s,-s, s,s,-s, s,-s,-s], [0,0,-1] );
   face( [-s,s,-s, -s,s,s, s,s,s, s,s,-s], [0,1,0] );
   face( [-s,-s,-s, s,-s,-s, s,-s,s, -s,-s,s], [0,-1,0] );
   face( [s,-s,-s, s,s,-s, s,s,s, s,-s,s], [1,0,0] );
   face( [-s,-s,-s, -s,-s,s, -s,s,s, -s,s,-s], [-1,0,0] );
   return {
      vertexPositions: new Float32Array(coords),
      vertexNormals: new Float32Array(normals),
      vertexTextureCoords: new Float32Array(texCoords),
      indices: new Uint16Array(indices)
   }
}

