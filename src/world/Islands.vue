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
      <div id="World" class="world-screen"></div>
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
      wlstats: null,
      quest_check: 0,
      interact: false,
      sound: null,
      is_whitelisted: false,
      helper_wl: false,
      is_mint_process: false
    }
  },
  props:{
    "control": {},
    "contract": {},
    "contract_data": {},
    "wallet_address": String,
    "wallet_balance": Number,
    "is_play": Boolean,
    "is_mobile": Boolean,
  },
  watch: {
    sound: function(val){
      if (val){
          document.getElementById('audioBack').volume=0.3
          document.getElementById('audioBack').play()
      } else {
          document.getElementById('audioBack').pause()
      }
    },
    wallet_address: async function(address){
      if (address){
        this.is_whitelisted = true
        await this.getProgress(address)
      }
    }
  },
  methods:{
    _progressKey(address){
      return `tsu_world_demo_progress_v1:${address}`
    },
    async getProgress(address){
      const raw = sessionStorage.getItem(this._progressKey(address))
      const n = raw ? Number(raw) : 0
      this.quest_check = Number.isFinite(n) ? n : 0
      return this.quest_check
    },
    async setProgress(address, glyph){
      const next = Math.max(this.quest_check || 0, Number(glyph) || 0)
      sessionStorage.setItem(this._progressKey(address), String(next))
      this.quest_check = next
      return true
    },
    toggleSound(){
        this.sound = !this.sound
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

    
      // renderer
      const container = document.getElementById('World')
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

      // light
			const sphere = new THREE.SphereGeometry( 0.1, 9, 5 );

			const pointLight1 = new THREE.PointLight( 0xbb0000, 50, 3 );
			pointLight1.position.set( -6.48, 1.4, -20.43 );
			pointLight1.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xbb0000 } ) ) );
			scene.add( pointLight1 );

			const pointLight2 = new THREE.PointLight( 0xbb0000, 50, 3 );
			pointLight2.position.set( -7.6, 1.4, -21.42 );
			pointLight2.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xbb0000 } ) ) );
			scene.add( pointLight2 );

			const pointLight3 = new THREE.PointLight( 0xbb0000, 20, 3 );
			pointLight3.position.set( 6.025, 1.32, -16.53 );
			pointLight3.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xbb0000 } ) ) );
			scene.add( pointLight3 );

			const pointLight4 = new THREE.PointLight( 0xbb0000, 20, 3 );
			pointLight4.position.set( 5.419, 1.35, -20.49 );
			pointLight4.add( new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( { color: 0xbb0000 } ) ) );
			scene.add( pointLight4 );

      // check collision
      function checkCollision(position, deltaX, deltaZ, deltaY) {
				if (Math.abs(position.x - camera.position.x) < deltaX && Math.abs(position.z - camera.position.z) < deltaZ && Math.abs(position.y - camera.position.y) < deltaY){
					return true
				} else {
					return false
				}
			}

      // textures
      const portal_texture_website = new THREE.TextureLoader().load( '/textures/portal_web.png' )
      const portal_texture_gitbook = new THREE.TextureLoader().load( '/textures/portal_gitbook.png' )
      const portal_texture_whitelisting = new THREE.TextureLoader().load( '/textures/portal_wl.png' )
      const portal_material = new THREE.MeshBasicMaterial( )
			portal_material.transparent = true
			portal_material.opacity = 0.5
			portal_material.map = portal_texture_website

      const screen_texture = new THREE.TextureLoader().load( '/textures/screen_coming.png' )
			screen_texture.flipY=false

      let control_website_material = new THREE.MeshStandardMaterial( {color: 0x6C0000, metalness: 1, roughness: 0.6, opacity: 0.5, transparent: true, flatShading: true} );
			let control_gitbook_material = new THREE.MeshStandardMaterial( {color: 0x000000, metalness: 1, roughness: 0.6, opacity: 0.5, transparent: true, flatShading: true} );
			let control_whitelist_material = new THREE.MeshStandardMaterial( {color: 0xffffff, metalness: 1, roughness: 0.6, opacity: 0.5, transparent: true, flatShading: true} );

      // gltf loader
      const loader = new GLTFLoader( manager );
            
      // load main lands

      let mixer_mainlands
      let point_mainlands_foxflame = {}
      let point_mainlands_portaltoggler = {}
      let point_mainlands_portal = {}
      let point_mainlands_backportal = {}
      let point_mainlands_screen = {}
      let point_mainlands_tshirt = {}
			loader.load( '/models/main_lands.gltf', ( gltf ) => {

        point_mainlands_foxflame['mesh'] = gltf.scene.getObjectByName('FoxFlame')
        point_mainlands_foxflame['position'] = point_mainlands_foxflame['mesh'].getWorldPosition(new THREE.Vector3())

        point_mainlands_portaltoggler['mesh'] = gltf.scene.getObjectByName('PortalToggle')
        point_mainlands_portaltoggler['position'] = point_mainlands_portaltoggler['mesh'].getWorldPosition(new THREE.Vector3())
        point_mainlands_portaltoggler['mesh'].material = control_website_material

        point_mainlands_portal['mesh'] = gltf.scene.getObjectByName('Portal')
        point_mainlands_portal['position'] = point_mainlands_portal['mesh'].getWorldPosition(new THREE.Vector3())
        point_mainlands_portal['mesh'].material = portal_material

        point_mainlands_backportal['mesh'] = gltf.scene.getObjectByName('BackPortal')
        point_mainlands_backportal['position'] = point_mainlands_backportal['mesh'].getWorldPosition(new THREE.Vector3())
        point_mainlands_backportal['mesh'].visible = false

        point_mainlands_screen['mesh'] = gltf.scene.getObjectByName('Screen')
        point_mainlands_screen['position'] = point_mainlands_screen['mesh'].getWorldPosition(new THREE.Vector3())
        point_mainlands_screen['mesh'].material.map = screen_texture

        point_mainlands_tshirt['mesh'] = gltf.scene.getObjectByName('TShirt')
        point_mainlands_tshirt['position'] = point_mainlands_tshirt['mesh'].getWorldPosition(new THREE.Vector3())

				mixer_mainlands = new THREE.AnimationMixer( gltf.scene )
				mixer_mainlands.clipAction( gltf.animations[ 0 ] ).play()
				mixer_mainlands.clipAction( gltf.animations[ 1 ] ).play()
				mixer_mainlands.clipAction( gltf.animations[ 2 ] ).play()
				mixer_mainlands.clipAction( gltf.animations[ 3 ] ).play()
				mixer_mainlands.clipAction( gltf.animations[ 4 ] ).play()
				mixer_mainlands.clipAction( gltf.animations[ 5 ] ).play()
                
        worldOctree.fromGraphNode( gltf.scene.getObjectByName('Lands') )
				const helper = new OctreeHelper( worldOctree )
				helper.visible = false
				scene.add( helper )
				scene.add( gltf.scene )

			});

      // load collab island
			let point_collabisland_portal_metaverse = {}
			let point_collabisland_portal_ascendants = {}
			loader.load( '/models/collab_island.glb', ( gltf ) => {
	
				gltf.scene.position.set(-20, -0.45, -18);
				worldOctree.fromGraphNode( gltf.scene.children[0] );
				worldOctree.fromGraphNode( gltf.scene.children[1] );

				point_collabisland_portal_metaverse['mesh'] = gltf.scene.getObjectByName('PortalMetaverse')
        point_collabisland_portal_metaverse['position'] = point_collabisland_portal_metaverse['mesh'].getWorldPosition(new THREE.Vector3())

        point_collabisland_portal_ascendants['mesh'] = gltf.scene.getObjectByName('PortalKFrens')
        point_collabisland_portal_ascendants['position'] = point_collabisland_portal_ascendants['mesh'].getWorldPosition(new THREE.Vector3())

				const helper = new OctreeHelper( worldOctree );
				helper.visible = false;
				scene.add( helper );
				scene.add( gltf.scene );

			});

      // load kk island
      let mixer_kk;
      let point_kk_portal_tw_metaverse = [];
      let point_kk_portal_web_metaverse = [];
			loader.load( '/models/kk_island.glb', ( gltf ) => {
	
				gltf.scene.position.set(-20, -0.45, -18);
				worldOctree.fromGraphNode( gltf.scene );

        mixer_kk = new THREE.AnimationMixer( gltf.scene )
        gltf.animations.forEach(animation => {
          mixer_kk.clipAction( animation ).play()
        });

        point_kk_portal_tw_metaverse['mesh'] = gltf.scene.getObjectByName('TerminalScreenTW')
        point_kk_portal_tw_metaverse['position'] = point_kk_portal_tw_metaverse['mesh'].getWorldPosition(new THREE.Vector3())

        point_kk_portal_web_metaverse['mesh'] = gltf.scene.getObjectByName('TerminalScreenWEB')
        point_kk_portal_web_metaverse['position'] = point_kk_portal_web_metaverse['mesh'].getWorldPosition(new THREE.Vector3())

				const helper = new OctreeHelper( worldOctree );
				helper.visible = false;
				scene.add( helper );
				scene.add( gltf.scene );

			});

      // load quest

      let quest_point_messages = [
          '<p style="max-width:500px;">You are collecting the first Glyph of Power and the words start roaring in your mind: <i>Path. Path is what every warrior has to choose</i></p>',
          '<i>Hardship. Difficulties on your way may harden your will</i>',
          '<i>Spirit. Spirit of yours is steadfast and brave</i>',
          '<i>Battle. Battle is about to change the world as you know it</i>',
          '<i>Today. Now you will choose what kind of tomorrow you want to live in</i>',
          '<i>Truth. Truth is sharper than a sword</i>',
          '<i>Honor. Honor cannot let you give up halfway to victory</i>',
          '<i>Prize. Prize is deserved only through true sacrifice</i>',
      ]
      let quest_point_positions = [
          [0.24, -0.5, -15.7],
          [-19.27, 0.1, -14.23],
          [-1.27, -1, -31],
          [-17.22, -19.5, -25.13],
          [-12.52, -1, -21],
          [-12.52, -1, -21],
          [7.1, 5, -18.67],
          [-12.13, 2.4, -12.87]
      ]
      let quest_mixers = {}
      let quest_points = []
      quest_point_positions.forEach((position, index) => {
          loader.load( '/models/quest0' + (index + 1) + '.glb', ( gltf ) => {
              
              quest_mixers[index] = new THREE.AnimationMixer( gltf.scene )
              quest_mixers[index].clipAction( gltf.animations[ 0 ] ).play()

              const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

              const group = new THREE.Group()
              group.add(pointLight)
              group.add(gltf.scene)
              group.position.set( position[0], position[1], position[2] )
              quest_points[index] = {}
              quest_points[index]['mesh'] = group
              quest_points[index]['position'] = group.getWorldPosition(new THREE.Vector3())
              quest_points[index]['mesh'].visible = false

              /*if (th.quest_check == index){
                quest_points[index]['mesh'].visible = true
              }

              if (th.wlstats.activeQ == 'false' ){
                quest_points[index]['mesh'].visible = false
              }*/

              scene.add( group )
          })
      });

      // load wl island
      let wl_island
      let wl_island_helper
      let wl_island_mixer
      let wl_island_greenflame = {}
      let wl_island_portal = {}
			loader.load( '/models/wl_island.glb', ( gltf ) => {
        wl_island = gltf.scene
				wl_island.position.set(-5, -1.3, -13);

        wl_island_greenflame['mesh'] = gltf.scene.getObjectByName('GreenFlame')
        wl_island_greenflame['position'] = wl_island_greenflame['mesh'].getWorldPosition(new THREE.Vector3())
        if(th.is_whitelisted){
          wl_island_greenflame['mesh'].visible = true
        } else {
          wl_island_greenflame['mesh'].visible = false
        }

        wl_island_portal['mesh'] = gltf.scene.getObjectByName('PortalEffect')
        wl_island_portal['position'] = wl_island_portal['mesh'].getWorldPosition(new THREE.Vector3())
        wl_island_portal['mesh'].visible = false
        
        wl_island_mixer = new THREE.AnimationMixer( gltf.scene )
        gltf.animations.forEach(animation => {
          wl_island_mixer.clipAction( animation ).play()
        });

				worldOctree.fromGraphNode( gltf.scene.getObjectByName('Land') );
				wl_island_helper = new OctreeHelper( worldOctree );
        wl_island_helper.visible = false;
				scene.add( wl_island_helper )
				scene.add( wl_island )
			});

      

      // load hidden island

			loader.load( '/models/hidden.glb', ( gltf ) => {
				gltf.scene.position.set(-1, -20, -30);

				worldOctree.fromGraphNode( gltf.scene );
				let helper = new OctreeHelper( worldOctree );
        helper.visible = false;
        scene.add( helper )
				scene.add( gltf.scene )
			});

      // load mint island
      let mint_island
      let mint_crystal
      let mint_flame1
      let mint_flame2
      let mint_island_helper
      let mint_island_mixer
      let mint_effects = []
			loader.load( '/models/mint_island.glb', ( gltf ) => {
        mint_island = gltf.scene
				mint_island.position.set(14, 1, -10);
        
        mint_island_mixer = new THREE.AnimationMixer( gltf.scene )
        gltf.animations.forEach(animation => {
          mint_island_mixer.clipAction( animation ).play()
        });

        mint_crystal = {}
        mint_crystal['mesh'] = gltf.scene.getObjectByName('MintCrystal')
        mint_crystal['position'] = mint_crystal['mesh'].getWorldPosition(new THREE.Vector3())

        mint_effects[0] = gltf.scene.getObjectByName('StormEffect')
        mint_effects[1] = gltf.scene.getObjectByName('StormEffect2')
        mint_effects[2] = gltf.scene.getObjectByName('StormEffect3')

        if (!th.contract_data.is_presale_active){
          
          mint_crystal['mesh'].visible = false
          mint_effects[0].visible = false
          mint_effects[1].visible = false
          mint_effects[2].visible = false
        }

        mint_flame1 = gltf.scene.getObjectByName('Flame1')
        mint_flame2 = gltf.scene.getObjectByName('Flame2')
        if(th.is_whitelisted){
          mint_flame1.visible = true
          mint_flame2.visible = true
        } else {
          mint_flame1.visible = false
          mint_flame2.visible = false
        }

				worldOctree.fromGraphNode( gltf.scene.getObjectByName('Land') );
				mint_island_helper = new OctreeHelper( worldOctree );
        mint_island_helper.visible = false;
				scene.add( mint_island_helper )
				scene.add( mint_island )
			});

      // load cube
      let cube
      let cube_mixer
      if (th.quest_check <= 8){
        loader.load( '/models/cube.glb', ( gltf ) => {
                
            cube_mixer = new THREE.AnimationMixer( gltf.scene )
            cube_mixer.clipAction( gltf.animations[ 0 ] ).play()

            const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

            const group = new THREE.Group()
            group.add(pointLight)
            group.add(gltf.scene)
            group.position.set( -37, -19.05, -8.88 )
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

      // load sphere
      let infopoint
      let infopoint_mixer
      loader.load( '/models/warn.glb', ( gltf ) => {
              
          infopoint_mixer = new THREE.AnimationMixer( gltf.scene )
          infopoint_mixer.clipAction( gltf.animations[ 0 ] ).play()

          const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

          const group = new THREE.Group()
          group.add(pointLight)
          group.add(gltf.scene)
          group.position.set( 0.24, -0.7, -15.7 )
          infopoint = {}
          infopoint['mesh'] = group
          infopoint['position'] = group.getWorldPosition(new THREE.Vector3())

          if (!th.contract_data.is_presale_active){
            infopoint['mesh'].visible = false
          }

          scene.add( group )
      })

      // load terminal
      let terminal
      let terminal2
      let terminal_mixer
      let terminal2_mixer
      loader.load( '/models/terminal.glb', ( gltf ) => {
              
          var terminal_texture_video = document.createElement( 'video' )
          terminal_texture_video.loop = true;
          terminal_texture_video.crossOrigin = 'anonymous'
          terminal_texture_video.preload = 'auto'
          terminal_texture_video.src = "/textures/terminal_room1.mp4"
          terminal_texture_video.muted = 'muted'
          terminal_texture_video.play()
            
          const terminal_texture = new THREE.VideoTexture( terminal_texture_video )
          terminal_texture.flipY = false

          gltf.scene.getObjectByName('TerminalScreen').material.map = terminal_texture

          terminal_mixer = new THREE.AnimationMixer( gltf.scene )
          terminal_mixer.clipAction( gltf.animations[ 0 ] ).play()

          terminal2_mixer = new THREE.AnimationMixer( gltf.scene )
          terminal2_mixer.clipAction( gltf.animations[ 0 ] ).play()

          const pointLight = new THREE.PointLight( 0xbb0000, 10, 3 )

          const group = new THREE.Group()
          group.add(pointLight)
          group.add(gltf.scene)
          group.position.set( 5.5, -1.8, -28 )
          terminal = {}
          terminal['mesh'] = group
          terminal['position'] = group.getWorldPosition(new THREE.Vector3())

          const group2 = new THREE.Group()
          group2.add(pointLight)
          group2.add(gltf.scene.clone())
          group2.position.set(-46, -20, -21.12);
          group2.rotation.set(0, -3, 0);
          terminal2 = {}
          terminal2['mesh'] = group2
          terminal2['position'] = group2.getWorldPosition(new THREE.Vector3())
 

          worldOctree.fromGraphNode( gltf.scene );
          worldOctree.fromGraphNode( group2 );
          const helper = new OctreeHelper( worldOctree );
          helper.visible = false;
          scene.add( helper );

          scene.add( group )
          scene.add( group2 )
      })


      // control parameters
      const GRAVITY = 50;
      const STEPS_PER_FRAME = 5;
      const worldOctree = new Octree();
      const playerCollider = new Capsule( new THREE.Vector3( 0, 1.2, 0 ), new THREE.Vector3( 0, 2, 0 ), 0.35 );
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

      function moveControls( deltaTime ) {

        let speedDelta
        if (th.is_mobile){
          speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 ) / 2;
        } else {
          speedDelta = deltaTime * ( playerOnFloor ? 25 : 8 ) / 2;
        }

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
        if (camera.rotation.x > 1.2){
          camera.rotation.x = 1.197
        }
        if (camera.rotation.x < -1.2){
          camera.rotation.x = -1.197
        }
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
      function teleportPlayer(x,z,y,rotation){
        playerCollider.start.set( x, z, y );
        playerCollider.end.set( x, z + 0.8, y );
        playerCollider.radius = 0.35;
        camera.position.copy( playerCollider.end );
        camera.rotation.set( 0, rotation, 0 );
      }

      //teleportToLink
      function teleportToLink(url, playerX, playerY, playerZ, rotationY){
        th.control.goForward = false
        th.control.goBack = false
        th.control.goLeft = false
        th.control.goRight = false
        th.control.jump = false
        playerCollider.start.set( playerX, playerY, playerZ );
        playerCollider.end.set( playerX, playerY + 0.8, playerZ );
        camera.rotation.set( 0, rotationY, 0 );
        window.open('https://namazov.pro')
      }

      function animate() {


        const deltaTime = Math.min( 0.05, clock.getDelta() ) / STEPS_PER_FRAME;

        for ( let i = 0; i < STEPS_PER_FRAME; i ++ ) {
					
          // mixers
          mixer_mainlands.update( deltaTime )
          
          infopoint_mixer.update ( deltaTime )
          terminal_mixer.update ( deltaTime )
          terminal2_mixer.update ( deltaTime )
          mint_island_mixer.update ( deltaTime )
          mixer_kk.update ( deltaTime )
          if (th.quest_check <= 8){
            cube_mixer.update ( deltaTime )
          }
          if (th.quest_check >= 3){
            wl_island_mixer.update ( deltaTime )
          }
          
          viewControls()
          moveControls( deltaTime )
					updatePlayer( deltaTime )
          update()

          for (let m = 0; m < 8; m ++) {
            quest_mixers[m].update( deltaTime );
          }
				}

        requestAnimationFrame( animate );
        renderer.render( scene, camera );

      }

      function update(){

        const stormActive = th.quest_check >= 8 || th.contract_data.is_presale_active

        if (stormActive){
          scene.background = new THREE.Color( 0x9196AC );
          scene.fog = new THREE.FogExp2( 0x9196AC, 0.12 );
          mint_effects[0].visible = true
          mint_effects[1].visible = true
          mint_effects[2].visible = true
          mint_crystal['mesh'].visible = true
          infopoint['mesh'].visible = true

        } else {
          scene.background = new THREE.Color( 0xbb0000 );
          scene.fog = new THREE.FogExp2( 0xbb0000, 0.12 );
          mint_effects[0].visible = false
          mint_effects[1].visible = false
          mint_effects[2].visible = false
          mint_crystal['mesh'].visible = false
          infopoint['mesh'].visible = false
        }
                
        if ( camera.position.y <= - 25 ) {
					playerCollider.start.set( 0, 0.35, 0 );
					playerCollider.end.set( 0, 1, 0 );
					playerCollider.radius = 0.35;
					camera.position.copy( playerCollider.end );
					camera.rotation.set( 0, 0, 0 );
				}
                
        point_mainlands_foxflame['mesh'].visible = true

        if (th.quest_check >= 3){
          wl_island_portal['mesh'].visible = true
        }

        if (th.is_whitelisted){
          wl_island_greenflame['mesh'].visible = true
          mint_flame1.visible = true
          mint_flame2.visible = true
        } else {
          wl_island_greenflame['mesh'].visible = false
          mint_flame1.visible = false
          mint_flame2.visible = false
        }

        // collisions
        if (checkCollision(point_mainlands_foxflame['position'], 2, 2, 2)){

  
          th.lock_message = false
          th.message = 'Demo mode: wallet not required'

				} else if (checkCollision(infopoint['position'], 2, 2, 2) && infopoint['mesh'].visible){

            th.message = '<p style="max-width:550px;">It looks like it is not the best time to collect the Glyphs during the Mint Storm. I will try to come back later.</p>'

        } /*else if (th.quest_check <= 8 && checkCollision(cube['position'], 2, 2, 2) && cube['mesh'].visible){

            if (th.is_mobile){
              th.message = '<p style="max-width:550px;">What the hell is that?<br>Tap Use to interact. </p>'
            } else {
              th.message = '<p style="max-width:550px;">What the hell is that?<br>Press E to interact. </p>'
            }
            if ( th.control.use ) {
              if (!th.lock_actions){
                th.lock_actions = true

                if (th.quest_check > 7){
                  th.setProgress(th.wallet_address, th.quest_check + 1)
                  cube['mesh'].visible = false
                  th.lock_message = true
                  th.message = '<p style="max-width:550px;">Now is the time to wake up, warrior! </p>'
                  setTimeout(function(){ th.lock_message = false }, 10000);
                }

                th.control.use = false
                setTimeout(function(){ th.lock_actions = false }, 300);
              }
            }

        }*/ else if (checkCollision(terminal['position'], 2, 2, 2) || checkCollision(terminal2['position'], 2, 2, 2)){

            if (th.is_mobile){
              th.message = 'Tap Use to Wake Up'
            } else {
              th.message = 'Press E to Wake Up'
            }
            if ( th.control.use ) {
              if (!th.lock_actions){
                th.lock_actions = true

                
                while (container.firstChild){
                  container.removeChild(container.firstChild);
                }
                
                renderer.dispose()

                //th.$emit('exit-into-room')

                window.location.href = './?w=city'

                th.control.use = false
                setTimeout(function(){ th.lock_actions = false }, 300);
              }
            }

        } else if (checkCollision(wl_island_portal['position'], 1, 1, 1) && wl_island_portal['mesh'].visible){

            teleportPlayer(-3, -19, -30, -1.6)

        } else if (checkCollision(mint_crystal['position'], 1, 1, 3) && mint_crystal['mesh'].visible){

            th.message = 'Mint disabled in demo'

        } else if (checkCollision(point_mainlands_portaltoggler['position'], 1, 1, 1)){

          th.lock_message = false
          {
            if (th.is_mobile){
              th.message = "Tap Use to change the portal's destination"
            } else {
              th.message = "Press E to change the portal's destination"
            }
              
              if ( th.control.use ) {
                  if (!th.lock_actions){
                      th.lock_actions = true
                      if (th.portal_mainlands == 'whitelisting'){
                          th.portal_mainlands = 'website'
                          portal_material.map = portal_texture_website
                          point_mainlands_portaltoggler['mesh'].material = control_website_material
                      } else if (th.portal_mainlands == 'website'){
                          th.portal_mainlands = 'gitbook'
                          portal_material.map = portal_texture_gitbook
                          point_mainlands_portaltoggler['mesh'].material = control_gitbook_material
                      } else if (th.portal_mainlands == 'gitbook'){
                          th.portal_mainlands = 'whitelisting'
                          portal_material.map = portal_texture_whitelisting
                          point_mainlands_portaltoggler['mesh'].material = control_whitelist_material
                      }
                      setTimeout(function(){ th.lock_actions = false }, 300);
                  }
              }
          }  

        } else if (checkCollision(point_mainlands_portal['position'], 1, 1, 1)){
                    
                    if (th.portal_mainlands == 'website'){
                        teleportToLink('https://namazov.pro', -11, 1, -26, 3)
                    } else if (th.portal_mainlands == 'gitbook'){
                        teleportToLink('https://namazov.pro', -11, 1, -26, 3)
                    } else if (th.portal_mainlands == 'whitelisting') {
                        teleportPlayer(-11, 1, -48.23, 0)
                    }

        } else if (checkCollision(point_mainlands_backportal['position'], 1, 1, 1)) {

                    teleportPlayer(-11.5, 1, -28, 4)   

        } else if (checkCollision(point_collabisland_portal_metaverse['position'], 1, 1, 1)) {

                    teleportToLink('https://namazov.pro', -20, 0.9, -18, 5)

        } else if (checkCollision(point_collabisland_portal_ascendants['position'], 1, 1, 1)) {

                    teleportToLink('https://namazov.pro', -20, 0.9, -18, 5)

        } else if (checkCollision(point_kk_portal_tw_metaverse['position'], 1, 1, 1)) {
          if (th.is_mobile){
            th.message = 'Tap Use to open creator\'s website'
          } else {
            th.message = 'Press E to open creator\'s website'
          }
          if ( th.control.use ) {
            if (!th.lock_actions){
              th.lock_actions = true

              teleportToLink('https://namazov.pro', -12.13, 3.4, -12.87, -1)

              th.control.use = false
              setTimeout(function(){ th.lock_actions = false }, 300);
            }
          }
        } else if (checkCollision(point_kk_portal_web_metaverse['position'], 1, 1, 1)) {
          if (th.is_mobile){
            th.message = 'Tap Use to open creator\'s website'
          } else {
            th.message = 'Press E to open creator\'s website'
          }
          if ( th.control.use ) {
            if (!th.lock_actions){
              th.lock_actions = true

              teleportToLink('https://namazov.pro', -12.13, 3.4, -12.87, -1)

              th.control.use = false
              setTimeout(function(){ th.lock_actions = false }, 300);
            }
          }
        } else if (checkCollision(point_mainlands_tshirt['position'], 2, 2, 2)) {

                    th.lock_message = false
                    th.message = 'Mint is coming soon'  

        } else {
                    if (!th.lock_message){
                        th.message = null
                    }
                    th.interact = false
        }


        quest_points.forEach((point, index) => {
          
          

          if (th.quest_check == index && th.quest_check < 8 && !th.lock_actions){
            quest_points[index]['mesh'].visible = true
          } else {
            quest_points[index]['mesh'].visible = false
          }

          if (stormActive){
            quest_points[index]['mesh'].visible = false
          }

          if (th.quest_check == 4){
            quest_points[4]['mesh'].visible = false
          }

          if (checkCollision(point['position'], 1.2, 1.2, 2) && point['mesh'].visible){
              if(index == 0){
                th.message = 'Hmm... It looks like I need to collect all 8 Glyphs of Power to make the first step on tsu warrior’s path.'
              }
              
              if ( th.control.use && !th.lock_actions ) {
                        
                th.lock_actions = true
                setTimeout(function(){ th.lock_actions = false }, 2000);

                th.lock_message = true
                
                if(index == 7){
                  th.message =  "<p style='max-width: 500px;font-size: 22px;font-weight: bold; margin-bottom: 30px;'>Congratulations! You have completed the quest.</p>" + quest_point_messages[index];
                } else {
                  th.message =  quest_point_messages[index]
                }
                
                th.$gtag.event('point')
                th.setProgress(th.wallet_address, index + 1)

                if (th.quest_check == 7){
                  setTimeout(function(){ th.lock_message = false }, 20000);
                } else {
                  setTimeout(function(){ th.lock_message = false }, 10000);
                }

                th.setProgress(th.wallet_address, index + 1)

                if (index != 7){ 
                  quest_points[index + 1]['mesh'].visible = true 
                }

                if (th.quest_check == 7){ 
                      
                  
                  /*axios.get('https://qroizz2nca.execute-api.us-east-2.amazonaws.com/wl/addwl?address=' + th.wallet_address)
                  .then(function (res) {
                      if (res.data.result){
                        th.$gtag.event('wl_success')
                        th.message = 'Excellent! Your ETH address has been added to the whitelist!'
                        wl_island_greenflame['mesh'].visible = true
                        setTimeout(function(){ th.lock_message = false }, 25000);
                      } else {
                        th.$gtag.event('wl_error')
                        th.message = 'Error!'
                        setTimeout(function(){ th.lock_message = false }, 25000);
                      }
                  })*/

                }


              }    
          }
        });
      }

    }
  },
  mounted () {
    
    let th = this


    /*axios.get('https://qroizz2nca.execute-api.us-east-2.amazonaws.com/wl/getremaining')
    .then(async function (res) {
      th.wlstats = res.data
      th.wlstats.activeQ = 'true'
      
      if (th.wallet_address){

        axios.get('https://qroizz2nca.execute-api.us-east-2.amazonaws.com/getproof/' + th.wallet_address)
        .then(function (res) {
          if (res.data == false){
            th.is_whitelisted = false
          } else {
            th.is_whitelisted = true
          }
          th.getProgress(th.wallet_address)
            .then(function(){
              th.getWorld()
            })
        })
        
      } else {
        th.getWorld()
      }
    })*/

    if (th.wallet_address){
      th.getProgress(th.wallet_address).then(function(){
        th.getWorld()
      })
    } else {
      th.getWorld()
    }

    

  }
}
</script>

<style scoped>
video{
  display: none;
}
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
.congratulations{
  max-width: 500px;
  font-size: 22px;
  font-weight: bold;
}

</style>
