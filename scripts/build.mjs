// SPDX-License-Identifier: GPL-3.0-or-later
// SodaDEX modification 2026-11-09: reproducible V2/V3-only compiler entrypoint.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const output = { '*': { '*': ['abi','evm.bytecode','evm.deployedBytecode'] } }
const aliases = {
 '@uniswap/v2-core/':'upstream/v2-core/', '@uniswap/v3-core/':'upstream/v3-core/',
 '@openzeppelin/contracts/':'vendor/contracts-3.4.2-solc-0.7/', 'base64-sol/':'vendor/base64-sol-1.0.1/',
}
function sources(root,entries,v2=false) {
 const result={}
 function visit(unit) {
  if(result[unit]) return
  let file=path.join(root,unit)
  for(const [prefix,dir] of Object.entries({...aliases,'@uniswap/lib/':`vendor/lib-${v2?'1.1.1':'4.0.1-alpha'}/`})) if(unit.startsWith(prefix))file=dir+unit.slice(prefix.length)
  const content=fs.readFileSync(file,'utf8');result[unit]={content}
  for(const m of content.matchAll(/import\s+(?:[^;]*?\bfrom\s*)?['"]([^'"]+)['"]\s*;/g)) visit(m[1].startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(unit),m[1])):m[1])
 }
 entries.forEach(visit);return result
}
fs.mkdirSync('build',{recursive:true})
const results={}
function compile(label,version,input,targets){
 input=structuredClone(input);input.settings.outputSelection=output
 const compiler=require('solc-'+version)
 const data=JSON.parse(compiler.compile(JSON.stringify(input)))
 const errors=(data.errors??[]).filter(e=>e.severity==='error')
 if(errors.length)throw Error(errors.map(e=>e.formattedMessage).join('\n'))
 for(const [unit,name] of targets){
  const row=data.contracts[unit][name];const key=label+'-'+name
  fs.writeFileSync('build/'+key+'.json',JSON.stringify({abi:row.abi,bytecode:row.evm.bytecode,deployedBytecode:row.evm.deployedBytecode},null,2)+'\n')
  results[key]={compiler:compiler.version(),runtimeBytes:row.evm.deployedBytecode.object.length/2}
 }
}
for(const [group,version,runs,entries,names] of [
 ['v2-core','05',999999,['contracts/UniswapV2Factory.sol','contracts/test/ERC20.sol'],[['contracts/test/ERC20.sol','ERC20'],['contracts/UniswapV2Factory.sol','UniswapV2Factory'],['contracts/UniswapV2Pair.sol','UniswapV2Pair']]],
 ['v2-periphery','06',999999,['contracts/UniswapV2Router02.sol'],[['contracts/UniswapV2Router02.sol','UniswapV2Router02']]],
 ['v3-core','07',800,['contracts/UniswapV3Factory.sol'],[['contracts/UniswapV3Factory.sol','UniswapV3Factory'],['contracts/UniswapV3Pool.sol','UniswapV3Pool']]],
]) {
 const settings={optimizer:{enabled:true,runs},evmVersion:'istanbul',...(version==='07'?{metadata:{bytecodeHash:'none'}}:{})}
 compile(group,version,{language:'Solidity',sources:sources('upstream/'+group,entries,group.startsWith('v2')),settings},names)
}
for(const kind of ['baseline','sodadex'])for(const runs of [1000,2000]){
 const input=JSON.parse(fs.readFileSync(`verification/inputs/v3-${kind}-${runs}.json`))
 // The archived standard inputs must equal the readable source, including every dependency.
 const root='upstream/v3-periphery';const overlay=new Map()
 if(kind==='sodadex'){
  for(const [dir,target] of [['sodadex/v3','contracts'],['sodadex/common','contracts/libraries']]){
   for(const f of fs.readdirSync(dir,{recursive:true}).filter(x=>x.endsWith('.sol')))overlay.set(path.posix.join(target,f),fs.readFileSync(path.join(dir,f),'utf8'))
  }
 }
 for(const [unit,row] of Object.entries(input.sources)){
  if(unit==='contracts/SodaEscapeHarness.sol')continue
  let actual=overlay.get(unit)
  if(actual===undefined){try{actual=sources(root,[unit])[unit].content}catch(error){throw Error(`unresolved archived source ${unit}: ${error.message}`)}}
  if(actual!==row.content)throw Error('archived/readable source mismatch '+kind+' '+unit)
 }
 const targets=runs===2000?[['contracts/NonfungiblePositionManager.sol','NonfungiblePositionManager']]:[['contracts/libraries/NFTDescriptor.sol','NFTDescriptor'],['contracts/NonfungibleTokenPositionDescriptor.sol','NonfungibleTokenPositionDescriptor']]
 compile('v3-'+kind,'07',input,targets)
}
fs.writeFileSync('build/manifest.json',JSON.stringify(results,null,2)+'\n')
console.log('Built',Object.keys(results).length,'artifacts; archived sources match readable source trees')
