const root = document.querySelector('#root');
const state = { offset: 0, limit: 20, detail: null, filters: { status: '', model: '', from: '', to: '' } };

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
function pretty(value) {
  if (value == null || value === '') return '—';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return String(value); }
}
function queryString() {
  const params = new URLSearchParams({ limit: state.limit, offset: state.offset });
  for (const [key, value] of Object.entries(state.filters)) if (value) params.set(key, value);
  return params.toString();
}
async function getLogs() {
  const response = await fetch(`/api/v1/logs?${queryString()}`);
  if (!response.ok) throw new Error(`로그 목록 조회 실패 (${response.status})`);
  return response.json();
}
async function getDetail(id) {
  const response = await fetch(`/api/v1/logs/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error(`로그 상세 조회 실패 (${response.status})`);
  return response.json();
}
function filters() {
  return `<form class="toolbar" id="filters">
    <label>상태<select name="status"><option value="">전체</option><option>completed</option><option>failed</option><option>pending</option></select></label>
    <label>모델<input name="model" placeholder="model" /></label>
    <label>시작일<input type="datetime-local" name="from" /></label>
    <label>종료일<input type="datetime-local" name="to" /></label>
    <button>필터 적용</button><button type="button" id="reset">초기화</button>
  </form>`;
}
function detailView(log) {
  return `<section class="card"><button id="back">← 목록</button><h2>Traffic ${esc(log.id)}</h2>
    <p><strong>상태:</strong> <span class="status ${esc(log.status)}">${esc(log.status)}</span> · <strong>모델:</strong> ${esc(log.model)} · <strong>지연:</strong> ${esc(log.latency_ms)}ms</p>
    <h3>request</h3><pre>${esc(pretty(log.request_json))}</pre>
    <h3>response</h3><pre>${esc(pretty(log.response_json))}</pre>
    <h3>error</h3><pre>${esc(log.error || '—')}</pre></section>`;
}
function listView(payload) {
  const rows = payload.data.map((log) => `<tr><td><a data-id="${esc(log.id)}">${esc(log.id.slice(0, 8))}</a></td><td class="status ${esc(log.status)}">${esc(log.status)}</td><td>${esc(log.model)}</td><td>${esc(log.http_status)}</td><td>${esc(log.latency_ms)}ms</td><td>${esc(log.started_at)}</td></tr>`).join('');
  return `<h1>LLM Proxy Traffic</h1>${filters()}<section class="card"><table><thead><tr><th>ID</th><th>상태</th><th>모델</th><th>HTTP</th><th>지연</th><th>시작</th></tr></thead><tbody>${rows || '<tr><td colspan="6">로그가 없습니다.</td></tr>'}</tbody></table><div class="pagination"><button id="prev" ${state.offset === 0 ? 'disabled' : ''}>이전</button><span>${state.offset + 1}–${state.offset + payload.data.length}</span><button id="next" ${payload.data.length < state.limit ? 'disabled' : ''}>다음</button></div></section>`;
}
function bindCommon() {
  const form = document.querySelector('#filters');
  for (const [key, value] of Object.entries(state.filters)) if (form.elements[key]) form.elements[key].value = value;
  form.addEventListener('submit', (event) => { event.preventDefault(); for (const key of Object.keys(state.filters)) state.filters[key] = form.elements[key].value; state.offset = 0; render(); });
  document.querySelector('#reset').addEventListener('click', () => { state.filters = { status: '', model: '', from: '', to: '' }; state.offset = 0; render(); });
  document.querySelector('#prev').addEventListener('click', () => { state.offset = Math.max(0, state.offset - state.limit); render(); });
  document.querySelector('#next').addEventListener('click', () => { state.offset += state.limit; render(); });
  document.querySelectorAll('[data-id]').forEach((link) => link.addEventListener('click', async () => { state.detail = await getDetail(link.dataset.id); render(); }));
}
async function render() {
  root.innerHTML = '<p>불러오는 중…</p>';
  try {
    if (state.detail) { root.innerHTML = detailView(state.detail); document.querySelector('#back').addEventListener('click', () => { state.detail = null; render(); }); return; }
    root.innerHTML = listView(await getLogs()); bindCommon();
  } catch (error) { root.innerHTML = `<p class="error">${esc(error.message)}</p><button id="retry">다시 시도</button>`; document.querySelector('#retry').addEventListener('click', render); }
}
render();
