import { memo } from 'react';

function getTwemojiUrl(emoji) {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${
    [...emoji].map(c => c.codePointAt(0).toString(16)).join('-')
  }.svg`;
}

function FlagEmojiRaw({ children, size = 14 }) {
  if (!children) return null;
  const str = String(children);
  const chars = [...str];
  const parts = [];
  let i = 0;
  while (i < chars.length) {
    const cp = chars[i].codePointAt(0);
    if (cp >= 0x1F1E6 && cp <= 0x1F1FF && i + 1 < chars.length) {
      const cp2 = chars[i + 1].codePointAt(0);
      if (cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
        parts.push({ type: 'img', src: getTwemojiUrl(chars[i] + chars[i + 1]), key: i });
        i += 2;
        continue;
      }
    }
    if (cp > 0x2000) {
      parts.push({ type: 'img', src: getTwemojiUrl(chars[i]), key: i });
      i++;
      continue;
    }
    if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
      parts[parts.length - 1].text += chars[i];
    } else {
      parts.push({ type: 'text', text: chars[i], key: i });
    }
    i++;
  }
  return (
    <>
      {parts.map(p =>
        p.type === 'img'
          ? <img key={p.key} src={p.src} width={size} height={size} alt="" style={{ display: 'inline', verticalAlign: 'middle' }} />
          : <span key={p.key}>{p.text}</span>
      )}
    </>
  );
}

const FlagEmoji = memo(FlagEmojiRaw);
export default FlagEmoji;
