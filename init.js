import * as THREE from "https://threejs.org/build/three.module.js";
import {buildScenes} from './buildScenes.js';
import {buildCar} from './buildThings.js';
import {treesLootAt, treesVisible, cameraUpdate} from './func.js';
import {onPointerDown, onPointerUp} from './buttonFunc.js';
import {parking, keyboardAndRC, moveCar} from './carMove.js';



var scene, renderer, camera;
var sceneHUD, cameraHUD;

var keyboard = new KeyboardState();
var clock = new THREE.Clock();

var car, alternateObs = [], obstacles = []
var raycaster, pickables = [];
var mouse = new THREE.Vector2();
var radarSound, RCmesh, RC, longBeep;
var beeper = false, radarOn = false;

var topCamera, scene1, thirdPVCamera;
var soundBT = false, topView = false, GPSView = false;
var thirdPV = false, firstPV = false;
var parkingMode = 0, parkingAngle = 0;
var PPart = 0;
var reversingCamera, rearMirror;
var parkingModeButton = false;
var CCW = 0;
var traceMeshes = [];
var carParameter;
var GPSCamera;

var bushes0 = new THREE.Group();

 
function init() {

	scene = new THREE.Scene();
	sceneHUD = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x888888);
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.set(-300, 200, 0);
	cameraHUD = new THREE.OrthographicCamera(window.innerWidth / -2,window.innerWidth / 2,
											window.innerHeight / 2,window.innerHeight / -2, 1, 1000);

	var light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
	light.position.set(0, 100, 0);
	scene.add(light);
	
	buildScenes();
	carParameter = [{name:'bodyWidth', value:20}, {name:'bodyLength', value:38}
					, {name:'axelLength', value:16}, {name:'frontWheelToBackWheel', value:26}];
	
	
	var grid = new THREE.GridHelper (1200,120,'red','white');
	scene.add (grid);


    ////////////////////////////////////////////////////////////
	//car
    car = buildCar(new THREE.Vector3(-122, 13, 21));
	var car2 = buildCar(new THREE.Vector3(-138, 13, 56));
	obstacles.push(car2);
	//obstacles
	//var car2 = new ObstacleCar(new THREE.Vector3(55, 13, 70), 'Hyundai');
	//var car3 = new ObstacleCar(new THREE.Vector3(-55, 13, 70), 'X5');
	//alternateObs.push(car2, car3);
	
	let loader = new THREE.TextureLoader();
	loader.crossOrigin = '';
	//let texture = loader.load('./pictures/dKpYAbl.jpg?1');
	//let obs = new Obstacle(new THREE.Vector3(0, 7, 100), [300, 2, 20], texture);
	//let obs2 = new Obstacle(new THREE.Vector3(0, 7, -100), [300, 2, 20], texture);
    
	//obstacles.push(obs, obs2);
	//scene.add(alternateObs, obstacles);
	
	//light
	var light = new THREE.AmbientLight( 0x404040 ); // soft white light
	scene.add( light );
  
    window.addEventListener('resize', onWindowResize, false);
  
    ////////////////////////////
    RCmesh = new THREE.Mesh (new THREE.SphereGeometry(5,6,6), new THREE.MeshBasicMaterial());
    scene.add(RCmesh);

    //////////////////////////////////////////////
    renderer.autoClear = false;
	
    //topCamera
	scene1 = new THREE.Scene();
    topCamera = new THREE.OrthographicCamera(-window.innerWidth/26, window.innerWidth/26
											, window.innerHeight/12, -window.innerHeight/12, 1, 1000);
    topCamera.position.y = 100;
	topCamera.up.set(1, 0, 0);
	topCamera.lookAt(0, 0, 0);
	
	//thirdPVCamera
	thirdPVCamera = new THREE.OrthographicCamera(-window.innerWidth/52, window.innerWidth/52
											, window.innerHeight/24, -window.innerHeight/24, 1, 1000);
	thirdPVCamera.lookAt (car.mesh.localToWorld (new THREE.Vector3(30,0,0)));
	thirdPVCamera.position.copy (car.mesh.localToWorld (new THREE.Vector3 (-30,18,0)));
	
	//rear mirror
    rearMirror = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    rearMirror.position.set(-60, 23, 40);
	
	//Reversing camera
    reversingCamera = new THREE.OrthographicCamera(-window.innerWidth/52, window.innerWidth/52
												, window.innerHeight/48, -window.innerHeight/48, 0.1, 1000);
    reversingCamera.position.set(-60, 23, 40);
	
	//GPSCamera
    GPSCamera = new THREE.OrthographicCamera(-window.innerWidth/6.5, window.innerWidth/6.5
											, window.innerHeight/6, -window.innerHeight/6, 1, 1000);
    GPSCamera.lookAt (car.mesh.localToWorld (new THREE.Vector3(50,0,0)));
	GPSCamera.position.copy (car.mesh.localToWorld (new THREE.Vector3 (-60,200,0)));

	
	//sound
	radarSound = document.getElementById('radarSound');
	longBeep = document.getElementById('longBeep');
	radarSound.muted = false;
	longBeep.muted = false;
	longBeep.loop = true;
	
	window.addEventListener ('pointerdown', onPointerDown, false);
	window.addEventListener ('pointerup', onPointerUp, false);
	raycaster = new THREE.Raycaster();

}
  
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
  
