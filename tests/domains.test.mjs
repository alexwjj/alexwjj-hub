import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { analyticsSnippet } from '../src/lib/analytics.ts';
import { sameOrigin, configuration, authRoute } from '../server/auth.mjs';
import catalog from '../src/content/projects.json' with { type: 'json' };
test('nine selected works and visitor-domain SDK channel', () => {
 assert.equal(catalog.length,9);
 for(const host of ['family.weightbook.icu','alexwjj-hub.weightbook.icu','weightbook.icu','demo.vercel.app','weightbook.icu.evil.test']) {
  let loaded;
  runInNewContext(analyticsSnippet('test').slice(8,-9), {location:{hostname:host},document:{createElement:()=>({}),head:{appendChild:s=>loaded=s.src}}});
  assert.equal(new URL(loaded).hostname, host==='weightbook.icu'||host.endsWith('.weightbook.icu')?'alexwjj-hub.weightbook.icu':'alexwjj-hub.vercel.app');
 }
});
test('custom domain CSRF stays same-origin and OAuth starts on configured callback host', async()=>{
 const config=configuration({APP_ORIGIN:'https://alexwjj-hub.vercel.app', SESSION_SECRET:'x'.repeat(40),GITHUB_CLIENT_ID:'test',GITHUB_CLIENT_SECRET:'test'});
 assert(sameOrigin(new Request('https://alexwjj-hub.weightbook.icu/api/messages',{headers:{origin:'https://alexwjj-hub.weightbook.icu'}}),config));
 assert(!sameOrigin(new Request('https://alexwjj-hub.weightbook.icu/api/messages',{headers:{origin:'https://evil.example'}}),config));
 const response=await authRoute(new Request('https://alexwjj-hub.weightbook.icu/api/auth/login'),config);
 assert.equal(response.headers.get('location'),'https://alexwjj-hub.vercel.app/api/auth/login');
});

test('all configured project aliases follow the current host in cards and dashboard', async()=>{
 const {projectUrlForHost}=await import('../src/lib/project-links.ts');
 for(const project of catalog.filter(p=>!['x-reader','alexwjj-github-io'].includes(p.id))){
  for(const host of ['weightbook.icu','alexwjj-hub.weightbook.icu','alexwjj-hub.vercel.app']){
   const result=new URL(projectUrlForHost(project,host));
   assert(result.hostname.endsWith(host.endsWith('vercel.app')?'.vercel.app':'.weightbook.icu'), `${project.id} on ${host}: ${result.href}`);
  }
 }
 const example={url:'https://old.vercel.app/app/item?q=1#/details',origins:['jlabphotos://desktop','https://new.weightbook.icu']};
 assert.equal(projectUrlForHost(example,'hub.weightbook.icu'),'https://new.weightbook.icu/app/item?q=1#/details');
 assert.equal(projectUrlForHost(example,'weightbook.icu.evil.test'),example.url);
 assert.equal(projectUrlForHost({url:'https://github.com/alexwjj/x-reader',origins:example.origins},'hub.weightbook.icu'),'https://github.com/alexwjj/x-reader');
 assert.equal(projectUrlForHost({url:null},'hub.weightbook.icu'),null);
});
