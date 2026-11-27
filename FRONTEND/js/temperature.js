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


// Name + temperature from the product's own "temperature" field ("hot", "cold" or null):
const TEMP_WORDS = { hot: 'Caliente', cold: 'Frío' };

function productNameHTML(name, temp)
{
  return TEMP_WORDS[temp]
    ? `${escapeHTML(name)} <span class="product-table__temp" data-field="temp">${TEMP_WORDS[temp]} ${tempIcon(temp)}</span>`
    : escapeHTML(name);
}


// Order lines: "Latte Caliente (flame)", from the product's "temperature" field
function lineNameHTML(name, temp)
{
  return TEMP_WORDS[temp]
    ? `${escapeHTML(name)} ${TEMP_WORDS[temp]} ${tempIcon(temp)}`
    : escapeHTML(name);
}

// Catalog cards: name, word and icon as separate pieces (the card title is a flex row)
function cardNameHTML(name, temp)
{
  return TEMP_WORDS[temp]
    ? `${escapeHTML(name)}<span>${TEMP_WORDS[temp]}</span>${tempIcon(temp)}`
    : escapeHTML(name);
}