
// Skybox 
var aCoords_SB;         
var uProjection_SB;     
var uModelview_SB;
var prog_SB

// Teapot 
var aCoords;          
var aNormal;
var uProjection;    
var uModelview;
var uNormalMatrix;
var uInvVT;
var prog;

// PMatirx 
var projection = mat4.create();   
// MVMatrix
var modelview;    
var normalMatrix = mat3.create();
var invVT = mat3.create(); 

// Cubemap(skybox) texture
var texID;   
var cube;   
var teapot;  

// Meet the requirement of allowing to the users view to orbit the teapot 
// (again, just letting the view circle the teapot by rotating aorund the y-axis is fine).
var rotator;
//var rotator1;
var rotX = 0, rotY = 0;  

/**
 *  Draw teapot and skybox. 
 */
function draw() {
    
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(projection, Math.PI/3, 1, 1, 2300);
    
    modelview = rotator.getViewMatrix();
    mat3.normalFromMat4(normalMatrix, modelview);
    
    // Draw the skybox.
    gl.useProgram(prog_SB); 
    gl.uniformMatrix4fv(uProjection_SB, false, projection);
    if (texID) {
        gl.enableVertexAttribArray(aCoords_SB);
        cube.render();  
        gl.disableVertexAttribArray(aCoords_SB);
        gl.disableVertexAttribArray(aCoords_SB);
    }
    
    // Meet the requirement of being able to rotate the teapot.
    mat3.fromMat4(invVT, modelview);
    mat3.invert(invVT,invVT);

    mat4.rotateX(modelview,modelview,rotX);
    mat4.rotateY(modelview,modelview,rotY);
    
    mat3.normalFromMat4(normalMatrix, modelview);
    
    // Draw the teapot.
    gl.useProgram(prog); 
    gl.uniformMatrix4fv(uProjection, false, projection);
    if (texID) {
        gl.enableVertexAttribArray(aCoords);
        gl.enableVertexAttribArray(aNormal);
        teapot.render();  
        gl.disableVertexAttribArray(aCoords);
        gl.disableVertexAttribArray(aNormal);
    }
}

/**
 *  Load the texture images.
 *  @param urls the urls for the source of the images 
 */
function loadTextureCube(urls) {
    var ct = 0;
    var img = new Array(6);
    var urls = [     
        "mp_crimimpact/criminal-impact_ft1.png",
        "mp_crimimpact/criminal-impact_bk1.png",
        "mp_crimimpact/criminal-impact_up1.png",
        "mp_crimimpact/criminal-impact_dn1.png",
        "mp_crimimpact/criminal-impact_rt1.png",
        "mp_crimimpact/criminal-impact_lf1.png"
    ];

    for (var i = 0; i < 6; i++) {
        img[i] = new Image();
        img[i].onload = function() {
            ct++;
            if (ct == 6) {
                texID = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, texID);
                var targets = [
                   gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 
                   gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z 
                ];
                for (var j = 0; j < 6; j++) {
                    gl.texImage2D(targets[j], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img[j]);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                draw();
            }
        }
        img[i].src = urls[i];
    }
}
 
/**
 *  Compute vertex normal for setting the teapot buffer. 
 *  @param data the data including arrays of vertex coordinates and indices
 */
function computeVertexNormal(data) {

	var numVertices = data.vertexPositions.length / 3;
	var numTris = data.indices.length / 3;

    console.log(numVertices);
    console.log(numTris);
    
	data.vertexNormals = new Array();

	// Get the indices of the triangles.
	var triangles = new Array(numTris);
	var vertexIndices = new Array(numVertices);
	for(var i = 0; i < vertexIndices.length; i++)
		vertexIndices[i] = new Array();

    var u = vec3.create();
	var v = vec3.create();

	for(var i = 0; i < numTris; i++) {
        
		// Indices of the indices of the vertices
		var vii1 = 3 * i;
		var vii2 = 3 * i + 1;
		var vii3 = 3 * i + 2;
        
		// Indices of the vertices
		var vi1 = data.indices[vii1] * 3;
		var vi2 = data.indices[vii2] * 3;
		var vi3 = data.indices[vii3] * 3;
        
		// Vertices
		var v1 = [data.vertexPositions[vi1], data.vertexPositions[vi1 + 1], data.vertexPositions[vi1 + 2]];
		var v2 = [data.vertexPositions[vi2], data.vertexPositions[vi2 + 1], data.vertexPositions[vi2 + 2]];
		var v3 = [data.vertexPositions[vi3], data.vertexPositions[vi3 + 1], data.vertexPositions[vi3 + 2]];

		var normal = vec3.create();
		var normalized = vec3.create();
		vec3.subtract(u, v2, v1);
		vec3.subtract(v, v3, v1);
		vec3.cross(normal, u, v);
		vec3.normalize(normalized, normal);

		triangles[i] = normalized;
		vertexIndices[vi1 / 3].push(i);
		vertexIndices[vi2 / 3].push(i);
		vertexIndices[vi3 / 3].push(i);
	}

	for(var i = 0; i < numVertices; i++) {
		var totalNormal = vec3.create();
		var temp = vec3.create();
		while(vertexIndices[i].length !== 0) {
			var currentTriangle = vertexIndices[i].pop();
			vec3.add(temp, totalNormal, triangles[currentTriangle]);
			vec3.copy(totalNormal, temp);
		}
		var normalized = vec3.create();
		vec3.normalize(normalized, totalNormal);
		data.vertexNormals[i * 3] = normalized[0];
		data.vertexNormals[i * 3 + 1] = normalized[1];
		data.vertexNormals[i * 3 + 2] = normalized[2];
	}

	return data;
}

