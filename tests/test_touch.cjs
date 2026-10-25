const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
function loadBridge(path) { const mod = {exports:{}}; vm.runInThisContext('(function(module){' + fs.readFileSync(path, 'utf8') + '\n})')(mod); return mod.exports; }
const {createState} = loadBridge('support/touch.js');
const state = createState();
state.press(1,'KeyW'); state.press(2,'fire'); state.press(3,'look',100,100);
state.move(3,112,95);
let s = state.sample(); assert.deepEqual([...s.keys],['KeyW']);assert.equal(s.mouse,1);assert.equal(s.dx,12);assert.equal(s.dy,-5);
assert.equal(state.sample().dx,0); // Consume relative look once, not once per frame forever.
state.press(4,'KeyW');state.up(1);assert.ok(state.sample().keys.has('KeyW'));
state.up(2);assert.equal(state.sample().mouse,0);
state.up(3);state.move(3,1000,1000);assert.equal(state.sample().dx,0);
state.release();assert.equal(state.sample().keys.size,0);
// Integration: touch without a gamepad, overlapping physical input, and focus loss.
const events={};let frame;
global.addEventListener=(n,f)=>(events[n]??=[]).push(f);
global.document={hidden:false,hasFocus:()=>true,addEventListener(){}};
global.requestAnimationFrame=f=>frame=f;
global.PlayGTA5Touch=state;
const {attach}=loadBridge('support/controller.js');
const buffer=new SharedArrayBuffer(512),keys=new Uint8Array(buffer,0,256),w=new Int32Array(buffer,256,10);
attach({keys,w,VK:{KeyW:87},canvas:{addEventListener(){}},getPads:()=>[]});
state.press(1,'KeyW');state.press(2,'fire');frame(16);assert.equal(keys[87],128);assert.equal(w[5],1);
events.keydown[0]({isTrusted:true,code:'KeyW'});state.release();frame(32);assert.equal(keys[87],128);assert.equal(w[5],0);
events.keyup[0]({isTrusted:true,code:'KeyW'});keys[87]=0;
state.press(1,'KeyW');frame(48);document.hidden=true;frame(64);assert.equal(keys[87],0);assert.equal(state.sample().keys.size,0);
console.log('PASS: multi-touch, repeated bindings, consumed look deltas, cancellation, physical overlap and focus loss');

// Modifier aliases must follow controller/touch and both physical modifier keys.
const extraBuffer = new SharedArrayBuffer(512), extraKeys = new Uint8Array(extraBuffer,0,256), extraWords = new Int32Array(extraBuffer,256,10);
document.hidden = false;
attach({keys:extraKeys,w:extraWords,VK:{Shift:16,ShiftLeft:160,ShiftRight:161},canvas:{addEventListener(){}},getPads:()=>[]});
state.press(8,'ShiftLeft'); frame(80); assert.equal(extraKeys[16],128);
state.release(); frame(96); assert.equal(extraKeys[16],0);
for(const listener of events.keydown) listener({isTrusted:true,code:'ShiftRight'}); frame(112); assert.equal(extraKeys[16],128);
for(const listener of events.blur) listener(); frame(128); assert.equal(extraKeys[16],0);
console.log('PASS: generic modifier keys for physical and virtual input');
