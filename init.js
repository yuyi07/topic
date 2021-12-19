import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {buildCar} from "./buildThings.js";
import {firstPV,treesLootAt, treesVisible, reversingLineVisible} from "./func.js";
import {cameraUpdate, loadCubemap, reversingLine} from "./func.js";
import {onPointerDown} from "./buttonFunc.js";
import {parking, keyboardAndRC, moveCar, flashTurnSignal} from "./carMove.js";
import {buildScenes} from "./buildScenes.js";
import {revLine} from "./buildThings.js";


var scene, renderer, camera;
var sceneHUD, GPSCamera;
var topCamera, thirdPVCamera;
var reversingCamera;
var keyboard = new KeyboardState();
var clock = new THREE.Clock();

var car, obstacles = [];
var raycaster;
var radarSound, RCmesh, longBeep;
var topView = false, GPSView = false;
var carParameter;
var sign;




export function init() {

	scene = new THREE.Scene();
	sceneHUD = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x888888);
	document.body.appendChild(renderer.domElement);

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.set(-300, 200, 0);

	var light = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
	light.position.set(0, 100, 0);
	scene.add(light);
	
	buildScenes();
	carParameter = [{name:'bodyWidth', value:20}, {name:'bodyLength', value:38}
					, {name:'axelLength', value:16}, {name:'frontWheelToBackWheel', value:26}];
	
    ////////////////////////////////////////////////////////////
	//car
    car = buildCar(new THREE.Vector3(-122, 13, 21));
	var car2 = buildCar(new THREE.Vector3(-138, 13, 56));
	obstacles.push(car2);
	
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

	//background
	var cubeMap = loadCubemap();
  	scene.background = cubeMap;
	
	window.addEventListener ('pointerdown', onPointerDown, false);
	raycaster = new THREE.Raycaster();


	//ReveringLine
	revLine();
	

	flashTurnSignal();
}
  
export function animate() {
	
    renderer.clear(true);
    
    keyboard.update();
  
    // 'static' variables  
	animate.theta = (animate.theta === undefined) ? 0.001 : animate.theta;
    animate.fSlowDown = (animate.fSlowDown === undefined) ? 0 : animate.fSlowDown;
    animate.bSlowDown = (animate.bSlowDown === undefined) ? 0 : animate.bSlowDown;
	
    /////////////////////////////////////////////////////////////////
    //move car	
	var deltaT = clock.getDelta();
	
	let paraArray = keyboardAndRC(animate.theta, animate.fSlowDown, animate.bSlowDown, deltaT);
	animate.theta = paraArray[0];
	animate.fSlowDown = paraArray[1];
	animate.bSlowDown = paraArray[2];
	let RC = paraArray[3];
    
	let frontWheelToBackWheel = carParameter[carParameter.map(x =>x.name).indexOf('frontWheelToBackWheel')].value;
    moveCar(RC, (car.speed * Math.tan(animate.theta)/frontWheelToBackWheel), deltaT);
	
    //camera position
	cameraUpdate(animate.theta, animate.fSlowDown, animate.bSlowDown);
	
    //parking 
	animate.theta = parking(animate.theta);
		  
    /////////////////////////////////////////////
    // purely cosmetic ...    wheel turn  
    car.leftfrontWheel.rotation.z -= car.speed*deltaT/5;
    car.rightfrontWheel.rotation.z -= car.speed*deltaT/5;
    car.leftRearWheel.rotation.z -= car.speed*deltaT/5;
	car.rightRearWheel.rotation.z -= car.speed*deltaT/5;
	
	//trees
	treesLootAt();

	//reversingLine
	sign = animate.theta > 0 ? 1: -1;
	reversingLine();

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
	reversingLineVisible(false);
    renderer.render(scene, camera);

	if(firstPV){
		car.mesh.visible = false;
		renderer.render(sceneHUD, camera);
		//car.mesh.visible = true;
		//reversing Camera
		if(car.dashboard.gearFrame.position.z == -0.13){
			renderer.setViewport(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.setScissor(WW/2.41, HH/4, WW/6.5, HH/6);
			renderer.clear();
			car.brakeLightR.visible = false;
			car.brakeLightL.visible = false;
		
			treesVisible(false);
			reversingLineVisible(true);
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
	else car.mesh.visible = true;
	renderer.setScissorTest( false );
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

export {scene, sceneHUD, camera, GPSCamera, topCamera, thirdPVCamera, reversingCamera, keyboard
		, car, obstacles, raycaster, radarSound, RCmesh, longBeep, topView, GPSView, carParameter, sign};