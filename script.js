/*

  Find the surprise animation ✨
  It's an omelette for a witch in space
  
  The eggs and "egg container" are generated as parametric 
  geometry, no 3D model was downloaded here.
  
  art & code by 
  Anna Scavenger, November 2019
  https://twitter.com/ouchpixels
  
*/

'use strict';

let container, camera, controls, renderer, scene, artwork;
let eggGroup, eyeGroup, eyeFront;
let orbMesh;

let textureURL = "https://assets.codepen.io/911157/textureEyePurple_256_optimized.jpg";

let mouseX = 0;
let mouseY = 0;

let isMouseMoved = false;
let isWitch = false;
let masterTL = null;

let windowRatio = window.innerWidth / window.innerHeight;
let isLandscape = ( windowRatio > 1 ) ? true : false;

const btnAnim = document.querySelector("#btn-animate");

let params = {
  
  radius: 16,
  pointsNum: 20000
  
}

init();
render();

function init() {
  
  container = document.querySelector("#scene-container");
  
  scene = new THREE.Scene();
  
  createRenderer();
  createCamera();
  createControls();
  createLights();
  createGeometries();
  createMaterials();
  createMeshes();
  createOrb();
  
  startTimeline();

  document.addEventListener("mousemove", onMouseMove, false);
  document.addEventListener("touchmove", onTouchMove, false);
  btnAnim.addEventListener("click", startAnimation, false);
  btnAnim.addEventListener("mouseover", toggleBtnStyle, false);
  window.addEventListener("resize", onWindowResize);
  
}

function createCamera() {

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    10000,
  );

  const cameraY = isLandscape ? 15 : 30;
  const cameraZ = isLandscape ? 30 : (35 / windowRatio);
  camera.position.set(-25, cameraY, cameraZ);
  camera.lookAt(scene.position);

}

function createControls() {

  controls = new THREE.OrbitControls(camera, container);
  controls.enabled = false;

}

function createLights() {

  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 5);

  const mainLight = new THREE.DirectionalLight(0x8A0A8A, 15);
  mainLight.position.set(10, 20, 7);

  scene.add(ambientLight, mainLight);
  
}

function wavySurfaceGeometry(u, v, target) {
  
  let x = 20 * (u - 0.5);  // x and z range from -10 to 10
  let z = 20 * (v - 0.5);
  let y = 1.5 * (Math.sin(x) * Math.cos(z));
  target.set(x, y, z);
  
}

function eggLathePoints() {
  
  let points = [];
  
  for (let deg = 0; deg <= 180; deg += 6) {

    let rad = Math.PI * (deg / 180);
    let point = new THREE.Vector2((0.72 + .08 * Math.cos(rad)) * Math.sin(rad), - Math.cos(rad)); 
    points.push(point);

  }
  
  return points;
  
}

function createGeometries() {
  
  const sphereGeom = new THREE.SphereBufferGeometry(1.5, 20, 20);
  const wavySurfaceGeom = new THREE.ParametricBufferGeometry(wavySurfaceGeometry, 64, 64);
  const eggGeom = new THREE.LatheBufferGeometry(eggLathePoints(), 32);

  return {
    
    sphereGeom,
    wavySurfaceGeom,
    eggGeom
    
  };

}

function createOrb() {
  
  let radius = params.radius;
  let pointsNum = params.pointsNum;
  
  let baseGeometry = new THREE.PlaneBufferGeometry(0.6, 0.6);
  
  let instancedGeometry = new THREE.InstancedBufferGeometry().copy(baseGeometry);
  let instanceCount = pointsNum;
  instancedGeometry.instanceCount = instanceCount;
  
  let aPosition = [];
  
  for (let i = 0; i < instanceCount; i++) {
    
    let theta = THREE.Math.randFloatSpread(360); 
    let phi = THREE.Math.randFloatSpread(360); 

    let x = radius * Math.sin(theta) * Math.cos(phi);
    let y = radius * Math.sin(theta) * Math.sin(phi);
    let z = radius * Math.cos(theta);
    
    aPosition.push(x, y, z);
    
  }
  
  let aPositionFloat32 = new Float32Array(aPosition);
  instancedGeometry.setAttribute("aPosition", new THREE.InstancedBufferAttribute(aPositionFloat32, 3));
  
  let aColor = [];
  let colors = [     
    
    new THREE.Color(0.25, 0, 1.0),
    new THREE.Color(0.8, 0, 1.0),
    new THREE.Color(0.5, 0.2, 1.0),
    new THREE.Color(1.0, 0.35, 0)
    
  ];
  
  for (let i = 0; i < instanceCount; i++) {
    
    let color = colors[Math.floor(Math.random() * colors.length)];
    aColor.push(color.r, color.g, color.b);

  }
  
  let aColorFloat32 = new Float32Array(aColor);
  instancedGeometry.setAttribute("aColor", new THREE.InstancedBufferAttribute(aColorFloat32, 3));
  
  let material = new THREE.ShaderMaterial({
    
    vertexShader: document.querySelector("#vs-orb").textContent,
    fragmentShader: document.querySelector("#fs-orb").textContent  
    
  });

  const orbMesh = new THREE.Mesh(instancedGeometry, material);
  return orbMesh;
  
}

