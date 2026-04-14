<script setup>
import { ref, watch } from 'vue'
// import require from 'requirejs'

import finnhub from 'finnhub'
// const finnhub = require('finnhub')

const searchTerm = ref('')
const options = ref([])
const loading = ref(false)
let searchFocus = ref(false)

let SearchRequest = null

const finnhubClient = new finnhub.DefaultApi('d6q2sv9r01qhcrmilvggd6q2sv9r01qhcrmilvh0')

function getSymbolData() {
  loading.value = true
  if (SearchRequest) clearTimeout(SearchRequest)
  SearchRequest = setTimeout(() => {
    finnhubClient.symbolSearch(searchTerm.value, '', (data, response) => {
      // console.log('Symbol search response:', response)
      if (response && response.result && searchTerm.value) {
        options.value = response.result
        loading.value = false
      }
    })
  }, 1000)
}

watch(searchTerm, () => {
  getSymbolData()
})
</script>
<template>
  <div
    class="d-flex container col-xl-12 justify-content-center align-items-center"
    style="position: relative; top: 0 !important"
  >
    <div class="col-md-7 col-xl-7 col-10" style="position: relative; top: 0 !important">
      <input
        v-model="searchTerm"
        type="text"
        class="input w-100 form-control"
        placeholder="Search..."
        autocomplete="off"
        @focus="searchFocus = true"
        @blur="searchFocus = false"
      />
      <ul class="list-group w-100 bg-white" v-if="loading">
        <li class="loading-element">
          <span class="bg-white spinner-border spinner-border-sm text-primary"></span>
        </li>
      </ul>
      <ul
        v-if="searchTerm && !loading && options.length && searchFocus"
        class="list-group w-100"
        style="z-index: 10; top: -3px; position: relative; left: 0"
      >
        <li class="list-group-item" v-for="(option, idx) in options" :key="idx">
          {{ option.description || '' }} - {{ option.symbol || '' }}
        </li>
      </ul>
    </div>
  </div>
</template>
<style>
.list-group li {
  cursor: pointer;
  width: 100%;
  border-left: 1px solid #dee2e6;
  border-right: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
  padding: 2px;
}
.list-group li:hover {
  background-color: #0d6efd;
  color: white;
}
.list-group {
  max-height: 200px;
  overflow: auto;
  position: relative;
  top: -1px;
  list-style-type: none;
}
.list-group .loading-element:hover {
  background-color: white !important;
  color: black !important;
}
.list-group .list-group-item:first-child {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>