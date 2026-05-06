<template>

    <div v-if="!is_world_loading_complete" class="loading">
      Loading...
      <p class="loading_message" v-html="randomMessage"></p>
      </div>
    <div v-else class="interface" unselectable="on">
      <div v-if="!is_play && !is_mint_process" class="interface-start-screen">
        <img class="interface-logo" src="/images/logo.svg" />
        <button @click="play()">Play</button>
      </div>
      <Mint 
        v-else-if="is_mint_process"
        v-bind:wallet_address = wallet_address 
        v-bind:contract = contract
        v-bind:contract_data = contract_data
        v-on:event-continue="play()"
      
      />
      <p v-else-if="is_world_loading_complete && !isMobile" class="interface-desktop-instructions">
        <span>To move, use: WASD</span><br/>
        <span :class="{'active': interact}">Press E to interact with objects</span><br/>
        <span>Use your MOUSE to look around and SPACE to jump</span>
      </p>
    </div>

    <button v-if="isMobile && is_play" class="mobile-control mobile-forward" @touchstart="control.goForward = true" @touchend="control.goForward = false">↑</button>
    <button v-if="isMobile && is_play" class="mobile-control mobile-left" @touchstart="control.goLeft = true" @touchend="control.goLeft = false">←</button>
    <button v-if="isMobile && is_play" class="mobile-control mobile-right" @touchstart="control.goRight = true" @touchend="control.goRight = false">→</button>
    <button v-if="isMobile && is_play" class="mobile-control mobile-back" @touchstart="control.goBack = true" @touchend="control.goBack = false">↓</button>
    <button v-if="isMobile && is_play" class="mobile-control mobile-jump" @touchstart="control.jump = true" @touchend="control.jump = false">JUMP</button>
    <button v-if="isMobile && is_play" class="mobile-control mobile-use" @touchstart="control.use = true" @touchend="control.use = false">USE</button>
    
    <div v-if="isMobile && is_play" id="rightJoystickArea" class="mobile-joystick mobile-joystick-right" @touchmove="cameraControl" @touchend="cameraControlEnd"><div id="rightJoystick"></div></div>
    
    <component 
    v-if="states.is_connect_complete"
    v-bind:is = currentWorld
    v-bind:control = control 
    v-bind:wallet_address = wallet_address 
    v-bind:wallet_balance = wallet_balance 
    v-bind:is_play = is_play 
    v-bind:is_mobile = is_mobile 
    v-bind:contract = contract
    v-bind:contract_data = contract_data
    v-on:loading-complete="onLoading()" 
    v-on:exit-into-room="loadWorld('Room')" 
    v-on:to-islands="loadWorld('Islands')" 
    v-on:mint="startMintProcess()" 
    :class="{'loading-complete': is_world_loading_complete}"
    ></component>

    <audio loop id="audioBack"> <source src="/japanese-type-harp.wav" type="audio/wav"></audio>


</template>

<script>
import Islands from './world/Islands.vue'
import Room from './world/Room.vue'
import Mint from './components/Mint.vue'