/**
 *  Create the teapot model. 
 *  @param modelData data get from the obj file
 */
function createModel(modelData) {  
    
    // Get the formated vertex positions, vertex normals and indices.
    var verts = new Float32Array(modelData.vertexPositions);
    var vertNormals = new Float32Array(modelData.vertexNormals);
    var indices = new Uint16Array(modelData.indices);
    
    // Create the model for the teapot.
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.normalBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    
    // Set the buffers.
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertNormals, gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    // Render the model.
    model.render = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview, false, modelview );
        gl.uniformMatrix3fv(uNormalMatrix, false, normalMatrix);
        gl.uniformMatrix3fv(uInvVT, false, invVT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}

/**
 *  Create the skybox model.
 */
function createModelSB(modelData) {  
    var model = {};
    model.coordsBuffer = gl.createBuffer();
    model.indexBuffer = gl.createBuffer();
    model.count = modelData.indices.length;
    gl.bindBuffer(gl.ARRAY_BUFFER, model.coordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
    console.log(modelData.vertexPositions.length);
    console.log(modelData.indices.length);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
    model.render = function() { 
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordsBuffer);
        gl.vertexAttribPointer(aCoords_SB, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(uModelview_SB, false, modelview );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }
    return model;
}


/**
 *  An event listener for the keydown event. 
 *  @param evt the event created from the keyboard
 */
function doKey(evt) {
    var rotationChanged = true;
	switch (evt.keyCode) {
	    case 37: rotY -= 0.3; break; // left arrow
	    case 39: rotY +=  0.3; break; // right arrow
	    case 38: rotX -= 0.3; break; // up arrow
	    case 40: rotX += 0.3; break; // down arrow
	    case 13: rotX = rotY = 0; break; // return
	    case 36: rotX = rotY = 0; break; // home
	    default: rotationChanged = false;
	}
	if (rotationChanged) {
     	     evt.preventDefault();
             draw();
	}
}

/**
 *  Create programs. 
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
   var vsh = gl.createShader( gl.VERTEX_SHADER );
   gl.shaderSource(vsh,vertexShaderSource);
   gl.compileShader(vsh);
   if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
      throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
   }
   var fsh = gl.createShader( gl.FRAGMENT_SHADER );
   gl.shaderSource(fsh, fragmentShaderSource);
   gl.compileShader(fsh);
   if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
      throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
   }
   var prog = gl.createProgram();
   gl.attachShader(prog,vsh);
   gl.attachShader(prog, fsh);
   gl.linkProgram(prog);
   if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
      throw "Link error in program:  " + gl.getProgramInfoLog(prog);
   }
   return prog;
}

/**
 *  Get content of the text. 
 *  @param elementID the ID for the element 
 */
function getTextContent( elementID ) {
    var element = document.getElementById(elementID);
    var fsource = "";
    var node = element.firstChild;
    var str = "";
    while (node) {
        if (node.nodeType == 3) 
            str += node.textContent;
        node = node.nextSibling;
    }
    return str;
}

/**
 *  Start all. 
 */
function start() {
   try {
        var canvas = document.getElementById("glcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            gl = canvas.getContext("experimental-webgl");
        }
        if ( ! gl ) {
            throw "Could not create WebGL context.";
        }
        var vertexShaderSource = getTextContent("vshaderSB"); 
        var fragmentShaderSource = getTextContent("fshaderSB");
        prog_SB = createProgram(gl,vertexShaderSource,fragmentShaderSource);
        aCoords_SB =  gl.getAttribLocation(prog_SB, "coords");
        uModelview_SB = gl.getUniformLocation(prog_SB, "modelview");
        uProjection_SB = gl.getUniformLocation(prog_SB, "projection");
        vertexShaderSource = getTextContent("vshader"); 
        fragmentShaderSource = getTextContent("fshader");
        prog = createProgram(gl,vertexShaderSource,fragmentShaderSource);
        aCoords =  gl.getAttribLocation(prog, "coords");
        aNormal =  gl.getAttribLocation(prog, "normal");
        uModelview = gl.getUniformLocation(prog, "modelview");
        uProjection = gl.getUniformLocation(prog, "projection");
        uNormalMatrix = gl.getUniformLocation(prog, "normalMatrix");
        uInvVT = gl.getUniformLocation(prog, "invVT");
        gl.enable(gl.DEPTH_TEST);
        rotator = new SimpleRotator(canvas, draw, 13, rotY, rotX);
       
        
        // Read the .obj file and get vertex coordinates and indices from it.
        console.log("reading "+ 'teapot_0.obj');
        var rawFile = new XMLHttpRequest();
        var allText = [];
        rawFile.open("GET", 'teapot_0.obj', true);
    
        rawFile.onreadystatechange = function ()
        {
            if(rawFile.readyState === 4)
            {
                if(rawFile.status === 200 || rawFile.status == 0)
                {
                    teapot = computeVertexNormal(obj2json(rawFile.responseText));
                    teapot = createModel(teapot);
                    console.log("Got text file!"); 
                }
            }
        }
        rawFile.send(null);

        cube = createModelSB(cube(1300));
       
        //rotator = SimpleRotator(teapot, draw, 10, rotY, rotX);
   }
   catch (e) {
      document.getElementById("message").innerHTML =
           "Could not initialize WebGL: " + e;
      return;
   }
   loadTextureCube();
   document.addEventListener("keydown", doKey, false);
   draw();
}
