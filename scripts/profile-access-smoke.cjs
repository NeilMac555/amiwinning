const fs=require('fs');
(async()=>{
 const base=process.env.PROFILE_TEST_URL || 'http://127.0.0.1:3047';
 for(const path of ['/neilmac555','/neilmac555/sharpsidesoccer','/neilmac555/ylose-soccer']){
  const res=await fetch(base+path);const html=await res.text();
  if(!res.ok || !html.includes('Checking your session') || html.includes('Lifetime P/L') || html.includes('profile-pl-value') || html.includes('equityPoints')) throw Error('Gate failed '+path);
  console.log('PASS signed-out HTML contains gate, no report:',path);
 }
 const manifest=JSON.parse(fs.readFileSync('.next/server/server-reference-manifest.json','utf8'));
 const action=Object.entries(manifest.node).find(([,v])=>v.exportedName==='loadProtectedReport');
 if(!action) { console.log('Action manifest keys',Object.values(manifest.node).map(x=>x.exportedName)); throw Error('Action missing'); }
 const res=await fetch(base+'/neilmac555',{method:'POST',headers:{'Next-Action':action[0],'Content-Type':'text/plain;charset=UTF-8','Origin':base},body:JSON.stringify(['invalid-token','neilmac555'])});
 const text=await res.text();if(text.includes('profile-pl-value') || !text.includes('digest')) throw Error('Invalid token not rejected');console.log('PASS forged access token rejected');
 const sample=await fetch(base+'/sample');if(!(await sample.text()).includes('Lifetime P/L'))throw Error('Sample broken');console.log('PASS sample still accessible');
})().catch(e=>{console.error(e);process.exitCode=1});

