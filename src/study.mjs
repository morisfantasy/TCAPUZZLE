// A chapter is a tree. Positions are stored at nodes so jumping to a variation
// or a black-to-move starting position never depends on replaying another line.
export function makeChapter(fen, headers = {}) {
  return { headers, nodes: [{ fen, parent: null, children: [], marks: [] }] };
}

export function appendMove(chapter, parent, move, extra = {}) {
  const id = chapter.nodes.length;
  chapter.nodes.push({
    parent, children: [], fen: move.after, san: move.san,
    from: move.from, to: move.to, marks: [], ...extra
  });
  chapter.nodes[parent].children.push(id);
  return id;
}

export function prefix(fen) {
  const [, side, , , , number] = fen.split(' ');
  return number + (side === 'w' ? '.' : '...');
}

function annotation(node) {
  const arrows = [], circles = [];
  for (const mark of node.marks) {
    if (mark.from === mark.to) circles.push(mark.color + mark.from);
    else arrows.push(mark.color + mark.from + mark.to);
  }
  const content = [node.comment, node.directives,
    arrows.length && '[%cal ' + arrows.join(',') + ']',
    circles.length && '[%csl ' + circles.join(',') + ']'].filter(Boolean).join(' ');
  return content ? '{' + content + '}' : '';
}

export function writeChapter(chapter) {
  const { headers, nodes } = chapter;
  function line(id, alternate = false) {
    const tokens = [];
    let first = true;
    while (id != null) {
      const node = nodes[id], parent = nodes[node.parent];
      if (node.before) tokens.push('{' + node.before + '}');
      if (first || parent.fen.split(' ')[1] === 'w') tokens.push(prefix(parent.fen));
      tokens.push(node.san, ...(node.nags || []), annotation(node));
      if (!alternate) {
        for (const other of parent.children.slice(1)) tokens.push('(' + line(other, true) + ')');
      }
      first = false;
      alternate = false;
      id = node.children[0];
    }
    return tokens.filter(Boolean).join(' ');
  }
  const pairs = Object.entries(headers).map(([key, value]) =>
    '[' + key + ' "' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]');
  return [pairs.join('\n'), [annotation(nodes[0]), line(nodes[0].children[0]), headers.Result || '*'].filter(Boolean).join(' ')]
    .filter(Boolean).join('\n\n');
}
