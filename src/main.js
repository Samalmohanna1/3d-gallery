import * as THREE from 'https://cdn.skypack.dev/three@0.136'
import { TWEEN } from 'https://cdn.skypack.dev/three@0.136/examples/jsm/libs/tween.module.min.js'
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/PointerLockControls'
import {GLTFLoader} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/loaders/GLTFLoader'

const gltfLoader = new GLTFLoader()
const wallColor = 'white'
const ceilingColor = '#f5f1ed'
const cubeColor = 'aqua'
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
	60,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)
let introModel

//renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)

//mouse controls
let controls, raycaster
let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let canJump = false

let prevTime = performance.now()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()

//lights functions
const createSpotlight = (color) => {
	const newObj = new THREE.SpotLight(color, 2)

	newObj.castShadow = true
	newObj.angle = 0.5
	newObj.penumbra = 0.2
	newObj.decay = 2
	newObj.distance = 60

	return newObj
}

//lights
const ambientLight = new THREE.AmbientLight('white', 0.05)
const sunLight = new THREE.DirectionalLight('orange', 0.02) //0xe8c37b
const sLHelper = new THREE.DirectionalLightHelper(sunLight, 6)

const cubeLight = createSpotlight('#cc330d') //0xFF7F00
const cubeLight2 = createSpotlight(0x7f00ff)
const cLHelper = new THREE.SpotLightHelper(cubeLight2)

const introLight = new THREE.PointLight('#ff9b3e', .8, 60)
const introLight2 = new THREE.PointLight('#cc330d', 1, 60)
const introLight3 = new THREE.PointLight('#2323be', .5, 40)
const iLHelper = new THREE.PointLightHelper(introLight)
const iLHelper2 = new THREE.PointLightHelper(introLight2)
const iLHelper3 = new THREE.PointLightHelper(introLight3)

//cube
const cubeGeometry = new THREE.BoxGeometry(6, 6, 6)
const cubeMaterial = new THREE.MeshPhongMaterial()
cubeMaterial.shininess = 100
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)

//floor
const floorTexture = new THREE.TextureLoader().load('../Floor.jpg')
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(10, 10)

const planeGeometry = new THREE.PlaneGeometry(200, 200)
const planeMaterial = new THREE.MeshStandardMaterial({
	roughness: 0.8,
	metalness: 0.2,
	bumpScale: 0.0005,
	side: THREE.DoubleSide,
	map: floorTexture,
})
const floor = new THREE.Mesh(planeGeometry, planeMaterial)

//ceiling
const ceilingGeometry = new THREE.PlaneGeometry(100, 200)
const ceilingMaterial = new THREE.MeshLambertMaterial({
	color: ceilingColor,
})
const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)

//walls
const wallGroup = new THREE.Group()
const enteranceWall = new THREE.Mesh(
	new THREE.BoxGeometry(100, 50, 0.001),
	new THREE.MeshLambertMaterial({ color: wallColor })
)

const backWall = new THREE.Mesh(
	new THREE.BoxGeometry(100, 50, 0.001),
	new THREE.MeshLambertMaterial({ color: wallColor })
)

const leftWall = new THREE.Mesh(
	new THREE.BoxGeometry(177, 50, 0.001),
	new THREE.MeshLambertMaterial({ color: wallColor })
)

const rightWall = new THREE.Mesh(
	new THREE.BoxGeometry(177, 50, 0.001),
	new THREE.MeshLambertMaterial({ color: wallColor })
)

//Initialize scene
const init = () => {
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.outputEncoding = THREE.sRGBEncoding

	camera.position.set(0, 5, 90)
	camera.rotation.set(0, 0, 0)

	sunLight.position.set(0, 45, 0)
	sunLight.castShadow = true
	cubeLight.position.set(80, 40, 80)
	//  cubeLight.rotation.z = Math.PI / 2
	cubeLight.target = cube
	cubeLight2.position.set(80, 35, 60)
  cubeLight2.target = cube

	introLight.position.set(0, 45, -70)
  introLight2.position.set(30, 5, -60)
  introLight3.position.set(-40, 15, -80)

	controls = new PointerLockControls(camera, document.body)
  
	const blocker = document.getElementById('blocker')
	const instructions = document.getElementById('instructions')

	instructions.addEventListener('pointerdown', function () {
		controls.lock()
	})

	controls.addEventListener('lock', function () {
		instructions.style.display = 'none'
		blocker.style.display = 'none'
	})

	controls.addEventListener('unlock', function () {
		blocker.style.display = 'block'
		instructions.style.display = ''
	})

	scene.add(controls.getObject())

	const onKeyDown = function (event) {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveForward = true
				break

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true
				break

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true
				break

			case 'ArrowRight':
			case 'KeyD':
				moveRight = true
				break

			case 'Space':
				if (canJump === true) velocity.y += 350
				canJump = false
				break
		}
	}

	const onKeyUp = function (event) {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveForward = false
				break

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = false
				break

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = false
				break

			case 'ArrowRight':
			case 'KeyD':
				moveRight = false
				break
		}
	}

	document.addEventListener('keydown', onKeyDown)
	document.addEventListener('keyup', onKeyUp)

	raycaster = new THREE.Raycaster(
		new THREE.Vector3(),
		new THREE.Vector3(0, -1, 0),
		0,
		10
	)

	//----------------------------------

  gltfLoader.load('/intro_bg.glb', (introBg)=> {
    introModel = introBg.scene
    introModel.scale.set(5.75,5.75,5.75)
    introModel.position.set(0, 19.5, -99.5)
    introModel.rotation.set(-(Math.PI/2), 0, Math.PI)
    introModel.castShadow = true
    introModel.receiveShadow = true
    scene.add(introBg.scene)
})