function createMaterials() {

  const beige = new THREE.MeshStandardMaterial({
    
    color: 0xc2c2ae,
    roughness: 0.1,
    metalness: 0.6,
    flatShading: true
    
	});
  
  beige.color.convertSRGBToLinear();
  beige.side = THREE.DoubleSide;
  
  const eggshell = new THREE.MeshStandardMaterial({
    
    color: 0xf1b168,
		roughness: 0.2,
	  metalness: 0.7,
		flatShading: true
    
	});
  
  eggshell.color.convertSRGBToLinear();
  
  const texture = new THREE.TextureLoader().load(textureURL);

	const uniforms = {
		"texture": {type: "t", value: texture}	
	};

  const matcapEye = new THREE.ShaderMaterial({
    
		uniforms: uniforms,
		vertexShader: document.getElementById("vs-matcap").textContent,
		fragmentShader: document.getElementById("fs-matcap").textContent
    
	});
  
  return {

    beige,
    eggshell,
    matcapEye

  };

}

function createMeshes() {
  
  const geometries = createGeometries();
  const materials = createMaterials();
  
  const wavySurface = new THREE.Mesh(geometries.wavySurfaceGeom, materials.beige);
  wavySurface.position.set(0, -0.1, 0);
  
  eggGroup = new THREE.Group();
  eyeGroup = new THREE.Group();
  
  const coords = [

    { x: -1.5, y: 1, z: -6.25 },
    { x: 1.625, y: 1, z: -3.125 },
    { x: 5, y: 1, z: 0 },
    { x: -7.5, y: 1, z: -6.5 },
    { x: -4.625, y: 1, z: -3.125 },
    { x: -1.5, y: 1, z: 0 },
    { x: 1.775, y: 1, z: 3.125 },
    { x: 4.75, y: 1, z: 6.25 },
    { x: -7.75, y: 1, z: 0 },
    { x: -4.625, y: 1, z: 3.125 },
    { x: -1.5, y: 1, z: 6.25 }
    
  ];
  
  const eye = new THREE.Mesh(geometries.sphereGeom, materials.matcapEye);
  eye.scale.setScalar(1.2);

  eyeFront = eye.clone();
  eyeFront.rotation.set(-0.35 * Math.PI, 1.5 * Math.PI / 2, 0);
  eyeFront.scale.setScalar(1.15);
  eyeFront.position.set(-7.7, 30, 6.5);
  
  const egg = new THREE.Mesh(geometries.eggGeom, materials.eggshell);
  egg.scale.set(2.25, 2.25, 2.25);
  
  const eggMesh = [];
  const eyeMesh = [];
  
  for (let i = 0; i < coords.length; i++) {
    
    eggMesh[i] = egg.clone();
    eggMesh[i].position.set(coords[i].x, coords[i].y, coords[i].z);
    eggGroup.add( eggMesh[i] );
    
  }
  
  for (let i = 0; i < coords.length; i++) {
    
    eyeMesh[i] = eye.clone();
    eyeMesh[i].position.set(coords[i].x, coords[i].y + 35, coords[i].z);
    eyeGroup.add( eyeMesh[i] );
    
  }
  
  let orb = createOrb();
  
  artwork = new THREE.Group();
  
  artwork.add(
    
    wavySurface,
    eyeFront,
    eggGroup,
    eyeGroup,
    orb
    
  );
  
  scene.add(artwork);
  
}

