<template>
    <div class="world">
      <p v-if="message != null && is_play" v-html="message" class="world-message"></p>
      <div v-if="is_loading_complete && is_play" class="world-quest-progress" :class="{'top-position': is_mobile}">
          <span :class="{'active': quest_check > 0}">道</span>
          <span :class="{'active': quest_check > 1}">難</span>
          <span :class="{'active': quest_check > 2}">気</span>
          <span :class="{'active': quest_check > 3}">戦</span>
          <span :class="{'active': quest_check > 4}">今</span>
          <span :class="{'active': quest_check > 5}">真</span>
          <span :class="{'active': quest_check > 6}">義</span>
          <span :class="{'active': quest_check > 7}">賞</span>     
			</div>
      <div id="World2" class="world-screen"></div>
    </div>
</template>

<script>
import * as THREE from 'three'

import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
import { Octree } from '/node_modules/three/examples/jsm/math/Octree.js';
import { OctreeHelper } from '/node_modules/three/examples/jsm/helpers/OctreeHelper.js';
import { Capsule } from '/node_modules/three/examples/jsm/math/Capsule.js';
export default {
  data(){
    return{
      is_loading_complete: false,
      message: null,
      lock_message: false,
      lock_actions: false,
      portal_mainlands: 'website',
      remaining: null,
      quest_check: 0,
      interact: false,
      sound: null,
      cube: false
    }
  },
  props:{
    "control": {},
    "contract_data": {},
    "wallet_address": String,
    "wallet_balance": Number,
    "is_play": Boolean,
    "is_mobile": Boolean
  },
  watch: {
    sound: function(val){
      if (val){
          document.getElementById('audioBack').volume=0.3
          document.getElementById('audioBack').play()
      } else {
          document.getElementById('audioBack').pause()
      }
    }
  },
  methods:{
    toggleSound(){
        this.sound = !this.sound
    },
    _progressKey(address){
      return `tsu_world_demo_progress_v1:${address}`
    },
    async getProgress(address){
      const raw = sessionStorage.getItem(this._progressKey(address))
      const n = raw ? Number(raw) : 0
      this.quest_check = Number.isFinite(n) ? n : 0
      this.cube = this.quest_check >= 8
      return this.quest_check
    },
    async setProgress(address, glyph){
      const next = Math.max(this.quest_check || 0, Number(glyph) || 0)
      sessionStorage.setItem(this._progressKey(address), String(next))
      this.quest_check = next
      this.cube = this.quest_check >= 8
      return true
    },
    getWorld(){

      let th = this;
      const clock = new THREE.Clock();

      // loading manager
      const manager = new THREE.LoadingManager();
      manager.onLoad = function ( ) {
        th.is_loading_complete = true
        th.$emit('loading-complete')
        animate();
      };
          
      // scene
      const scene = new THREE.Scene();

      // camera
      const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
      camera.rotation.order = 'YXZ';
      camera.rotation.x = 0
    
      // renderer
      const container = document.getElementById('World2')
      const renderer = new THREE.WebGLRenderer( { antialias: true } );
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( window.innerWidth, window.innerHeight );
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild( renderer.domElement );

      // environment
      const environment = new RoomEnvironment();
      const pmremGenerator = new THREE.PMREMGenerator( renderer );
      scene.environment = pmremGenerator.fromScene( environment ).texture;
      scene.background = new THREE.Color( 0x4A16AC );
      scene.fog = new THREE.FogExp2( 0x4A16AC, 0.05 );

      // check collision
      function checkCollision(position, deltaX, deltaZ, deltaY) {
        if (Math.abs(position.x - camera.position.x) < deltaX && Math.abs(position.z - camera.position.z) < deltaZ && Math.abs(position.y - camera.position.y) < deltaY){
          return true
        } else {
          return false
        }
      }

        // gltf loader
        const loader = new GLTFLoader( manager );

        var video = document.createElement( 'video' );
				video.loop = true;
				video.crossOrigin = 'anonymous';
				video.preload = 'auto';
				video.src = "/textures/room/mint_date.mp4";
				video.muted = 'muted';
				video.play();

        const texture = new THREE.VideoTexture( video );
        texture.flipY=false
        //const azuki_art = new THREE.TextureLoader().load( 'https://pbs.twimg.com/media/FQ3swMoX0AAPRSw?format=jpg&name=medium' )
        //azuki_art.flipY=false
        // load main lands
        let point_terminal = {}
        let point_door = {}
        let nftframes = []
        let mixer_room
        loader.load( '/models/room.glb', ( gltf ) => {

          point_terminal['mesh'] = gltf.scene.getObjectByName('TerminalScreen')
          point_terminal['position'] = point_terminal['mesh'].getWorldPosition(new THREE.Vector3())
          point_terminal['mesh'].material.map = texture

          point_door['mesh'] = gltf.scene.getObjectByName('Door')
          point_door['position'] = point_door['mesh'].getWorldPosition(new THREE.Vector3())


          var terminal_texture_video = document.createElement( 'video' )
          terminal_texture_video.loop = true;
          terminal_texture_video.crossOrigin = 'anonymous'
          terminal_texture_video.preload = 'auto'
          terminal_texture_video.src = "/textures/terminal_islands.mp4"
          terminal_texture_video.muted = 'muted'
          terminal_texture_video.play()
            
          const terminal_texture = new THREE.VideoTexture( terminal_texture_video )
          terminal_texture.flipY = false

          point_terminal['mesh'].material.map = terminal_texture


          gltf.scene.getObjectByName('Billboard').material.map = texture

          var video2 = document.createElement( 'video' );
          video2.loop = true;
          video2.crossOrigin = 'anonymous';
          video2.preload = 'auto';
          video2.src = "/textures/room/art.mp4";
          video2.muted = 'muted';
          video2.play();

          const texture2 = new THREE.VideoTexture( video2 );
          texture2.flipY=false
          
          
          nftframes[0] = gltf.scene.getObjectByName('NFTArt')
          nftframes[1] = gltf.scene.getObjectByName('NFTArt1')
          nftframes[2] = gltf.scene.getObjectByName('NFTArt2')

          nftframes[2].material.map = texture2


          mixer_room = new THREE.AnimationMixer( gltf.scene )
          gltf.animations.forEach(animation => {
            mixer_room.clipAction( animation ).play()
          });

          worldOctree.fromGraphNode( gltf.scene )
          const helper = new OctreeHelper( worldOctree )
          helper.visible = false
          scene.add( helper )
          scene.add( gltf.scene )

        });

        // load cube
        let cube
        let cube_mixer
        if (th.cube){
          loader.load( '/models/cube.glb', ( gltf ) => {
                  
              cube_mixer = new THREE.AnimationMixer( gltf.scene )
              cube_mixer.clipAction( gltf.animations[ 0 ] ).play()

              //const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

              const group = new THREE.Group()

              group.add(gltf.scene)
              group.position.set( 0.64, 0, 0.75 )
              cube = {}
              cube['mesh'] = group
              cube['position'] = group.getWorldPosition(new THREE.Vector3())

              worldOctree.fromGraphNode( cube['mesh'] )
              const helper = new OctreeHelper( worldOctree );
              helper.visible = false;
              scene.add( helper );

              scene.add( group )
          })
        }

        let quest_mixer
        let quest_point
        loader.load( '/models/quest05.glb', ( gltf ) => {
                
            quest_mixer = new THREE.AnimationMixer( gltf.scene )
            quest_mixer.clipAction( gltf.animations[ 0 ] ).play()

            const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

            const group = new THREE.Group()
            group.add(pointLight)
            group.add(gltf.scene)
            group.position.set( -1.7, 0, -2 )
            quest_point = {}
            quest_point['mesh'] = group
            quest_point['position'] = group.getWorldPosition(new THREE.Vector3())
            quest_point['mesh'].visible = false

            if (th.quest_check == 4){
              quest_point['mesh'].visible = true
            }

            scene.add( group )
        })


        // control parameters
        const GRAVITY = 50;
        const STEPS_PER_FRAME = 5;
        const worldOctree = new Octree();
        const playerCollider = new Capsule( new THREE.Vector3( -2, 1.2, 0.44 ), new THREE.Vector3( -2, 2, 0.44 ), 0.35 );
        const playerVelocity = new THREE.Vector3();
        const playerDirection = new THREE.Vector3();

        let playerOnFloor = false;


        function playerCollisions() {

        const result = worldOctree.capsuleIntersect( playerCollider );
        playerOnFloor = false;
        if ( result ) {
          playerOnFloor = result.normal.y > 0;
          if ( ! playerOnFloor ) {
            playerVelocity.addScaledVector( result.normal, - result.normal.dot( playerVelocity ) );
          }
          playerCollider.translate( result.normal.multiplyScalar( result.depth ) );
        }
      }

      function updatePlayer( deltaTime ) {
        let damping = Math.exp( - 4 * deltaTime ) - 1;
        if ( ! playerOnFloor ) {
          playerVelocity.y -= GRAVITY * deltaTime;
          // small air resistance
          damping *= 0.1;
        }

        playerVelocity.addScaledVector( playerVelocity, damping );

        const deltaPosition = playerVelocity.clone().multiplyScalar( deltaTime );
        playerCollider.translate( deltaPosition );

        playerCollisions();

        camera.position.copy( playerCollider.end );
      }

      function getForwardVector() {
        camera.getWorldDirection( playerDirection );
        playerDirection.y = 0;
        playerDirection.normalize();
        return playerDirection;
      }

      function getSideVector() {
        camera.getWorldDirection( playerDirection );
        playerDirection.y = 0;
        playerDirection.normalize();
        playerDirection.cross( camera.up );
        return playerDirection;
      }

      function controls( deltaTime ) {

      const speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 ) / 2;

        if ( th.control.goForward ) {
          playerVelocity.add( getForwardVector().multiplyScalar( speedDelta ) );
        }

        if ( th.control.goBack ) {
          playerVelocity.add( getForwardVector().multiplyScalar( - speedDelta ) );
        }

        if ( th.control.goLeft ) {
          playerVelocity.add( getSideVector().multiplyScalar( - speedDelta ) );
        }

        if ( th.control.goRight ) {
          playerVelocity.add( getSideVector().multiplyScalar( speedDelta ) );
        }

        if ( playerOnFloor ) {
          if ( th.control.jump ) {
            playerVelocity.y = 15;
          }
        }
      }

      function viewControls(){
        if (!th.is_mobile){
          camera.rotation.y = th.control.cameraRotationY;
          camera.rotation.x = th.control.cameraRotationX;
        } else {
          if (th.control.viewTop){
            camera.rotation.x += 0.003
          }
          if (th.control.viewBottom){
            camera.rotation.x -= 0.003
          }
          if (th.control.viewLeft){
            camera.rotation.y += 0.003
          }
          if (th.control.viewRight){
            camera.rotation.y -= 0.003
          }
        }
      }

      // resize window
      window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
      });

      //teleportPlayer
      /*function teleportPlayer(x,z,y,rotation){
        playerCollider.start.set( x, z, y );
        playerCollider.end.set( x, z + 0.8, y );
        playerCollider.radius = 0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, rotation, 0 );
      }*/

      //teleportToLink
      /*function teleportToLink(url, playerX, playerY, playerZ, rotationY){
        playerCollider.start.set( playerX, playerY, playerZ );
        playerCollider.end.set( playerX, playerY + 0.8, playerZ );
        camera.rotation.set( 0, rotationY, 0 );
        keyStates = {}
        window.open(url)
      }*/

      function animate() {

        const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

        for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
          controls( deltaTime );
          viewControls()
          updatePlayer( deltaTime );
          update();
          mixer_room.update( deltaTime )
          quest_mixer.update( deltaTime )
          if (th.cube){
            cube_mixer.update( deltaTime )
          }
        }

        requestAnimationFrame( animate );
        renderer.render( scene, camera );

      }

      function update(){

        if ( camera.position.y <= - 25 ) {
          playerCollider.start.set( 0, 0.35, 0 );
          playerCollider.end.set( 0, 1, 0 );
          playerCollider.radius = 0.35;
          camera.position.copy( playerCollider.end );
          camera.rotation.set( 0, 0, 0 );
        }

        const stormActive = th.quest_check >= 8 || th.contract_data.is_presale_active
        if(stormActive){
          quest_point['mesh'].visible = false
        }

        if (checkCollision(point_terminal['position'], 1, 1, 1)){

  
          if (th.is_mobile){
              th.message = 'Tap Use to fall back into tsu dimension'
            } else {
              th.message = 'Press E to fall back into tsu dimension'
            }
            if ( th.control.use ) {
              if (!th.lock_actions){
                th.lock_actions = true
                
                /*while (container.firstChild){
                  container.removeChild(container.firstChild);
                }
                renderer.dispose()
                th.$emit('to-islands')*/

                window.location.href = '/'
                                
                th.control.use = false
                setTimeout(function(){ th.lock_actions = false }, 300);
              }
            }

				} else if (checkCollision(quest_point['position'], 1, 1, 2) && quest_point['mesh'].visible){


          if (!th.lock_message){
            th.message = null
          }
          if (th.wallet_address){
            if ( th.control.use && !th.lock_actions ) {
              th.lock_actions = true
              th.lock_message = true
              th.message = '<i>Today. Now you will choose what kind of tomorrow you want to live in</i>'
              th.setProgress(th.wallet_address, 5)
              quest_point['mesh'].visible = false
              setTimeout(function(){ th.lock_actions = false }, 2000);
              setTimeout(function(){ th.lock_message = false }, 10000);
              
            }
          }
        
        } else if (th.cube && checkCollision(cube['position'], 1, 1, 2)){
          th.message = '<p style="max-width: 400px;">I can hear something inside… Hope it’s not a demon that one day will come out and trash my room.</p>'
        } else if (checkCollision(point_door['position'], 0.5, 0.5, 1)){
          th.message = 'Try to come back here when you obtain your tsu Pass'
        } else {
          if (!th.lock_message){
            th.message = null
          }
        }

      }

    }
  },
  mounted () {

    let th = this
    if (th.wallet_address){
      th.getProgress(th.wallet_address)
      .then(function(){
        th.getWorld()
      })
    } else {
      th.getWorld()
    }

  }
}
</script>

<style scoped>
  .world{
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .world-message{
    color: #ffffff;
    position: absolute;
  }
    .world-quest-progress{
    position: absolute;
    bottom: 100px;
  }
  .world-quest-progress.top-position{
    bottom: auto;
    top: 30px;
  }
  .world-quest-progress span{
      opacity: 0.3;
      margin: 0 4px;
  }
  .world-quest-progress span.active{
      opacity: 1;
  }
</style>
