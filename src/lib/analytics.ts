export function analyticsSnippet(projectId: string) {
  if (!/^[a-z\d-]{1,80}$/.test(projectId)) return '请先选择项目';
  return `<script>(()=>{const h=location.hostname;const o=h==='weightbook.icu'||h.endsWith('.weightbook.icu')?'https://alexwjj-hub.weightbook.icu':'https://alexwjj-hub.vercel.app';const s=document.createElement('script');s.type='module';s.async=true;s.src=o+'/sdk/hub.js?project=${projectId}';document.head.appendChild(s)})();</script>`;
}
