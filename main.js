var SIZE_SCALE = 1000;
var ORBIT_SCALE = 100000;
var ORBIT_OFFSET = 500;
var ORBIT_STEP = 100;
var ORBIT_SPEED_SCALE = 0.01;
var REAL_ORBITS = true;
var USE_GODRAYS = false;
var USE_SKYBOX = false;

var canvas = document.querySelector("#renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var solar = {};
var pickResult = {};

function createScene() {
  var scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(0, 0, 0);
  
	camera = new BABYLON.ArcRotateCamera("camera", 0, 0.8, 3000, BABYLON.Vector3.Zero(), scene);
  camera.fov = -100;
  camera.maxZ = 100000;
  camera.wheelPrecision = 1;
  camera.attachControl(canvas, true);
  
  light = new BABYLON.PointLight("sunlight", new BABYLON.Vector3(0, 0, 0), scene);
  
  if (USE_GODRAYS){
    var godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 0.5, camera, null, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
  	godrays.mesh.material.diffuseTexture = new BABYLON.Texture('textures/sun.png', scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
  	godrays.mesh.material.diffuseTexture.hasAlpha = true;
  	godrays.mesh.scaling = new BABYLON.Vector3(1000, 1000, 1000);
  }
  
  if (USE_SKYBOX){
    var skybox = BABYLON.Mesh.CreateBox("galaxy", 100000, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/galaxy/galaxy", scene,  ['_px.png', '_py.png', '_pz.png', '_nx.png', '_ny.png', '_nz.png']);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
  }
  
  return scene;
}

function addObject(order, name, meshSize, realSize, orbitDistance, orbitTarget, rotationSpeed, color){
  solar[name] = BABYLON.Mesh.CreateSphere(name, 32, realSize / SIZE_SCALE, scene);
  solar[name].order = order;
  solar[name].realSize = realSize;
  solar[name].orbit = orbitDistance / ORBIT_SCALE;
  solar[name].material = new BABYLON.StandardMaterial("text", scene);
  solar[name].material.diffuseColor = color;
  solar[name].alpha = 0;
  solar[name].alphaSpeed = 1/rotationSpeed * ORBIT_SPEED_SCALE;
  
  if(name !== 'sun'){
    new BABYLON.Group2D({
        parent: canvas2D, id: name, width: 80, height: 10, trackNode: solar[name], origin: BABYLON.Vector2.Zero(),
        children: [
            new BABYLON.Text2D(name, { marginAlignment: "h: center, v:center", fontName: "12px Arial" })
        ]
    });
  }
  
  scene.registerBeforeRender(function () {
    if (orbitTarget){
      solar[name].alpha += solar[name].alphaSpeed;
	    if (!REAL_ORBITS) solar[name].position = solar[orbitTarget].position.add(new BABYLON.Vector3(Math.cos(solar[name].alpha) * (solar[name].order * ORBIT_STEP + ORBIT_OFFSET), 0, Math.sin(solar[name].alpha) * (solar[name].order * ORBIT_STEP + ORBIT_OFFSET)));
	    else solar[name].position = solar[orbitTarget].position.add(new BABYLON.Vector3(Math.cos(solar[name].alpha) * solar[name].orbit, 0, Math.sin(solar[name].alpha) * solar[name].orbit));
    }
  });
}

var scene = createScene();
var canvas2D = new BABYLON.ScreenSpaceCanvas2D(scene);

if (USE_GODRAYS) addObject(0, 'sun', 69, 1, 0, null, 0, new BABYLON.Color3(1, 1, 0.8));
else {
  addObject(0, 'sun', 69, 695700, 0, null, 0, new BABYLON.Color3(1, 1, 0.8));
  solar.sun.material.emissiveColor = new BABYLON.Color3(1, 1, 0.9);
}

addObject(1, 'mercury', 2.4, 2439, 69816900, 'sun', 0.24, new BABYLON.Color3(1, 0.9, 0.9));
addObject(2, 'venus', 6, 6051, 108939000, 'sun', 0.62, new BABYLON.Color3(1, 0.8, 0.8));
addObject(3, 'earth', 6.4, 6371, 152100000, 'sun', 1, new BABYLON.Color3(0, 0.5, 1));
addObject(-4.8, 'moon', 2, 1737, 362000, 'earth', 0.07, new BABYLON.Color3(1, 1, 1));
addObject(4, 'mars', 3.4, 3389, 249000000, 'sun', 1.88, new BABYLON.Color3(1, 0.4, 0.2));
addObject(5, 'jupiter', 18, 69911, 816000000, 'sun', 4.33, new BABYLON.Color3(1, 0.8, 0.5));
addObject(6, 'saturn', 16, 58232, 1500000000, 'sun', 10.76, new BABYLON.Color3(1, 0.8, 0.5));
addObject(7, 'uranus', 10, 25362, 3000000000, 'sun', 30.68, new BABYLON.Color3(0.2, 0.8, 1));
addObject(8, 'neptune', 10, 24622, 4500000000, 'sun', 60.18, new BABYLON.Color3(0, 0.2, 1));
addObject(4.5, 'ceres', 2, 945, 445410000, 'sun', 4.6, new BABYLON.Color3(1, 1, 1));
addObject(9, 'pluto', 2, 1189, 7300000000, 'sun', 248, new BABYLON.Color3(1, 0.9, 0.8));

selectedObject = solar.sun;

scene.registerBeforeRender(function () {
  camera.target = selectedObject;
});

engine.runRenderLoop(function () {
 scene.render();
});

canvas.addEventListener("click", function () {
  pickResult = scene.pick(scene.pointerX, scene.pointerY);
  console.log(pickResult);
  if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.name !== 'galaxy') {
    console.log(pickResult.pickedMesh.name);
    selectedObject = pickResult.pickedMesh;
  }
});

window.addEventListener("resize", function () {
  engine.resize();
});

function goTo(name){
	pickResult.pickedMesh = solar['name'];
}


