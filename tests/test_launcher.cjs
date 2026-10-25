const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
async function launch(ready) {
  const nodes = {};
  function node() { return {disabled:false,textContent:'',hidden:true,events:{},children:[],value:'safe',addEventListener(n,fn){this.events[n]=fn;},replaceChildren(){this.children=[];},append(child){this.children.push(child);}}; }
  let destination;
  const context = vm.createContext({
    document:{getElementById:id=>nodes[id]??=node(),createElement:node},
    isSecureContext:true,crossOriginIsolated:true,SharedArrayBuffer,OffscreenCanvas:function(){},
    WebAssembly:{validate:()=>true},navigator:{gpu:{requestAdapter:async()=>({features:new Set(['texture-compression-bc']),requestDevice:async()=>({destroy(){}})})}},
    fetch:async path=>path==='/api/game-status'?{ok:ready,json:async()=>({ready})}:{ok:true,text:async()=>"importScripts('game.js');"},
    AbortSignal,URLSearchParams,FormData:class {get(){return 'sandbox';}},location:{assign:url=>destination=url}
  });
  vm.runInContext(fs.readFileSync('public/assets/launcher.js','utf8'),context);
  await nodes['launch-form'].events.submit({preventDefault(){}});
  if (ready) {
    const url = new URL(destination,'https://example.test');
    assert.equal(url.pathname,'/play/');assert.equal(url.searchParams.get('mode'),'sandbox');
    assert.equal(url.searchParams.get('res'),'1280x720');assert.equal(url.searchParams.get('fps'),'30');
  } else {
    assert.equal(destination,undefined);assert.match(nodes.feedback.textContent,/asset copy is not ready/);
    assert.equal(nodes['play-button'].disabled,false);
  }
}
(async()=>{await launch(true);await launch(false);console.log('PASS: ready storage launches the selected game mode; incomplete storage blocks launch with an explanation');})().catch(e=>{console.error(e);process.exitCode=1;});
