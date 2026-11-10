// SPDX-License-Identifier: GPL-3.0-or-later
// SodaDEX modification 2026-11-09: offline artifact regression and owned-Anvil business checks.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {spawn} from 'node:child_process'
import {JsonRpcProvider,ContractFactory,Contract,parseEther,ZeroAddress} from 'ethers'
const load=n=>JSON.parse(fs.readFileSync('build/'+n+'.json'))
const object=a=>typeof a==='string'?a.replace(/^0x/,''):a.object.replace(/^0x/,'')
for(const [group,name] of [['v2-core','UniswapV2Factory'],['v2-core','UniswapV2Pair'],['v2-periphery','UniswapV2Router02'],['v3-core','UniswapV3Factory'],['v3-core','UniswapV3Pool']])test('exact upstream artifact '+name,()=>{
 const actual=load(group+'-'+name), expected=JSON.parse(fs.readFileSync('verification/upstream-artifacts/'+name+'.json'))
 assert.equal(object(actual.bytecode),object(expected.bytecode));assert.deepEqual(actual.abi,expected.abi)
})
test('V3 branding preserves existing ABI',()=>{
 for(const name of ['NFTDescriptor','NonfungibleTokenPositionDescriptor','NonfungiblePositionManager']){
  const old=load('v3-baseline-'+name).abi, changed=load('v3-sodadex-'+name).abi
  assert.deepEqual(changed.filter(x=>x.name!=='deploymentInfo'),old)
  assert.equal(changed.filter(x=>x.name==='deploymentInfo').length,name==='NonfungiblePositionManager'?1:0)
 }
})
test('actual local V2 swaps and V3 deployment wiring',async()=>{
 const port=18556,url=`http://127.0.0.1:${port}`
 const net=await import('node:net');await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(port,'127.0.0.1',()=>s.close(resolve))})
 const process=spawn('anvil',['--silent','--host','127.0.0.1','--port',String(port),'--chain-id','31337'],{stdio:'ignore'})
 const provider=new JsonRpcProvider(url,31337,{staticNetwork:true,pollingInterval:50})
 try{
  for(let i=0;i<60;i++){try{if((await provider.send('web3_clientVersion',[])).toLowerCase().includes('anvil'))break}catch{}await new Promise(r=>setTimeout(r,100))}
  assert.equal(Number(await provider.send('eth_chainId',[])),31337)
  const signer=await provider.getSigner(0),owner=await signer.getAddress(),other=await provider.getSigner(1)
  async function deploy(n,args=[],libraries={}){
   const a=load(n);let code=object(a.bytecode)
   for(const refs of Object.values(a.bytecode.linkReferences??{}))for(const [name,locations]of Object.entries(refs))for(const r of locations){assert(libraries[name]);code=code.slice(0,r.start*2)+libraries[name].slice(2)+code.slice((r.start+r.length)*2)}
   const c=await new ContractFactory(a.abi,'0x'+code,signer).deploy(...args);await c.waitForDeployment();return c
  }
  const v2=await deploy('v2-core-UniswapV2Factory',[owner]);const a=await deploy('v2-core-ERC20',[parseEther('1000')]);const b=await deploy('v2-core-ERC20',[parseEther('1000')]);const aa=await a.getAddress(),bb=await b.getAddress()
  const router=await deploy('v2-periphery-UniswapV2Router02',[await v2.getAddress(),ZeroAddress]);const rr=await router.getAddress();const deadline=BigInt((await provider.getBlock('latest')).timestamp+3600)
  for(const t of [a,b])await(await t.approve(rr,parseEther('100'))).wait()
  await(await router.addLiquidity(aa,bb,parseEther('10'),parseEther('10'),parseEther('10'),parseEther('10'),owner,deadline)).wait()
  const pair=new Contract(await v2.getPair(aa,bb),load('v2-core-UniswapV2Pair').abi,signer)
  assert((await pair.balanceOf(owner))>0n);const before=await b.balanceOf(owner)
  const quoted=await router.getAmountsOut(parseEther('1'),[aa,bb])
  await(await router.swapExactTokensForTokens(parseEther('1'),quoted[1],[aa,bb],owner,deadline)).wait();assert.equal(await b.balanceOf(owner)-before,quoted[1])
  const v3=await deploy('v3-core-UniswapV3Factory');await(await v3.createPool(aa,bb,3000)).wait()
  const pool=new Contract(await v3.getPool(aa,bb,3000),load('v3-core-UniswapV3Pool').abi,signer);await(await pool.initialize(2n**96n)).wait();assert.equal((await pool.slot0())[0],2n**96n)
  await assert.rejects(v3.connect(other).setOwner(await other.getAddress()))
  const library=await deploy('v3-sodadex-NFTDescriptor')
  const descriptor=await deploy('v3-sodadex-NonfungibleTokenPositionDescriptor',[aa,'0x'+Buffer.from('OKB').toString('hex').padEnd(64,'0')],{NFTDescriptor:await library.getAddress()})
  const manager=await deploy('v3-sodadex-NonfungiblePositionManager',[await v3.getAddress(),aa,await descriptor.getAddress()])
  assert.equal(await manager.name(),'SodaDEX V3 Positions NFT');assert.equal(await manager.symbol(),'SODA-V3-POS');assert.deepEqual(Array.from(await manager.deploymentInfo()),['SodaDEX',1n,31337n,true]);assert.equal(await manager.factory(),await v3.getAddress())
 }finally{provider.destroy();process.kill('SIGTERM');await new Promise(resolve=>process.once('exit',resolve))}
},{timeout:90000})
