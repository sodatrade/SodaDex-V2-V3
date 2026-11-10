#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
# SodaDEX modification 2026-11-09: read-only getter/code verification of existing addresses.
import concurrent.futures,datetime,json,subprocess,pathlib
R=pathlib.Path(__file__).resolve().parents[1]
def cast(*args):
 p=subprocess.run(['cast',*map(str,args)],capture_output=True,text=True,timeout=60)
 if p.returncode:raise RuntimeError(p.stderr[-400:])
 return p.stdout.strip()
results=[]
for record in sorted((R/'deployments').glob('xlayer-*.json')):
 d=json.loads(record.read_text());chain=d['chainId'];url='https://rpc.ignix.bot/rpc/196' if chain==196 else 'https://testrpc.xlayer.tech/terigon';c=d['contracts']
 assert int(cast('chain-id','--rpc-url',url))==chain
 block=cast('block-number','--rpc-url',url)
 def call(addr,sig):return cast('call',addr,sig,'--block',block,'--rpc-url',url).lower()
 def code(row):
  name,addr=row;runtime=cast('code',addr,'--block',block,'--rpc-url',url);assert runtime!='0x'
  return name,{'address':addr,'runtimeKeccak256':cast('keccak',runtime)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:codes=dict(pool.map(code,c.items()))
 assert call(c['v2Router'],'factory()(address)')==c['v2Factory'].lower()
 assert call(c['v2Router'],'WETH()(address)')==d['wrappedNative'].lower()
 assert call(c['v2Factory'],'feeToSetter()(address)')==d['owner'].lower()
 assert call(c['v3Factory'],'owner()(address)')==d['owner'].lower()
 assert call(c['v3PositionManager'],'factory()(address)')==c['v3Factory'].lower()
 assert call(c['v3PositionManager'],'WETH9()(address)')==d['wrappedNative'].lower()
 assert call(c['v3Quoter'],'factory()(address)')==c['v3Factory'].lower()
 results.append({'record':record.name,'role':d['role'],'chainId':chain,'block':int(block),'contracts':codes,'factoryRouterPositionManagerBindingsVerified':True,'ownerVerified':d['owner']})
(R/'deployments/verification.json').write_text(json.dumps({'checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'mode':'read-only code/getter checks; not a full deployment bytecode audit','signedOrBroadcast':False,'chains':results},indent=2)+'\n')
print('PASS all recorded 196/1952 contract code, owner and bindings; no signing or broadcast')
