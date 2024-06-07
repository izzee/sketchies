import './style.css'
import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera, 
  Scene, 
  SphereGeometry,
  TorusGeometry,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { NoiseShader } from './noise-shader';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { animate, inView } from 'motion'

const runAnimations = () => {
  // Three.js
  const loaderTag = document.querySelector('section.loader')
  const threeTag = document.querySelector('.three')
  const {width, height} = threeTag.getBoundingClientRect()

  let aimEffect = 0
  let currentEffect = 1
  let aimDirection = 0
  let currentDirection = 0
  let timeoutEffect

  const clock = new Clock()
  const scene = new Scene()
  const camera = new PerspectiveCamera( 75, width / height, 0.1, 1000 )

  const renderer = new WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0)
  threeTag.appendChild( renderer.domElement)

  // Post-Processing
  const composer = new EffectComposer(renderer)

  const renderPass = new RenderPass(scene, camera)
  composer.addPass(renderPass)

  const nosiePass = new ShaderPass(NoiseShader)
  nosiePass.uniforms.time.value = clock.getElapsedTime()
  nosiePass.uniforms.time.value = clock.getElapsedTime()
  nosiePass.uniforms.effect.value = currentEffect
  nosiePass.uniforms.direction.value = currentDirection

  nosiePass.uniforms.aspectRatio.value = width / height
  composer.addPass(nosiePass);

  const outputPass = new OutputPass()
  composer.addPass(outputPass)


  // Lighting
  const ambience = new AmbientLight(0x404040)
  camera.add(ambience)

  const keyLight = new DirectionalLight(0xffffff, 1)
  keyLight.position.set(-1,1,3)
  camera.add(keyLight)

  const fillLight = new DirectionalLight(0xffffff, .5)
  fillLight.position.set(1,1,3)
  camera.add(fillLight)

  const backLight = new DirectionalLight(0xffffff, 1)
  backLight.position.set(-1,3,-1)
  camera.add(backLight)

  scene.add(camera)
  camera.position.z = 200


  // Set up groups
  const loadGroup = new Group()
  const haloGroup = new Group()
  const scrollGroup = new Group()

  loadGroup.add(haloGroup)
  scrollGroup.add(loadGroup)
  scene.add(scrollGroup)
  
  // Create geometries
  const makeSphere = (textureFile, size) => {
    const loader = new TextureLoader()
    
    const texture = loader.load(`../${textureFile}`)
    const geometry = new SphereGeometry(size, size, size)
    const material = new MeshLambertMaterial({
      map: texture
    })
    const sphere = new Mesh(geometry, material)
    return sphere
  }
  
  const makeHalo = () => {
    const geometry = new TorusGeometry(55, 1, 30)
    const material = new MeshBasicMaterial({
      color: 0xffff00
    })
    const halo = new Mesh(geometry, material)
    halo.geometry.rotateX(Math.PI / 2.25)
    return halo
  }

  const assembleOrbit = () => { 
    const halo = makeHalo()
    haloGroup.add(halo)

    const earth = makeSphere('earth.jpg', 12)
    earth.translateX(70)
    haloGroup.add(earth)

    const smiley = makeSphere('smiley.png', 10)
    smiley.getCenter
    smiley.translateX(-65)
    smiley.rotateY(185)
    haloGroup.add(smiley)

    const beachball = makeSphere('beachball.jpg', 8)
    beachball.translateZ(55)
    haloGroup.add(beachball)

    const rainbowball = makeSphere('rainbow.jpg', 12)
    rainbowball.translateZ(-65)
    haloGroup.add(rainbowball)
    haloGroup.translateY(80)
  }
  
  // Import models and set up scene
  const gltfLoader = new GLTFLoader()
  gltfLoader.load('../bust2.glb', (gltf) => {
    gltf.scene.traverse( function ( child ) {
      if ( child.isMesh ) {
        child.geometry.center();
      }
    });
    gltf.scene.scale.set(120, 120, 120)
    loadGroup.add(gltf.scene)
    assembleOrbit()

    document.body.classList.remove('loading')
    // gltfLoader.load('../duck.glb', (gltf) => {
    //   gltf.scene.scale.set(20, 20, 20)
    //   gltf.scene.translateX(35)
    //   gltf.scene.translateZ(40)
    //   gltf.scene.rotateY(20)
    //   haloGroup.add(gltf.scene)
    // })
  }, 
    (xhr) => {
    }, 
    (error) => {console.error(error)
  })


  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableZoom = false
  controls.enablePan = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 2

  // Animation
  const render = () => {
    // autorotation of shape
    controls.update()

    // rotate scroll group containing shape
    // scrollGroup.rotation.set(0,window.scrollY*0.0025,0)

    haloGroup.rotateY(0.01)

    // tween effect based on scroll status
    const newDirection = currentDirection + (aimDirection - currentDirection) * 0.02
    if (aimDirection !== 0) {
      currentDirection = newDirection
      currentEffect = Math.min(currentEffect + 0.02, 1)
    } else {
      currentDirection = Math.max(newDirection, 0)
      currentEffect = Math.max(currentEffect - 0.02, 0)
    }

    nosiePass.uniforms.direction.value = currentDirection
    nosiePass.uniforms.effect.value = currentEffect
    nosiePass.uniforms.aspectRatio.value = width / height

    // uptate time that is passed into noise shader
    nosiePass.uniforms.time.value = clock.getElapsedTime()
    // animate scene
    requestAnimationFrame(render)
    composer.render()
  }
  render()

  // Window resize
  const resize = () => {
    const {width, height} = threeTag.getBoundingClientRect()
    nosiePass.uniforms.aspectRatio.value = width / height
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
  window.addEventListener('resize', resize)

  // Scroll listener
  const scroll = () => {
    clearTimeout(timeoutEffect)
    aimEffect = 1

    timeoutEffect = setTimeout(() => {
      aimEffect = 0
    }, 100)
  }
  window.addEventListener('scroll', scroll)
  inView('section', (info) => {
    if (info.target.querySelector('.content')) {
      // animate(info.target.querySelectorAll('.content'), 
      // )
    }
    if (info.target.classList.contains('left')) {
      aimDirection = 1
    } else if (info.target.classList.contains('right')) {
      aimDirection = -1
    } else {
      aimDirection = 0
    }
    return (leaveInfo) => {}
  }, {margin: '-50%'})
}



if ( WebGL.isWebGLAvailable() ) {
  runAnimations()
} else {
  document.querySelector('.error-message').style.display = 'block'

}