function animate() {
    
  let eyes = eyeGroup;
  let value1 = mouseX * 7.0;
  // let value2 = mouseY * 5.0;

  if ( eyes && isWitch && isMouseMoved ) {
      
    eyes.children[0].rotation.set( value1, value1, value1 );
    eyes.children[1].rotation.set( 0, 0, value1 );
    eyes.children[2].rotation.set( 0.3 * value1, 0, 0 );
    eyes.children[3].rotation.set( 0, 3 * value1, 0 );
    eyes.children[4].rotation.set( value1, 0, 0 );
    eyes.children[5].rotation.set( 0, value1, value1 );
    eyes.children[6].rotation.set( 0, 0.3 * value1, 0 );
    eyes.children[7].rotation.set( value1, 0, 0 );
    eyes.children[8].rotation.set( 0, 0, value1 );
    eyes.children[9].rotation.set( 0, value1, value1 );
    eyes.children[10].rotation.set( 0, 0, -value1 );
    eyeFront.rotation.set( 1.5 * value1, Math.PI / 4, 1.5 * value1 );
    
  }
  
  else {
      
    return;
      
  }

}

function createRenderer() {

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(1.5);
  renderer.gammaFactor = 2.2;
  renderer.outputEncoding = THREE.GammaEncoding;
  renderer.physicallyCorrectLights = true;
  container.appendChild( renderer.domElement );

}

function update() {
  
  if (artwork) {
    
    artwork.rotation.y += 0.1 * (-mouseX * 0.35 - artwork.rotation.y);
	  artwork.rotation.x += 0.05 * (-mouseY * 0.15 - artwork.rotation.x);
    
	}
  
}

function render() {
  
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  animate();
  update();
  
}

function onMouseMove(e) {
  
  e.preventDefault(); 
  isMouseMoved = true;
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = - (e.clientY / window.innerHeight ) * 2 + 1;

}

function onTouchMove(e) {
  
  isMouseMoved = true;
  
  let x = e.changedTouches[0].clientX;
  let y = e.changedTouches[0].clientY;
  
  mouseX = (x / window.innerWidth) * 2 - 1;
  mouseY = (y / window.innerWidth) * 2 - 1;

}

function onWindowResize() {
  
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( container.clientWidth, container.clientHeight );
  
}

function startAnimation() {
  
  isWitch = !isWitch;
  toggleAnimation();
  
}

function toggleBtnStyle() {
  
  let bg1 = "linear-gradient(#633b73, #211b20) padding-box, linear-gradient(#211b20, #633b73) border-box";
  let bg2 = "linear-gradient(#6e5b4f, #302313) padding-box, linear-gradient(#302313, #6e5b4f) border-box";
  
  if ( !isWitch ) {

    btnAnim.style.background = bg1;

  } else {

    btnAnim.style.background = bg2;

  }
 
}

function startTimeline() {
  
  let eggs = eggGroup;
  let eggsPositions = [];
  
  let eyes = eyeGroup;
  let eyesPositions = [];
  
  // get x, y, z position of every egg mesh
  for ( let i = 0; i < eggs.children.length; i++ ) {
    
    eggsPositions[i] = eggs.children[i].position;
    
  }
  
  // get x, y, z position of every eye mesh
  for ( let i = 0; i < eyes.children.length; i++ ) {
    
    eyesPositions[i] = eyes.children[i].position;
    
  }
  
  masterTL = gsap.timeline({ paused: true });
  
  masterTL
    .add("eggs")
    .to(eggsPositions, { duration: 1.3, stagger: 0.25, y: 10, ease: "elastic" })
    .to(eggGroup.position, 1.75, { y: 25, ease: "elastic.inOut" }, "eggs+=2.5")
    .to(eyeFront.position, 0.8, { y: 1.1, ease: "bounce" }, "eggs+=3.6")
    .to(eyesPositions, { duration: 0.8, stagger: 0.15, y: 1.1, ease: "bounce" })
  ;
  
  masterTL.play();
  masterTL.reversed(true);
    
  return masterTL;
  
}

function toggleAnimation() {
  
  masterTL.reversed( !masterTL.reversed() );
  
}

window.addEventListener("load", function () {

  setTimeout(showButton, 200);
  
}, false);

function showButton() {
  
  let showTL = gsap.timeline();
  
  showTL
    .add("show")
    .to(btnAnim, { duration: 0.25, autoAlpha: 1, ease: "sine" }, "show")
    .to(btnAnim, { duration: 0.25, y: -1.25, ease: "elastic" }, "show")
  ;

}