function animate() {
	
    renderer.clear(true);
    
    keyboard.update();
  
    // 'static' variables  
	car.theta = (car.theta === undefined) ? 0.001 : car.theta;
    car.fSlowDown = (car.fSlowDown === undefined) ? 0 : car.fSlowDown;
    car.bSlowDown = (car.bSlowDown === undefined) ? 0 : car.bSlowDown;
	
	//addObstacles();
    /////////////////////////////////////////////////////////////////
    //move car	
	var deltaT = clock.getDelta();
	
	let paraArray = keyboardAndRC(car.theta, car.fSlowDown, car.bSlowDown, deltaT);
	car.theta = paraArray[0];
	car.fSlowDown = paraArray[1];
	car.bSlowDown = paraArray[2];
    
	let frontWheelToBackWheel = carParameter[carParameter.map(x =>x.name).indexOf('frontWheelToBackWheel')].value;
	
    moveCar(RC, (car.speed * Math.tan(car.theta)/frontWheelToBackWheel), deltaT);
	
    //camera position
	cameraUpdate(car.theta, car.fSlowDown, car.bSlowDown);
	
    //parking 
	car.theta = parking(car.theta);
		  
    /////////////////////////////////////////////
    // purely cosmetic ...    wheel turn  
    car.leftfrontWheel.rotation.z += car.speed*deltaT/5;
    car.rightfrontWheel.rotation.z += car.speed*deltaT/5;
    car.leftRearWheel.rotation.z += car.speed*deltaT/5;
	car.rightRearWheel.rotation.z += car.speed*deltaT/5;
	
	//trees
	treesLootAt();


    requestAnimationFrame(animate);
    render();
}
  
function render() {
	var WW = window.innerWidth;
	var HH = window.innerHeight;
    renderer.setScissorTest( true );

    renderer.setViewport(0, 0, WW, HH);
    renderer.setScissor(0, 0, WW, HH);
    renderer.clear();
    renderer.render(scene, camera);

	if(firstPV){
		renderer.render(sceneHUD, camera);
		//reversing Camera
		if(car.dashboard.gearFrame.position.z == -0.13){
			renderer.setViewport(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.setScissor(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.clear();
			car.brakeLightR.visible = false;
			car.brakeLightL.visible = false;
			treesVisible(false);
			renderer.render(scene, reversingCamera);	
			treesVisible(true);
			car.brakeLightR.visible = true;
			car.brakeLightL.visible = true;
		}
		else if(topView){
			renderer.setViewport(WW/2.41, HH/4, WW/13, HH/6);
			renderer.setScissor(WW/2.41, HH/4, WW/13, HH/6);
			renderer.clear();
			renderer.render(scene, topCamera);
			renderer.setViewport(WW*1.545/3.13, HH/4, WW/13, HH/6);
			renderer.setScissor(WW*1.545/3.13, HH/4, WW/13, HH/6);
			renderer.clear();
			renderer.render(scene, thirdPVCamera);
		}
		else if(GPSView){
			renderer.setViewport(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.setScissor(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.clear();
			car.mesh.visible = false;
			car.mapArrow.visible = true;
			treesVisible(false);
			renderer.render(scene, GPSCamera);
			treesVisible(true);
			car.mesh.visible = true;
			car.mapArrow.visible = false;
		}
	}
	renderer.setScissorTest( false );
}

export {scene, renderer, camera, sceneHUD, cameraHUD, keyboard, clock, car, alternateObs, obstacles, raycaster, pickables, mouse, radarSound, RC, RCmesh, longBeep, 
    beeper, radarOn, topCamera, scene1, thirdPVCamera, soundBT, topView, GPSView, thirdPV , firstPV ,
     parkingMode, parkingAngle, PPart, reversingCamera, rearMirror, parkingModeButton, CCW,  traceMeshes, carParameter, GPSCamera, bushes0};
 export {init, animate}    