export default {
  name: 'App',
  components: {
    Islands,
    Room,
    Mint
  },
  data(){
    return{ 
      states: {
        is_connect_complete: null
      },
      currentWorld: 'Islands',
      wallet_address: null,
      wallet_balance: null,
      wlstats: {},
      contract: {},
      contract_data: {
        is_presale_active: false
      },
      is_world_loading_complete: false,
      is_connect: false,
      is_play: false,
      is_mobile: false,
      is_mint_process: false,
      control: {
        goForward: false,
        goBack: false,
        goLeft: false,
        goRight: false,
        jump: false,
        use: false,
        cameraRotationX: 0,
        cameraRotationY: 0,
        viewTop: false,
        viewBottom: false,
        viewLeft: false,
        viewRight: false,
      },
      previousTouch: null,
      message: null,
      loading_message: [
        "To access particular tsu world sections, the player will be required to own tsu NFT at their address. We bring utility from the early beginning!",
        "Only courageous tsu Warriors will be able to find easter eggs and secret locations with different rewards. But remember to trust your warrior's spirit. It will guide you even in the darkest moments!"
      ],
      page: null
    }
  },
  methods:{
    async get_contract_data(){},
    startMintProcess(){
      if (!this.is_mint_process){
        this.is_mint_process = true
        document.exitPointerLock()
      }
    },
    loadWorld(){
      this.states.is_connect_complete = true
      this.is_world_loading_complete = false
      const params = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop),
      });

      this.page = params.w;
      if (this.page == 'city'){
        this.currentWorld = 'Room'
      } else {
        this.currentWorld = 'Islands'
      }
    },
    async connect(){
      // Demo mode: no wallet/contract/backend required
      this.is_connect = true
      this.wallet_address = '0xDEMO000000000000000000000000000000000000'
      this.wallet_balance = 0
      this.contract = {}
      this.contract_data = {
        ...this.contract_data,
        is_presale_active: false,
        presales_at_address: 0,
        price: 0,
        total_supply: 0
      }
      return true
    },
    setDesktopControl(){

      document.addEventListener( 'keydown', ( event ) => {
        if ( document.pointerLockElement === document.body ) {
          if (event.code == 'KeyW') {
            this.control.goForward = true
          }
          if (event.code == 'KeyS') {
            this.control.goBack = true
          }
          if (event.code == 'KeyA') {
            this.control.goLeft = true
          }
          if (event.code == 'KeyD') {
            this.control.goRight = true
          }
          if (event.code == 'Space') {
            this.control.jump = true
          }
          if (event.code == 'KeyE') {
            this.control.use = true
          }
        }
			})

			document.addEventListener( 'keyup', ( event ) => {
        if ( document.pointerLockElement === document.body ) {
          if (event.code == 'KeyW') {
            this.control.goForward = false
          }
          if (event.code == 'KeyS') {
            this.control.goBack = false
          }
          if (event.code == 'KeyA') {
            this.control.goLeft = false
          }
          if (event.code == 'KeyD') {
            this.control.goRight = false
          }
          if (event.code == 'Space') {
            this.control.jump = false
          }
          if (event.code == 'KeyE') {
            this.control.use = false
          }
        }
			})

      document.body.addEventListener( 'mousemove', (event) => {
        if ( document.pointerLockElement === document.body ) {
          this.control.cameraRotationY -= event.movementX / 500;
          this.control.cameraRotationX -= event.movementY / 500;
        } else {
          this.control.cameraRotationY -= event.movementX / 100000;
          this.control.cameraRotationX -= event.movementY / 100000;
        }
      })

      document.addEventListener('pointerlockchange', () => {
        if ( document.pointerLockElement === document.body ) {
          this.is_play = true
          this.is_mint_process = false
        } else {
          this.is_play = false
        }
      })

    },
    moveControl(event){
      const touch = event.touches[0]

      let control = document.getElementById("leftJoystick")
      let centerY = window.innerHeight - (control.offsetHeight / 2) - 100
      let centerX = (control.offsetWidth / 2) + 100

      control.style.left = touch.pageX - 30 + 'px'
      control.style.top = touch.pageY - 30 + 'px'

      if ( touch.pageY < centerY - 30 ){
        this.control.viewTop = true
      } else {
        this.control.viewTop = false
      }
      if ( touch.pageY > centerY + 30 ){
        this.control.viewBottom = true
      } else {
        this.control.viewBottom = false
      }
      if ( touch.pageX < centerX - 30 ){
        this.control.viewLeft = true
      } else {
        this.control.viewLeft = false
      }
      if ( touch.pageX > centerX + 30 ){
        this.control.viewRight = true
      } else {
        this.control.viewRight = false
      }
    },
    moveControlEnd(){
      let control = document.getElementById("leftJoystick")
      control.style.left = 110 - control.offsetWidth / 2 + 'px'
      control.style.top = window.innerHeight - 110 - control.offsetHeight / 2 + 'px'
      this.control.goForward = false
      this.control.goBack = false
      this.control.goLeft = false
      this.control.goRight = false
    },
    cameraControl(event){

      event.preventDefault()
      const touch = event.touches[0];
      let control = document.getElementById("rightJoystick")
      let centerY = window.innerHeight - (control.offsetHeight / 2) - 100
      let centerX = window.innerWidth - (control.offsetWidth / 2) - 100

      if ( touch.pageY < centerY - 30 ){
        this.control.viewTop = true
      } else {
        this.control.viewTop = false
      }
      if ( touch.pageY > centerY + 30 ){
        this.control.viewBottom = true
      } else {
        this.control.viewBottom = false
      }
      if ( touch.pageX < centerX - 30 ){
        this.control.viewLeft = true
      } else {
        this.control.viewLeft = false
      }
      if ( touch.pageX > centerX + 30 ){
        this.control.viewRight = true
      } else {
        this.control.viewRight = false
      }

      if (touch.pageY > centerY - 50 + (control.offsetHeight / 2) && touch.pageY < centerY + 50){
        control.style.top = touch.pageY - 30 + 'px'
      }

      if (touch.pageX < centerX + 50 + (control.offsetWidth / 2) && touch.pageX > centerX - (control.offsetWidth / 2)){
        control.style.left = touch.pageX - 30 + 'px'
      }
      
      
    },
    cameraControlEnd(){
      let control = document.getElementById("rightJoystick")
      control.style.left = window.innerWidth - 110 - control.offsetWidth / 2 + 'px'
      control.style.top = window.innerHeight - 110 - control.offsetHeight / 2 + 'px'
      this.control.viewTop = false
      this.control.viewBottom = false
      this.control.viewLeft = false
      this.control.viewRight = false
    },
    play(){
      if (!this.isMobile){
        document.body.requestPointerLock()
      } else {
        this.is_play = true
        this.is_mobile = true
      }
      this.is_mint_process = false
    },
    onLoading(){
      this.is_world_loading_complete = true
    },
    jump(){
      let th = this
      th.control.jump = true
      setTimeout(function(){ th.control.jump = false }, 100);
    },
    forward(){
      let th = this
      th.control.goForward = true
      setTimeout(function(){ th.control.goForward = false }, 1000);
    }
  },
  computed:{
    isMobile(){
      if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true
      } else {
        return false
      }
    },
    randomMessage(){
      return this.loading_message[Math.floor(Math.random()*this.loading_message.length)];
    }
  },
  mounted(){

    let th = this
    
    if(!th.isMobile){
      th.setDesktopControl()
    }

    th.connect(false).then(async function(){
      th.loadWorld()
    })

  
  }
  
}
</script>

