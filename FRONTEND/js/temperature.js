function escapeHTML(s) 
{
  return String(s).replace(/[&<>"']/g, c =>
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

function tempInfo(name) 
{
  const plain = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const temp = /\bcaliente\b/.test(plain) ? 'hot' : /\bfrio\b/.test(plain) ? 'cold' : null;
  const m = name.match(/^(.*\S)\s+(caliente|fr[ií]o)$/i);
  return { temp, base: m ? m[1] : name, label: m ? m[2] : null };
}

function tempIcon(temp) 
{
  return temp
    ? `<svg class="icon icon--sm" aria-hidden="true" focusable="false"><use href="#icon-${temp}"></use></svg>`
    : '';
}

function catalogNameHTML(name) 
{
  const { temp, base, label } = tempInfo(name);
  return label
    ? `${escapeHTML(base)}<span>${escapeHTML(label)}</span>${tempIcon(temp)}`
    : `${escapeHTML(name)}${tempIcon(temp)}`;
}

function tableNameHTML(name) 
{
  const { temp, base, label } = tempInfo(name);
  return label
    ? `${escapeHTML(base)} <span class="product-table__temp" data-field="temp">${escapeHTML(label)} ${tempIcon(temp)}</span>`
    : `${escapeHTML(name)} ${tempIcon(temp)}`;
}