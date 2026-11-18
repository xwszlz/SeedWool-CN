/* 统一数据访问抽象层：当前读取静态 JSON；未来切 API 只改 DataSource，不改页面 */
export const DataSource = { type: 'static', base: 'assets/data' };
async function request(resource) {
  if (DataSource.type === 'static') {
    const res = await fetch(`${DataSource.base}/${resource}.json`);
    if (!res.ok) throw new Error('static data unavailable: ' + resource);
    const data = await res.json();
    return { code: 0, message: 'ok', data };
  }
  const res = await fetch(`${DataSource.base}/${resource}`, { headers: { Accept: 'application/json' } });
  return res.json();
}
export const DataAdapter = {
  getProducts: () => request('products'),
  getIndicators: () => request('indicators'),
  getBatches: () => request('batches'),
  getPapers: () => request('papers'),
};
