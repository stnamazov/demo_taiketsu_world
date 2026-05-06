<template>
   <div class="mint-form">
        <img src="/images/mint.svg" />
        <div class="mint-block" :class="{'disabled':contract_data.presales_at_address == 3}">
          <div class="mint-qty">
            <button :class="{'disabled':count_for_mint < 2}" v-on:click="count_for_mint--">-</button>
            <input type="number" min="1" :max="3 - contract_data.presales_at_address" v-model="count_for_mint"/>
            <button :class="{'disabled':count_for_mint >= 3 - contract_data.presales_at_address}" v-on:click="count_for_mint++">+</button>
          </div>
          <button v-if="!lock" @click="presale()">Mint for {{contract_data.price * count_for_mint / 1000000000000000000}}</button>
          <button v-else >Loading...</button>
        </div>
        <div class="mint-block">
          <button @click="$emit('event-continue')">Back</button>
          <div class="mint-message" v-html="message"></div>
        </div>
    </div> 
</template>

<script>
export default {
  data(){
    return{
      total_supply: null,
      proof: null,
      price: null,
      count_for_mint: 1,
      message: null,
      lock: false
    }
  },
  props:{
    "contract": {},
    "contract_data": {},
    "wallet_address": String,
  },
  computed:{

  },
  methods:{
    async presale(){
      this.message = '<p>Mint is disabled in demo mode.</p>'
      /*let th = this
      if (!th.lock){
        th.lock = true
        await th.contract.methods
        .preSale(th.count_for_mint, th.proof).send({ from: th.wallet_address, value: th.contract_data.price * th.count_for_mint })
        .on('transactionHash', function (hash) {
            th.message = '<p>Transaction ID:</p><span class="hash">'+ hash +'</span><p><a href="https://etherscan.io/tx/' + hash + '" target="_blank">View on Etherscan</a></p>'
            th.lock = false
        })
        .on('error', function (error) {
            th.message = 'Error: <span class="hash">'+ error.message +'</span></p>'
            th.lock = false
        })
      }*/
      
      
    }
  },
  mounted () {
    // Demo: no backend
  },

}
</script>

<style scoped>
.mint-block{
  display: flex;
  flex-direction: column;
  max-width: 300px;
}
.mint-qty{
  display: flex;
  width: 100%;
}
button, input{
  border: 1px solid #ffffff80;
  background: none;
  padding: 5px;
  border-radius: 5px;
  color: #ffffff;
  height: 40px;
  width: 100%;
  margin-top: 10px;
}
.mint-qty input{
  margin-left: 10px;
  margin-right: 10px;
}
.mint-qty button{
  width: 40px;
  flex: 0 0 40px;
}
button:active{
  transform: scale(0.9);
}
.disabled{
  opacity: 0.5;
  pointer-events: none;
}
.mint-message{
  margin-top: 20px;
}

</style>