<style>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -moz-user-select: none; 
  -webkit-user-select: none; 
  -ms-user-select: none; 
  user-select: none;
  -o-user-select: none;
}
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  touch-action: none;
}
#app {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  overflow: hidden;
  background-color: #bb0000;
  background-image: url('/images/bgeffect.svg');
  background-size: cover;
  background-position: center center;
  text-align: center;
  font-family: 'Outfit', sans-serif;
  color: #ffffff;
}
.loading{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 100;
}
.loading_message{
  margin-top: 20px;
  max-width: 500px;
}

.interface{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 100;
}
.interface-start-screen{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.interface-start-screen button, .interface-start-screen a{
  width: auto;
  padding: 10px 20px;
  background: #ffffff30;
  border: none;
  border-radius: 5px;
  color: #ffffff70;
  margin-top: 20px;
  text-transform: uppercase;
  text-decoration: none;
}
.interface-desktop-instructions{
  color: #ffffff40;
  position: absolute;
  bottom: 30px;
}
.interface-message{
  color: #ffffff;
}

.mobile-control{
  position: absolute;
  z-index: 200;
  width: 50px;
  height: 50px;
  background: #ffffff30;
  color: #ffffff60;
  border-radius: 10px;
  border: none;
}
.mobile-control.mobile-forward{
  bottom: 110px;
  left: 90px;
}
.mobile-control.mobile-back{
  bottom: 50px;
  left: 90px;
}
.mobile-control.mobile-left{
  bottom: 80px;
  left: 30px;
}
.mobile-control.mobile-right{
  bottom: 80px;
  left: 150px;
}
.mobile-control.mobile-jump{
  bottom: 160px;
  right: 150px;
}
.mobile-control.mobile-use{
  bottom: 160px;
  right: 30px;
}

.mobile-joystick{
  position: absolute;
  z-index: 200;
  width: 100px;
  height: 100px;
  background: #ffffff30;
  color: #ffffff60;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-joystick-left{
  bottom: 60px;
  left: 60px;
}

.mobile-joystick-right{
  bottom: 60px;
  right: 60px;
}

#leftJoystick{
  position: fixed;
  z-index: 200;
  width: 50px;
  height: 50px;
  background: #ffffff30;
  color: #ffffff60;
  border-radius: 50%;
  border: none;
}

#rightJoystick{
  position: fixed;
  z-index: 200;
  width: 50px;
  height: 50px;
  background: #ffffff30;
  color: #ffffff60;
  border-radius: 50%;
  border: none;
}
.hash{
  word-break: break-all;
}
a{
  color: #ffffff;
}
</style>