gltfLoader.load('/intro_scene.glb', (introScene)=> {
  introModel = introScene.scene
  introModel.scale.set(15,15,15)
  introModel.position.set(0, 0.1, -60)
  // introModel.rotation.set(-(Math.PI/2), 0, Math.PI)
  introModel.castShadow = true
  introModel.receiveShadow = true
  scene.add(introScene.scene)
})

 	//----------------------------------

	cube.receiveShadow = true
	cube.castShadow = true
	// cube.position.set(30, 16, 0)
  cube.position.set(80, 16, 80)

	//----------------------------------

	floor.rotation.x = Math.PI / 2
	floor.receiveShadow = true

	//----------------------------------

	ceiling.rotation.x = Math.PI / 2
	ceiling.position.y = 50

	enteranceWall.position.z = 100
	enteranceWall.position.y = 25

	backWall.position.set(0, 25, -100)

	leftWall.rotation.y = Math.PI / 2
	leftWall.position.set(-50, 25, 12)

	rightWall.rotation.y = Math.PI / 2
	rightWall.position.set(50, 25, 12)
	rightWall.receiveShadow = true

	wallGroup.add(enteranceWall, backWall, leftWall, rightWall)

	//----------------------------------

	for (let i = 0; i < wallGroup.children.length; i++) {
		wallGroup.children[i].BBox = new THREE.Box3()
		wallGroup.children[i].BBox.setFromObject(wallGroup.children[i])
	}

	//----------------------------------
	scene.add(camera)
	scene.add(ambientLight)
	// scene.add(sunLight)
	scene.add(cubeLight, cubeLight2)
	scene.add(cubeLight.target)
	// scene.add(sLHelper, cLHelper)
	scene.add(introLight,introLight2,introLight3)
  // scene.add(iLHelper,iLHelper2,iLHelper3)
	scene.add(cube)
	scene.add(floor)
	// scene.add(ceiling)
	// scene.add(wallGroup)

	//----------------------------------
	document.body.appendChild(renderer.domElement)
	window.addEventListener('resize', onWindowResize)
}

const onWindowResize = () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

const tween = (light) => {
	new TWEEN.Tween(light)
		.to(
			{
				angle: Math.random() * 0.7 + 0.1,
				penumbra: Math.random() + 1,
			},
			Math.random() * 3000 + 2000
		)
		.easing(TWEEN.Easing.Quadratic.Out)
		.start()

	new TWEEN.Tween(light.position)
		.to(
			{
				x: Math.random() * 30 - 15,
				y: Math.random() * 10 + 15,
				z: Math.random() * 30 - 15,
			},
			Math.random() * 3000 + 2000
		)
		.easing(TWEEN.Easing.Quadratic.Out)
		.start()
}

const animate = () => {
	// tween(cubeLight)
	// tween(introLight)
	// tween(spotLight3)

	// setTimeout(animate, 5000)

	requestAnimationFrame(animate)
	render()
}

const render = () => {
	const time = performance.now()
  const lightsTime = Date.now() * 0.0005

	cube.rotation.x += 0.01
	cube.rotation.y += 0.01

  // introLight.position.x = Math.sin(lightsTime * 0.7) * 3
	// introLight.position.y = Math.cos(lightsTime * 0.9) * 4
  // introLight.position.z = Math.cos(lightsTime * 0.3) * -90

	TWEEN.update()

	if (controls.isLocked === true) {
		raycaster.ray.origin.copy(controls.getObject().position)
		raycaster.ray.origin.y -= 10

		const intersections = raycaster.intersectObjects(wallGroup, false)

		const onObject = intersections.length > 0

		const delta = (time - prevTime) / 1000

		velocity.x -= velocity.x * 10.0 * delta
		velocity.z -= velocity.z * 10.0 * delta

		velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward)
		direction.x = Number(moveRight) - Number(moveLeft)
		direction.normalize() // this ensures consistent movements in all directions

		if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta
		if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta

		if (onObject === true) {
			velocity.y = Math.max(0, velocity.y)
			// canJump = true;
		}

		controls.moveRight(-velocity.x * delta)
		controls.moveForward(-velocity.z * delta)

		controls.getObject().position.y += velocity.y * delta // new behavior

		if (controls.getObject().position.y < 10) {
			velocity.y = 0
			controls.getObject().position.y = 10
			// canJump = true;
		}
	}

	prevTime = time

	renderer.render(scene, camera)
}

init()
animate()
